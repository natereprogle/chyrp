<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const props = defineProps<{ phrases: string[] }>()

const wrapper = ref<HTMLSpanElement | null>(null)
const current = ref<HTMLSpanElement | null>(null)
const ruler = ref<HTMLSpanElement | null>(null)
const text = ref(props.phrases[0] ?? '')
const width = ref<number | null>(null)
const state = ref<'in' | 'out' | 'idle'>('idle')

const DISPLAY_MS = 2000
const TRANSITION_MS = 300
const WIDTH_TRANSITION_MS = 400
const CYCLE_MS = DISPLAY_MS + Math.max(TRANSITION_MS, WIDTH_TRANSITION_MS) + TRANSITION_MS

let timer: ReturnType<typeof setInterval> | null = null
let swapTimer: ReturnType<typeof setTimeout> | null = null
let index = 0

const measure = (value: string): number => {
  const el = ruler.value
  if (!el) return 0
  el.textContent = value
  return el.offsetWidth
}

const tick = () => {
  if (!props.phrases.length) return
  index = (index + 1) % props.phrases.length
  const next = props.phrases[index] ?? ''
  const nextW = measure(next)

  state.value = 'out'
  width.value = nextW

  swapTimer = setTimeout(() => {
    text.value = next
    state.value = 'in'
    requestAnimationFrame(() => {
      state.value = 'idle'
    })
  }, Math.max(TRANSITION_MS, WIDTH_TRANSITION_MS))
}

onMounted(() => {
  if (!props.phrases.length) return
  width.value = measure(props.phrases[0] ?? '')
  timer = setInterval(tick, CYCLE_MS)
})

onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  if (swapTimer) clearTimeout(swapTimer)
})
</script>

<template>
  <span
    ref="wrapper"
    class="rotating-wrapper"
    :style="width !== null ? { width: width + 'px' } : undefined"
  >
    <span
      ref="current"
      class="rotating-current"
      :class="{ in: state === 'in', out: state === 'out' }"
      aria-live="polite"
    >
      {{ text }}
    </span>
    <span
      class="rotating-underline"
      :style="width !== null ? { width: width + 'px' } : undefined"
      aria-hidden="true"
    />
    <span
      ref="ruler"
      class="rotating-current"
      aria-hidden="true"
      style="position: absolute; visibility: hidden; white-space: nowrap; pointer-events: none;"
    />
  </span>
</template>

<style scoped>
.rotating-wrapper {
  display: inline-block;
  position: relative;
  vertical-align: bottom;
  max-width: 100%;
  overflow: hidden;
  transition: width 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

.rotating-current {
  display: inline-block;
  white-space: nowrap;
  color: var(--accent-strong);
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.rotating-current.out {
  opacity: 0;
  transform: translateY(-0.4em);
}

.rotating-current.in {
  opacity: 0;
  transform: translateY(0.4em);
}

.rotating-underline {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--accent), #8b5cf6);
  transition: width 0.4s cubic-bezier(0.23, 1, 0.32, 1);
}

@media (prefers-reduced-motion: reduce) {
  .rotating-current,
  .rotating-underline,
  .rotating-wrapper {
    transition: none;
  }
}
</style>
