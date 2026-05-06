<script setup lang="ts" generic="T extends string">
const props = defineProps<{
  modelValue: T
  options: readonly { value: T; label: string }[]
  name: string
  label?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: T] }>()

const onChange = (value: T) => emit('update:modelValue', value)

void props
</script>

<template>
  <div class="radio-group" role="radiogroup" :aria-label="label ?? name">
    <label v-for="opt in options" :key="opt.value">
      <input
        type="radio"
        :name="name"
        :value="opt.value"
        :checked="modelValue === opt.value"
        @change="onChange(opt.value)"
      />
      <span>{{ opt.label }}</span>
    </label>
  </div>
</template>

<style scoped>
.radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.radio-group label {
  flex-direction: row;
  align-items: center;
  padding: 7px 14px;
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
  font-size: 13px;
  color: var(--muted);
  background: white;
  transition:
    border-color 0.1s ease,
    background-color 0.1s ease,
    color 0.1s ease;
}

.radio-group input[type='radio'] {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.radio-group label:hover {
  border-color: var(--soft);
  color: var(--text);
}

.radio-group label:has(input:checked) {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent-strong);
  font-weight: 500;
}

.radio-group label:focus-within {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

@media (prefers-color-scheme: dark) {
  html:not(.light) .radio-group label {
    background: var(--bg);
    color: var(--muted);
  }

  html:not(.light) .radio-group label:has(input:checked) {
    background: var(--accent-soft);
  }
}

html.dark .radio-group label {
  background: var(--bg);
  color: var(--muted);
}

html.dark .radio-group label:has(input:checked) {
  background: var(--accent-soft);
}
</style>
