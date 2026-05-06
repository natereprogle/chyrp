<script setup lang="ts">
defineProps<{ id: string; heading: string }>()
</script>

<template>
  <section :id="id" class="docsec" :aria-labelledby="`${id}-heading`">
    <h2 :id="`${id}-heading`">{{ heading }}</h2>
    <slot />
  </section>
</template>

<style scoped>
.docsec {
  margin: 0 0 64px;
  scroll-margin-top: 80px;
}

.docsec h2 {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.025em;
  line-height: 1.2;
  margin: 0 0 12px;
  scroll-margin-top: 80px;
}

.docsec :deep(h3) {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.01em;
  margin: 28px 0 10px;
  scroll-margin-top: 80px;
}

.docsec :deep(p) {
  color: #334155;
  margin: 0 0 16px;
  max-width: 720px;
}

.docsec :deep(p strong) {
  font-weight: 600;
  color: var(--text);
}

.docsec :deep(ul) {
  margin: 0 0 16px;
  padding-left: 20px;
  color: #334155;
}

.docsec :deep(ul li) {
  margin-bottom: 4px;
}

@media (max-width: 600px) {
  .docsec h2 {
    font-size: 24px;
  }
}

@media (prefers-color-scheme: dark) {
  html:not(.light) .docsec :deep(p),
  html:not(.light) .docsec :deep(ul) {
    color: var(--muted);
  }
}

html.dark .docsec :deep(p),
html.dark .docsec :deep(ul) {
  color: var(--muted);
}
</style>
