import { buildActions } from './actions';
import { EXIT_ANIMATION_MS, ICONS } from './constants';
import { flipFloatUp } from './flip';
import { renderIcon, renderLoadingIcon, setDonutProgress } from './icons';
import type { SoundOption, ToastHandle, ToastOptions, ToastPosition, ToastStyle } from './types';

/**
 * Hooks called by a {@link ToastHandleImpl} during teardown.
 */
export interface HandleCleanupHooks {
  /**
   * Called when the handle is being torn down (dismiss or swipe).
   *
   * @param handle - The handle being released.
   */
  release(handle: ToastHandleImpl): void;

  /**
   * Called when update() changes a toast's style.
   *
   * @param handle - The updated handle.
   * @param nextStyle - The style after update.
   */
  handleStyleUpdateSound(handle: ToastHandleImpl, nextStyle: ToastStyle): void;
}

const STYLE_PATTERN = /toast-(info|warning|error|loading)/g;
const STYLE_PATTERN_SINGLE = /toast-(info|warning|error|loading)/;

/**
 * Concrete implementation of {@link ToastHandle}. Manages the toast element
 * lifecycle, timer state, and dismissal animations.
 */
export class ToastHandleImpl implements ToastHandle {
  el: HTMLElement;
  fingerprint: string | null = null;
  channel: string | null = null;
  position: ToastPosition = 'top-right';
  max: number | null = null;
  value = 0;
  pendingTimeout: number | null = null;
  timerStarted = false;
  sound: SoundOption | undefined = undefined;
  resound: boolean | undefined = undefined;

  timeoutId: number | null = null;
  dismissed = false;

  // Pause-on-hover bookkeeping.
  timerStartedAt: number | null = null;
  timerDuration: number | null = null;
  timerRemaining: number | null = null;
  paused = false;

  private hooks: HandleCleanupHooks;

  constructor(el: HTMLElement, hooks: HandleCleanupHooks) {
    this.el = el;
    this.hooks = hooks;
  }

  /**
   * Dismiss the toast with the standard hide animation.
   */
  dismiss(): void {
    if (this.dismissed) return;
    this.dismissed = true;
    this.clearTimer();
    this.pendingTimeout = null;
    const el = this.el;
    this.runReleaseWithFloatUp(el);
    el.classList.remove('toast-show');
    el.classList.add('toast-hide');
    setTimeout(() => el.parentNode?.removeChild(el), EXIT_ANIMATION_MS);
  }

  /**
   * Tear-down path used by the swipe gesture. The element is already animated
   * off-screen, so we skip the `toast-hide` class transition and just clean up
   * state and remove the node after the swipe animation completes.
   */
  finalizeAfterSwipe(): void {
    if (this.dismissed) return;
    this.dismissed = true;
    this.clearTimer();
    this.pendingTimeout = null;
    const el = this.el;
    this.runReleaseWithFloatUp(el);
    setTimeout(() => el.parentNode?.removeChild(el), EXIT_ANIMATION_MS);
  }

  /**
   * FLIP the surviving siblings so they float smoothly into their new layout
   * slots instead of snapping.
   */
  private runReleaseWithFloatUp(el: HTMLElement): void {
    const container = el.parentElement;
    if (
      container &&
      container.classList.contains('toast-container')
    ) {
      flipFloatUp(container, el, () => this.hooks.release(this));
    } else {
      this.hooks.release(this);
    }
  }

  /**
   * Start (or restart) the auto-dismiss countdown and progress bar animation.
   *
   * @param ms - Duration in milliseconds before the toast is dismissed.
   */
  startTimer(ms: number): void {
    this.clearTimer();
    const bar = this.el.querySelector<HTMLElement>('.toast-progress-fill');
    if (!bar) return;
    if (ms > 0) {
      bar.style.transition = 'none';
      bar.style.width = '100%';
      // Force reflow so the next transition kicks in.
      void bar.offsetWidth;
      bar.style.transition = `width ${ms}ms linear`;
      bar.style.width = '0%';
      this.el.classList.add('toast-has-timer');
      this.timerStartedAt = Date.now();
      this.timerDuration = ms;
      this.timerRemaining = ms;
      this.timeoutId = window.setTimeout(() => this.dismiss(), ms);
    } else {
      bar.style.transition = 'none';
      bar.style.width = '0%';
      this.el.classList.remove('toast-has-timer');
    }
  }

  /**
   * Mutate the live toast in place, updating its style, body, icon, actions,
   * and/or timer.
   *
   * @param opts - The properties to update.
   * @returns This handle, for chaining.
   */
  update(opts: ToastOptions): this {
    const el = this.el;

    const match = el.className.match(STYLE_PATTERN_SINGLE);
    const currentStyle = (match?.[1] as ToastStyle | undefined) ?? 'info';
    const nextStyle: ToastStyle = opts.style ?? currentStyle;
    const styleChanged = opts.style !== undefined && nextStyle !== currentStyle;

    if (opts.sound !== undefined) {
      this.sound = opts.sound;
    }
    if (opts.resound !== undefined) {
      this.resound = opts.resound;
    }

    if (opts.style) {
      el.className = el.className.replace(STYLE_PATTERN, '').trim();
      el.classList.add('toast-' + opts.style);
    }

    const maxProvided = Object.prototype.hasOwnProperty.call(opts, 'max');
    const valueProvided = Object.prototype.hasOwnProperty.call(opts, 'value');
    const nextMax = maxProvided ? (opts.max ?? null) : this.max;
    const nextValue = valueProvided ? (opts.value ?? 0) : this.value;

    const iconEl = el.querySelector<HTMLElement>('.toast-icon');
    if (iconEl) {
      if (opts.icon !== undefined) {
        renderIcon(iconEl, opts, nextStyle, nextValue);
        iconEl.style.display = opts.icon === false ? 'none' : '';
      } else if (nextStyle === 'loading') {
        const existingDonut = iconEl.querySelector<SVGSVGElement>('.toast-donut');
        const hasDonut = !!existingDonut;
        const wantDonut = typeof nextMax === 'number' && nextMax > 0;
        if (wantDonut && hasDonut) {
          setDonutProgress(existingDonut, nextValue, nextMax as number);
        } else if (wantDonut !== hasDonut || opts.style === 'loading') {
          renderLoadingIcon(iconEl, nextValue, wantDonut ? (nextMax as number) : null);
        }
      } else if (opts.style) {
        iconEl.innerHTML = '';
        iconEl.textContent = ICONS[opts.style] ?? ICONS.info;
        iconEl.style.display = '';
      }
    }

    this.max = nextMax;
    this.value = nextValue;

    if (opts.title !== undefined) {
      const titleEl = el.querySelector<HTMLElement>('.toast-title');
      if (titleEl) {
        titleEl.textContent = opts.title || '';
        titleEl.style.display = opts.title ? '' : 'none';
      }
    }
    if (opts.body !== undefined) {
      const bodyEl = el.querySelector<HTMLElement>('.toast-body');
      if (bodyEl) bodyEl.textContent = opts.body || '';
    }

    // Allow updating actions in place (e.g. promise() converting loading to
    // success and adding a "view" action).
    if (opts.actions !== undefined) {
      const existingActions = el.querySelector('.toast-actions');
      existingActions?.parentNode?.removeChild(existingActions);
      const newActions = buildActions(opts.actions, this);
      if (newActions) {
        const content = el.querySelector('.toast-content');
        content?.appendChild(newActions);
      }
    }

    if (opts.timeout !== undefined) {
      if (this.el.style.display === 'none') {
        this.pendingTimeout = opts.timeout;
        this.timerStarted = false;
      } else {
        this.startTimer(opts.timeout);
        this.timerStarted = true;
      }
    }

    if (styleChanged) {
      this.hooks.handleStyleUpdateSound(this, nextStyle);
    }

    return this;
  }

  private clearTimer(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
