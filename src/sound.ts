import type { ChimeNote, SoundOption, ToastStyle } from './types';

type ChimePreset = 'success' | 'error' | 'alert' | 'gentle';

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: typeof AudioContext;
}

let audioCtx: AudioContext | null | false = null;

let presetOverrides: Partial<Record<ChimePreset, ChimeNote[]>> = {};

function getAudioContext(): AudioContext | null {
  if (audioCtx === null) {
    try {
      const Ctor = window.AudioContext ?? (window as WindowWithWebkitAudio).webkitAudioContext;
      audioCtx = Ctor ? new Ctor() : false;
    } catch {
      audioCtx = false;
    }
  }
  return audioCtx === false ? null : audioCtx;
}

// 'success' is a rising C-major arpeggio, 'error' a descending minor line,
// 'alert' is a repeated G5/D5 perfect-fifth chord, 'gentle' is a soft C-major bloom.
// prettier-ignore
const PRESETS: Record<ChimePreset, ChimeNote[]> = {
  success: [
    { frequency: 523.25, startOffset: 0, duration: 0.12, amplitude: 0.18 },  // C5
    { frequency: 659.25, startOffset: 0.09, duration: 0.15, amplitude: 0.18 },  // E5
    { frequency: 783.99, startOffset: 0.18, duration: 0.22, amplitude: 0.20 },  // G5
  ],
  error: [
    { frequency: 440.00, startOffset: 0, duration: 0.14, amplitude: 0.18 },  // A4
    { frequency: 349.23, startOffset: 0.13, duration: 0.16, amplitude: 0.17 },  // F4
    { frequency: 293.66, startOffset: 0.25, duration: 0.22, amplitude: 0.15 },  // D4
  ],
  alert: [
    { frequency: 783.99, startOffset: 0, duration: 0.10, amplitude: 0.14 },  // G5 ─┐ first chord
    { frequency: 587.33, startOffset: 0, duration: 0.10, amplitude: 0.10 },  // D5 ─┘
    { frequency: 783.99, startOffset: 0.18, duration: 0.13, amplitude: 0.14 },  // G5 ─┐ second chord
    { frequency: 587.33, startOffset: 0.18, duration: 0.13, amplitude: 0.10 },  // D5 ─┘
  ],
  gentle: [
    { frequency: 523.25, startOffset: 0, duration: 0.30, amplitude: 0.14 },     // C5
    { frequency: 659.25, startOffset: 0, duration: 0.26, amplitude: 0.10 },     // E5
    { frequency: 783.99, startOffset: 0, duration: 0.22, amplitude: 0.07 },     // G5
  ],
};

function playNotes(notes: ChimePreset | ChimeNote[]): void {
  // If the notes argument is a preset name, look up the preset (with overrides) before playing.
  if (typeof notes === 'string') notes = presetOverrides[notes] ?? PRESETS[notes];

  const ctx = getAudioContext();
  if (!ctx) return;
  const now = ctx.currentTime;
  for (const { frequency, startOffset, duration, amplitude } of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = frequency;
    osc.type = 'sine';
    // Quick attack, soft decay — avoids click artifacts at start/stop.
    gain.gain.setValueAtTime(0, now + startOffset);
    gain.gain.linearRampToValueAtTime(amplitude, now + startOffset + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + startOffset);
    osc.stop(now + startOffset + duration + 0.02);
  }
}

function playFromUrl(url: string): void {
  try {
    const a = new Audio(url);
    a.volume = 0.6;
    void a.play().catch(() => {
      // Autoplay may be blocked; that's fine.
    });
  } catch {
    // Ignore.
  }
}

function isNamedPreset(s: string): s is ChimePreset {
  return s === 'gentle' || s === 'alert' || s === 'success' || s === 'error';
}

/**
 * Override the built-in chime presets with user-supplied note sequences.
 *
 * @param overrides - A partial map of preset names to custom note arrays.
 */
export function setSoundPresets(overrides: Partial<Record<ChimePreset, ChimeNote[]>>): void {
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
export function playSound(soundOpt: SoundOption | undefined, styleName: ToastStyle): void {
  if (soundOpt === false || soundOpt == null) return;
  if (Array.isArray(soundOpt)) {
    playNotes(soundOpt);
    return;
  }
  if (typeof soundOpt === 'string') {
    if (isNamedPreset(soundOpt)) playNotes(soundOpt);
    else playFromUrl(soundOpt);
    return;
  }
  if (soundOpt === true) {
    let preset: ChimePreset = 'gentle';
    if (styleName === 'error') preset = 'error';
    else if (styleName === 'warning') preset = 'alert';
    else if (styleName === 'info') preset = 'success';
    playNotes(preset);
  }
}
