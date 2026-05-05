const FLIP_DURATION_MS = 280;
const FLIP_STAGGER_MS = 35;
const FLIP_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

const cleanupTimers = new WeakMap<HTMLElement, number>();

function cancelPendingCleanup(el: HTMLElement): void {
  const tid = cleanupTimers.get(el);
  if (tid !== undefined) {
    clearTimeout(tid);
    cleanupTimers.delete(el);
  }
}

/**
 * Take a dismissed toast out of layout flow without altering its visual
 * position. Any in-flight transform (e.g. an active swipe-off transition)
 * is preserved by subtracting it from the absolute offset, so the gesture
 * continues smoothly while the rest of the stack reflows.
 *
 * @param container - The parent toast container element.
 * @param el - The toast element being dismissed.
 */
function freezeDismissed(container: HTMLElement, el: HTMLElement): void {
  if (el.dataset.toastFrozen === '1') return;

  let tx = 0;
  let ty = 0;
  const computed = window.getComputedStyle(el).transform;
  if (computed && computed !== 'none') {
    try {
      const m = new DOMMatrix(computed);
      tx = m.e;
      ty = m.f;
    } catch {
      // Fall back to no compensation.
    }
  }

  const r = el.getBoundingClientRect();
  const c = container.getBoundingClientRect();
  el.style.position = 'absolute';
  el.style.top = `${r.top - c.top - ty}px`;
  el.style.left = `${r.left - c.left - tx}px`;
  el.style.width = `${r.width}px`;
  el.dataset.toastFrozen = '1';
}

/**
 * FLIP-animate sibling toasts as they fill the gap left by a dismissed
 * toast. Capture rects pre-mutation, take the dismissed toast out of flow
 * and run any other layout-changing work via {@link mutate}, capture rects
 * post-mutation, then invert each sibling's transform and transition to
 * identity.
 *
 * Stagger propagates outward from the gap: the closest sibling starts
 * immediately, each subsequent one delayed by ~35ms.
 *
 * Re-entrant: when this runs again for a cascading dismissal,
 * `getBoundingClientRect` captures each sibling's current visual position
 * (transform-applied), so the new flip continues smoothly from wherever
 * the in-flight animation had reached toward the new layout slot.
 *
 * @param container - The parent toast container element.
 * @param dismissedEl - The toast element being removed from layout.
 * @param mutate - Callback that performs layout-changing work (e.g. releasing the handle).
 */
export function flipFloatUp(
  container: HTMLElement,
  dismissedEl: HTMLElement,
  mutate: () => void,
): void {
  const allKids = Array.prototype.slice.call(container.children) as HTMLElement[];
  const siblings: HTMLElement[] = [];
  for (const child of allKids) {
    if (
      child !== dismissedEl &&
      child.classList.contains('toast') &&
      child.style.display !== 'none' &&
      child.dataset.toastFrozen !== '1'
    ) {
      siblings.push(child);
    }
  }

  // No in-flow siblings need to FLIP into the gap. Skip freezing entirely —
  // freezing would set position:absolute, causing the (right/left-anchored)
  // container to collapse to 0 width, which yanks the dismissed toast off
  // its visual slot before the toast-hide transition can play.
  if (siblings.length === 0) {
    mutate();
    return;
  }

  const dismissedIdx = allKids.indexOf(dismissedEl);
  const oldRects = siblings.map((el) => el.getBoundingClientRect());

  freezeDismissed(container, dismissedEl);
  mutate();

  for (let i = 0; i < siblings.length; i++) {
    const s = siblings[i]!;
    const oldR = oldRects[i]!;

    cancelPendingCleanup(s);

    // Drop any in-flight transform so getBoundingClientRect reads the pure
    // post-mutation layout slot. We still hold oldR (the visual position
    // before mutation) so the inverse below restores the visual continuity.
    s.style.transition = 'none';
    s.style.transform = '';
    void s.offsetHeight;
    const newR = s.getBoundingClientRect();

    const dx = oldR.left - newR.left;
    const dy = oldR.top - newR.top;

    if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
      s.style.removeProperty('transform');
      s.style.removeProperty('transition');
      continue;
    }

    // 1 = adjacent to the gap → no delay; 2 = one further → 1 stagger; etc.
    const sIdx = allKids.indexOf(s);
    const distance = Math.max(0, Math.abs(sIdx - dismissedIdx) - 1);
    const delay = distance * FLIP_STAGGER_MS;

    s.style.transform = `translate(${dx}px, ${dy}px)`;
    void s.offsetHeight;

    s.style.transition = `transform ${FLIP_DURATION_MS}ms ${FLIP_EASING} ${delay}ms`;
    s.style.transform = '';

    const tid = window.setTimeout(
      () => {
        cleanupTimers.delete(s);
        s.style.removeProperty('transform');
        s.style.removeProperty('transition');
      },
      FLIP_DURATION_MS + delay + 50,
    );
    cleanupTimers.set(s, tid);
  }
}
