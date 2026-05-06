<script setup lang="ts">
withDefaults(defineProps<{ stack?: boolean; label?: string }>(), { stack: false })
</script>

<template>
  <div
    class="demo-area"
    :class="{ 'demo-area-stack': stack }"
    role="group"
    :aria-label="label ?? 'Interactive demo'"
  >
    <slot />
  </div>
</template>

<style scoped>
.demo-area {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  margin: 16px 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  box-shadow: var(--shadow-sm);
}

.demo-area-stack {
  flex-direction: column;
  align-items: stretch;
  gap: 16px;
}

.demo-area-stack :deep(div) {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.demo-area :deep(.grid) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  grid-auto-flow: column;
  gap: 12px;
}

.demo-area :deep(label) {
  font-size: 13px;
  color: var(--muted);
  font-weight: 500;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.demo-area :deep(select),
.demo-area :deep(input[type='text']) {
  font: inherit;
  font-size: 13px;
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: white;
  color: var(--text);
}

.demo-area :deep(select:focus),
.demo-area :deep(input[type='text']:focus) {
  outline: 2px solid var(--accent);
  outline-offset: 0;
  border-color: var(--accent);
}

@media (max-width: 600px) {
  .demo-area {
    padding: 16px;
  }

  .demo-area :deep(.grid) {
    grid-template-columns: unset;
    grid-auto-flow: unset;
  }
}

@media (prefers-color-scheme: dark) {
  html:not(.light) .demo-area :deep(select),
  html:not(.light) .demo-area :deep(input[type='text']) {
    background: var(--bg);
    color: var(--text);
  }
}

html.dark .demo-area :deep(select),
html.dark .demo-area :deep(input[type='text']) {
  background: var(--bg);
  color: var(--text);
}
</style>
