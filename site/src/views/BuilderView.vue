<script setup lang="ts">
import { useHead } from '@/composables/useHead'
import ToastBuilder from '@/components/ToastBuilder.vue'

useHead({
  title: 'chyrp — toast builder',
  description:
    'Build a chyrp toast interactively, tweak every option, preview the generated code, and run it live.',
})
</script>

<template>
  <section class="builder-page">
    <div class="builder-shell">
      <div class="builder-intro">
        <p class="builder-eyebrow">Interactive playground</p>
        <h1>Chyrp Toast Builder</h1>
        <p>
          Dial in every option, inspect the exact <code>chyrp(...)</code> call, and fire the
          toast without leaving the site.
        </p>
      </div>
      <ToastBuilder />
    </div>
  </section>
</template>

<style scoped>
.builder-page {
  padding: 88px 24px 96px;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.08), transparent 30%),
    radial-gradient(circle at top right, rgba(249, 115, 22, 0.08), transparent 34%),
    var(--bg);
}

.builder-shell {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.builder-intro {
  max-width: 760px;
}

@media (max-width: 800px) {
  .builder-page {
    padding: 72px 16px 72px;
  }
}
</style>
