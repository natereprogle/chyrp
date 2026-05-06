import { onBeforeUnmount, onMounted, readonly, ref } from 'vue'

export type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'chyrp-theme'

const isThemePreference = (value: string | null): value is ThemePreference =>
  value === 'light' || value === 'dark' || value === 'system'

const readStored = (): ThemePreference => {
  if (typeof localStorage === 'undefined') return 'system'
  const stored = localStorage.getItem(STORAGE_KEY)
  return isThemePreference(stored) ? stored : 'system'
}

const preference = ref<ThemePreference>(readStored())

const applyTheme = (value: ThemePreference) => {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  html.classList.remove('light', 'dark')
  if (value === 'light') html.classList.add('light')
  else if (value === 'dark') html.classList.add('dark')
}

const setTheme = (value: ThemePreference) => {
  preference.value = value
  applyTheme(value)
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, value)
  }
}

let initialized = false
const ensureInitialized = () => {
  if (initialized) return
  initialized = true
  applyTheme(preference.value)
}

export function useTheme() {
  ensureInitialized()

  const mediaQuery =
    typeof window !== 'undefined' && 'matchMedia' in window
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null

  const handleSystemChange = () => {
    if (preference.value === 'system') applyTheme('system')
  }

  onMounted(() => {
    mediaQuery?.addEventListener('change', handleSystemChange)
  })

  onBeforeUnmount(() => {
    mediaQuery?.removeEventListener('change', handleSystemChange)
  })

  return {
    theme: readonly(preference),
    setTheme,
  }
}
