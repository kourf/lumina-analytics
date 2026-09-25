import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: "vitest.setup.js",
    exclude: ['**/node_modules/**', 'functions/**']
  },
  plugins: [react()],
  build: {
    outDir: 'build_dist',
    emptyOutDir: true
  }
})
