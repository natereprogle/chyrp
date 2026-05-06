import { onBeforeUnmount, watchEffect } from 'vue'

interface HeadOptions {
  title?: string
  description?: string
}

const setMeta = (name: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('name', name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

const DEFAULT_TITLE = 'chyrp — toast notifications'
const DEFAULT_DESCRIPTION =
  'A tiny, dependency-free toast notification library with stacking, swipe-to-dismiss, sounds, and promise integration.'

export function useHead(options: HeadOptions | (() => HeadOptions)) {
  const resolve: () => HeadOptions = typeof options === 'function' ? options : () => options

  watchEffect(() => {
    const { title, description } = resolve()
    if (title) document.title = title
    if (description) setMeta('description', description)
  })

  onBeforeUnmount(() => {
    document.title = DEFAULT_TITLE
    setMeta('description', DEFAULT_DESCRIPTION)
  })
}
