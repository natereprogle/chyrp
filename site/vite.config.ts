import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: [
      { find: 'chyrp/style.css', replacement: fileURLToPath(new URL('../src/style.css', import.meta.url)) },
      { find: 'chyrp', replacement: fileURLToPath(new URL('../src/index.ts', import.meta.url)) },
      { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
    ],
  },
})
