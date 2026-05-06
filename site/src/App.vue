<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import BackToTop from '@/components/BackToTop.vue'
</script>

<template>
  <a class="skip-link" href="#main-content">Skip to main content</a>
  <AppHeader />
  <router-view v-slot="{ Component }">
    <component :is="Component" />
  </router-view>
  <AppFooter />
  <BackToTop />
</template>

<style scoped>
.skip-link {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 8px 14px;
  background: var(--surface);
  color: var(--accent-strong);
  border: 1px solid var(--accent);
  border-radius: 8px;
  font-weight: 600;
  z-index: 100;
  transform: translateY(-200%);
  transition: transform 0.15s ease;
}

.skip-link:focus {
  transform: translateY(0);
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  text-decoration: none;
}
</style>
