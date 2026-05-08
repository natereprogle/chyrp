<div style="text-align: center">
<img src="./assets/banner.png" alt="Logo">
</div>

# chyrp

**Toasts that get your attention.**

Chyrp (Pronounced "Chirp") is a tiny, dependency-free toast notification library. Ships with stacking, swipe-to-dismiss, pause-on-hover, sound, promise integration, and a determinate progress donut for loading states — all in around 30 kB of unminified, sourcemapped JS.

- Zero runtime dependencies
- ESM, CJS, and IIFE bundles (~6kB gzipped/ea.\*)
- Full TypeScript types
- Mobile-aware (auto-positions to `bottom-center`, larger hit targets)
- Respects `prefers-reduced-motion`
- Dark mode support via `prefers-color-scheme` and manual override

<sup>\* Not including CSS or optional source maps. CSS is mandatory and adds an additional 3 kB (gzipped) to overall size</sup>

## Install

```bash
npm install chyrp
```

## Quick start

```ts
import { chyrp } from 'chyrp';
import 'chyrp/style.css';

chyrp({ body: 'Hello world' });

chyrp.info('Saved');
chyrp.warning('Disk almost full');
chyrp.error('Upload failed');
chyrp.loading('Uploading…');
```

The CSS import is required — it's a side-effect import that injects the toast container styles. If you bundle CSS separately (e.g. CSS modules + a stylesheet pipeline), import it once at your app entry.

## API

### `chyrp(opts)` and convenience methods

```ts
chyrp({ title: 'Saved', body: 'Your changes are live', style: 'info' });

chyrp.info('Saved', { title: 'Success' });
chyrp.warning('Disk almost full');
chyrp.error('Upload failed', { persistent: true });
chyrp.loading('Uploading…', { max: 100, value: 0 });
```

All forms return a `ToastHandle`:

```ts
interface ToastHandle {
  dismiss(): void;
  update(opts: ToastOptions): ToastHandle;
}
```

### Promise integration

```ts
chyrp.promise(api.saveUser(user), {
  loading: 'Saving…',
  success: (user) => `Saved ${user.name}`,
  error:   (err)  => ({ title: 'Save failed', body: err.message }),
});
```

Each branch may be a string (used as `body`), an options object, or a function returning either.

### Determinate progress

```ts
const handle = chyrp.loading('Uploading', { max: 100, value: 0 });

uploader.on('progress', (n) => handle.update({ value: n }));
uploader.on('done',     ()  => handle.update({ style: 'info', body: 'Done', timeout: 2000 }));
```

When `max > 0`, the icon is a donut filled in proportion to `value / max`. Otherwise it's an indeterminate spinner.

### Channels

Group related toasts under a name and dismiss them together. The channel also renders as a small italic label in the corner of the toast.

```ts
import { chyrp, dismissChannel } from 'chyrp';

chyrp.info('Connection lost', { channel: 'network', persistent: true });
chyrp.info('Retrying…',        { channel: 'network' });

// later, when the network comes back:
dismissChannel('network');
```

### Action buttons

```ts
chyrp({
  title: 'File deleted',
  body: 'document.pdf was moved to trash',
  actions: [
    { label: 'Undo', style: 'primary', onClick: () => restore() },
    { label: 'Dismiss' },
  ],
});
```

`onClick` returning `false` keeps the toast open; otherwise it auto-dismisses.

### Configuration

```ts
import { configure } from 'chyrp';

configure({
  position: 'bottom-right',
  pauseOnHover: true,
  sound: false,           // true | 'gentle' | 'alert' | 'success' | 'error' | <url>
  resound: true,          // replay sound when handle.update({ style }) changes style
});
```

Per-call options always win over global defaults.

### Sound

```ts
chyrp.error('Save failed', { sound: true });        // style-aware default
chyrp.info('Saved',        { sound: 'success' });   // named chime
chyrp.info('Custom',       { sound: '/ding.mp3' }); // custom URL
```

Named chimes are synthesized with the Web Audio API, so they have no asset dependency.

Enable style-change replay per toast:

```ts
const h = chyrp.loading('Uploading', { sound: true, resound: true });
h.update({ style: 'info', body: 'Upload complete' }); // plays style-mapped success chime
```

Or set it globally:

```ts
configure({ resound: true });
```

### Dismiss helpers

```ts
import { dismissAll, dismissChannel } from 'chyrp';

dismissAll();              // dismiss every live toast
dismissChannel('network'); // dismiss everything tagged 'network'
```

### Optional `alert()` override

This is opt-in because libraries shouldn't monkey-patch globals on import:

```ts
import { interceptAlert } from 'chyrp';

const restore = interceptAlert();
window.alert('hello'); // shows as an info toast

restore(); // put the native alert back
```

## CDN / `<script>` usage

```html
<link rel="stylesheet" href="https://unpkg.com/chyrp/dist/style.css" />
<script src="https://unpkg.com/chyrp/dist/index.iife.js"></script>
<script>
  Chyrp.chyrp.info('Hello');
</script>
```

## Options reference

| Option         | Type                                                                                              | Default       | Notes                                                      |
| -------------- | ------------------------------------------------------------------------------------------------- | ------------- | ---------------------------------------------------------- |
| `title`        | `string`                                                                                          | `''`          | Bold heading above the body                                |
| `body`         | `string`                                                                                          | `''`          | Main message                                               |
| `style`        | `'info' \| 'warning' \| 'error' \| 'loading'`                                                     | `'info'`      | Visual style and default icon                              |
| `timeout`      | `number`                                                                                          | `4000`        | Ms before auto-dismiss; `0` disables                       |
| `persistent`   | `boolean`                                                                                         | `false`       | Equivalent to `timeout: 0`                                 |
| `debounce`     | `number`                                                                                          | `100`         | Ms to suppress identical follow-up toasts                  |
| `swipe`        | `boolean`                                                                                         | `true`        | Allow swipe-to-dismiss                                     |
| `pauseOnHover` | `boolean`                                                                                         | `true`        | Pause timer on pointer hover (desktop only)                |
| `position`     | `'top-right' \| 'top-left' \| 'top-center' \| 'bottom-right' \| 'bottom-left' \| 'bottom-center'` | `'top-right'` | Mobile always forces `bottom-center`                       |
| `channel`      | `string`                                                                                          | —             | Tag for grouping; rendered as a label                      |
| `icon`         | `string \| HTMLElement \| false`                                                                  | —             | Custom icon (text, cloned DOM node, or hide)               |
| `actions`      | `ToastAction[]`                                                                                   | —             | Buttons rendered below the body                            |
| `sound`        | `boolean \| 'gentle' \| 'alert' \| 'success' \| 'error' \| string`                                | `true`        | Named chime, URL, or `true` for style default              |
| `resound`      | `boolean`                                                                                         | `false`       | Replay sound when `handle.update({ style })` changes style |
| `max`          | `number`                                                                                          | —             | (loading) total work units for determinate donut           |
| `value`        | `number`                                                                                          | `0`           | (loading) current progress                                 |

## Accessibility

- Toasts are `role="button"` with `tabindex="0"`. Enter / Space dismiss.
- Keyboard focus pauses the auto-dismiss timer (same as hover).
- The overflow pill is keyboard-activatable.
- All animation durations collapse to fades when `prefers-reduced-motion: reduce` is set.

## Dark mode

Toasts automatically adapt to dark backgrounds when the user's OS reports `prefers-color-scheme: dark`. All colors are defined as CSS custom properties prefixed with `--tt-`, so you can override any of them.

To force a specific theme regardless of system preference, add a class to the `<html>` element:

```html
<!-- Force dark mode -->
<html class="dark">

<!-- Force light mode -->
<html class="light">

<!-- Follow system preference (default) -->
<html>
```

You can also override individual variables to customize the toast appearance:

```css
:root {
  --tt-bg: #1a1a2e;
  --tt-title-color: #eee;
  --tt-body-color: #ccc;
  --tt-info: #00d2ff;
}
```

## Browser support

Targets ES2022. Pointer events are required for swipe-to-dismiss; if `PointerEvent` is unavailable, swipe is disabled and click-to-dismiss still works.

## Demo

A full interactive demo + docs site lives under [`demo/`](demo/). After cloning:

```bash
npm install
npm run build           # produces dist/ that the demo loads
open demo/index.html    # or run `npm run demo` to serve at http://localhost:3000/demo/
```

Every feature in this README has a runnable example there.

## License

MIT
