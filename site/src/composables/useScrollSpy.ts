import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'

export function useScrollSpy(ids: Ref<string[]>) {
  const activeId = ref<string | null>(null)
  let observer: IntersectionObserver | null = null
  const visible = new Set<string>()

  const computeTopMost = () => {
    for (const id of ids.value) {
      if (visible.has(id)) {
        activeId.value = id
        return
      }
    }
    if (visible.size === 0) activeId.value = null
  }

  const setup = () => {
    teardown()
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id
          if (entry.isIntersecting) visible.add(id)
          else visible.delete(id)
        }
        computeTopMost()
      },
      { rootMargin: '-80px 0px -55% 0px', threshold: 0 },
    )

    for (const id of ids.value) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }
  }

  const teardown = () => {
    observer?.disconnect()
    observer = null
    visible.clear()
  }

  onMounted(setup)
  onBeforeUnmount(teardown)
  watch(ids, () => setup(), { flush: 'post' })

  return { activeId }
}
