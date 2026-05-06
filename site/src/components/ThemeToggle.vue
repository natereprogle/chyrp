<script setup lang="ts">
import { useTheme, type ThemePreference } from '@/composables/useTheme'

const { theme, setTheme } = useTheme()

const options: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' },
  { value: 'dark', label: 'Dark' },
]
</script>

<template>
  <div class="theme-toggle" role="radiogroup" aria-label="Color theme">
    <button
      v-for="opt in options"
      :key="opt.value"
      type="button"
      role="radio"
      :aria-checked="theme === opt.value"
      :class="{ active: theme === opt.value }"
      @click="setTheme(opt.value)"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  background: var(--border-soft);
  border: 1px solid var(--border);
  border-radius: 999px;
  padding: 2px;
  gap: 0;
}

.theme-toggle button {
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  padding: 5px 12px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease;
  line-height: 1.2;
  white-space: nowrap;
}

.theme-toggle button:hover {
  color: var(--text);
}

.theme-toggle button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.theme-toggle button.active {
  background: var(--surface);
  color: var(--text);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

@media (prefers-color-scheme: dark) {
  html:not(.light) .theme-toggle button.active {
    background: #334155;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }
}

html.dark .theme-toggle button.active {
  background: #334155;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}
</style>
