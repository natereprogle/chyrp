<script setup lang="ts">
import { computed } from 'vue'
import { useScrollSpy } from '@/composables/useScrollSpy'

interface TocItem {
  id: string
  label: string
}

const props = defineProps<{ items: readonly TocItem[]; label?: string }>()

const ids = computed(() => props.items.map((i) => i.id))
const { activeId } = useScrollSpy(ids)

const onClick = (event: MouseEvent, id: string) => {
  event.preventDefault()
  const el = document.getElementById(id)
  if (!el) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  if (history.replaceState) {
    history.replaceState(null, '', `#${id}`)
  }
}
</script>

<template>
  <aside class="toc" :aria-label="label ?? 'Table of contents'">
    <nav>
      <a
        v-for="item in items"
        :key="item.id"
        :href="`#${item.id}`"
        :class="{ active: activeId === item.id }"
        :aria-current="activeId === item.id ? 'location' : undefined"
        @click="onClick($event, item.id)"
      >
        {{ item.label }}
      </a>
    </nav>
  </aside>
</template>

<style scoped>
.toc {
  position: sticky;
  top: 80px;
  align-self: start;
  max-height: calc(100vh - 100px);
  overflow-y: auto;
  padding-right: 8px;
}

.toc nav {
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: 13px;
}

.toc nav a {
  color: var(--muted);
  text-decoration: none;
  padding: 6px 12px;
  border-radius: 0;
  border-left: 2px solid var(--border-soft);
  transition:
    color 0.1s ease,
    border-color 0.1s ease,
    background-color 0.1s ease;
  line-height: 1.4;
}

.toc nav a:hover {
  color: var(--text);
  border-left-color: var(--soft);
  text-decoration: none;
}

.toc nav a.active {
  color: var(--accent-strong);
  border-left-color: var(--accent);
  font-weight: 500;
  background: linear-gradient(90deg, var(--accent-soft) 0%, transparent 100%);
}
</style>
