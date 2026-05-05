import type { ToastPosition, ToastStyle } from './types';

export const DEFAULT_DEBOUNCE_MS = 100;
export const EXIT_ANIMATION_MS = 250;
export const MAX_VISIBLE_TOASTS = 4;
export const SWIPE_DISTANCE_THRESHOLD = 80;
export const SWIPE_VELOCITY_THRESHOLD = 0.5;
export const DONUT_SIZE = 20;
export const DONUT_RADIUS = 8;
export const DONUT_STROKE = 3;
export const DONUT_CIRCUMFERENCE = 2 * Math.PI * DONUT_RADIUS;
export const MOBILE_BREAKPOINT = 600;

export const ICONS: Record<ToastStyle, string> = {
  info: 'i',
  warning: '!',
  error: '×',
  loading: '',
};

export const VALID_POSITIONS: ReadonlySet<ToastPosition> = new Set<ToastPosition>([
  'top-right',
  'top-left',
  'top-center',
  'bottom-right',
  'bottom-left',
  'bottom-center',
]);
