<script setup lang="ts">
defineProps<{ label?: string }>()
</script>

<template>
  <aside class="note" role="note" :aria-label="label ?? 'Note'">
    <slot />
  </aside>
</template>

<style scoped>
.note {
  border: 1px solid var(--border);
  background: var(--surface);
  border-left: 3px solid var(--accent);
  padding: 14px 18px;
  border-radius: 8px;
  margin: 14px 0;
  color: #334155;
  font-size: 14px;
  line-height: 1.55;
}

.note :deep(strong) {
  color: var(--accent-strong);
  font-weight: 600;
}

.note :deep(.code) {
  margin-top: 12px;
}

@media (prefers-color-scheme: dark) {
  html:not(.light) .note {
    color: var(--muted);
  }
}

html.dark .note {
  color: var(--muted);
}
</style>
