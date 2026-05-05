import { DONUT_CIRCUMFERENCE, DONUT_RADIUS, DONUT_SIZE, DONUT_STROKE, ICONS } from './constants';
import type { ToastOptions, ToastStyle } from './types';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Create a CSS-animated spinner element for indeterminate loading toasts.
 *
 * @returns A `<div>` with the `toast-spinner` class.
 */
export function buildSpinner(): HTMLDivElement {
  const spinner = document.createElement('div');
  spinner.className = 'toast-spinner';
  return spinner;
}

/**
 * Create an SVG donut chart for determinate loading toasts.
 *
 * @returns An `<svg>` element with track and fill circles.
 */
export function buildDonut(): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'toast-donut');
  svg.setAttribute('viewBox', `0 0 ${DONUT_SIZE} ${DONUT_SIZE}`);
  svg.setAttribute('width', String(DONUT_SIZE));
  svg.setAttribute('height', String(DONUT_SIZE));

  const cx = DONUT_SIZE / 2;
  const cy = DONUT_SIZE / 2;

  const track = document.createElementNS(SVG_NS, 'circle');
  track.setAttribute('class', 'toast-donut-track');
  track.setAttribute('cx', String(cx));
  track.setAttribute('cy', String(cy));
  track.setAttribute('r', String(DONUT_RADIUS));
  track.setAttribute('stroke-width', String(DONUT_STROKE));
  track.setAttribute('fill', 'none');

  const fill = document.createElementNS(SVG_NS, 'circle');
  fill.setAttribute('class', 'toast-donut-fill');
  fill.setAttribute('cx', String(cx));
  fill.setAttribute('cy', String(cy));
  fill.setAttribute('r', String(DONUT_RADIUS));
  fill.setAttribute('stroke-width', String(DONUT_STROKE));
  fill.setAttribute('fill', 'none');
  fill.setAttribute('stroke-dasharray', String(DONUT_CIRCUMFERENCE));
  fill.setAttribute('stroke-dashoffset', String(DONUT_CIRCUMFERENCE));
  fill.setAttribute('transform', `rotate(-90 ${cx} ${cy})`);

  svg.appendChild(track);
  svg.appendChild(fill);
  return svg;
}

/**
 * Update the fill arc of a donut SVG to reflect current progress.
 *
 * @param svg - The donut SVG element.
 * @param value - Current progress value.
 * @param max - Maximum progress value.
 */
export function setDonutProgress(svg: SVGSVGElement, value: number, max: number): void {
  const fill = svg.querySelector<SVGCircleElement>('.toast-donut-fill');
  if (!fill) return;
  const safeMax = max > 0 ? max : 1;
  let safeValue = typeof value === 'number' && !Number.isNaN(value) ? value : 0;
  if (safeValue < 0) safeValue = 0;
  if (safeValue > safeMax) safeValue = safeMax;
  const offset = DONUT_CIRCUMFERENCE * (1 - safeValue / safeMax);
  fill.setAttribute('stroke-dashoffset', String(offset));
}

/**
 * Render either a spinner or a determinate donut into the icon area.
 *
 * @param iconEl - The container element for the icon.
 * @param value - Current progress value (used for determinate donuts).
 * @param max - Maximum progress value, or `null` for indeterminate.
 * @returns The spinner or donut element that was appended.
 */
export function renderLoadingIcon(
  iconEl: HTMLElement,
  value: number,
  max: number | null,
): SVGSVGElement | HTMLDivElement {
  iconEl.innerHTML = '';
  if (typeof max === 'number' && max > 0) {
    const donut = buildDonut();
    iconEl.appendChild(donut);
    setDonutProgress(donut, value || 0, max);
    return donut;
  }
  const spinner = buildSpinner();
  iconEl.appendChild(spinner);
  return spinner;
}

function isElement(value: unknown): value is HTMLElement {
  return typeof value === 'object' && value !== null && (value as Element).nodeType === 1;
}

/**
 * Render the icon area for a toast. Returns whether the icon box should be
 * displayed (`false` means the caller should hide it entirely).
 *
 * @param iconEl - The container element for the icon.
 * @param opts - Toast options that may contain a custom icon.
 * @param styleName - The resolved toast style.
 * @param currentValue - Current progress value (for loading donuts).
 * @returns `true` if the icon should be visible, `false` otherwise.
 */
export function renderIcon(
  iconEl: HTMLElement,
  opts: ToastOptions,
  styleName: ToastStyle,
  currentValue: number,
): boolean {
  if (opts.icon === false) {
    iconEl.innerHTML = '';
    return false;
  }
  // Loading style with no override: use spinner/donut.
  if (styleName === 'loading' && opts.icon === undefined) {
    const max = typeof opts.max === 'number' && opts.max > 0 ? opts.max : null;
    renderLoadingIcon(iconEl, currentValue || 0, max);
    return true;
  }
  // DOM node — clone so the same node can't be reused across toasts.
  if (isElement(opts.icon)) {
    iconEl.innerHTML = '';
    iconEl.appendChild(opts.icon.cloneNode(true));
    return true;
  }
  if (typeof opts.icon === 'string') {
    iconEl.innerHTML = '';
    iconEl.textContent = opts.icon;
    return true;
  }
  iconEl.innerHTML = '';
  iconEl.textContent = ICONS[styleName] ?? ICONS.info;
  return true;
}
