import { manager } from './manager';
import type { PromiseOptions, ToastConfig, ToastHandle, ToastOptions } from './types';

export type {
  ChimeNote,
  IconOption,
  PromiseOptions,
  PromiseValueSpec,
  SoundOption,
  ToastAction,
  ToastConfig,
  ToastHandle,
  ToastOptions,
  ToastPosition,
  ToastStyle,
} from './types';

/**
 * Show a toast and return a handle to it.
 *
 * @param opts - Configuration for the toast.
 * @returns A handle that can dismiss or update the toast.
 */
export function show(opts: ToastOptions): ToastHandle {
  return manager.show(opts);
}

/**
 * Convenience: show an info-styled toast.
 *
 * @param body - The message text.
 * @param opts - Optional overrides.
 * @returns A handle that can dismiss or update the toast.
 */
export function info(body: string, opts?: ToastOptions): ToastHandle {
  return manager.show({ body, style: 'info', ...opts });
}

/**
 * Convenience: show a warning-styled toast.
 *
 * @param body - The message text.
 * @param opts - Optional overrides.
 * @returns A handle that can dismiss or update the toast.
 */
export function warning(body: string, opts?: ToastOptions): ToastHandle {
  return manager.show({ body, style: 'warning', ...opts });
}

/**
 * Convenience: show an error-styled toast.
 *
 * @param body - The message text.
 * @param opts - Optional overrides.
 * @returns A handle that can dismiss or update the toast.
 */
export function error(body: string, opts?: ToastOptions): ToastHandle {
  return manager.show({ body, style: 'error', ...opts });
}

/**
 * Convenience: show a loading-styled toast (spinner or determinate donut).
 *
 * @param body - The message text.
 * @param opts - Optional overrides.
 * @returns A handle that can dismiss or update the toast.
 */
export function loading(body: string, opts?: ToastOptions): ToastHandle {
  return manager.show({ body, style: 'loading', ...opts });
}

/**
 * Wrap a promise: show a loading toast immediately, then update to success or
 * error when the promise settles.
 *
 * @param p - The promise to track.
 * @param opts - Labels for loading, success, and error states.
 * @returns A handle that can dismiss or update the toast.
 */
export function promise<T>(p: Promise<T>, opts: PromiseOptions<T>): ToastHandle {
  return manager.promise(p, opts);
}

/**
 * Dismiss every live toast.
 */
export function dismissAll(): void {
  manager.dismissAll();
}

/**
 * Dismiss every live toast tagged with the given channel.
 *
 * @param name - The channel name to dismiss.
 */
export function dismissChannel(name: string): void {
  manager.dismissChannel(name);
}

/**
 * Set global defaults. Per-call options still override.
 *
 * @param opts - Global configuration to apply.
 */
export function configure(opts: ToastConfig): void {
  manager.configure(opts);
}

interface ChyrpFn {
  (opts: ToastOptions): ToastHandle;
  info: typeof info;
  warning: typeof warning;
  error: typeof error;
  loading: typeof loading;
  promise: typeof promise;
  dismissAll: typeof dismissAll;
  dismissChannel: typeof dismissChannel;
  configure: typeof configure;
}

const chyrpFn = ((opts: ToastOptions) => manager.show(opts)) as ChyrpFn;
chyrpFn.info = info;
chyrpFn.warning = warning;
chyrpFn.error = error;
chyrpFn.loading = loading;
chyrpFn.promise = promise;
chyrpFn.dismissAll = dismissAll;
chyrpFn.dismissChannel = dismissChannel;
chyrpFn.configure = configure;

/**
 * Callable chyrp function with attached helpers.
 *
 * @example
 * import { chyrp } from 'chyrp';
 * import 'chyrp/style.css';
 *
 * chyrp({ body: 'hello' });
 * chyrp.info('hello');
 * chyrp.promise(saveUser(), { loading: 'Saving…', success: 'Saved' });
 */
export const chyrp: ChyrpFn = chyrpFn;

/**
 * Optionally replace `window.alert` with a toast-based version. Returns a
 * function that restores the original alert. Opt-in because monkey-patching
 * globals is the kind of side effect a library shouldn't do on import.
 */
export function interceptAlert(): () => void {
  const original = window.alert;
  window.alert = (message?: unknown) => {
    manager.show({ body: String(message), style: 'info' });
  };
  return () => {
    window.alert = original;
  };
}
