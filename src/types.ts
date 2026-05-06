export interface ChimeNote {
  /** Frequency in Hz. */
  frequency: number;
  /** Time offset from the start of the chime in seconds. */
  startOffset: number;
  /** Duration of the note's audible envelope in seconds. */
  duration: number;
  /** Peak amplitude (0–1). */
  amplitude: number;
}

export type ToastStyle = 'info' | 'warning' | 'error' | 'loading';

export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'top-center'
  | 'bottom-right'
  | 'bottom-left'
  | 'bottom-center';

export type SoundOption =
  | boolean
  | 'gentle'
  | 'alert'
  | 'success'
  | 'error'
  | ChimeNote[]
  | (string & {});

export type IconOption = string | HTMLElement | false;

export interface ToastAction {
  label: string;
  onClick?: (handle: ToastHandle) => boolean | void;
  style?: 'primary' | 'default';
}

export interface ToastOptions {
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
  /** Replay sound when a style change happens via handle.update({ style }). */
  resound?: boolean;
  /** (loading) Total work units for determinate donut. */
  max?: number;
  /** (loading) Current progress. */
  value?: number;
}

export interface ToastConfig {
  position?: ToastPosition;
  pauseOnHover?: boolean;
  sound?: SoundOption;
  /** Global default for replaying sound when update() changes style. */
  resound?: boolean;
  /** Override built-in chime presets. Unset presets keep their defaults. */
  soundPresets?: Partial<Record<'success' | 'error' | 'alert' | 'gentle', ChimeNote[]>>;
}

export interface ToastHandle {
  /** Dismiss the toast immediately. */
  dismiss(): void;
  /** Mutate the live toast in place. */
  update(opts: ToastOptions): ToastHandle;
}

export type PromiseValueSpec<T> = string | ToastOptions | ((value: T) => string | ToastOptions);

export interface PromiseOptions<T = unknown, E = unknown> {
  loading?: PromiseValueSpec<void>;
  success?: PromiseValueSpec<T>;
  error?: PromiseValueSpec<E>;
}
