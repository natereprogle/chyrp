<script setup lang="ts">
import { useHead } from '@/composables/useHead'
import RotatingTagline from '@/components/RotatingTagline.vue'
import FeatureCard from '@/components/FeatureCard.vue'
import { chyrp, type ToastOptions } from 'chyrp'
import { playDemoSong } from '@/utils/song'

type BgStyle = 'info' | 'warning' | 'error' | 'loading'

type SpotlightStage = HTMLDivElement & {
  _spotlightTimer?: number;
};

interface BgToast {
  style: BgStyle
  title?: string
  body: string
  actions?: { label: string; variant?: 'primary' | 'default', onClick?: (event: MouseEvent) => void }[]
  top: string
  left: string
  rotation: string
}

function removeClickedDomElement(event: MouseEvent, callback: () => void) {
  const topDiv = (event.currentTarget as HTMLElement).closest(
    ".hero-bg-toast-wrap"
  ) as HTMLElement | null;

  if (!topDiv) return;

  topDiv.style.transition = "opacity 0.2s ease, visibility 0.2s ease";
  topDiv.style.opacity = "0";
  topDiv.style.visibility = "hidden";
  callback();

  setTimeout(() => {
    topDiv.remove();
  }, 250);
}

const BG_POOL: Omit<BgToast, 'top' | 'left' | 'rotation'>[] = [
  { style: 'info', title: 'Saved', body: 'Your changes were saved.' },
  { style: 'info', title: 'Deployed', body: 'v2.4.1 is live in production.' },
  { style: 'info', body: 'New comment on your post.', actions: [{ label: 'View', variant: 'primary', onClick: () => chyrp({ title: "Hold on a sec...", style: "info", body: "...what comment?" }) }, { label: 'Dismiss', onClick: (event) => removeClickedDomElement(event, () => { }) }] },
  { style: 'warning', title: 'Low storage', body: 'Only 2 GB remaining.', actions: [{ label: 'Free up space', variant: 'primary', onClick: (event) => removeClickedDomElement(event, () => showLoading("Freeing space...", "Space freed!")) }] },
  { style: 'warning', title: 'Update available', body: 'Version 3.0.0 is ready.', actions: [{ label: 'Install', variant: 'primary', onClick: () => chyrp({ title: "Oh my", style: "warning", "body": "You're quite trusting, aren't you?" }) }, { label: 'Later', onClick: (event) => removeClickedDomElement(event, () => chyrp({ style: "info", "body": "You'll be reminded tomorrow." })) }, { label: 'Dismiss', onClick: (event) => removeClickedDomElement(event, () => { }) }] },
  { style: 'warning', body: 'Session expires in 5 minutes.' },
  { style: 'error', title: 'Upload failed', body: 'File exceeds the 10 MB limit.' },
  { style: 'error', title: 'Network error', body: 'Could not reach the server.', actions: [{ label: 'Retry', onClick: (event) => removeClickedDomElement(event, () => showLoading("Retrying...", "Retry complete")) }] },
  { style: 'loading', title: 'Processing', body: 'Uploading your file…' },
  { style: 'loading', body: 'Syncing data…' },
]

function rand(min1: number, max1: number, min2?: number, max2?: number, index?: number) {
  if (min2 !== undefined && max2 !== undefined) {
    return (index === undefined ? Math.random() < 0.5 : index % 2 === 0)
      ? min1 + Math.random() * (max1 - min1)
      : min2 + Math.random() * (max2 - min2)
  }
  return min1 + Math.random() * (max1 - min1)
}

const bgToasts: BgToast[] = [...BG_POOL]
  .sort(() => Math.random() - 0.5)
  .slice(0, 7)
  .map((msg, i) => ({
    ...msg,
    top: `${rand(4, 88, 4, 88)}%`,
    left: `${rand(1, 20, 65, 80, i)}%`, // Prevents too much overlap in the center, which would make it hard to read the hero.
    rotation: `${rand(-14, 14)}deg`,
  }))

const STYLE_ICONS: Record<Exclude<BgStyle, 'loading'>, string> = {
  info: 'i',
  warning: '!',
  error: '×',
}

useHead({
  title: 'chyrp — toasts that get your attention',
  description:
    'A tiny, dependency-free toast notification library with stacking, swipe-to-dismiss, sounds, and promise integration.',
})

const phrases = [
  'have purpose.',
  'stack up nicely.',
  'earn their place.',
  'demand attention.',
  'never overstay.',
  'work with you.',
]

const showInfo = () => {
  chyrp.info('Saved', { title: 'Success' })
}
const showWarning = () => {
  chyrp.warning('Almost out of space')
}
const showError = () => {
  chyrp.error('Upload failed', { title: 'Network error' })
}
const showLoading = (initial?: string, body?: string) => {
  const handle = chyrp.loading(initial ?? 'Working…')
  setTimeout(() => {
    handle.update({ style: 'info', body: body ?? 'All done', timeout: 2000 })
  }, 1800)
}

const featureStyles = () => {
  const styles: ({ delay?: number } & Partial<ToastOptions>)[] = [
    {
      style: 'info',
      title: 'Info style',
      body: 'Use for general information or success messages.',
    },
    {
      style: 'warning',
      title: 'Warning style',
      body: 'Use for cautionary messages that need attention.',
    },
    {
      style: 'error',
      title: 'Error style',
      body: 'Use for critical issues or failure messages.',
    },
    {
      style: 'loading',
      title: 'Loading style',
      body: 'Use for ongoing processes without a defined end time.',
    },
    {
      style: 'info',
      title: 'Custom position',
      body: 'Who said they had to appear in the top-right corner?',
      position: 'top-left',
      delay: 500
    },
    {
      style: 'info',
      title: 'Shhhhh',
      icon: '🤫',
      body: 'Shhh, I\'m hiding!! No sound from me',
      sound: false,
      position: 'bottom-center',
      delay: 500
    }
  ];

  styles.forEach((options, i) => {
    setTimeout(() => {
      chyrp({ ...options, timeout: 8000 })
    }, i * (options.delay ?? 300));
  })
}

const featurePromise = () => {
  chyrp.promise(
    new Promise<{ name: string }>((resolve, reject) =>
      Math.random() < 0.5
        ? setTimeout(() => reject(new Error('Failed to save user')), 1400)
        : setTimeout(() => resolve({ name: 'Ada Lovelace' }), 1400),
    ),
    {
      loading: 'Saving user…',
      success: (user) => `Saved ${user.name}`,
      error: (err) => ({ title: `Error: ${(err as Error).message}`, body: 'Psst...this was on purpose. The promise rejects 50% of the time for demo purposes 😉', timeout: 6000 }),
    },
  )
}

const featureChannels = () => {
  chyrp.info('Connection lost', { channel: 'network', persistent: true, title: 'Offline' })
  setTimeout(() => chyrp.info('Retrying…', { channel: 'network', persistent: true }), 350)
  setTimeout(() => chyrp.info('Back online', { channel: 'network', sound: 'success' }), 1500)
}

const featureProgress = () => {
  const handle = chyrp.loading('Uploading', { max: 100, value: 0, persistent: true })
  let v = 0
  const tick = () => {
    v = Math.min(100, v + 8 + Math.random() * 14)
    handle.update({ value: v, body: `Uploading… ${Math.round(v)}%` })
    if (v < 100) setTimeout(tick, 220)
    else
      handle.update({
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

const featureSound = () => {
  chyrp.info('Soft chime', { sound: 'gentle' })
}

const featureSwipe = () => {
  chyrp.info('Drag me sideways to dismiss', { persistent: true, title: 'Swipe to dismiss' })
}

const featureActions = () => {
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

const featureFun = () => {
  if(window.innerWidth <= 600) {
    chyrp({
      style: "warning",
      title: "Sorry about this...",
      body: "It appears you're on mobile (or have a super tiny screen). Unfortunately, this demo really only works well on desktop. Come back later and try it!",
    });

    return;
  }

  chyrp({
    style: "info",
    title: "Quick check",
    body: "Hi there, I'm the dev of Chyrp! I wanted to make sure I got your permission before playing a little tune. Don't worry, it's just a demo of chyrp's sound capabilities, but I wanted to be respectful and ask first. May I play it for you?",
    persistent: true,
    actions: [
      {
        label: 'Play demo song',
        style: 'primary',
        onClick: () => {
          chyrp({
            style: 'info',
            title: "Thanks!",
            body: "Get ready, here we go!",
            timeout: 2000,
            pauseOnHover: false,
            swipe: false,
          });

          setTimeout(() => {
            startSpotlightShow(8.9 * 1000);
            playDemoSong()
          }, 2200);
        },
      },
      {
        label: 'No thanks', onClick: () => {
          chyrp({ style: 'info', title: "No worries!", body: "If you change your mind, the demo song is just a toast away. Thanks for checking out Chyrp!" })
        }
      },
    ],
  })
}

const startSpotlightShow = (durationMs = 5000) =>  {
  const app = document.getElementById("app");

  if (!app) {
    throw new Error('Missing #app element');
  }

  let stage = document.querySelector(".spotlight-stage") as SpotlightStage | null;

  if (!stage) {
    stage = document.createElement("div") as SpotlightStage;
    stage.className = "spotlight-stage";

    stage.innerHTML = `
      <div class="spotlight-beam left"></div>
      <div class="spotlight-beam center"></div>
      <div class="spotlight-beam right"></div>
    `;

    document.body.appendChild(stage);
  }

  app.classList.add("spotlight-active");

  // force the browser to apply the initial opacity before activating transition
  // requestAnimationFrame() isn't enough on its own here, we need a slight delay to ensure the initial styles are applied before we add the "active" class that triggers the transition
  // Otherwise, the transition isn't "displayed". At least, it isn't on Firefox.
  setTimeout(() => {
    requestAnimationFrame(() => {
      stage.classList.add("active");
    });
  }, 20);

  window.clearTimeout(stage._spotlightTimer);

  stage._spotlightTimer = window.setTimeout(() => {
    stage.classList.remove("active");
    app.classList.remove("spotlight-active");

    window.setTimeout(() => {
      stage.remove();
    }, 300);
  }, durationMs);
}

const features: {
  icon: string
  title: string
  description: string
  cta: string
  docHref?: string
  fire: () => void
}[] = [
    {
      icon: '🚦',
      title: 'Options for all',
      description:
        'Customize styles, icons, positioning, sound, and more to match your app\'s design.',
      cta: 'Try it',
      docHref: '/docs#styles',
      fire: featureStyles,
    },
    {
      icon: '⏳',
      title: 'Promise integration',
      description:
        'Wrap any promise to get loading → success/error transitions automatically. One call, three states.',
      cta: 'Try it',
      docHref: '/docs#promise',
      fire: featurePromise,
    },
    {
      icon: '📡',
      title: 'Channels',
      description:
        'Tag toasts under a channel and dismiss them as a group — perfect for transient network or status updates.',
      cta: 'Try channels',
      docHref: '/docs#channels',
      fire: featureChannels,
    },
    {
      icon: '⏱️',
      title: 'Determinate progress',
      description:
        'Pass a max and value to render a donut filled in proportion to your work. Update in place as it ticks.',
      cta: 'Run upload',
      docHref: '/docs#progress',
      fire: featureProgress,
    },
    {
      icon: '🔔',
      title: 'Sound built in',
      description:
        'Web Audio chimes synthesized on the fly — no asset files. Style-aware defaults or fully custom notes.',
      cta: 'Play chime',
      docHref: '/docs#sound',
      fire: featureSound,
    },
    {
      icon: '👆',
      title: 'Swipe-to-dismiss',
      description:
        'Drag toasts horizontally past a threshold to dismiss with momentum. Pointer, touch, and keyboard friendly.',
      cta: 'Show swipeable',
      docHref: '/docs#swipe',
      fire: featureSwipe,
    },
    {
      icon: '🎬',
      title: 'Action buttons',
      description:
        'Add Undo, Install, or any custom button. Return false from onClick to keep the toast open while you work.',
      cta: 'Try Undo',
      docHref: '/docs#actions',
      fire: featureActions,
    },
    {
      icon: '🤪',
      title: 'Have some fun!',
      description:
        'Sometimes, a library can double as a way to add some fun to your site. This is one of those times.',
      cta: 'Hit it, DJ!',
      fire: featureFun,
    }
  ]

</script>

<template>
  <section class="hero" aria-labelledby="hero-heading">
    <div class="hero-bg-toasts" aria-hidden="true">
      <div v-for="(t, i) in bgToasts" :key="i" class="hero-bg-toast-wrap"
        :style="{ top: t.top, left: t.left, transform: `rotate(${t.rotation})` }">
        <div :class="`toast toast-${t.style} toast-show`">
          <div class="toast-icon">
            <div v-if="t.style === 'loading'" class="toast-spinner" />
            <template v-else>{{ STYLE_ICONS[t.style] }}</template>
          </div>
          <div class="toast-content">
            <div v-if="t.title" class="toast-header">
              <p class="toast-title">{{ t.title }}</p>
            </div>
            <p class="toast-body">{{ t.body }}</p>
            <div v-if="t.actions?.length" class="toast-actions">
              <button v-for="(a, j) in t.actions" :key="j"
                :class="`toast-action toast-action-${a.variant ?? 'default'}`" tabindex="-1"
                @click="a.onClick?.($event)">{{
                  a.label }}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="container">
      <h1 id="hero-heading">chyrp</h1>
      <p class="tagline">
        <span>Toasts that</span>
        <RotatingTagline :phrases="phrases" />
      </p>
      <div class="hero-actions" role="group" aria-label="Toast style examples">
        <button type="button" class="btn btn-info" @click="showInfo">chyrp.info</button>
        <button type="button" class="btn btn-warning" @click="showWarning">chyrp.warning</button>
        <button type="button" class="btn btn-error" @click="showError">chyrp.error</button>
        <button type="button" class="btn btn-loading" @click="showLoading()">chyrp.loading</button>
      </div>
      <p class="hero-meta">
        <code>npm install chyrp</code> · zero deps · ~9 kB gzipped (js + css) · MIT
      </p>
      <div class="hero-cta">
        <router-link to="/docs" class="btn btn-primary">Read the docs →</router-link>
        <a href="https://github.com/natereprogle/chyrp" class="btn" target="_blank" rel="noopener" data-external-link>
          View on GitHub
        </a>
      </div>
    </div>
  </section>

  <section class="features" aria-labelledby="features-heading">
    <div class="container">
      <header class="features-header">
        <p class="features-eyebrow">What's inside</p>
        <h2 id="features-heading">Big features, tiny package</h2>
        <p>
          Every chyrp toast is built with the kind of behavior real apps need. Try each one
          right here — no install required.
        </p>
      </header>
      <div class="features-grid">
        <FeatureCard v-for="feature in features" :key="feature.title" :icon="feature.icon" :title="feature.title"
          :description="feature.description" :cta="feature.cta" :doc-href="feature.docHref" @trigger="feature.fire()" />
      </div>
    </div>
  </section>

  <section class="preview" aria-labelledby="preview-heading">
    <div class="preview-inner">
      <div class="preview-copy">
        <h2 id="preview-heading">Try the live builder!</h2>
        <p>
          Chyrp has a lot of options, but you don't have to memorize them to get started. The builder is an
          interactive playground that generates code for you as you tweak settings, so you can get a feel for how
          everything works before you write a line of code.
        </p>
        <ul>
          <li>Every <code>ToastOptions</code> field in one place</li>
          <li>Generated code updates as you tweak values</li>
          <li>Full support for every option, even <code>actions</code> and <code>ChimeNote[]</code>!</li>
          <li>High coolness factor (we're biased)</li>
        </ul>
        <div class="preview-actions">
          <router-link to="/builder" class="btn btn-primary">Open builder →</router-link>
          <router-link to="/docs#install" class="btn">Skip to install 💙</router-link>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.hero-bg-toasts {
  text-align: start;
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
  opacity: 1;
  transition: opacity 0.4s ease, visibility 0.4s ease;
}

@media (max-width: 1150px) {
  .hero-bg-toasts {
    opacity: 0.4;
  }
}

@media (max-width: 700px) {
  .hero-bg-toasts {
    opacity: 0;
    visibility: hidden;
  }
}

.hero-bg-toast-wrap {
  position: absolute;
  transform-origin: center;
  user-select: none;
}

.hero-bg-toast-wrap .toast {
  cursor: default;
  transition: none;
}

.hero {
  padding: 96px 0 72px;
  background:
    radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59, 130, 246, 0.08), transparent 60%),
    linear-gradient(180deg, #ffffff 0%, var(--bg) 100%);
  border-bottom: 1px solid var(--border);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero .container {
  position: relative;
  z-index: 1;
  pointer-events: none;
}

.hero .container *:not(div, h1) {
  pointer-events: auto;
}

.hero h1 {
  font-size: clamp(40px, 7vw, 64px);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.05;
  margin: 0 0 20px;
}

.hero .tagline {
  font-size: clamp(20px, 4vw, 32px);
  font-weight: 600;
  color: var(--text);
  max-width: 700px;
  margin: 0 auto 40px;
  line-height: 1.3;
  letter-spacing: -0.02em;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: baseline;
  gap: 0 0.4em;
  padding: 0 16px;
}

.hero-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 36px;
}

.hero-meta {
  font-size: 13px;
  color: var(--soft);
  margin: 0;
  padding: 0 16px;
  word-break: break-word;
  width: max-content;
  margin: 0 auto;
}

.hero-meta code {
  background: var(--surface);
  border: 1px solid var(--border);
  padding: 4px 10px;
  border-radius: 6px;
  color: var(--text);
  font-size: 13px;
  margin-right: 4px;
}

.hero-cta {
  display: inline-flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 28px;
}

.features {
  padding: 80px 0;
  border-bottom: 1px solid var(--border);
}

.features-header {
  text-align: center;
  max-width: 640px;
  margin: 0 auto 48px;
  padding: 0 16px;
}

.features-eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--accent-strong);
  margin: 0 0 12px;
}

.features-header h2 {
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 700;
  letter-spacing: -0.025em;
  margin: 0 0 16px;
  line-height: 1.15;
}

.features-header p {
  color: var(--muted);
  font-size: 16px;
  margin: 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
}

.preview {
  padding: 80px 0;
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139, 92, 246, 0.06), transparent 70%),
    var(--bg);
  border-bottom: 1px solid var(--border);
}

.preview-inner {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 24px;
}

@media (max-width: 800px) {
  .preview-inner {
    grid-template-columns: minmax(0, 1fr);
    gap: 28px;
  }
}

.preview-copy h2 {
  font-size: clamp(26px, 4vw, 36px);
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.2;
  margin: 0 0 16px;
}

.preview-copy p {
  color: var(--muted);
  margin: 0 0 20px;
  font-size: 15.5px;
  line-height: 1.65;
}

.preview-copy ul {
  margin: 0 0 24px;
  padding: 0;
  list-style: none;
  color: var(--muted);
  font-size: 14.5px;
}

.preview-copy ul li {
  padding-left: 26px;
  position: relative;
  margin-bottom: 8px;
}

.preview-copy ul li::before {
  content: '✓';
  position: absolute;
  left: 0;
  top: 0;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-soft);
  color: var(--accent-strong);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  margin-top: 4px;
}

.preview-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

@media (max-width: 600px) {
  .hero {
    padding: 56px 0 48px;
  }

  .hero .tagline {
    font-size: 18px;
  }
}

@media (prefers-color-scheme: dark) {
  html:not(.light) .hero {
    background:
      radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59, 130, 246, 0.12), transparent 60%),
      linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%);
  }
}

html.dark .hero {
  background:
    radial-gradient(ellipse 80% 50% at 50% 0%, rgba(59, 130, 246, 0.12), transparent 60%),
    linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%);
}
</style>
