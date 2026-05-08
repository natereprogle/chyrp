// Plays a little diddy when the "Hit it, DJ!" button is clicked on the homepage.
// This is just a fun demo of the custom sound feature, and isn't meant to be a real music player or anything.

import { chyrp, type ChimeNote, type ToastOptions, type ToastPosition, type ToastStyle } from "chyrp";

type StyledChimeNote = ChimeNote & Partial<ToastOptions>;

const notes: StyledChimeNote[] = [
  { frequency: 293.665, startOffset: 0.000000, duration: 0.136364, amplitude: 1, style: "info", position: "top-right", oscillatorType: "square", timeout: 500 },
  { frequency: 293.665, startOffset: 0.136364, duration: 0.136364, amplitude: 1, style: "info", position: "top-right", oscillatorType: "square" },
  { frequency: 587.330, startOffset: 0.272727, duration: 0.136364, amplitude: 1, style: "info", position: "top-center", oscillatorType: "square" },
  { frequency: 440.000, startOffset: 0.545455, duration: 0.136364, amplitude: 1, style: "info", position: "top-left", oscillatorType: "square" },
  { frequency: 415.305, startOffset: 0.954545, duration: 0.136364, amplitude: 1, style: "info", position: "bottom-left", oscillatorType: "square" },
  { frequency: 391.995, startOffset: 1.227273, duration: 0.136364, amplitude: 1, style: "info", position: "bottom-center", oscillatorType: "square", timeout: 530 },
  { frequency: 349.228, startOffset: 1.500000, duration: 0.136364, amplitude: 1, style: "info", position: "bottom-center", oscillatorType: "square" },
  { frequency: 293.665, startOffset: 1.772727, duration: 0.136364, amplitude: 1, style: "info", position: "bottom-right", oscillatorType: "square", timeout: 600 },
  { frequency: 349.228, startOffset: 1.909091, duration: 0.136364, amplitude: 1, style: "info", position: "bottom-right", oscillatorType: "square", timeout: 600 },
  { frequency: 391.995, startOffset: 2.045455, duration: 0.136364, amplitude: 1, style: "info", position: "bottom-right", oscillatorType: "square", timeout: 600 },

  { frequency: 277.183, startOffset: 2.181818, duration: 0.136364, amplitude: 1, style: "warning", position: "top-right", oscillatorType: "square", timeout: 500 },
  { frequency: 277.183, startOffset: 2.318182, duration: 0.136364, amplitude: 1, style: "warning", position: "top-right", oscillatorType: "square" },
  { frequency: 587.330, startOffset: 2.454545, duration: 0.136364, amplitude: 1, style: "warning", position: "top-center", oscillatorType: "square" },
  { frequency: 440.000, startOffset: 2.727273, duration: 0.136364, amplitude: 1, style: "warning", position: "top-left", oscillatorType: "square" },
  { frequency: 415.305, startOffset: 3.136364, duration: 0.136364, amplitude: 1, style: "warning", position: "bottom-left", oscillatorType: "square" },
  { frequency: 391.995, startOffset: 3.409091, duration: 0.136364, amplitude: 1, style: "warning", position: "bottom-center", oscillatorType: "square", timeout: 530 },
  { frequency: 349.228, startOffset: 3.681818, duration: 0.136364, amplitude: 1, style: "warning", position: "bottom-center", oscillatorType: "square" },
  { frequency: 293.665, startOffset: 3.954545, duration: 0.136364, amplitude: 1, style: "warning", position: "bottom-right", oscillatorType: "square", timeout: 600 },
  { frequency: 349.228, startOffset: 4.090909, duration: 0.136364, amplitude: 1, style: "warning", position: "bottom-right", oscillatorType: "square", timeout: 600 },
  { frequency: 391.995, startOffset: 4.227273, duration: 0.136364, amplitude: 1, style: "warning", position: "bottom-right", oscillatorType: "square", timeout: 600 },

  { frequency: 261.626, startOffset: 4.363636, duration: 0.136364, amplitude: 1, style: "error", position: "top-right", oscillatorType: "square", timeout: 500 },
  { frequency: 261.626, startOffset: 4.500000, duration: 0.136364, amplitude: 1, style: "error", position: "top-right", oscillatorType: "square" },
  { frequency: 587.330, startOffset: 4.636364, duration: 0.136364, amplitude: 1, style: "error", position: "top-center", oscillatorType: "square" },
  { frequency: 440.000, startOffset: 4.909091, duration: 0.136364, amplitude: 1, style: "error", position: "top-left", oscillatorType: "square" },
  { frequency: 415.305, startOffset: 5.318182, duration: 0.136364, amplitude: 1, style: "error", position: "bottom-left", oscillatorType: "square" },
  { frequency: 391.995, startOffset: 5.590909, duration: 0.136364, amplitude: 1, style: "error", position: "bottom-center", oscillatorType: "square", timeout: 530 },
  { frequency: 349.228, startOffset: 5.863636, duration: 0.136364, amplitude: 1, style: "error", position: "bottom-center", oscillatorType: "square" },
  { frequency: 293.665, startOffset: 6.136364, duration: 0.136364, amplitude: 1, style: "error", position: "bottom-right", oscillatorType: "square", timeout: 600 },
  { frequency: 349.228, startOffset: 6.272727, duration: 0.136364, amplitude: 1, style: "error", position: "bottom-right", oscillatorType: "square", timeout: 600 },
  { frequency: 391.995, startOffset: 6.409091, duration: 0.136364, amplitude: 1, style: "error", position: "bottom-right", oscillatorType: "square", timeout: 600 },

  { frequency: 246.942, startOffset: 6.545455, duration: 0.136364, amplitude: 1, style: "loading", position: "top-right", oscillatorType: "square", timeout: 500 },
  { frequency: 246.942, startOffset: 6.681818, duration: 0.136364, amplitude: 1, style: "loading", position: "top-right", oscillatorType: "square" },
  { frequency: 587.330, startOffset: 6.818182, duration: 0.136364, amplitude: 1, style: "loading", position: "top-center", oscillatorType: "square" },
  { frequency: 440.000, startOffset: 7.090909, duration: 0.136364, amplitude: 1, style: "loading", position: "top-left", oscillatorType: "square" },
  { frequency: 415.305, startOffset: 7.500000, duration: 0.136364, amplitude: 1, style: "loading", position: "bottom-left", oscillatorType: "square" },
  { frequency: 391.995, startOffset: 7.772727, duration: 0.136364, amplitude: 1, style: "loading", position: "bottom-center", oscillatorType: "square", timeout: 530 },
  { frequency: 349.228, startOffset: 8.045455, duration: 0.136364, amplitude: 1, style: "loading", position: "bottom-center", oscillatorType: "square" },
  { frequency: 293.665, startOffset: 8.318182, duration: 0.136364, amplitude: 1, style: "loading", position: "bottom-right", oscillatorType: "square", timeout: 600 },
  { frequency: 349.228, startOffset: 8.454545, duration: 0.136364, amplitude: 1, style: "loading", position: "bottom-right", oscillatorType: "square", timeout: 600 },
  { frequency: 391.995, startOffset: 8.590909, duration: 0.136364, amplitude: 1, style: "loading", position: "bottom-right", oscillatorType: "square", timeout: 600 },

  { frequency: 293.665, startOffset: 8.727273, duration: 0.272727, amplitude: 1, style: "info", timeout: 10000, body: "And that's how you play a song with Chyrp", title: "Tada!", icon: "🎶", position: "top-center", oscillatorType: "square" },
];

export function playDemoSong(): void {
  let playing = false;
  let lastStyle: ToastStyle = "info";
  for (let note of notes) {
    setTimeout(() => {
      // We could use chyrp.info, chyrp.warning, etc. to set the style, but those are just wrappers for `chyrp()` anyway, and doing so would require switch or if statements to call the correct method based on the style.
      chyrp({
        body: note.body ?? "DOOT",
        sound: !playing ? notes : false,  // The first Toast is responsible for playing the song, even if it's dismissed. We don't want to play the entire song per toast, so just show toasts without sound for the rest of the notes.
        // ^ This is allowed because `notes` is of type `StyledChimeNote` which extends `ChimeNote` and therefore is assignable to it.
        position: note.position,
        style: note.style,
        timeout: note.timeout ?? 400,
        title: note.title,
        icon: note.icon,
        // Disable debounce to prevent notes from being skipped (since the built-in debouncer would cause skipped notes due to them being triggered faster than 100ms)
        debounce: 0,
        // Disable swipe
        swipe: false,
        // Disable pause on hover to prevent the "dance" the chyrps do from being interrupted if the user hovers over one
        pauseOnHover: false,
      });

      playing = true; // Since the value of `playing` is captured when the setTimeout expires and not when the timeout is created, we set it to "playing" within the timeout itself.
    }, note.startOffset * 1000); // Since startOffset is in seconds and setTimeout uses milliseconds, we need to multiply by 1000.
  }
}
