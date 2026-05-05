import type { ToastAction, ToastHandle } from './types';

/**
 * Build the action buttons row for a toast.
 *
 * @param actions - The action definitions to render.
 * @param handle - The toast handle passed to each action callback.
 * @returns A wrapper element containing the buttons, or `null` if there are no actions.
 */
export function buildActions(
  actions: ToastAction[] | undefined,
  handle: ToastHandle,
): HTMLDivElement | null {
  if (!actions || actions.length === 0) return null;
  const wrap = document.createElement('div');
  wrap.className = 'toast-actions';
  for (const action of actions) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className =
      'toast-action toast-action-' + (action.style === 'primary' ? 'primary' : 'default');
    btn.textContent = action.label || '';
    // Stop propagation so the toast's click-to-dismiss handler doesn't fire
    // when an action button is clicked.
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      let keep = false;
      if (typeof action.onClick === 'function') {
        try {
          keep = action.onClick(handle) === false;
        } catch {
          // Ignore.
        }
      }
      if (!keep) handle.dismiss();
    });
    // Also stop pointerdown so we don't accidentally start a swipe on the
    // action button.
    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
    wrap.appendChild(btn);
  }
  return wrap;
}

/**
 * Build a small channel label element.
 *
 * @param channel - The channel name, or `null` if none.
 * @returns A `<span>` element with the channel name, or `null` if the channel is falsy.
 */
export function buildChannelLabel(channel: string | null): HTMLSpanElement | null {
  if (!channel) return null;
  const el = document.createElement('span');
  el.className = 'toast-channel';
  el.textContent = channel;
  return el;
}
