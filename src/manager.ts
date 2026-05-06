import { buildActions, buildChannelLabel } from './actions';
import {
  DEFAULT_DEBOUNCE_MS,
  EXIT_ANIMATION_MS,
  MAX_VISIBLE_TOASTS,
  VALID_POSITIONS,
} from './constants';
import { type HandleCleanupHooks, ToastHandleImpl } from './handle';
import { renderIcon } from './icons';
import { attachPauseOnHover } from './pause';
import { playSound, setSoundPresets } from './sound';
import { attachSwipe } from './swipe';
import type {
  PromiseOptions,
  PromiseValueSpec,
  ToastConfig,
  ToastHandle,
  ToastOptions,
  ToastPosition,
  ToastStyle,
} from './types';
import { fingerprint, isMobile, isTouchPrimary } from './utils';

interface DebounceEntry {
  handle: ToastHandleImpl;
  timeoutId: number;
}

type ResolvedConfig = Required<Omit<ToastConfig, 'sound' | 'soundPresets'>> & {
  sound: ToastConfig['sound'];
};

/**
 * Central manager that owns all live toasts, their containers, and the
 * global configuration.
 */
class ToastManager implements HandleCleanupHooks {
  private liveToasts: ToastHandleImpl[] = [];
  private containers: Partial<Record<ToastPosition, HTMLDivElement>> = {};
  private overflowEls: Partial<Record<ToastPosition, HTMLDivElement>> = {};
  private recentToasts: Record<string, DebounceEntry> = {};
  private resizeRaf: number | null = null;
  private resizeListenerAttached = false;

  config: ResolvedConfig = {
    position: 'top-right',
    pauseOnHover: true,
    sound: true,
    resound: false,
  };

  // ---------- HandleCleanupHooks ----------

  /**
   * Release a dismissed toast handle: clear its debounce entry, remove it
   * from the live list, and reflow visibility.
   *
   * @param handle - The handle being torn down.
   */
  release(handle: ToastHandleImpl): void {
    if (handle.fingerprint) {
      const entry = this.recentToasts[handle.fingerprint];
      if (entry && entry.handle === handle) {
        clearTimeout(entry.timeoutId);
        delete this.recentToasts[handle.fingerprint];
      }
    }
    const idx = this.liveToasts.indexOf(handle);
    if (idx !== -1) {
      this.liveToasts.splice(idx, 1);
      this.reflowVisibility();
    }
  }

  /**
   * Optionally replay a toast sound when update() changes style.
   *
   * @param handle - The updated toast handle.
   * @param nextStyle - The style after update.
   */
  handleStyleUpdateSound(handle: ToastHandleImpl, nextStyle: ToastStyle): void {
    const shouldResound = handle.resound ?? this.config.resound;
    if (!shouldResound) return;
    const soundOpt = handle.sound !== undefined ? handle.sound : this.config.sound;
    playSound(soundOpt, nextStyle);
  }

  // ---------- Public API ----------

  /**
   * Create and display a new toast.
   *
   * @param opts - Configuration for the toast.
   * @returns A handle that can dismiss or update the toast.
   */
  show(opts: ToastOptions = {}): ToastHandle {
    this.ensureResizeListener();

    const debounceMs = opts.debounce ?? DEFAULT_DEBOUNCE_MS;
    const fp = fingerprint(opts);
    if (debounceMs > 0 && this.recentToasts[fp]) {
      return this.recentToasts[fp].handle;
    }

    const title = opts.title ?? '';
    const body = opts.body ?? '';
    const styleName: ToastStyle = opts.style ?? 'info';
    const persistent = !!opts.persistent;
    const defaultTimeout = styleName === 'loading' || persistent ? 0 : 4000;
    const timeout = opts.timeout ?? defaultTimeout;
    const hasDeterminate = styleName === 'loading' && typeof opts.max === 'number' && opts.max > 0;
    const initialValue = typeof opts.value === 'number' ? opts.value : 0;
    const swipeEnabled = opts.swipe !== false;
    const pauseEnabled = (opts.pauseOnHover ?? this.config.pauseOnHover) && !isTouchPrimary();
    const position = this.resolvePosition(opts.position);
    const channel = opts.channel ?? null;

    // ---------- Build element ----------
    const el = document.createElement('div');
    el.className = 'toast toast-' + styleName;
    if (channel) el.setAttribute('data-channel', channel);
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'Click or swipe to dismiss notification');

    const iconEl = document.createElement('div');
    iconEl.className = 'toast-icon';
    const iconShown = renderIcon(iconEl, opts, styleName, initialValue);
    if (!iconShown) iconEl.style.display = 'none';
    el.appendChild(iconEl);

    const content = document.createElement('div');
    content.className = 'toast-content';

    // Header row: title + channel label. Channel goes top-right (opposite the
    // title), styled small/italic/muted.
    const header = document.createElement('div');
    header.className = 'toast-header';
    const titleEl = document.createElement('p');
    titleEl.className = 'toast-title';
    titleEl.textContent = title;
    if (!title) titleEl.style.display = 'none';
    header.appendChild(titleEl);
    const channelEl = buildChannelLabel(channel);
    if (channelEl) header.appendChild(channelEl);
    content.appendChild(header);

    const bodyEl = document.createElement('p');
    bodyEl.className = 'toast-body';
    bodyEl.textContent = body;
    content.appendChild(bodyEl);

    el.appendChild(content);

    const progress = document.createElement('div');
    progress.className = 'toast-progress';
    const progressFill = document.createElement('div');
    progressFill.className = 'toast-progress-fill';
    progress.appendChild(progressFill);
    el.appendChild(progress);

    // ---------- Build handle ----------
    const handle = new ToastHandleImpl(el, this);
    handle.fingerprint = fp;
    handle.channel = channel;
    handle.position = position;
    handle.sound = opts.sound;
    handle.resound = opts.resound;
    handle.max = hasDeterminate ? (opts.max as number) : null;
    handle.value = initialValue;

    // Actions go after content is built so the handle can be wired.
    const actionsEl = buildActions(opts.actions, handle);
    if (actionsEl) content.appendChild(actionsEl);

    // ---------- Wire interaction ----------
    el.addEventListener('click', () => handle.dismiss());
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handle.dismiss();
      }
    });

    if (swipeEnabled && 'PointerEvent' in window) attachSwipe(handle);
    if (pauseEnabled) attachPauseOnHover(handle);

    // ---------- Mount ----------
    const c = this.getContainer(position);
    this.liveToasts.push(handle);
    c.appendChild(el);

    setTimeout(() => el.classList.add('toast-show'), 10);

    // ---------- Timer scheduling ----------
    if (timeout > 0) {
      let sameSlot = 0;
      for (let i = 0; i < this.liveToasts.length - 1; i++) {
        if (this.liveToasts[i]!.position === position) sameSlot++;
      }
      const willBeVisible = sameSlot < MAX_VISIBLE_TOASTS;
      if (willBeVisible) {
        setTimeout(() => handle.startTimer(timeout), 20);
        handle.timerStarted = true;
      } else {
        handle.pendingTimeout = timeout;
      }
    }

    // ---------- Debounce ----------
    if (debounceMs > 0) {
      this.recentToasts[fp] = {
        handle,
        timeoutId: window.setTimeout(() => {
          if (this.recentToasts[fp]?.handle === handle) {
            delete this.recentToasts[fp];
          }
        }, debounceMs),
      };
    }

    // ---------- Sound ----------
    const soundOpt = opts.sound !== undefined ? opts.sound : this.config.sound;
    playSound(soundOpt, styleName);

    this.reflowVisibility();
    return handle;
  }

  /**
   * Dismiss every live toast.
   */
  dismissAll(): void {
    for (const h of this.liveToasts.slice()) h.dismiss();
  }

  /**
   * Dismiss every live toast tagged with the given channel.
   *
   * @param name - The channel name to clear.
   */
  dismissChannel(name: string): void {
    if (!name) return;
    for (const h of this.liveToasts.slice()) {
      if (h.channel === name) h.dismiss();
    }
  }

  /**
   * Apply global configuration defaults.
   *
   * @param opts - Configuration overrides to merge.
   */
  configure(opts: ToastConfig): void {
    if (opts.position && VALID_POSITIONS.has(opts.position)) {
      this.config.position = opts.position;
    }
    if (typeof opts.pauseOnHover === 'boolean') {
      this.config.pauseOnHover = opts.pauseOnHover;
    }
    if (opts.sound !== undefined) {
      this.config.sound = opts.sound;
    }
    if (typeof opts.resound === 'boolean') {
      this.config.resound = opts.resound;
    }
    if (opts.soundPresets) {
      setSoundPresets(opts.soundPresets);
    }
    // Reflow live toasts so changes take effect.
    this.reflowVisibility();
  }

  /**
   * Wrap a promise: show a loading toast immediately, then update to
   * success or error when the promise settles.
   *
   * If you need support for modifying standard toast options, you should
   * ***not*** use this method. This wrapper lacks support for nearly all
   * of the {@link ToastOptions} that the main {@link show} method provides.
   *
   * @param promise - The promise to track.
   * @param opts - Labels for loading, success, and error states.
   * @returns A handle that can dismiss or update the toast.
   */
  promise<T>(promise: Promise<T>, opts: PromiseOptions<T> = {}): ToastHandle {
    const loadingOpt = resolvePromiseValue(opts.loading, undefined);
    const handle = this.show({ style: 'loading', body: '', ...loadingOpt });

    const applyOutcome = <V>(
      style: ToastStyle,
      spec: PromiseValueSpec<V> | undefined,
      value: V,
    ): void => {
      const resolved = resolvePromiseValue(spec, value);
      if (!resolved) {
        handle.dismiss();
        return;
      }
      handle.update({
        style,
        timeout: 4000,
        max: undefined,
        value: 0,
        ...resolved,
      });
    };

    promise.then(
      (val) => applyOutcome('info', opts.success, val),
      (err) => applyOutcome('error', opts.error as PromiseValueSpec<unknown>, err),
    );
    return handle;
  }

  /**
   * Resolve the effective position for a toast, accounting for mobile override.
   *
   * @param pos - The position requested by the caller, if any.
   * @returns The resolved position.
   */
  private resolvePosition(pos: ToastPosition | undefined): ToastPosition {
    if (isMobile()) return 'bottom-center';
    if (pos && VALID_POSITIONS.has(pos)) return pos;
    return this.config.position;
  }

  /**
   * Get (or lazily create) the DOM container for a given position.
   *
   * @param position - The toast position slot.
   * @returns The container element.
   */
  private getContainer(position: ToastPosition): HTMLDivElement {
    let c = this.containers[position];
    if (!c) {
      c = document.createElement('div');
      c.className = 'toast-container toast-container-' + position;
      c.setAttribute('data-position', position);
      document.body.appendChild(c);
      this.containers[position] = c;
    }
    return c;
  }

  /**
   * Get (or lazily create) the overflow pill for a given position.
   *
   * @param position - The toast position slot.
   * @returns The overflow element.
   */
  private ensureOverflow(position: ToastPosition): HTMLDivElement {
    const existing = this.overflowEls[position];
    if (existing) return existing;
    const el = document.createElement('div');
    el.className = 'toast-overflow';
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.addEventListener('click', () => {
      // Dismiss the oldest visible toast at this position.
      for (const h of this.liveToasts) {
        if (h.position === position) {
          h.dismiss();
          return;
        }
      }
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        el.click();
      }
    });
    this.overflowEls[position] = el;
    return el;
  }

  /**
   * Remove the overflow pill for a position with an exit animation.
   *
   * @param position - The toast position slot.
   */
  private removeOverflow(position: ToastPosition): void {
    const el = this.overflowEls[position];
    if (!el) return;
    if (el.parentNode) {
      el.classList.remove('toast-overflow-show');
      const node = el;
      setTimeout(() => node.parentNode?.removeChild(node), EXIT_ANIMATION_MS);
    }
    delete this.overflowEls[position];
  }

  /**
   * Reflow all containers. Called whenever toasts are added or removed.
   *
   * Hide toasts beyond MAX_VISIBLE_TOASTS, show overflow pill,
   * start any pending timers for newly-promoted toasts.
   */
  private reflowVisibility(): void {
    const byPosition: Partial<Record<ToastPosition, ToastHandleImpl[]>> = {};
    for (const h of this.liveToasts) {
      const list = byPosition[h.position] ?? [];
      list.push(h);
      byPosition[h.position] = list;
    }

    for (const pos of Object.keys(byPosition) as ToastPosition[]) {
      const stack = byPosition[pos]!;
      this.reflowStandard(pos, stack);
    }

    // Tear down overflow pills for empty positions.
    for (const pos of Object.keys(this.overflowEls) as ToastPosition[]) {
      if (!byPosition[pos]) {
        this.removeOverflow(pos);
      }
    }
  }

  private reflowStandard(position: ToastPosition, stack: ToastHandleImpl[]): void {
    for (let i = 0; i < stack.length; i++) {
      const h = stack[i]!;
      const shouldBeVisible = i < MAX_VISIBLE_TOASTS;
      const wasVisible = h.el.style.display !== 'none';
      h.el.style.display = shouldBeVisible ? '' : 'none';

      if (shouldBeVisible && !wasVisible && h.pendingTimeout !== null && !h.timerStarted) {
        this.promoteTimer(h);
      }
    }

    const hidden = Math.max(0, stack.length - MAX_VISIBLE_TOASTS);
    const c = this.getContainer(position);
    if (hidden === 0) {
      this.removeOverflow(position);
      return;
    }
    const ov = this.ensureOverflow(position);
    ov.textContent = '+' + hidden + ' more';
    ov.setAttribute('aria-label', hidden + ' more notifications. Click to dismiss the oldest.');
    // Visual top of stack:
    //   top-anchored containers (column):       first DOM child
    //   bottom-anchored containers (col-reverse): last DOM child
    const anchorTop = position.startsWith('top-');
    const desiredLast = !anchorTop;
    const inWrongPlace =
      ov.parentNode !== c ||
      (!desiredLast && c.firstChild !== ov) ||
      (desiredLast && c.lastChild !== ov);
    if (inWrongPlace) {
      if (ov.parentNode === c) c.removeChild(ov);
      if (desiredLast) c.appendChild(ov);
      else c.insertBefore(ov, c.firstChild);
    }
    setTimeout(() => ov.classList.add('toast-overflow-show'), 10);
  }

  /**
   * Start a newly-visible toast's auto-dismiss timer that was deferred
   * while it was hidden behind the overflow limit.
   *
   * @param h - The toast handle to promote.
   */
  private promoteTimer(h: ToastHandleImpl): void {
    const ms = h.pendingTimeout;
    if (ms === null) return;
    h.pendingTimeout = null;
    h.timerStarted = true;
    setTimeout(() => h.startTimer(ms), 20);
  }

  /**
   * Lazily attach a window resize listener that reflows visibility
   * on breakpoint changes.
   */
  private ensureResizeListener(): void {
    if (this.resizeListenerAttached) return;
    this.resizeListenerAttached = true;
    window.addEventListener('resize', () => {
      if (this.resizeRaf !== null) return;
      this.resizeRaf = window.requestAnimationFrame(() => {
        this.resizeRaf = null;
        this.reflowVisibility();
      });
    });
  }
}

/**
 * Resolve a {@link PromiseValueSpec} into concrete {@link ToastOptions}.
 *
 * @param spec - The spec (string, options object, or factory function).
 * @param value - The resolved/rejected value passed to factory functions.
 * @returns Toast options, or `null` if the spec is undefined.
 */
function resolvePromiseValue<T>(
  spec: PromiseValueSpec<T> | undefined,
  value: T,
): ToastOptions | null {
  if (spec === undefined || spec === null) return null;
  const v = typeof spec === 'function' ? (spec as (v: T) => string | ToastOptions)(value) : spec;
  if (typeof v === 'string') return { body: v };
  if (typeof v === 'object') return v;
  return null;
}

export const manager = new ToastManager();
