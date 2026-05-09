import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  globalName: 'Chyrp',
  platform: 'browser',
  target: 'es2022',
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  copy: [
    { from: 'src/style.css', to: 'dist' },
    { from: 'src/style-rounded.css', to: 'dist' },
    { from: 'src/style-glassmorphism.css', to: 'dist' },
    { from: 'src/style-material.css', to: 'dist' },
    { from: 'src/style-premium-dark.css', to: 'dist' },
  ],
});
