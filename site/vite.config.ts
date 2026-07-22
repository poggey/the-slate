import { defineConfig } from 'vite'
import { resolve } from 'path'

// The analysis JSON is imported straight from ../output/slate.json —
// the single source of truth. Re-running the notebooks updates the site.
export default defineConfig({
  resolve: {
    alias: {
      '@data': resolve(__dirname, '../output'),
    },
  },
  server: {
    fs: { allow: ['..'] },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'other-design': resolve(__dirname, 'other-design.html'),
      },
    },
  },
})
