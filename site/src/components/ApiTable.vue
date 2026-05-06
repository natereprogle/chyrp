<script setup lang="ts">
defineProps<{
  caption?: string
  headers: readonly string[]
  rows: readonly (readonly string[])[]
}>()
</script>

<template>
  <div class="api-wrap" role="region" :aria-label="caption ?? 'API table'" tabindex="0">
    <table class="api">
      <caption v-if="caption" class="visually-hidden">{{ caption }}</caption>
      <thead>
        <tr>
          <th v-for="(h, i) in headers" :key="i" scope="col">{{ h }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(row, ri) in rows" :key="ri">
          <td v-for="(cell, ci) in row" :key="ci" v-html="cell" />
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.api-wrap {
  overflow-x: auto;
  margin: 12px 0 24px;
  border-radius: 10px;
  box-shadow: var(--shadow-sm);
}

table.api {
  width: 100%;
  border-collapse: collapse;
  font-size: 13.5px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}

table.api th,
table.api td {
  text-align: left;
  padding: 11px 16px;
  border-bottom: 1px solid var(--border);
  vertical-align: top;
}

table.api tbody tr:last-child td {
  border-bottom: none;
}

table.api th {
  font-weight: 600;
  background: #f8fafc;
  font-size: 11.5px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--muted);
}

table.api td:first-child {
  white-space: nowrap;
}

table.api :deep(code) {
  font-size: 12.5px;
  background: var(--border-soft);
  padding: 1px 6px;
  white-space: normal;
  word-break: break-word;
}

@media (max-width: 600px) {
  table.api {
    font-size: 12.5px;
  }

  table.api th,
  table.api td {
    padding: 10px 12px;
  }
}

@media (prefers-color-scheme: dark) {
  html:not(.light) table.api th {
    background: var(--bg);
  }
}

html.dark table.api th {
  background: var(--bg);
}
</style>
