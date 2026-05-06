<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { chyrp, configure, dismissAll, dismissChannel, interceptAlert } from 'chyrp'
import type { ToastPosition } from 'chyrp'

import CodeBlock from '@/components/CodeBlock.vue'
import DemoArea from '@/components/DemoArea.vue'
import DocSection from '@/components/DocSection.vue'
import RadioPills from '@/components/RadioPills.vue'
import NoteCallout from '@/components/NoteCallout.vue'
import ApiTable from '@/components/ApiTable.vue'
import TableOfContents from '@/components/TableOfContents.vue'
import { useHead } from '@/composables/useHead'

useHead({
  title: 'chyrp — documentation',
  description:
    'Full reference for chyrp: install, options, channels, sounds, accessibility, mobile behavior, and the full API.',
})

const tocItems = [
  { id: 'install', label: 'Install' },
  { id: 'quick-start', label: 'Quick start' },
  { id: 'styles', label: 'Styles' },
  { id: 'title-body', label: 'Title & body' },
  { id: 'position', label: 'Position' },
  { id: 'timing', label: 'Timing' },
  { id: 'debounce', label: 'Debounce' },
  { id: 'channels', label: 'Channels' },
  { id: 'icons', label: 'Custom icons' },
  { id: 'actions', label: 'Action buttons' },
  { id: 'promise', label: 'Promise integration' },
  { id: 'progress', label: 'Determinate progress' },
  { id: 'update', label: 'Updating in place' },
  { id: 'sound', label: 'Sound' },
  { id: 'pause', label: 'Pause-on-hover' },
  { id: 'swipe', label: 'Swipe-to-dismiss' },
  { id: 'dismiss', label: 'Dismiss helpers' },
  { id: 'configure', label: 'Global configuration' },
  { id: 'alert', label: 'alert() override' },
  { id: 'a11y', label: 'Accessibility' },
  { id: 'mobile', label: 'Mobile' },
  { id: 'reduced-motion', label: 'Reduced motion' },
  { id: 'dark-mode', label: 'Dark mode' },
  { id: 'api', label: 'API reference' },
] as const

// ---------- Reactive demo state ----------
const positionValue = ref<ToastPosition>('top-right')
const positionOptions = [
  { value: 'top-left', label: 'top-left' },
  { value: 'top-center', label: 'top-center' },
  { value: 'top-right', label: 'top-right' },
  { value: 'bottom-left', label: 'bottom-left' },
  { value: 'bottom-center', label: 'bottom-center' },
  { value: 'bottom-right', label: 'bottom-right' },
] as const satisfies readonly { value: ToastPosition; label: string }[]

const cfgPosition = ref<ToastPosition>('top-right')
const cfgPause = ref<'true' | 'false'>('true')
const cfgSound = ref<'true' | 'false' | 'gentle' | 'alert' | 'success' | 'error'>('true')
const cfgResound = ref<'true' | 'false'>('false')

const alertOn = ref(false)
let restoreAlert: (() => void) | null = null

// ---------- Demo handlers ----------
const showBasic = () => chyrp({ body: 'Hello world' })

const showStyle = (style: 'info' | 'warning' | 'error' | 'loading') => {
  if (style === 'info') chyrp.info('Saved')
  else if (style === 'warning') chyrp.warning('Almost out of space')
  else if (style === 'error') chyrp.error('Upload failed')
  else {
    const h = chyrp.loading('Working…')
    setTimeout(() => h.dismiss(), 2200)
  }
}

const showTitleBody = () => {
  chyrp({ title: 'Saved', body: 'Your changes are live.', style: 'info' })
}

const showAtPosition = () => {
  chyrp.info(`Position: ${positionValue.value}`, { position: positionValue.value })
}

const showTiming = (timeout: number | null) => {
  if (timeout === null) {
    chyrp.info('Persistent — click or swipe to dismiss', { persistent: true })
    return
  }
  if (timeout === 1500) chyrp.info('Quick — gone in 1.5s', { timeout: 1500 })
  else if (timeout === 8000) chyrp.info('Patient — gone in 8s', { timeout: 8000 })
  else chyrp.info('Default — gone in 4s')
}

const showDebounce = () => chyrp.info('Same message', { debounce: 2000 })

const channelNetwork = () =>
  chyrp.info('Network event', { channel: 'network', persistent: true, title: 'Connection' })
const channelUser = () =>
  chyrp.info('User event', { channel: 'user', persistent: true, title: 'Profile' })

const iconEmoji = () => chyrp.info('Party time', { icon: '🎉' })
const iconNone = () => chyrp.info('No icon at all', { icon: false })
const iconSvg = () => {
  const NS = 'http://www.w3.org/2000/svg'
  const svg = document.createElementNS(NS, 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('width', '20')
  svg.setAttribute('height', '20')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  const path = document.createElementNS(NS, 'path')
  path.setAttribute('d', 'M12 2 L15 9 L22 9 L17 14 L19 22 L12 18 L5 22 L7 14 L2 9 L9 9 Z')
  svg.appendChild(path)
  chyrp.info('Starred', { icon: svg as unknown as HTMLElement, title: 'Custom DOM icon' })
}

const actionUndo = () => {
  chyrp({
    title: 'File deleted',
    body: 'document.pdf was moved to trash',
    persistent: true,
    actions: [
      {
        label: 'Undo',
        style: 'primary',
        onClick: () => {
          chyrp.info('Restored document.pdf', { sound: 'success' })
        },
      },
      { label: 'Dismiss' },
    ],
  })
}

const actionMulti = () => {
  chyrp({
    title: 'Update available',
    body: 'Version 2.0.1 is ready to install.',
    style: 'info',
    persistent: true,
    actions: [
      {
        label: 'Install',
        style: 'primary',
        onClick: (h) => {
          h.update({ style: 'loading', body: 'Installing…', actions: [], timeout: 0 })
          setTimeout(() => {
            h.update({ style: 'info', body: 'Update installed', timeout: 2500 })
          }, 1600)
          return false
        },
      },
      {
        label: 'Remind me later',
        onClick: () => {
          chyrp.info("We'll ask again tomorrow")
        },
      },
      { label: 'Skip' },
    ],
  })
}

const fakeRequest = <T,>(ms: number, value: T, shouldReject: boolean) =>
  new Promise<T>((resolve, reject) => {
    setTimeout(() => {
      if (shouldReject) reject(new Error(String(value)))
      else resolve(value)
    }, ms)
  })

const promiseResolve = () => {
  chyrp.promise(fakeRequest(1500, { name: 'Ada Lovelace' }, false), {
    loading: 'Saving user…',
    success: (user) => `Saved ${user.name}`,
    error: (err) => ({ title: 'Save failed', body: (err as Error).message }),
  })
}
const promiseReject = () => {
  chyrp.promise(fakeRequest(1500, 'Network unreachable', true), {
    loading: 'Saving user…',
    success: 'Saved',
    error: (err) => ({ title: 'Save failed', body: (err as Error).message }),
  })
}

const animateProgress = () => {
  const h = chyrp.loading('Uploading', { max: 100, value: 0, persistent: true })
  let v = 0
  const tick = () => {
    v = Math.min(100, v + (8 + Math.random() * 14))
    h.update({ value: v, body: `Uploading… ${Math.round(v)}%` })
    if (v < 100) setTimeout(tick, 220)
    else
      h.update({
        style: 'info',
        body: 'Upload complete',
        max: undefined,
        value: 0,
        timeout: 2200,
        sound: 'success',
      })
  }
  setTimeout(tick, 250)
}

const streamUpdates = () => {
  const h = chyrp.loading('Step 1/3: connecting', { persistent: true })
  setTimeout(() => h.update({ body: 'Step 2/3: uploading' }), 800)
  setTimeout(() => h.update({ body: 'Step 3/3: verifying' }), 1700)
  setTimeout(
    () => h.update({ style: 'info', body: 'Done!', timeout: 2200, sound: 'success' }),
    2600,
  )
}

const soundGentle = () => chyrp.info('Gentle chime', { sound: 'gentle' })
const soundAlert = () => chyrp.warning('Alert chime', { sound: 'alert' })
const soundSuccess = () => chyrp.info('Success chime', { sound: 'success' })
const soundError = () => chyrp.error('Error chime', { sound: 'error' })
const soundDefault = () => chyrp.warning('Style-aware default', { sound: true })
const soundCustom = () => {
  chyrp.info('Custom chime!', {
    sound: [
      { frequency: 880, startOffset: 0, duration: 0.1, amplitude: 0.2 },
      { frequency: 1108, startOffset: 0.08, duration: 0.15, amplitude: 0.18 },
      { frequency: 1318, startOffset: 0.16, duration: 0.2, amplitude: 0.15 },
    ],
  })
}

const pauseOn = () =>
  chyrp.info('Hover me — the timer pauses', { pauseOnHover: true, timeout: 5000 })
const pauseOff = () =>
  chyrp.info('No pause — slipping away', { pauseOnHover: false, timeout: 5000 })

const swipeOn = () => chyrp.info('Drag me out (or click)', { persistent: true })
const swipeOff = () =>
  chyrp.info('Pinned in place — only click dismisses', { swipe: false, persistent: true })

const spawn5 = () => {
  for (let i = 1; i <= 5; i++) {
    setTimeout(() => chyrp.info(`Toast #${i}`, { timeout: 0 }), i * 100)
  }
}

const applyConfigure = () => {
  configure({
    position: cfgPosition.value,
    pauseOnHover: cfgPause.value === 'true',
    sound:
      cfgSound.value === 'true' ? true : cfgSound.value === 'false' ? false : cfgSound.value,
    resound: cfgResound.value === 'true',
  })
  chyrp.info('Defaults applied')
}

const testConfig = () => chyrp.info('Test toast — uses current defaults')

const resetConfig = () => {
  cfgPosition.value = 'top-right'
  cfgPause.value = 'true'
  cfgSound.value = 'true'
  cfgResound.value = 'false'
  configure({ position: 'top-right', pauseOnHover: true, sound: true, resound: false })
  chyrp.info('Reset to defaults')
}

const toggleAlert = () => {
  if (restoreAlert) {
    restoreAlert()
    restoreAlert = null
    alertOn.value = false
    chyrp.info('Native alert restored')
  } else {
    restoreAlert = interceptAlert()
    alertOn.value = true
    chyrp.info('alert() now shows as a toast')
  }
}
const triggerAlert = () => window.alert('Hello from alert()!')

const a11yDemo = () => {
  chyrp({
    title: 'Try Tab + Enter',
    body: 'Focus this toast with Tab, then Enter or Space to dismiss.',
    persistent: true,
  })
}

// On mount, scroll to hash if present
onMounted(() => {
  if (window.location.hash) {
    const id = window.location.hash.slice(1)
    const el = document.getElementById(id)
    if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }))
  }
})
</script>

<template>
  <div class="container layout">
    <TableOfContents :items="tocItems" />

    <main class="content" id="main-content" tabindex="-1">
      <DocSection id="install" heading="Install">
        <p>Install from npm. The CSS is a separate import so you can bundle it however you like.</p>
        <CodeBlock code="npm install chyrp" />
        <CodeBlock :code="`import { chyrp } from 'chyrp';\nimport 'chyrp/style.css';`" />
        <NoteCallout>
          <strong>CDN:</strong> Drop in the IIFE bundle and access the library at
          <code>window.Chyrp</code>:
          <CodeBlock
            mini
            :code="`<link rel=&quot;stylesheet&quot; href=&quot;https://unpkg.com/chyrp/dist/style.css&quot; />\n<script src=&quot;https://unpkg.com/chyrp/dist/index.iife.js&quot;></script>\n<script>Chyrp.chyrp.info('Hello');</script>`"
          />
        </NoteCallout>
      </DocSection>

      <DocSection id="quick-start" heading="Quick start">
        <p>
          Show a toast with a single call. Every form returns a <code>ToastHandle</code> you can
          use to dismiss or update later.
        </p>
        <DemoArea label="Quick start example">
          <button type="button" class="btn" @click="showBasic">Show toast</button>
        </DemoArea>
        <CodeBlock code="chyrp({ body: 'Hello world' });" />
      </DocSection>

      <DocSection id="styles" heading="Styles">
        <p>
          Four built-in visual styles, each with a default icon and accent color. Use the
          convenience methods or pass <code>style</code> to the main function.
        </p>
        <DemoArea label="Style variants">
          <button type="button" class="btn btn-info" @click="showStyle('info')">info</button>
          <button type="button" class="btn btn-warning" @click="showStyle('warning')">
            warning
          </button>
          <button type="button" class="btn btn-error" @click="showStyle('error')">error</button>
          <button type="button" class="btn btn-loading" @click="showStyle('loading')">
            loading
          </button>
        </DemoArea>
        <CodeBlock
          :code="`chyrp.info('Saved');\nchyrp.warning('Almost out of space');\nchyrp.error('Upload failed');\nchyrp.loading('Working…');\n\n// equivalent:\nchyrp({ body: 'Saved', style: 'info' });`"
        />
      </DocSection>

      <DocSection id="title-body" heading="Title & body">
        <p>Add a bold heading above the body for two-line layouts.</p>
        <DemoArea label="Titled toast">
          <button type="button" class="btn btn-primary" @click="showTitleBody">
            Show titled toast
          </button>
        </DemoArea>
        <CodeBlock
          :code="`chyrp({\n  title: 'Saved',\n  body: 'Your changes are live.',\n  style: 'info',\n});`"
        />
      </DocSection>

      <DocSection id="position" heading="Position">
        <p>
          Six anchor positions. Mobile viewports always force <code>bottom-center</code> for
          thumb reach.
        </p>
        <DemoArea stack label="Position picker">
          <RadioPills
            v-model="positionValue"
            name="position"
            :options="positionOptions"
            label="Toast position"
          />
          <div>
            <button type="button" class="btn btn-primary" @click="showAtPosition">
              Show at selected position
            </button>
          </div>
        </DemoArea>
        <CodeBlock code="chyrp.info('Hello', { position: 'top-right' });" />
      </DocSection>

      <DocSection id="timing" heading="Timing">
        <p>
          The default timeout is 4&nbsp;seconds. Set <code>timeout</code> to a custom number of
          milliseconds, <code>0</code> to disable, or use <code>persistent: true</code> as a
          shorthand for the latter.
        </p>
        <DemoArea label="Timing variants">
          <button type="button" class="btn" @click="showTiming(1500)">1.5s</button>
          <button type="button" class="btn" @click="showTiming(4000)">default (4s)</button>
          <button type="button" class="btn" @click="showTiming(8000)">8s</button>
          <button type="button" class="btn" @click="showTiming(null)">persistent</button>
        </DemoArea>
        <CodeBlock
          :code="`chyrp.info('Quick',     { timeout: 1500 });\nchyrp.info('Default');                          // 4000 ms\nchyrp.info('Patient',   { timeout: 8000 });\nchyrp.info('Forever',   { persistent: true }); // user must dismiss`"
        />
      </DocSection>

      <DocSection id="debounce" heading="Debounce">
        <p>
          Identical toasts fired within the debounce window are suppressed and the existing
          handle is returned. Useful for chatty event sources. Click the button rapidly:
        </p>
        <DemoArea label="Debounce demo">
          <button type="button" class="btn btn-primary" @click="showDebounce">
            Spam click me
          </button>
        </DemoArea>
        <CodeBlock
          :code="`// Default debounce window is 100 ms; bump it for noisier sources:\nchyrp.info('Same message', { debounce: 2000 });`"
        />
      </DocSection>

      <DocSection id="channels" heading="Channels">
        <p>
          Tag toasts under a channel name and dismiss them as a group. The channel renders as a
          small italic label in the toast's corner.
        </p>
        <DemoArea label="Channels demo">
          <button type="button" class="btn" @click="channelNetwork">Add network toast</button>
          <button type="button" class="btn" @click="channelUser">Add user toast</button>
          <button type="button" class="btn" @click="dismissChannel('network')">
            dismissChannel('network')
          </button>
          <button type="button" class="btn" @click="dismissChannel('user')">
            dismissChannel('user')
          </button>
        </DemoArea>
        <CodeBlock
          :code="`import { chyrp, dismissChannel } from 'chyrp';\n\nchyrp.info('Connection lost', { channel: 'network', persistent: true });\nchyrp.info('Retrying…',       { channel: 'network' });\n\n// later:\ndismissChannel('network');`"
        />
      </DocSection>

      <DocSection id="icons" heading="Custom icons">
        <p>
          Override the default icon with a string (text or emoji), an <code>HTMLElement</code>
          (cloned per toast), or <code>false</code> to hide the icon column entirely.
        </p>
        <DemoArea label="Icon variants">
          <button type="button" class="btn" @click="iconEmoji">Emoji icon</button>
          <button type="button" class="btn" @click="iconSvg">SVG element</button>
          <button type="button" class="btn" @click="iconNone">No icon</button>
        </DemoArea>
        <CodeBlock
          :code="`chyrp.info('Party time',  { icon: '🎉' });\n\nconst svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');\n// …populate svg…\nchyrp.info('Custom DOM',  { icon: svg });\n\nchyrp.info('No icon box', { icon: false });`"
        />
      </DocSection>

      <DocSection id="actions" heading="Action buttons">
        <p>
          Add buttons under the body. Returning <code>false</code> from <code>onClick</code>
          keeps the toast open; otherwise it auto-dismisses after the click.
        </p>
        <DemoArea label="Action button demos">
          <button type="button" class="btn btn-primary" @click="actionUndo">
            File deleted (with Undo)
          </button>
          <button type="button" class="btn" @click="actionMulti">Multi-action</button>
        </DemoArea>
        <CodeBlock
          :code="`chyrp({\n  title: 'File deleted',\n  body: 'document.pdf was moved to trash',\n  persistent: true,\n  actions: [\n    { label: 'Undo', style: 'primary', onClick: () => restore() },\n    { label: 'Dismiss' },\n  ],\n});`"
        />
      </DocSection>

      <DocSection id="promise" heading="Promise integration">
        <p>
          Wrap a promise to show a loading toast that converts to success or error when it
          settles. Each branch may be a string, an options object, or a function returning
          either.
        </p>
        <DemoArea label="Promise demos">
          <button type="button" class="btn btn-primary" @click="promiseResolve">
            Resolves after 1.5s
          </button>
          <button type="button" class="btn btn-error" @click="promiseReject">
            Rejects after 1.5s
          </button>
        </DemoArea>
        <CodeBlock
          :code="`chyrp.promise(api.saveUser(user), {\n  loading: 'Saving…',\n  success: (user) => \`Saved \${user.name}\`,\n  error:   (err)  => ({ title: 'Save failed', body: err.message }),\n});`"
        />
      </DocSection>

      <DocSection id="progress" heading="Determinate progress">
        <p>
          For loading toasts with known total work, pass <code>max</code> and <code>value</code>.
          The icon becomes a donut filled in proportion to <code>value / max</code>. Update via
          <code>handle.update({ value })</code>.
        </p>
        <DemoArea label="Progress demo">
          <button type="button" class="btn btn-primary" @click="animateProgress">
            Animate 0 → 100%
          </button>
        </DemoArea>
        <CodeBlock
          :code="`const handle = chyrp.loading('Uploading', { max: 100, value: 0 });\n\nuploader.on('progress', (n) => handle.update({ value: n }));\nuploader.on('done',     ()  => handle.update({\n  style: 'info', body: 'Upload complete', timeout: 2000,\n}));`"
        />
      </DocSection>

      <DocSection id="update" heading="Updating in place">
        <p>
          <code>handle.update(opts)</code> mutates a live toast — change body, style, icon,
          actions, timeout, anything. Useful for streaming status updates without flapping the
          UI. By default style changes are silent; enable <code>resound</code> to replay sound
          on style transitions.
        </p>
        <DemoArea label="Streaming updates">
          <button type="button" class="btn btn-primary" @click="streamUpdates">
            Stream updates
          </button>
        </DemoArea>
        <CodeBlock
          :code="`const h = chyrp.loading('Step 1/3: connecting', { resound: true });\nsetTimeout(() => h.update({ body: 'Step 2/3: uploading' }), 700);\nsetTimeout(() => h.update({ body: 'Step 3/3: verifying' }), 1400);\nsetTimeout(() => h.update({ style: 'info', body: 'Done!', timeout: 2000 }), 2100);`"
        />
      </DocSection>

      <DocSection id="sound" heading="Sound">
        <p>
          Chyrp toasts demand attention. Pass a named chime, a custom URL, or <code>true</code>
          for a style-aware default. Named chimes are synthesized via Web Audio — no asset
          dependency. Sound is <strong>opt-out</strong>; the global default is style-aware.
        </p>
        <DemoArea label="Sound presets">
          <button type="button" class="btn" @click="soundGentle">gentle</button>
          <button type="button" class="btn" @click="soundAlert">alert</button>
          <button type="button" class="btn" @click="soundSuccess">success</button>
          <button type="button" class="btn" @click="soundError">error</button>
          <button type="button" class="btn" @click="soundDefault">true (style default)</button>
        </DemoArea>
        <CodeBlock
          :code="`chyrp.info('Saved',  { sound: 'success' });    // named chime\nchyrp.error('Save failed', { sound: true });   // style default → 'error'\nchyrp.info('Custom', { sound: '/ding.mp3' });  // your own audio asset`"
        />

        <h3>Replay sound on update()</h3>
        <p>
          Set <code>resound: true</code> to play a sound whenever
          <code>handle.update({ style })</code> changes style.
        </p>
        <CodeBlock
          :code="`const h = chyrp.loading('Uploading', {\n  sound: true,\n  resound: true,\n});\n\nh.update({ style: 'info', body: 'Upload complete' }); // plays success preset`"
        />

        <h3>Custom chime notes</h3>
        <p>
          Pass a <code>ChimeNote[]</code> array directly to play a fully custom synthesized chime
          on a single toast:
        </p>
        <DemoArea label="Custom chime">
          <button type="button" class="btn btn-primary" @click="soundCustom">Custom chime</button>
        </DemoArea>
        <CodeBlock
          :code="`chyrp.info('Custom sound!', {\n  sound: [\n    { frequency: 880,   startOffset: 0,    duration: 0.1, amplitude: 0.2 },\n    { frequency: 1108,  startOffset: 0.08, duration: 0.15, amplitude: 0.18 },\n    { frequency: 1318,  startOffset: 0.16, duration: 0.2, amplitude: 0.15 },\n  ],\n});`"
        />

        <h3>Overriding preset sounds</h3>
        <p>
          Use <code>configure({ soundPresets })</code> to globally replace any of the four
          built-in chime presets (<code>success</code>, <code>error</code>, <code>alert</code>,
          <code>gentle</code>). Omitted presets keep their defaults.
        </p>
        <CodeBlock
          :code="`import { configure } from 'chyrp';\n\nconfigure({\n  soundPresets: {\n    success: [\n      { frequency: 880, startOffset: 0, duration: 0.12, amplitude: 0.2 },\n      { frequency: 1320, startOffset: 0.1, duration: 0.18, amplitude: 0.18 },\n    ],\n    // error, alert, gentle keep their defaults\n  },\n});`"
        />

        <h3>Opt-out of sound</h3>
        <p>
          Sound isn't for everyone. Use <code>configure({ sound: false })</code> to globally
          disable all sounds. Use <code>resound: false</code> (default) to keep
          <code>update({ style })</code> transitions silent.
        </p>
        <CodeBlock
          :code="`import { configure } from 'chyrp';\n\nconfigure({\n  sound: false,\n  resound: false,\n});`"
        />
      </DocSection>

      <DocSection id="pause" heading="Pause-on-hover">
        <p>
          The auto-dismiss timer pauses while the toast is hovered or keyboard-focused. The
          progress bar freezes and resumes from where it left off. Auto-disabled on touch-primary
          devices.
        </p>
        <DemoArea stack label="Pause-on-hover demo">
          <div>
            <button type="button" class="btn btn-primary" @click="pauseOn">
              With pauseOnHover (hover the toast)
            </button>
            <button type="button" class="btn" @click="pauseOff">Without pauseOnHover</button>
          </div>
        </DemoArea>
        <CodeBlock
          :code="`chyrp.info('Read me carefully',  { pauseOnHover: true,  timeout: 5000 });\nchyrp.info('Slipping away…',     { pauseOnHover: false, timeout: 5000 });`"
        />
      </DocSection>

      <DocSection id="swipe" heading="Swipe-to-dismiss">
        <p>
          Drag a toast horizontally (or vertically for centered positions) past a threshold to
          dismiss it with momentum. Disable with <code>swipe: false</code>.
        </p>
        <DemoArea label="Swipe demo">
          <button type="button" class="btn btn-primary" @click="swipeOn">Swipe me away</button>
          <button type="button" class="btn" @click="swipeOff">No-swipe toast</button>
        </DemoArea>
        <CodeBlock
          :code="`chyrp.info('Drag me out',     { persistent: true });\nchyrp.info('Pinned in place', { swipe: false, persistent: true });`"
        />
      </DocSection>

      <DocSection id="dismiss" heading="Dismiss helpers">
        <p>Tear down all live toasts at once, or just those tagged with a channel.</p>
        <DemoArea label="Dismiss demo">
          <button type="button" class="btn" @click="spawn5">Spawn 5 toasts</button>
          <button type="button" class="btn btn-error" @click="dismissAll">dismissAll()</button>
        </DemoArea>
        <CodeBlock
          :code="`import { dismissAll, dismissChannel } from 'chyrp';\n\ndismissAll();\ndismissChannel('network');`"
        />
      </DocSection>

      <DocSection id="configure" heading="Global configuration">
        <p>Set defaults once with <code>configure()</code>. Per-call options always win.</p>
        <DemoArea stack label="Configure form">
          <div class="grid">
            <label>
              Position
              <select v-model="cfgPosition">
                <option value="top-right">top-right</option>
                <option value="top-left">top-left</option>
                <option value="top-center">top-center</option>
                <option value="bottom-right">bottom-right</option>
                <option value="bottom-left">bottom-left</option>
                <option value="bottom-center">bottom-center</option>
              </select>
            </label>
            <label>
              Pause on hover
              <select v-model="cfgPause">
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </label>
            <label>
              Sound default
              <select v-model="cfgSound">
                <option value="true">true (style-aware)</option>
                <option value="false">false (silent)</option>
                <option value="gentle">gentle</option>
                <option value="alert">alert</option>
                <option value="success">success</option>
                <option value="error">error</option>
              </select>
            </label>
            <label>
              Resound on style changes
              <select v-model="cfgResound">
                <option value="true">true</option>
                <option value="false">false</option>
              </select>
            </label>
          </div>
          <div>
            <button type="button" class="btn btn-primary" @click="applyConfigure">Apply</button>
            <button type="button" class="btn" @click="testConfig">Show test toast</button>
            <button type="button" class="btn" @click="resetConfig">Reset</button>
          </div>
        </DemoArea>
        <CodeBlock
          :code="`configure({\n  position: '${cfgPosition}',\n  pauseOnHover: ${cfgPause},\n  sound: ${(cfgSound === 'true' ? true : cfgSound === 'false' ? false : `'${cfgSound}'`)},\n  resound: ${cfgResound},\n});`"
        />
      </DocSection>

      <DocSection id="alert" heading="alert() override">
        <p>
          Opt-in helper that replaces <code>window.alert</code> with a toast-based version.
          Returns a function that restores the native alert.
        </p>
        <DemoArea label="alert override demo">
          <button
            type="button"
            class="btn btn-primary"
            :aria-pressed="alertOn"
            @click="toggleAlert"
          >
            Intercept: <span>{{ alertOn ? 'on' : 'off' }}</span>
          </button>
          <button type="button" class="btn" @click="triggerAlert">Call alert('hello')</button>
        </DemoArea>
        <CodeBlock
          :code="`import { interceptAlert } from 'chyrp';\n\nconst restore = interceptAlert();\nwindow.alert('hello'); // shows as an info toast\n\nrestore(); // put the native alert back`"
        />
      </DocSection>

      <DocSection id="a11y" heading="Accessibility">
        <p>
          Toasts are <code>role="button"</code> with <code>tabindex="0"</code>, so they appear
          in the tab order. Keyboard focus pauses the auto-dismiss timer (just like hover) —
          handy for screen-reader users who need extra time. Action buttons inside toasts are
          real <code>&lt;button&gt;</code>s.
        </p>
        <ul class="kbd-list">
          <li><kbd>Tab</kbd> — focus a live toast</li>
          <li><kbd>Enter</kbd> / <kbd>Space</kbd> — dismiss the focused toast</li>
          <li>
            <kbd>Tab</kbd> into the overflow pill, then <kbd>Enter</kbd> — dismiss the oldest
            hidden toast
          </li>
        </ul>
        <DemoArea label="Accessibility demo">
          <button type="button" class="btn btn-primary" @click="a11yDemo">
            Show toast (then Tab to it)
          </button>
        </DemoArea>
      </DocSection>

      <DocSection id="mobile" heading="Mobile">
        <p>
          Below 600&nbsp;px viewport width, toasts automatically reposition to the bottom edge
          regardless of <code>position</code>, expand to full width with safe-area inset
          padding, and use larger touch targets and progress bar. Pause-on-hover is disabled on
          touch-primary devices since hover doesn't apply.
        </p>
        <NoteCallout>
          Resize this page to under 600&nbsp;px wide to see the mobile layout, or use your
          browser's device toolbar.
        </NoteCallout>
      </DocSection>

      <DocSection id="reduced-motion" heading="Reduced motion">
        <p>
          When <code>prefers-reduced-motion: reduce</code> is set, all transform-based
          entry/exit animations collapse to a fade, the spinner slows down, and the overflow
          pill skips its slide-in. Toasts still appear and dismiss — they just don't fly.
        </p>
        <NoteCallout>
          Toggle <em>Reduce motion</em> in your OS settings (or DevTools → Rendering → Emulate
          CSS media feature) to verify.
        </NoteCallout>
      </DocSection>

      <DocSection id="dark-mode" heading="Dark mode">
        <p>
          Toasts automatically adapt to dark backgrounds via
          <code>prefers-color-scheme: dark</code>. All colors are defined as CSS custom
          properties prefixed with <code>--tt-</code>, so you can override any of them.
        </p>
        <p>
          To force a specific theme regardless of system preference, add a <code>light</code> or
          <code>dark</code> class to the <code>&lt;html&gt;</code> element:
        </p>
        <CodeBlock
          :code="`<!-- Force dark mode -->\n<html class=&quot;dark&quot;>\n\n<!-- Force light mode -->\n<html class=&quot;light&quot;>\n\n<!-- Follow system preference (default) -->\n<html>`"
        />
        <NoteCallout>
          Use the toggle in the top-right corner of this page to preview each mode. The
          <code>.dark</code> class applies dark variables unconditionally, while
          <code>.light</code> prevents the <code>prefers-color-scheme</code> media query from
          activating.
        </NoteCallout>
        <h3>Customizing colors</h3>
        <p>Override any <code>--tt-*</code> variable to theme the toasts. For example:</p>
        <CodeBlock
          :code="`:root {\n  --tt-bg: #1a1a2e;\n  --tt-title-color: #eee;\n  --tt-body-color: #ccc;\n  --tt-info: #00d2ff;\n}`"
        />
      </DocSection>

      <DocSection id="api" heading="API reference">
        <h3>Functions</h3>
        <ApiTable
          caption="Exported functions"
          :headers="['Export', 'Signature']"
          :rows="[
            ['<code>chyrp</code>', '<code>(opts: ToastOptions) =&gt; ToastHandle</code>'],
            [
              '<code>chyrp.info</code> · <code>warning</code> · <code>error</code> · <code>loading</code>',
              '<code>(body: string, opts?: ToastOptions) =&gt; ToastHandle</code>',
            ],
            [
              '<code>chyrp.promise</code>',
              '<code>&lt;T&gt;(p: Promise&lt;T&gt;, opts: PromiseOptions&lt;T&gt;) =&gt; ToastHandle</code>',
            ],
            ['<code>configure</code>', '<code>(opts: ToastConfig) =&gt; void</code>'],
            ['<code>dismissAll</code>', '<code>() =&gt; void</code>'],
            ['<code>dismissChannel</code>', '<code>(name: string) =&gt; void</code>'],
            [
              '<code>interceptAlert</code>',
              '<code>() =&gt; () =&gt; void</code> (returns a restore function)',
            ],
          ]"
        />

        <h3>ToastOptions</h3>
        <ApiTable
          caption="ToastOptions fields"
          :headers="['Field', 'Type', 'Default', 'Notes']"
          :rows="[
            ['<code>title</code>', '<code>string</code>', '—', 'Bold heading above the body'],
            ['<code>body</code>', '<code>string</code>', '—', 'Main message'],
            [
              '<code>style</code>',
              `<code>'info' | 'warning' | 'error' | 'loading'</code>`,
              `<code>'info'</code>`,
              'Visual style and default icon',
            ],
            [
              '<code>timeout</code>',
              '<code>number</code>',
              '<code>4000</code>',
              'Ms before auto-dismiss; <code>0</code> disables',
            ],
            [
              '<code>persistent</code>',
              '<code>boolean</code>',
              '<code>false</code>',
              'Equivalent to <code>timeout: 0</code>',
            ],
            [
              '<code>debounce</code>',
              '<code>number</code>',
              '<code>100</code>',
              'Ms to suppress identical follow-up toasts',
            ],
            ['<code>swipe</code>', '<code>boolean</code>', '<code>true</code>', 'Allow swipe-to-dismiss'],
            [
              '<code>pauseOnHover</code>',
              '<code>boolean</code>',
              '<code>true</code>',
              'Pause timer on hover/focus (desktop only)',
            ],
            [
              '<code>position</code>',
              '<code>ToastPosition</code>',
              `<code>'top-right'</code>`,
              `Mobile forces <code>bottom-center</code>`,
            ],
            [
              '<code>channel</code>',
              '<code>string</code>',
              '—',
              'Tag for grouping; rendered as a label',
            ],
            [
              '<code>icon</code>',
              '<code>string | HTMLElement | false</code>',
              '—',
              'Custom icon (text, cloned DOM, or hide)',
            ],
            [
              '<code>actions</code>',
              '<code>ToastAction[]</code>',
              '—',
              'Buttons rendered below the body',
            ],
            [
              '<code>sound</code>',
              `<code>boolean | 'gentle' | 'alert' | 'success' | 'error' | string</code>`,
              '<code>true</code>',
              'Named chime, URL, or <code>true</code> for style default',
            ],
            [
              '<code>resound</code>',
              '<code>boolean</code>',
              '<code>false</code>',
              'Replay sound when <code>update()</code> changes style',
            ],
            [
              '<code>max</code>',
              '<code>number</code>',
              '—',
              '(loading) Total work units for determinate donut',
            ],
            [
              '<code>value</code>',
              '<code>number</code>',
              '<code>0</code>',
              '(loading) Current progress',
            ],
          ]"
        />

        <h3>PromiseOptions&lt;T = unknown, E = unknown&gt;</h3>
        <ApiTable
          caption="PromiseOptions fields"
          :headers="['Field', 'Type', 'Default', 'Description']"
          :rows="[
            ['<code>loading</code>', '<code>PromiseValueSpec&amp;lt;void&amp;gt;</code>', '—', 'Text to display while the Promise is waiting to resolve or reject.'],
            ['<code>success</code>', '<code>PromiseValueSpec&amp;lt;T&amp;gt;</code>', '—', 'Text or options to show if the Promise resolves.'],
            ['<code>error</code>', '<code>PromiseValueSpec&amp;lt;E&amp;gt;</code>', '—', 'Text or options to show if the Promise rejects.'],
          ]"
        />

        <h3>ToastHandle</h3>
        <ApiTable
          caption="ToastHandle methods"
          :headers="['Method', 'Signature']"
          :rows="[
            ['<code>dismiss</code>', '<code>() =&gt; void</code>'],
            ['<code>update</code>', '<code>(opts: ToastOptions) =&gt; ToastHandle</code>'],
          ]"
        />

      </DocSection>
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 64px;
  padding: 56px 0 96px;
}

@media (max-width: 960px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
    gap: 24px;
    padding: 32px 0 64px;
  }

  .toc {
    display: none;
  }
}

.kbd-list {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
}

.kbd-list li {
  padding: 6px 0;
  color: #334155;
}

kbd {
  display: inline-block;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-bottom-width: 2px;
  border-radius: 5px;
  padding: 2px 7px;
  color: #334155;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
  min-width: 28px;
  text-align: center;
}

@media (prefers-color-scheme: dark) {
  html:not(.light) .kbd-list li {
    color: var(--muted);
  }

  html:not(.light) kbd {
    color: var(--text);
    background: var(--surface);
  }
}

html.dark .kbd-list li {
  color: var(--muted);
}

html.dark kbd {
  color: var(--text);
  background: var(--surface);
}
</style>
