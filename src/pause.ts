import type { ToastHandleImpl } from './handle';

/**
 * Attach pause-on-hover behaviour to a toast. Pauses by capturing the
 * progress bar's current width and freezing it, then resumes by re-issuing
 * the transition with the remaining duration.
 *
 * @param handle - The toast handle to attach hover listeners to.
 */
export function attachPauseOnHover(handle: ToastHandleImpl): void {
  const el = handle.el;

  function pause(): void {
    if (handle.dismissed || !handle.timerStarted || handle.paused) return;
    if (
      handle.timeoutId === null ||
      handle.timerStartedAt === null ||
      handle.timerDuration === null
    ) {
      return;
    }
    const elapsed = Date.now() - handle.timerStartedAt;
    const remaining = Math.max(0, handle.timerDuration - elapsed);
    handle.timerRemaining = remaining;
    clearTimeout(handle.timeoutId);
    handle.timeoutId = null;
    handle.paused = true;
    const bar = el.querySelector<HTMLElement>('.toast-progress-fill');
    if (bar) {
      const computed = window.getComputedStyle(bar).width;
      bar.style.transition = 'none';
      bar.style.width = computed;
    }
    el.classList.add('toast-paused');
  }

  function resume(): void {
    if (handle.dismissed || !handle.paused) return;
    handle.paused = false;
    el.classList.remove('toast-paused');
    const ms = handle.timerRemaining ?? 0;
    if (ms <= 0) {
      handle.dismiss();
      return;
    }
    const bar = el.querySelector<HTMLElement>('.toast-progress-fill');
    if (bar) {
      bar.style.transition = 'none';
      // Force a reflow so the next transition takes effect.
      void bar.offsetWidth;
      bar.style.transition = `width ${ms}ms linear`;
      bar.style.width = '0%';
    }
    handle.timerStartedAt = Date.now();
    handle.timerDuration = ms;
    handle.timeoutId = window.setTimeout(() => handle.dismiss(), ms);
  }

  el.addEventListener('pointerenter', pause);
  el.addEventListener('pointerleave', resume);
  // Keyboard focus also pauses, since a keyboard user might need extra time
  // to read and act.
  el.addEventListener('focusin', pause);
  el.addEventListener('focusout', resume);
}
