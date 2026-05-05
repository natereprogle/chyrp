//#region src/types.d.ts
interface ChimeNote {
  /** Frequency in Hz. */
  frequency: number;
  /** Time offset from the start of the chime in seconds. */
  startOffset: number;
  /** Duration of the note's audible envelope in seconds. */
  duration: number;
  /** Peak amplitude (0–1). */
  amplitude: number;
}
type ToastStyle = 'info' | 'warning' | 'error' | 'loading';
type ToastPosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
type SoundOption = boolean | 'gentle' | 'alert' | 'success' | 'error' | ChimeNote[] | (string & {});
type IconOption = string | HTMLElement | false;
interface ToastAction {
  label: string;
  onClick?: (handle: ToastHandle) => boolean | void;
  style?: 'primary' | 'default';
}
interface ToastOptions {
  /** Bold heading shown above the body. */
  title?: string;
  /** Main message text. */
  body?: string;
  /** Visual style and default icon. */
  style?: ToastStyle;
  /** Milliseconds before auto-dismiss. 0 disables. */
  timeout?: number;
  /** If true, disables auto-dismiss. */
  persistent?: boolean;
  /** Ms during which an identical toast is suppressed. */
  debounce?: number;
  /** Allow swipe-to-dismiss. Default true. */
  swipe?: boolean;
  /** Pause timer on pointer hover. Ignored on touch-primary devices. */
  pauseOnHover?: boolean;
  /** Override container position. Mobile always forces 'bottom-center'. */
  position?: ToastPosition;
  /** Tag for grouping. Use {@link dismissChannel} to clear by channel. */
  channel?: string;
  /** Custom icon: text, DOM element (cloned), or false to hide. */
  icon?: IconOption;
  /** Buttons rendered below the body. */
  actions?: ToastAction[];
  /** Sound preset, URL, or true for style-based default. */
  sound?: SoundOption;
  /** (loading) Total work units for determinate donut. */
  max?: number;
  /** (loading) Current progress. */
  value?: number;
}
interface ToastConfig {
  position?: ToastPosition;
  pauseOnHover?: boolean;
  sound?: SoundOption;
  /** Override built-in chime presets. Unset presets keep their defaults. */
  soundPresets?: Partial<Record<'success' | 'error' | 'alert' | 'gentle', ChimeNote[]>>;
}
interface ToastHandle {
  /** Dismiss the toast immediately. */
  dismiss(): void;
  /** Mutate the live toast in place. */
  update(opts: ToastOptions): ToastHandle;
}
type PromiseValueSpec<T> = string | ToastOptions | ((value: T) => string | ToastOptions);
interface PromiseOptions<T = unknown, E = unknown> {
  loading?: PromiseValueSpec<void>;
  success?: PromiseValueSpec<T>;
  error?: PromiseValueSpec<E>;
}
//#endregion
//#region src/index.d.ts
/**
 * Show a toast and return a handle to it.
 *
 * @param opts - Configuration for the toast.
 * @returns A handle that can dismiss or update the toast.
 */
declare function show(opts: ToastOptions): ToastHandle;
/**
 * Convenience: show an info-styled toast.
 *
 * @param body - The message text.
 * @param opts - Optional overrides.
 * @returns A handle that can dismiss or update the toast.
 */
declare function info(body: string, opts?: ToastOptions): ToastHandle;
/**
 * Convenience: show a warning-styled toast.
 *
 * @param body - The message text.
 * @param opts - Optional overrides.
 * @returns A handle that can dismiss or update the toast.
 */
declare function warning(body: string, opts?: ToastOptions): ToastHandle;
/**
 * Convenience: show an error-styled toast.
 *
 * @param body - The message text.
 * @param opts - Optional overrides.
 * @returns A handle that can dismiss or update the toast.
 */
declare function error(body: string, opts?: ToastOptions): ToastHandle;
/**
 * Convenience: show a loading-styled toast (spinner or determinate donut).
 *
 * @param body - The message text.
 * @param opts - Optional overrides.
 * @returns A handle that can dismiss or update the toast.
 */
declare function loading(body: string, opts?: ToastOptions): ToastHandle;
/**
 * Wrap a promise: show a loading toast immediately, then update to success or
 * error when the promise settles.
 *
 * @param p - The promise to track.
 * @param opts - Labels for loading, success, and error states.
 * @returns A handle that can dismiss or update the toast.
 */
declare function promise<T>(p: Promise<T>, opts: PromiseOptions<T>): ToastHandle;
/**
 * Dismiss every live toast.
 */
declare function dismissAll(): void;
/**
 * Dismiss every live toast tagged with the given channel.
 *
 * @param name - The channel name to dismiss.
 */
declare function dismissChannel(name: string): void;
/**
 * Set global defaults. Per-call options still override.
 *
 * @param opts - Global configuration to apply.
 */
declare function configure(opts: ToastConfig): void;
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
declare const chyrp: ChyrpFn;
/**
 * Optionally replace `window.alert` with a toast-based version. Returns a
 * function that restores the original alert. Opt-in because monkey-patching
 * globals is the kind of side effect a library shouldn't do on import.
 */
declare function interceptAlert(): () => void;
//#endregion
export { type ChimeNote, type IconOption, type PromiseOptions, type PromiseValueSpec, type SoundOption, type ToastAction, type ToastConfig, type ToastHandle, type ToastOptions, type ToastPosition, type ToastStyle, chyrp, configure, dismissAll, dismissChannel, error, info, interceptAlert, loading, promise, show, warning };
//# sourceMappingURL=index.d.ts.map