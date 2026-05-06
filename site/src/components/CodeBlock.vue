<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    code: string
    lang?: 'javascript' | 'typescript' | 'bash' | 'markup' | 'css' | 'auto'
    mini?: boolean
  }>(),
  {
    lang: 'auto',
    mini: false,
  },
)

const codeEl = ref<HTMLElement | null>(null)
const copied = ref(false)

const detectLang = (text: string): string => {
  if (/^(npm |yarn |pnpm )/.test(text)) return 'bash'
  if (/^\s*<|^\s*&lt;/.test(text) || /^\s*<!--/.test(text)) return 'markup'
  if (/^\s*:root\b|^\s*--tt-|^\s*\.[a-z].*\{/m.test(text)) return 'css'
  return 'javascript'
}

const language = computed(() => (props.lang === 'auto' ? detectLang(props.code) : props.lang))

const highlight = async () => {
  await nextTick()
  if (typeof window === 'undefined') return
  const el = codeEl.value
  if (!el || !window.Prism) return
  window.Prism.highlightElement(el)
}

onMounted(highlight)
watch(() => props.code, highlight)

const copy = async () => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(props.code)
    } else {
      const ta = document.createElement('textarea')
      ta.value = props.code
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
  } catch {
    /* ignore */
  }
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 1200)
}
</script>

<template>
  <pre class="code" :class="[`language-${language}`, { mini }]">
    <button
      type="button"
      class="copy-btn"
      :class="{ copied }"
      :aria-label="copied ? 'Copied to clipboard' : 'Copy code to clipboard'"
      @click="copy"
    >{{ copied ? 'Copied' : 'Copy' }}</button><code ref="codeEl" :class="`language-${language}`">{{ code }}</code></pre>
</template>

<style scoped>
pre.code {
  position: relative;
  background: var(--code-bg);
  color: var(--code-text);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 18px 20px;
  margin: 16px 0;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  box-shadow: var(--shadow-sm);
}

pre.code.mini {
  padding: 14px 16px;
  font-size: 12.5px;
  margin: 12px 0 0;
}

pre.code code {
  font-family: inherit;
  display: block;
  white-space: pre;
  overflow-x: auto;
  overflow-y: hidden;
  max-width: 100%;
  background: transparent;
  padding: 0;
  border: none;
  color: inherit;
}

pre.code[class*='language-'],
pre.code code[class*='language-'] {
  background: var(--code-bg);
  color: var(--code-text);
  text-shadow: none;
  font-family:
    ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace !important;
  font-size: inherit;
  line-height: inherit;
}

pre.code :deep(.token.comment),
pre.code :deep(.token.prolog),
pre.code :deep(.token.doctype),
pre.code :deep(.token.cdata) {
  color: var(--code-cmt);
  font-style: italic;
}

pre.code :deep(.token.string),
pre.code :deep(.token.template-string) {
  color: var(--code-str);
}

pre.code :deep(.token.keyword) {
  color: var(--code-keyword);
}

pre.code :deep(.token.function) {
  color: var(--code-fn);
}

pre.code :deep(.token.number),
pre.code :deep(.token.boolean) {
  color: var(--code-num);
}

pre.code :deep(.token.operator) {
  color: var(--code-op);
}

pre.code :deep(.token.punctuation) {
  color: var(--code-punct);
}

pre.code :deep(.token.property) {
  color: var(--code-prop);
}

pre.code :deep(.token.tag) {
  color: var(--code-tag);
}

pre.code :deep(.token.attr-name) {
  color: var(--code-attr);
}

pre.code :deep(.token.attr-value) {
  color: var(--code-str);
}

pre.code :deep(.token.selector) {
  color: var(--code-sel);
}

pre.code :deep(.token.variable) {
  color: var(--code-var);
}

pre.code :deep(.token.class-name) {
  color: var(--code-cls);
}

pre.code :deep(.token.constant) {
  color: var(--code-const);
}

pre.code :deep(.token.parameter) {
  color: var(--code-var);
}

pre.code :deep(.token.builtin) {
  color: var(--code-builtin);
}

pre.code :deep(.token.regex) {
  color: var(--code-regex);
}

.copy-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  font-family: inherit;
  background: rgba(0, 0, 0, 0.05);
  color: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 0, 0, 0.08);
  font-size: 11px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    color 0.15s ease;
}

.copy-btn:hover {
  background: rgba(0, 0, 0, 0.1);
  color: rgba(0, 0, 0, 0.8);
}

.copy-btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.copy-btn.copied {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
}

@media (prefers-color-scheme: dark) {
  html:not(.light) pre.code {
    background: var(--code-bg);
    border: 1px solid var(--border);
  }

  html:not(.light) .copy-btn {
    background: rgba(255, 255, 255, 0.06);
    color: rgba(255, 255, 255, 0.65);
    border-color: rgba(255, 255, 255, 0.08);
  }

  html:not(.light) .copy-btn:hover {
    background: rgba(255, 255, 255, 0.12);
    color: white;
  }

  html:not(.light) .copy-btn.copied {
    background: rgba(16, 185, 129, 0.2);
    color: #6ee7b7;
  }
}

html.dark pre.code {
  background: var(--code-bg);
  border: 1px solid var(--border);
}

html.dark .copy-btn {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.65);
  border-color: rgba(255, 255, 255, 0.08);
}

html.dark .copy-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: white;
}

html.dark .copy-btn.copied {
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
}
</style>
