import { EXIT_ANIMATION_MS, SWIPE_DISTANCE_THRESHOLD, SWIPE_VELOCITY_THRESHOLD } from './constants';
import type { ToastHandleImpl } from './handle';

interface SwipeAxis {
  axis: 'x' | 'y';
  dir: 1 | -1;
}

/**
 * Wire up swipe-to-dismiss on the toast element. The handle is responsible
 * for cleaning up its own state when {@link ToastHandleImpl.finalizeAfterSwipe}
 * is called — the swipe code only owns the gesture animation.
 *
 * @param handle - The toast handle whose element receives pointer listeners.
 */
export function attachSwipe(handle: ToastHandleImpl): void {
  const el = handle.el;
  let startX = 0;
  let startY = 0;
  let startT = 0;
  let dx = 0;
  let dy = 0;
  let dragging = false;
  let pointerId: number | null = null;

  // Resolve swipe axis and direction from the toast's position. The toast
  // exits toward the screen edge it's anchored to, with rubber-banding in the
  // opposite direction.
  function resolveAxis(): SwipeAxis {
    const pos = handle.position;
    if (pos.includes('center')) {
      return { axis: 'y', dir: pos.startsWith('top-') ? -1 : 1 };
    }
    if (pos.includes('left')) return { axis: 'x', dir: -1 };
    return { axis: 'x', dir: 1 };
  }

  function onDown(e: PointerEvent): void {
    if (e.button !== 0) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    startT = Date.now();
    dx = 0;
    dy = 0;
    dragging = true;
    el.classList.add('toast-dragging');
    try {
      el.setPointerCapture(pointerId);
    } catch {
      // Ignore.
    }
  }

  function onMove(e: PointerEvent): void {
    if (!dragging || e.pointerId !== pointerId) return;
    dx = e.clientX - startX;
    dy = e.clientY - startY;
    const ad = resolveAxis();
    const raw = ad.axis === 'y' ? dy : dx;
    // 'travel' is positive in the dismissal direction.
    let travel = raw * ad.dir;
    if (travel < 0) travel = travel * 0.2; // rubber-band
    const visualTravel = travel * ad.dir;
    const opacity = 1 - Math.min(0.7, Math.abs(travel) / 200);
    el.style.transform =
      ad.axis === 'y' ? `translateY(${visualTravel}px)` : `translateX(${visualTravel}px)`;
    el.style.opacity = String(opacity);
  }

  function onUp(e: PointerEvent): void {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    el.classList.remove('toast-dragging');
    if (pointerId !== null) {
      try {
        el.releasePointerCapture(pointerId);
      } catch {
        // Ignore.
      }
    }
    const ad = resolveAxis();
    const raw = ad.axis === 'y' ? dy : dx;
    const travel = raw * ad.dir;
    const elapsed = Math.max(1, Date.now() - startT);
    const velocity = travel / elapsed;
    const pastDistance = travel >= SWIPE_DISTANCE_THRESHOLD;
    const pastVelocity = velocity >= SWIPE_VELOCITY_THRESHOLD;

    if (pastDistance || pastVelocity) {
      el.style.transition = `transform ${EXIT_ANIMATION_MS}ms ease-out, opacity ${EXIT_ANIMATION_MS}ms ease-out`;
      const sign = ad.dir > 0 ? '120%' : '-120%';
      el.style.transform = ad.axis === 'y' ? `translateY(${sign})` : `translateX(${sign})`;
      el.style.opacity = '0';
      handle.finalizeAfterSwipe();
      return;
    }

    el.style.transition = 'transform 200ms ease-out, opacity 200ms ease-out';
    el.style.transform = '';
    el.style.opacity = '';
    setTimeout(() => {
      el.style.transition = '';
    }, 200);
  }

  el.addEventListener('pointerdown', onDown);
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerup', onUp);
  el.addEventListener('pointercancel', onUp);
}
