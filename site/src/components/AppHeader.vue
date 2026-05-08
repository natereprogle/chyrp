<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import ThemeToggle from './ThemeToggle.vue'

const menuOpen = ref(false)
const route = useRoute()
const version = ref<string | null>(null)

fetch('https://registry.npmjs.org/chyrp/latest')
  .then((res) => res.json())
  .then((data) => {
    if ((data.version as string).startsWith('v')) {
      version.value = data.version
    } else {
      version.value = 'v' + data.version
    }
  })
  .catch(() => {
    // leave version null so the badge is never shown
  })

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}
</script>

<template>
  <header class="site-header" :class="{ 'menu-open': menuOpen }">
    <div class="container header-inner">
      <router-link to="/" class="brand" aria-label="chyrp home">
        <img src="@/assets/logo.png" alt="" class="brand-mark" aria-hidden="true" />
        <strong>chyrp</strong>
        <span v-if="version !== null" class="version" :aria-label="version">{{ version }}</span>
      </router-link>

      <button type="button" class="menu-toggle" :aria-expanded="menuOpen" aria-controls="primary-nav"
        aria-label="Toggle navigation menu" @click="toggleMenu">
        {{ menuOpen ? '✕' : '☰' }}
      </button>

      <nav id="primary-nav" class="header-nav" aria-label="Primary">
        <router-link to="/">Home</router-link>
        <router-link to="/builder">Builder</router-link>
        <router-link to="/docs">Docs</router-link>
        <a href="https://github.com/natereprogle/chyrp" target="_blank" rel="noopener" data-external-link>GitHub</a>
        <a href="https://www.npmjs.com/package/chyrp" target="_blank" rel="noopener" data-external-link>npm</a>
        <ThemeToggle />
      </nav>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(250, 250, 250, 0.85);
  /* -webkit-backdrop-filter must be before backdrop-filter */
  /* https://github.com/parcel-bundler/lightningcss/issues/785 */
  -webkit-backdrop-filter: saturate(180%) blur(12px);
  backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1px solid var(--border);
}

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 60px;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  color: var(--text);
}

.brand:hover {
  text-decoration: none;
}

.brand strong {
  font-weight: 600;
  letter-spacing: -0.01em;
}

.brand-mark {
  width: 22px;
  height: 22px;
  filter: drop-shadow(0 4px 10px rgba(59, 130, 246, 0.3));
}

.version {
  font-size: 11px;
  background: var(--accent-soft);
  color: var(--accent-strong);
  padding: 2px 8px;
  border-radius: 999px;
  font-weight: 500;
  font-feature-settings: 'tnum';
}

.header-nav {
  display: flex;
  align-items: center;
  gap: 24px;
  font-size: 14px;
}

.header-nav a {
  color: var(--muted);
  font-weight: 500;
}

.header-nav a:hover,
.header-nav a:focus-visible {
  color: var(--text);
  text-decoration: none;
}

.header-nav a.router-link-active {
  color: var(--accent-strong);
}

.menu-toggle {
  display: none;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
  color: var(--text);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
}

.menu-toggle:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

@media (max-width: 768px) {
  .header-nav {
    position: fixed;
    top: 60px;
    left: 0;
    right: 0;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 12px 16px 16px;
    box-shadow: var(--shadow-md);
    visibility: hidden;
    opacity: 0;
    transform: translateY(-8px);
    transition:
      opacity 0.18s ease,
      transform 0.18s ease,
      visibility 0s linear 0.18s;
  }

  .header-nav a {
    padding: 12px 8px;
    border-bottom: 1px solid var(--border-soft);
  }

  .header-nav a:last-of-type {
    border-bottom: none;
  }

  .header-nav .theme-toggle {
    align-self: center;
    margin-top: 8px;
  }

  .site-header.menu-open .header-nav {
    visibility: visible;
    opacity: 1;
    transform: translateY(0);
    transition:
      opacity 0.18s ease,
      transform 0.18s ease,
      visibility 0s linear 0s;
  }

  .menu-toggle {
    display: inline-flex;
  }
}

@media (prefers-color-scheme: dark) {
  html:not(.light) .site-header {
    background: rgba(15, 23, 42, 0.85);
  }

  html:not(.light) .menu-toggle {
    background: var(--surface);
  }
}

html.dark .site-header {
  background: rgba(15, 23, 42, 0.85);
}

html.dark .menu-toggle {
  background: var(--surface);
}
</style>
