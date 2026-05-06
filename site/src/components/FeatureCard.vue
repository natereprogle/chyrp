<script setup lang="ts">
import { ref } from 'vue'

defineProps<{
  icon: string
  title: string
  description: string
  cta: string
  docHref?: string
}>()

defineEmits<{ trigger: [] }>()

const tiltX = ref(0)
const tiltY = ref(0)
const glowX = ref('50%')
const glowY = ref('50%')

const onPointerMove = (e: PointerEvent) => {
  if (e.pointerType && e.pointerType !== 'mouse') return
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const x = (e.clientX - rect.left) / rect.width
  const y = (e.clientY - rect.top) / rect.height
  tiltY.value = (x - 0.5) * 12
  tiltX.value = (0.5 - y) * 12
  glowX.value = `${Math.max(0, Math.min(100, x * 100))}%`
  glowY.value = `${Math.max(0, Math.min(100, y * 100))}%`
}

const resetParallax = () => {
  tiltX.value = 0
  tiltY.value = 0
  glowX.value = '50%'
  glowY.value = '50%'
}
</script>

<template>
  <article
    class="feature-card"
    :style="{
      '--card-rotate-x': `${tiltX}deg`,
      '--card-rotate-y': `${tiltY}deg`,
      '--card-glow-x': glowX,
      '--card-glow-y': glowY,
    }"
    @pointermove="onPointerMove"
    @pointerleave="resetParallax"
    @pointercancel="resetParallax"
  >
    <div class="feature-icon" aria-hidden="true">{{ icon }}</div>
    <h3 class="feature-title">{{ title }}</h3>
    <p class="feature-desc">{{ description }}</p>
    <div class="feature-actions">
      <button type="button" class="btn btn-primary" @click="$emit('trigger')">
        {{ cta }}
      </button>
      <router-link v-if="docHref" :to="docHref" class="feature-link">
        Docs →
      </router-link>
    </div>
  </article>
</template>

<style scoped>
.feature-card {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
  transform-style: preserve-3d;
  will-change: transform;
  transform:
    perspective(900px)
    translateY(var(--card-lift, 0px))
    rotateX(var(--card-rotate-x, 0deg))
    rotateY(var(--card-rotate-y, 0deg));
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.12s ease;
}

.feature-card::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(
      280px circle at var(--card-glow-x, 50%) var(--card-glow-y, 50%),
      rgba(59, 130, 246, 0.1),
      transparent 45%
    );
  opacity: 0;
  transition: opacity 0.2s ease;
}

.feature-card:hover {
  --card-lift: -2px;
  border-color: var(--accent);
  box-shadow: var(--shadow-md);
}

.feature-card:hover::after {
  opacity: 1;
}

.feature-card > * {
  position: relative;
  z-index: 1;
}

@media (prefers-reduced-motion: reduce) {
  .feature-card,
  .feature-card:hover {
    --card-lift: 0px;
    transform: none;
    transition: none;
  }

  .feature-card::after,
  .feature-card:hover::after {
    opacity: 0;
    transition: none;
  }
}

.feature-icon {
  font-size: 24px;
  line-height: 1;
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--accent-soft);
  border-radius: 12px;
}

.feature-title {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 0;
  color: var(--text);
}

.feature-desc {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.55;
  flex: 1;
}

.feature-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.feature-link {
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
}

.feature-link:hover {
  color: var(--accent-strong);
  text-decoration: none;
}
</style>
