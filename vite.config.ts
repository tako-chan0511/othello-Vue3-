// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // これで `@/xxx` → `<projectRoot>/src/xxx` に
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
