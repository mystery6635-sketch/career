import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// /design-sync용 라이브러리 빌드: src/design-system.ts → dist-lib/index.es.js + style.css
export default defineConfig({
  resolve: { alias: { '@shared': fileURLToPath(new URL('./shared', import.meta.url)) } },
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist-lib',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    lib: {
      entry: fileURLToPath(new URL('./src/design-system.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'index.es.js',
      cssFileName: 'style',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react-router-dom'],
    },
  },
})
