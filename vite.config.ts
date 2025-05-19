// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'url'

export default defineConfig({
  base: '/othello-Vue3-/',
  plugins: [vue()],
  resolve: {
    alias: {
      // これで `@/xxx` → `<projectRoot>/src/xxx` に
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
