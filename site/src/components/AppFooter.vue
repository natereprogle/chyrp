<script setup lang="ts"></script>

<template>
  <footer class="site-footer">
    <div class="container">
      <p>MIT licensed. Built with <code>chyrp</code> itself.</p>
      <p>
        <a href="https://github.com/natereprogle/chyrp" target="_blank" rel="noopener" data-external-link>
          Source code
        </a>
      </p>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  border-top: 1px solid var(--border);
  padding: 32px 0 40px;
  color: var(--muted);
  font-size: 13.5px;
  text-align: center;
  background: var(--surface);
}

.site-footer p {
  margin: 0;
}

.site-footer code {
  background: var(--border-soft);
  padding: 2px 6px;
  border-radius: 4px;
  color: var(--text);
  font-size: 12.5px;
}
</style>
