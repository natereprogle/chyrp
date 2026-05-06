<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const visible = ref(false)
let rafId = 0

const onScroll = () => {
  if (rafId) return
  rafId = requestAnimationFrame(() => {
    visible.value = window.scrollY > 400
    rafId = 0
  })
}

const scrollToTop = () => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  if (rafId) cancelAnimationFrame(rafId)
})
</script>

<template>
  <button
    type="button"
    class="back-to-top"
    :class="{ visible }"
    aria-label="Back to top"
    @click="scrollToTop"
  >
    <span aria-hidden="true">↑</span>
  </button>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 18px;
  color: var(--muted);
  text-decoration: none;
  box-shadow: var(--shadow-md);
  opacity: 0;
  pointer-events: none;
  transform: translateY(8px);
  transition:
    opacity 0.2s ease,
    transform 0.2s ease,
    color 0.15s ease;
  z-index: 40;
  cursor: pointer;
}

.back-to-top.visible {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.back-to-top:hover {
  color: var(--accent);
  text-decoration: none;
}

.back-to-top:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

@media (max-width: 600px) {
  .back-to-top {
    bottom: 16px;
    right: 16px;
  }
}
</style>
