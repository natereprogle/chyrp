//#region src/actions.ts
/**
* Build the action buttons row for a toast.
*
* @param actions - The action definitions to render.
* @param handle - The toast handle passed to each action callback.
* @returns A wrapper element containing the buttons, or `null` if there are no actions.
*/
function buildActions(actions, handle) {
	if (!actions || actions.length === 0) return null;
	const wrap = document.createElement("div");
	wrap.className = "toast-actions";
	for (const action of actions) {
		const btn = document.createElement("button");
		btn.type = "button";
		btn.className = "toast-action toast-action-" + (action.style === "primary" ? "primary" : "default");
		btn.textContent = action.label || "";
		btn.addEventListener("click", (e) => {
			e.stopPropagation();
			let keep = false;
			if (typeof action.onClick === "function") try {
				keep = action.onClick(handle) === false;
			} catch {}
			if (!keep) handle.dismiss();
		});
		btn.addEventListener("pointerdown", (e) => e.stopPropagation());
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
function buildChannelLabel(channel) {
	if (!channel) return null;
	const el = document.createElement("span");
	el.className = "toast-channel";
	el.textContent = channel;
	return el;
}
const DONUT_CIRCUMFERENCE = 2 * Math.PI * 8;
const ICONS = {
	info: "i",
	warning: "!",
	error: "×",
	loading: ""
};
const VALID_POSITIONS = new Set([
	"top-right",
	"top-left",
	"top-center",
	"bottom-right",
	"bottom-left",
	"bottom-center"
]);
//#endregion
//#region src/flip.ts
const FLIP_DURATION_MS = 280;
const FLIP_STAGGER_MS = 35;
const FLIP_EASING = "cubic-bezier(0.2, 0.8, 0.2, 1)";
const cleanupTimers = /* @__PURE__ */ new WeakMap();
function cancelPendingCleanup(el) {
	const tid = cleanupTimers.get(el);
	if (tid !== void 0) {
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
function freezeDismissed(container, el) {
	if (el.dataset.toastFrozen === "1") return;
	let tx = 0;
	let ty = 0;
	const computed = window.getComputedStyle(el).transform;
	if (computed && computed !== "none") try {
		const m = new DOMMatrix(computed);
		tx = m.e;
		ty = m.f;
	} catch {}
	const r = el.getBoundingClientRect();
	const c = container.getBoundingClientRect();
	el.style.position = "absolute";
	el.style.top = `${r.top - c.top - ty}px`;
	el.style.left = `${r.left - c.left - tx}px`;
	el.style.width = `${r.width}px`;
	el.dataset.toastFrozen = "1";
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
function flipFloatUp(container, dismissedEl, mutate) {
	const allKids = Array.prototype.slice.call(container.children);
	const siblings = [];
	for (const child of allKids) if (child !== dismissedEl && child.classList.contains("toast") && child.style.display !== "none" && child.dataset.toastFrozen !== "1") siblings.push(child);
	if (siblings.length === 0) {
		mutate();
		return;
	}
	const dismissedIdx = allKids.indexOf(dismissedEl);
	const oldRects = siblings.map((el) => el.getBoundingClientRect());
	freezeDismissed(container, dismissedEl);
	mutate();
	for (let i = 0; i < siblings.length; i++) {
		const s = siblings[i];
		const oldR = oldRects[i];
		cancelPendingCleanup(s);
		s.style.transition = "none";
		s.style.transform = "";
		s.offsetHeight;
		const newR = s.getBoundingClientRect();
		const dx = oldR.left - newR.left;
		const dy = oldR.top - newR.top;
		if (Math.abs(dx) < .5 && Math.abs(dy) < .5) {
			s.style.removeProperty("transform");
			s.style.removeProperty("transition");
			continue;
		}
		const sIdx = allKids.indexOf(s);
		const delay = Math.max(0, Math.abs(sIdx - dismissedIdx) - 1) * FLIP_STAGGER_MS;
		s.style.transform = `translate(${dx}px, ${dy}px)`;
		s.offsetHeight;
		s.style.transition = `transform ${FLIP_DURATION_MS}ms ${FLIP_EASING} ${delay}ms`;
		s.style.transform = "";
		const tid = window.setTimeout(() => {
			cleanupTimers.delete(s);
			s.style.removeProperty("transform");
			s.style.removeProperty("transition");
		}, FLIP_DURATION_MS + delay + 50);
		cleanupTimers.set(s, tid);
	}
}
//#endregion
//#region src/icons.ts
const SVG_NS = "http://www.w3.org/2000/svg";
/**
* Create a CSS-animated spinner element for indeterminate loading toasts.
*
* @returns A `<div>` with the `toast-spinner` class.
*/
function buildSpinner() {
	const spinner = document.createElement("div");
	spinner.className = "toast-spinner";
	return spinner;
}
/**
* Create an SVG donut chart for determinate loading toasts.
*
* @returns An `<svg>` element with track and fill circles.
*/
function buildDonut() {
	const svg = document.createElementNS(SVG_NS, "svg");
	svg.setAttribute("class", "toast-donut");
	svg.setAttribute("viewBox", `0 0 20 20`);
	svg.setAttribute("width", String(20));
	svg.setAttribute("height", String(20));
	const cx = 20 / 2;
	const cy = 20 / 2;
	const track = document.createElementNS(SVG_NS, "circle");
	track.setAttribute("class", "toast-donut-track");
	track.setAttribute("cx", String(cx));
	track.setAttribute("cy", String(cy));
	track.setAttribute("r", String(8));
	track.setAttribute("stroke-width", String(3));
	track.setAttribute("fill", "none");
	const fill = document.createElementNS(SVG_NS, "circle");
	fill.setAttribute("class", "toast-donut-fill");
	fill.setAttribute("cx", String(cx));
	fill.setAttribute("cy", String(cy));
	fill.setAttribute("r", String(8));
	fill.setAttribute("stroke-width", String(3));
	fill.setAttribute("fill", "none");
	fill.setAttribute("stroke-dasharray", String(DONUT_CIRCUMFERENCE));
	fill.setAttribute("stroke-dashoffset", String(DONUT_CIRCUMFERENCE));
	fill.setAttribute("transform", `rotate(-90 ${cx} ${cy})`);
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
function setDonutProgress(svg, value, max) {
	const fill = svg.querySelector(".toast-donut-fill");
	if (!fill) return;
	const safeMax = max > 0 ? max : 1;
	let safeValue = typeof value === "number" && !Number.isNaN(value) ? value : 0;
	if (safeValue < 0) safeValue = 0;
	if (safeValue > safeMax) safeValue = safeMax;
	const offset = DONUT_CIRCUMFERENCE * (1 - safeValue / safeMax);
	fill.setAttribute("stroke-dashoffset", String(offset));
}
/**
* Render either a spinner or a determinate donut into the icon area.
*
* @param iconEl - The container element for the icon.
* @param value - Current progress value (used for determinate donuts).
* @param max - Maximum progress value, or `null` for indeterminate.
* @returns The spinner or donut element that was appended.
*/
function renderLoadingIcon(iconEl, value, max) {
	iconEl.innerHTML = "";
	if (typeof max === "number" && max > 0) {
		const donut = buildDonut();
		iconEl.appendChild(donut);
		setDonutProgress(donut, value || 0, max);
		return donut;
	}
	const spinner = buildSpinner();
	iconEl.appendChild(spinner);
	return spinner;
}
function isElement(value) {
	return typeof value === "object" && value !== null && value.nodeType === 1;
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
function renderIcon(iconEl, opts, styleName, currentValue) {
	if (opts.icon === false) {
		iconEl.innerHTML = "";
		return false;
	}
	if (styleName === "loading" && opts.icon === void 0) {
		const max = typeof opts.max === "number" && opts.max > 0 ? opts.max : null;
		renderLoadingIcon(iconEl, currentValue || 0, max);
		return true;
	}
	if (isElement(opts.icon)) {
		iconEl.innerHTML = "";
		iconEl.appendChild(opts.icon.cloneNode(true));
		return true;
	}
	if (typeof opts.icon === "string") {
		iconEl.innerHTML = "";
		iconEl.textContent = opts.icon;
		return true;
	}
	iconEl.innerHTML = "";
	iconEl.textContent = ICONS[styleName] ?? ICONS.info;
	return true;
}
//#endregion
//#region src/handle.ts
const STYLE_PATTERN = /toast-(info|warning|error|loading)/g;
const STYLE_PATTERN_SINGLE = /toast-(info|warning|error|loading)/;
/**
* Concrete implementation of {@link ToastHandle}. Manages the toast element
* lifecycle, timer state, and dismissal animations.
*/
var ToastHandleImpl = class {
	el;
	fingerprint = null;
	channel = null;
	position = "top-right";
	max = null;
	value = 0;
	pendingTimeout = null;
	timerStarted = false;
	timeoutId = null;
	dismissed = false;
	timerStartedAt = null;
	timerDuration = null;
	timerRemaining = null;
	paused = false;
	hooks;
	constructor(el, hooks) {
		this.el = el;
		this.hooks = hooks;
	}
	/**
	* Dismiss the toast with the standard hide animation.
	*/
	dismiss() {
		if (this.dismissed) return;
		this.dismissed = true;
		this.clearTimer();
		this.pendingTimeout = null;
		const el = this.el;
		this.runReleaseWithFloatUp(el);
		el.classList.remove("toast-show");
		el.classList.add("toast-hide");
		setTimeout(() => el.parentNode?.removeChild(el), 250);
	}
	/**
	* Tear-down path used by the swipe gesture. The element is already animated
	* off-screen, so we skip the `toast-hide` class transition and just clean up
	* state and remove the node after the swipe animation completes.
	*/
	finalizeAfterSwipe() {
		if (this.dismissed) return;
		this.dismissed = true;
		this.clearTimer();
		this.pendingTimeout = null;
		const el = this.el;
		this.runReleaseWithFloatUp(el);
		setTimeout(() => el.parentNode?.removeChild(el), 250);
	}
	/**
	* FLIP the surviving siblings so they float smoothly into their new layout
	* slots instead of snapping.
	*/
	runReleaseWithFloatUp(el) {
		const container = el.parentElement;
		if (container && container.classList.contains("toast-container")) flipFloatUp(container, el, () => this.hooks.release(this));
		else this.hooks.release(this);
	}
	/**
	* Start (or restart) the auto-dismiss countdown and progress bar animation.
	*
	* @param ms - Duration in milliseconds before the toast is dismissed.
	*/
	startTimer(ms) {
		this.clearTimer();
		const bar = this.el.querySelector(".toast-progress-fill");
		if (!bar) return;
		if (ms > 0) {
			bar.style.transition = "none";
			bar.style.width = "100%";
			bar.offsetWidth;
			bar.style.transition = `width ${ms}ms linear`;
			bar.style.width = "0%";
			this.el.classList.add("toast-has-timer");
			this.timerStartedAt = Date.now();
			this.timerDuration = ms;
			this.timerRemaining = ms;
			this.timeoutId = window.setTimeout(() => this.dismiss(), ms);
		} else {
			bar.style.transition = "none";
			bar.style.width = "0%";
			this.el.classList.remove("toast-has-timer");
		}
	}
	/**
	* Mutate the live toast in place, updating its style, body, icon, actions,
	* and/or timer.
	*
	* @param opts - The properties to update.
	* @returns This handle, for chaining.
	*/
	update(opts) {
		const el = this.el;
		const currentStyle = el.className.match(STYLE_PATTERN_SINGLE)?.[1] ?? "info";
		const nextStyle = opts.style ?? currentStyle;
		if (opts.style) {
			el.className = el.className.replace(STYLE_PATTERN, "").trim();
			el.classList.add("toast-" + opts.style);
		}
		const maxProvided = Object.prototype.hasOwnProperty.call(opts, "max");
		const valueProvided = Object.prototype.hasOwnProperty.call(opts, "value");
		const nextMax = maxProvided ? opts.max ?? null : this.max;
		const nextValue = valueProvided ? opts.value ?? 0 : this.value;
		const iconEl = el.querySelector(".toast-icon");
		if (iconEl) {
			if (opts.icon !== void 0) {
				renderIcon(iconEl, opts, nextStyle, nextValue);
				iconEl.style.display = opts.icon === false ? "none" : "";
			} else if (nextStyle === "loading") {
				const existingDonut = iconEl.querySelector(".toast-donut");
				const hasDonut = !!existingDonut;
				const wantDonut = typeof nextMax === "number" && nextMax > 0;
				if (wantDonut && hasDonut) setDonutProgress(existingDonut, nextValue, nextMax);
				else if (wantDonut !== hasDonut || opts.style === "loading") renderLoadingIcon(iconEl, nextValue, wantDonut ? nextMax : null);
			} else if (opts.style) {
				iconEl.innerHTML = "";
				iconEl.textContent = ICONS[opts.style] ?? ICONS.info;
				iconEl.style.display = "";
			}
		}
		this.max = nextMax;
		this.value = nextValue;
		if (opts.title !== void 0) {
			const titleEl = el.querySelector(".toast-title");
			if (titleEl) {
				titleEl.textContent = opts.title || "";
				titleEl.style.display = opts.title ? "" : "none";
			}
		}
		if (opts.body !== void 0) {
			const bodyEl = el.querySelector(".toast-body");
			if (bodyEl) bodyEl.textContent = opts.body || "";
		}
		if (opts.actions !== void 0) {
			const existingActions = el.querySelector(".toast-actions");
			existingActions?.parentNode?.removeChild(existingActions);
			const newActions = buildActions(opts.actions, this);
			if (newActions) el.querySelector(".toast-content")?.appendChild(newActions);
		}
		if (opts.timeout !== void 0) if (this.el.style.display === "none") {
			this.pendingTimeout = opts.timeout;
			this.timerStarted = false;
		} else {
			this.startTimer(opts.timeout);
			this.timerStarted = true;
		}
		return this;
	}
	clearTimer() {
		if (this.timeoutId !== null) {
			clearTimeout(this.timeoutId);
			this.timeoutId = null;
		}
	}
};
//#endregion
//#region src/pause.ts
/**
* Attach pause-on-hover behaviour to a toast. Pauses by capturing the
* progress bar's current width and freezing it, then resumes by re-issuing
* the transition with the remaining duration.
*
* @param handle - The toast handle to attach hover listeners to.
*/
function attachPauseOnHover(handle) {
	const el = handle.el;
	function pause() {
		if (handle.dismissed || !handle.timerStarted || handle.paused) return;
		if (handle.timeoutId === null || handle.timerStartedAt === null || handle.timerDuration === null) return;
		const elapsed = Date.now() - handle.timerStartedAt;
		handle.timerRemaining = Math.max(0, handle.timerDuration - elapsed);
		clearTimeout(handle.timeoutId);
		handle.timeoutId = null;
		handle.paused = true;
		const bar = el.querySelector(".toast-progress-fill");
		if (bar) {
			const computed = window.getComputedStyle(bar).width;
			bar.style.transition = "none";
			bar.style.width = computed;
		}
		el.classList.add("toast-paused");
	}
	function resume() {
		if (handle.dismissed || !handle.paused) return;
		handle.paused = false;
		el.classList.remove("toast-paused");
		const ms = handle.timerRemaining ?? 0;
		if (ms <= 0) {
			handle.dismiss();
			return;
		}
		const bar = el.querySelector(".toast-progress-fill");
		if (bar) {
			bar.style.transition = "none";
			bar.offsetWidth;
			bar.style.transition = `width ${ms}ms linear`;
			bar.style.width = "0%";
		}
		handle.timerStartedAt = Date.now();
		handle.timerDuration = ms;
		handle.timeoutId = window.setTimeout(() => handle.dismiss(), ms);
	}
	el.addEventListener("pointerenter", pause);
	el.addEventListener("pointerleave", resume);
	el.addEventListener("focusin", pause);
	el.addEventListener("focusout", resume);
}
//#endregion
//#region src/sound.ts
let audioCtx = null;
let presetOverrides = {};
function getAudioContext() {
	if (audioCtx === null) try {
		const Ctor = window.AudioContext ?? window.webkitAudioContext;
		audioCtx = Ctor ? new Ctor() : false;
	} catch {
		audioCtx = false;
	}
	return audioCtx === false ? null : audioCtx;
}
const PRESETS = {
	success: [
		{
			frequency: 523.25,
			startOffset: 0,
			duration: .12,
			amplitude: .18
		},
		{
			frequency: 659.25,
			startOffset: .09,
			duration: .15,
			amplitude: .18
		},
		{
			frequency: 783.99,
			startOffset: .18,
			duration: .22,
			amplitude: .2
		}
	],
	error: [
		{
			frequency: 440,
			startOffset: 0,
			duration: .14,
			amplitude: .18
		},
		{
			frequency: 349.23,
			startOffset: .13,
			duration: .16,
			amplitude: .17
		},
		{
			frequency: 293.66,
			startOffset: .25,
			duration: .22,
			amplitude: .15
		}
	],
	alert: [
		{
			frequency: 783.99,
			startOffset: 0,
			duration: .1,
			amplitude: .14
		},
		{
			frequency: 587.33,
			startOffset: 0,
			duration: .1,
			amplitude: .1
		},
		{
			frequency: 783.99,
			startOffset: .18,
			duration: .13,
			amplitude: .14
		},
		{
			frequency: 587.33,
			startOffset: .18,
			duration: .13,
			amplitude: .1
		}
	],
	gentle: [
		{
			frequency: 523.25,
			startOffset: 0,
			duration: .3,
			amplitude: .14
		},
		{
			frequency: 659.25,
			startOffset: 0,
			duration: .26,
			amplitude: .1
		},
		{
			frequency: 783.99,
			startOffset: 0,
			duration: .22,
			amplitude: .07
		}
	]
};
function playNotes(notes) {
	if (typeof notes === "string") notes = presetOverrides[notes] ?? PRESETS[notes];
	const ctx = getAudioContext();
	if (!ctx) return;
	const now = ctx.currentTime;
	for (const { frequency, startOffset, duration, amplitude } of notes) {
		const osc = ctx.createOscillator();
		const gain = ctx.createGain();
		osc.frequency.value = frequency;
		osc.type = "sine";
		gain.gain.setValueAtTime(0, now + startOffset);
		gain.gain.linearRampToValueAtTime(amplitude, now + startOffset + .005);
		gain.gain.exponentialRampToValueAtTime(.001, now + startOffset + duration);
		osc.connect(gain).connect(ctx.destination);
		osc.start(now + startOffset);
		osc.stop(now + startOffset + duration + .02);
	}
}
function playFromUrl(url) {
	try {
		const a = new Audio(url);
		a.volume = .6;
		a.play().catch(() => {});
	} catch {}
}
function isNamedPreset(s) {
	return s === "gentle" || s === "alert" || s === "success" || s === "error";
}
/**
* Override the built-in chime presets with user-supplied note sequences.
*
* @param overrides - A partial map of preset names to custom note arrays.
*/
function setSoundPresets(overrides) {
	presetOverrides = overrides;
}
/**
* Play a sound for a toast notification.
*
* Accepts a preset name, a URL to an audio file, a custom note array, `true`
* to use the style-based default, or `false`/`undefined` for silence.
*
* @param soundOpt - The sound configuration.
* @param styleName - The toast style, used to pick a default preset when `soundOpt` is `true`.
*/
function playSound(soundOpt, styleName) {
	if (soundOpt === false || soundOpt == null) return;
	if (Array.isArray(soundOpt)) {
		playNotes(soundOpt);
		return;
	}
	if (typeof soundOpt === "string") {
		if (isNamedPreset(soundOpt)) playNotes(soundOpt);
		else playFromUrl(soundOpt);
		return;
	}
	if (soundOpt === true) {
		let preset = "gentle";
		if (styleName === "error") preset = "error";
		else if (styleName === "warning") preset = "alert";
		else if (styleName === "info") preset = "success";
		playNotes(preset);
	}
}
//#endregion
//#region src/swipe.ts
/**
* Wire up swipe-to-dismiss on the toast element. The handle is responsible
* for cleaning up its own state when {@link ToastHandleImpl.finalizeAfterSwipe}
* is called — the swipe code only owns the gesture animation.
*
* @param handle - The toast handle whose element receives pointer listeners.
*/
function attachSwipe(handle) {
	const el = handle.el;
	let startX = 0;
	let startY = 0;
	let startT = 0;
	let dx = 0;
	let dy = 0;
	let dragging = false;
	let pointerId = null;
	function resolveAxis() {
		const pos = handle.position;
		if (pos.includes("center")) return {
			axis: "y",
			dir: pos.startsWith("top-") ? -1 : 1
		};
		if (pos.includes("left")) return {
			axis: "x",
			dir: -1
		};
		return {
			axis: "x",
			dir: 1
		};
	}
	function onDown(e) {
		if (e.button !== 0) return;
		pointerId = e.pointerId;
		startX = e.clientX;
		startY = e.clientY;
		startT = Date.now();
		dx = 0;
		dy = 0;
		dragging = true;
		el.classList.add("toast-dragging");
		try {
			el.setPointerCapture(pointerId);
		} catch {}
	}
	function onMove(e) {
		if (!dragging || e.pointerId !== pointerId) return;
		dx = e.clientX - startX;
		dy = e.clientY - startY;
		const ad = resolveAxis();
		let travel = (ad.axis === "y" ? dy : dx) * ad.dir;
		if (travel < 0) travel = travel * .2;
		const visualTravel = travel * ad.dir;
		const opacity = 1 - Math.min(.7, Math.abs(travel) / 200);
		el.style.transform = ad.axis === "y" ? `translateY(${visualTravel}px)` : `translateX(${visualTravel}px)`;
		el.style.opacity = String(opacity);
	}
	function onUp(e) {
		if (!dragging || e.pointerId !== pointerId) return;
		dragging = false;
		el.classList.remove("toast-dragging");
		if (pointerId !== null) try {
			el.releasePointerCapture(pointerId);
		} catch {}
		const ad = resolveAxis();
		const travel = (ad.axis === "y" ? dy : dx) * ad.dir;
		const velocity = travel / Math.max(1, Date.now() - startT);
		if (travel >= 80 || velocity >= .5) {
			el.style.transition = `transform 250ms ease-out, opacity 250ms ease-out`;
			const sign = ad.dir > 0 ? "120%" : "-120%";
			el.style.transform = ad.axis === "y" ? `translateY(${sign})` : `translateX(${sign})`;
			el.style.opacity = "0";
			handle.finalizeAfterSwipe();
			return;
		}
		el.style.transition = "transform 200ms ease-out, opacity 200ms ease-out";
		el.style.transform = "";
		el.style.opacity = "";
		setTimeout(() => {
			el.style.transition = "";
		}, 200);
	}
	el.addEventListener("pointerdown", onDown);
	el.addEventListener("pointermove", onMove);
	el.addEventListener("pointerup", onUp);
	el.addEventListener("pointercancel", onUp);
}
//#endregion
//#region src/utils.ts
/**
* Check whether the viewport width is at or below the mobile breakpoint.
*
* @returns `true` if the window is mobile-sized.
*/
function isMobile() {
	return window.innerWidth <= 600;
}
/**
* Detect whether the device is touch-primary. Pause-on-hover is disabled
* on these devices because hover/leave events don't fit how phones are
* actually used.
*
* @returns `true` if the device has no hover capability or a coarse pointer.
*/
function isTouchPrimary() {
	return typeof window.matchMedia === "function" ? window.matchMedia("(hover: none), (pointer: coarse)").matches : false;
}
/**
* Produce a deduplication fingerprint for a toast. The channel is included
* so that identical messages in different channels are treated as distinct.
* Uses NUL as separator so it can't collide with regular text.
*
* @param opts - The toast options to fingerprint.
* @returns A string key suitable for deduplication lookups.
*/
function fingerprint(opts) {
	const sep = "\0";
	return (opts.style ?? "info") + sep + (opts.title ?? "") + sep + (opts.body ?? "") + sep + (opts.channel ?? "");
}
//#endregion
//#region src/manager.ts
/**
* Central manager that owns all live toasts, their containers, and the
* global configuration.
*/
var ToastManager = class {
	liveToasts = [];
	containers = {};
	overflowEls = {};
	recentToasts = {};
	resizeRaf = null;
	resizeListenerAttached = false;
	config = {
		position: "top-right",
		pauseOnHover: true,
		sound: true
	};
	/**
	* Release a dismissed toast handle: clear its debounce entry, remove it
	* from the live list, and reflow visibility.
	*
	* @param handle - The handle being torn down.
	*/
	release(handle) {
		if (handle.fingerprint) {
			const entry = this.recentToasts[handle.fingerprint];
			if (entry && entry.handle === handle) {
				clearTimeout(entry.timeoutId);
				delete this.recentToasts[handle.fingerprint];
			}
		}
		const idx = this.liveToasts.indexOf(handle);
		if (idx !== -1) {
			this.liveToasts.splice(idx, 1);
			this.reflowVisibility();
		}
	}
	/**
	* Create and display a new toast.
	*
	* @param opts - Configuration for the toast.
	* @returns A handle that can dismiss or update the toast.
	*/
	show(opts = {}) {
		this.ensureResizeListener();
		const debounceMs = opts.debounce ?? 100;
		const fp = fingerprint(opts);
		if (debounceMs > 0 && this.recentToasts[fp]) return this.recentToasts[fp].handle;
		const title = opts.title ?? "";
		const body = opts.body ?? "";
		const styleName = opts.style ?? "info";
		const persistent = !!opts.persistent;
		const defaultTimeout = styleName === "loading" || persistent ? 0 : 4e3;
		const timeout = opts.timeout ?? defaultTimeout;
		const hasDeterminate = styleName === "loading" && typeof opts.max === "number" && opts.max > 0;
		const initialValue = typeof opts.value === "number" ? opts.value : 0;
		const swipeEnabled = opts.swipe !== false;
		const pauseEnabled = (opts.pauseOnHover ?? this.config.pauseOnHover) && !isTouchPrimary();
		const position = this.resolvePosition(opts.position);
		const channel = opts.channel ?? null;
		const el = document.createElement("div");
		el.className = "toast toast-" + styleName;
		if (channel) el.setAttribute("data-channel", channel);
		el.setAttribute("role", "button");
		el.setAttribute("tabindex", "0");
		el.setAttribute("aria-label", "Click or swipe to dismiss notification");
		const iconEl = document.createElement("div");
		iconEl.className = "toast-icon";
		if (!renderIcon(iconEl, opts, styleName, initialValue)) iconEl.style.display = "none";
		el.appendChild(iconEl);
		const content = document.createElement("div");
		content.className = "toast-content";
		const header = document.createElement("div");
		header.className = "toast-header";
		const titleEl = document.createElement("p");
		titleEl.className = "toast-title";
		titleEl.textContent = title;
		if (!title) titleEl.style.display = "none";
		header.appendChild(titleEl);
		const channelEl = buildChannelLabel(channel);
		if (channelEl) header.appendChild(channelEl);
		content.appendChild(header);
		const bodyEl = document.createElement("p");
		bodyEl.className = "toast-body";
		bodyEl.textContent = body;
		content.appendChild(bodyEl);
		el.appendChild(content);
		const progress = document.createElement("div");
		progress.className = "toast-progress";
		const progressFill = document.createElement("div");
		progressFill.className = "toast-progress-fill";
		progress.appendChild(progressFill);
		el.appendChild(progress);
		const handle = new ToastHandleImpl(el, this);
		handle.fingerprint = fp;
		handle.channel = channel;
		handle.position = position;
		handle.max = hasDeterminate ? opts.max : null;
		handle.value = initialValue;
		const actionsEl = buildActions(opts.actions, handle);
		if (actionsEl) content.appendChild(actionsEl);
		el.addEventListener("click", () => handle.dismiss());
		el.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				handle.dismiss();
			}
		});
		if (swipeEnabled && "PointerEvent" in window) attachSwipe(handle);
		if (pauseEnabled) attachPauseOnHover(handle);
		const c = this.getContainer(position);
		this.liveToasts.push(handle);
		c.appendChild(el);
		setTimeout(() => el.classList.add("toast-show"), 10);
		if (timeout > 0) {
			let sameSlot = 0;
			for (let i = 0; i < this.liveToasts.length - 1; i++) if (this.liveToasts[i].position === position) sameSlot++;
			if (sameSlot < 4) {
				setTimeout(() => handle.startTimer(timeout), 20);
				handle.timerStarted = true;
			} else handle.pendingTimeout = timeout;
		}
		if (debounceMs > 0) this.recentToasts[fp] = {
			handle,
			timeoutId: window.setTimeout(() => {
				if (this.recentToasts[fp]?.handle === handle) delete this.recentToasts[fp];
			}, debounceMs)
		};
		playSound(opts.sound !== void 0 ? opts.sound : this.config.sound, styleName);
		this.reflowVisibility();
		return handle;
	}
	/**
	* Dismiss every live toast.
	*/
	dismissAll() {
		for (const h of this.liveToasts.slice()) h.dismiss();
	}
	/**
	* Dismiss every live toast tagged with the given channel.
	*
	* @param name - The channel name to clear.
	*/
	dismissChannel(name) {
		if (!name) return;
		for (const h of this.liveToasts.slice()) if (h.channel === name) h.dismiss();
	}
	/**
	* Apply global configuration defaults.
	*
	* @param opts - Configuration overrides to merge.
	*/
	configure(opts) {
		if (opts.position && VALID_POSITIONS.has(opts.position)) this.config.position = opts.position;
		if (typeof opts.pauseOnHover === "boolean") this.config.pauseOnHover = opts.pauseOnHover;
		if (opts.sound !== void 0) this.config.sound = opts.sound;
		if (opts.soundPresets) setSoundPresets(opts.soundPresets);
		this.reflowVisibility();
	}
	/**
	* Wrap a promise: show a loading toast immediately, then update to
	* success or error when the promise settles.
	*
	* @param promise - The promise to track.
	* @param opts - Labels for loading, success, and error states.
	* @returns A handle that can dismiss or update the toast.
	*/
	promise(promise, opts = {}) {
		const loadingOpt = resolvePromiseValue(opts.loading, void 0);
		const handle = this.show({
			style: "loading",
			body: "",
			...loadingOpt
		});
		const applyOutcome = (style, spec, value) => {
			const resolved = resolvePromiseValue(spec, value);
			if (!resolved) {
				handle.dismiss();
				return;
			}
			handle.update({
				style,
				timeout: 4e3,
				max: void 0,
				value: 0,
				...resolved
			});
		};
		promise.then((val) => applyOutcome("info", opts.success, val), (err) => applyOutcome("error", opts.error, err));
		return handle;
	}
	/**
	* Resolve the effective position for a toast, accounting for mobile override.
	*
	* @param pos - The position requested by the caller, if any.
	* @returns The resolved position.
	*/
	resolvePosition(pos) {
		if (isMobile()) return "bottom-center";
		if (pos && VALID_POSITIONS.has(pos)) return pos;
		return this.config.position;
	}
	/**
	* Get (or lazily create) the DOM container for a given position.
	*
	* @param position - The toast position slot.
	* @returns The container element.
	*/
	getContainer(position) {
		let c = this.containers[position];
		if (!c) {
			c = document.createElement("div");
			c.className = "toast-container toast-container-" + position;
			c.setAttribute("data-position", position);
			document.body.appendChild(c);
			this.containers[position] = c;
		}
		return c;
	}
	/**
	* Get (or lazily create) the overflow pill for a given position.
	*
	* @param position - The toast position slot.
	* @returns The overflow element.
	*/
	ensureOverflow(position) {
		const existing = this.overflowEls[position];
		if (existing) return existing;
		const el = document.createElement("div");
		el.className = "toast-overflow";
		el.setAttribute("role", "button");
		el.setAttribute("tabindex", "0");
		el.addEventListener("click", () => {
			for (const h of this.liveToasts) if (h.position === position) {
				h.dismiss();
				return;
			}
		});
		el.addEventListener("keydown", (e) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				el.click();
			}
		});
		this.overflowEls[position] = el;
		return el;
	}
	/**
	* Remove the overflow pill for a position with an exit animation.
	*
	* @param position - The toast position slot.
	*/
	removeOverflow(position) {
		const el = this.overflowEls[position];
		if (!el) return;
		if (el.parentNode) {
			el.classList.remove("toast-overflow-show");
			const node = el;
			setTimeout(() => node.parentNode?.removeChild(node), 250);
		}
		delete this.overflowEls[position];
	}
	/**
	* Reflow all containers. Called whenever toasts are added or removed.
	*
	* Hide toasts beyond MAX_VISIBLE_TOASTS, show overflow pill,
	* start any pending timers for newly-promoted toasts.
	*/
	reflowVisibility() {
		const byPosition = {};
		for (const h of this.liveToasts) {
			const list = byPosition[h.position] ?? [];
			list.push(h);
			byPosition[h.position] = list;
		}
		for (const pos of Object.keys(byPosition)) {
			const stack = byPosition[pos];
			this.reflowStandard(pos, stack);
		}
		for (const pos of Object.keys(this.overflowEls)) if (!byPosition[pos]) this.removeOverflow(pos);
	}
	reflowStandard(position, stack) {
		for (let i = 0; i < stack.length; i++) {
			const h = stack[i];
			const shouldBeVisible = i < 4;
			const wasVisible = h.el.style.display !== "none";
			h.el.style.display = shouldBeVisible ? "" : "none";
			if (shouldBeVisible && !wasVisible && h.pendingTimeout !== null && !h.timerStarted) this.promoteTimer(h);
		}
		const hidden = Math.max(0, stack.length - 4);
		const c = this.getContainer(position);
		if (hidden === 0) {
			this.removeOverflow(position);
			return;
		}
		const ov = this.ensureOverflow(position);
		ov.textContent = "+" + hidden + " more";
		ov.setAttribute("aria-label", hidden + " more notifications. Click to dismiss the oldest.");
		const desiredLast = !position.startsWith("top-");
		if (ov.parentNode !== c || !desiredLast && c.firstChild !== ov || desiredLast && c.lastChild !== ov) {
			if (ov.parentNode === c) c.removeChild(ov);
			if (desiredLast) c.appendChild(ov);
			else c.insertBefore(ov, c.firstChild);
		}
		setTimeout(() => ov.classList.add("toast-overflow-show"), 10);
	}
	/**
	* Start a newly-visible toast's auto-dismiss timer that was deferred
	* while it was hidden behind the overflow limit.
	*
	* @param h - The toast handle to promote.
	*/
	promoteTimer(h) {
		const ms = h.pendingTimeout;
		if (ms === null) return;
		h.pendingTimeout = null;
		h.timerStarted = true;
		setTimeout(() => h.startTimer(ms), 20);
	}
	/**
	* Lazily attach a window resize listener that reflows visibility
	* on breakpoint changes.
	*/
	ensureResizeListener() {
		if (this.resizeListenerAttached) return;
		this.resizeListenerAttached = true;
		window.addEventListener("resize", () => {
			if (this.resizeRaf !== null) return;
			this.resizeRaf = window.requestAnimationFrame(() => {
				this.resizeRaf = null;
				this.reflowVisibility();
			});
		});
	}
};
/**
* Resolve a {@link PromiseValueSpec} into concrete {@link ToastOptions}.
*
* @param spec - The spec (string, options object, or factory function).
* @param value - The resolved/rejected value passed to factory functions.
* @returns Toast options, or `null` if the spec is undefined.
*/
function resolvePromiseValue(spec, value) {
	if (spec === void 0 || spec === null) return null;
	const v = typeof spec === "function" ? spec(value) : spec;
	if (typeof v === "string") return { body: v };
	if (typeof v === "object") return v;
	return null;
}
const manager = new ToastManager();
//#endregion
//#region src/index.ts
/**
* Show a toast and return a handle to it.
*
* @param opts - Configuration for the toast.
* @returns A handle that can dismiss or update the toast.
*/
function show(opts) {
	return manager.show(opts);
}
/**
* Convenience: show an info-styled toast.
*
* @param body - The message text.
* @param opts - Optional overrides.
* @returns A handle that can dismiss or update the toast.
*/
function info(body, opts) {
	return manager.show({
		body,
		style: "info",
		...opts
	});
}
/**
* Convenience: show a warning-styled toast.
*
* @param body - The message text.
* @param opts - Optional overrides.
* @returns A handle that can dismiss or update the toast.
*/
function warning(body, opts) {
	return manager.show({
		body,
		style: "warning",
		...opts
	});
}
/**
* Convenience: show an error-styled toast.
*
* @param body - The message text.
* @param opts - Optional overrides.
* @returns A handle that can dismiss or update the toast.
*/
function error(body, opts) {
	return manager.show({
		body,
		style: "error",
		...opts
	});
}
/**
* Convenience: show a loading-styled toast (spinner or determinate donut).
*
* @param body - The message text.
* @param opts - Optional overrides.
* @returns A handle that can dismiss or update the toast.
*/
function loading(body, opts) {
	return manager.show({
		body,
		style: "loading",
		...opts
	});
}
/**
* Wrap a promise: show a loading toast immediately, then update to success or
* error when the promise settles.
*
* @param p - The promise to track.
* @param opts - Labels for loading, success, and error states.
* @returns A handle that can dismiss or update the toast.
*/
function promise(p, opts) {
	return manager.promise(p, opts);
}
/**
* Dismiss every live toast.
*/
function dismissAll() {
	manager.dismissAll();
}
/**
* Dismiss every live toast tagged with the given channel.
*
* @param name - The channel name to dismiss.
*/
function dismissChannel(name) {
	manager.dismissChannel(name);
}
/**
* Set global defaults. Per-call options still override.
*
* @param opts - Global configuration to apply.
*/
function configure(opts) {
	manager.configure(opts);
}
const chyrpFn = ((opts) => manager.show(opts));
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
const chyrp = chyrpFn;
/**
* Optionally replace `window.alert` with a toast-based version. Returns a
* function that restores the original alert. Opt-in because monkey-patching
* globals is the kind of side effect a library shouldn't do on import.
*/
function interceptAlert() {
	const original = window.alert;
	window.alert = (message) => {
		manager.show({
			body: String(message),
			style: "info"
		});
	};
	return () => {
		window.alert = original;
	};
}
//#endregion
export { chyrp, configure, dismissAll, dismissChannel, error, info, interceptAlert, loading, promise, show, warning };

//# sourceMappingURL=index.js.map