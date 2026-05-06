declare module 'chyrp' {
  export interface ChimeNote {
    frequency: number
    startOffset: number
    duration: number
    amplitude: number
  }

  export type ToastStyle = 'info' | 'warning' | 'error' | 'loading'

  export type ToastPosition =
    | 'top-right'
    | 'top-left'
    | 'top-center'
    | 'bottom-right'
    | 'bottom-left'
    | 'bottom-center'

  export type SoundOption =
    | boolean
    | 'gentle'
    | 'alert'
    | 'success'
    | 'error'
    | ChimeNote[]
    | (string & {})

  export type IconOption = string | HTMLElement | false

  export interface ToastAction {
    label: string
    onClick?: (handle: ToastHandle) => boolean | void
    style?: 'primary' | 'default'
  }

  export interface ToastOptions {
    title?: string
    body?: string
    style?: ToastStyle
    timeout?: number
    persistent?: boolean
    debounce?: number
    swipe?: boolean
    pauseOnHover?: boolean
    position?: ToastPosition
    channel?: string
    icon?: IconOption
    actions?: ToastAction[]
    sound?: SoundOption
    resound?: boolean
    max?: number
    value?: number
  }

  export interface ToastConfig {
    position?: ToastPosition
    pauseOnHover?: boolean
    sound?: SoundOption
    resound?: boolean
    soundPresets?: Partial<Record<'success' | 'error' | 'alert' | 'gentle', ChimeNote[]>>
  }

  export interface ToastHandle {
    dismiss(): void
    update(opts: ToastOptions): ToastHandle
  }

  export type PromiseValueSpec<T> = string | ToastOptions | ((value: T) => string | ToastOptions)

  export interface PromiseOptions<T = unknown, E = unknown> {
    loading?: PromiseValueSpec<void>
    success?: PromiseValueSpec<T>
    error?: PromiseValueSpec<E>
  }

  interface ChyrpFn {
    (opts: ToastOptions): ToastHandle
    info(body: string, opts?: ToastOptions): ToastHandle
    warning(body: string, opts?: ToastOptions): ToastHandle
    error(body: string, opts?: ToastOptions): ToastHandle
    loading(body: string, opts?: ToastOptions): ToastHandle
    promise<T>(p: Promise<T>, opts: PromiseOptions<T>): ToastHandle
  }

  export const chyrp: ChyrpFn
  export function show(opts: ToastOptions): ToastHandle
  export function info(body: string, opts?: ToastOptions): ToastHandle
  export function warning(body: string, opts?: ToastOptions): ToastHandle
  export function error(body: string, opts?: ToastOptions): ToastHandle
  export function loading(body: string, opts?: ToastOptions): ToastHandle
  export function promise<T>(p: Promise<T>, opts: PromiseOptions<T>): ToastHandle
  export function dismissAll(): void
  export function dismissChannel(name: string): void
  export function configure(opts: ToastConfig): void
  export function interceptAlert(): () => void
}

declare module 'chyrp/style.css'
