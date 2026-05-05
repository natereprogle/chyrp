import { MOBILE_BREAKPOINT } from './constants';
import type { ToastOptions } from './types';

/**
 * Check whether the viewport width is at or below the mobile breakpoint.
 *
 * @returns `true` if the window is mobile-sized.
 */
export function isMobile(): boolean {
  return window.innerWidth <= MOBILE_BREAKPOINT;
}

/**
 * Detect whether the device is touch-primary. Pause-on-hover is disabled
 * on these devices because hover/leave events don't fit how phones are
 * actually used.
 *
 * @returns `true` if the device has no hover capability or a coarse pointer.
 */
export function isTouchPrimary(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(hover: none), (pointer: coarse)').matches
    : false;
}

/**
 * Produce a deduplication fingerprint for a toast. The channel is included
 * so that identical messages in different channels are treated as distinct.
 * Uses NUL as separator so it can't collide with regular text.
 *
 * @param opts - The toast options to fingerprint.
 * @returns A string key suitable for deduplication lookups.
 */
export function fingerprint(opts: ToastOptions): string {
  const sep = '\u0000';
  return (
    (opts.style ?? 'info') +
    sep +
    (opts.title ?? '') +
    sep +
    (opts.body ?? '') +
    sep +
    (opts.channel ?? '')
  );
}
