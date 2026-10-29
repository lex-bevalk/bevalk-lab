import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    modulePreload: { polyfill: false },
    // Chunk mayor observado en las entradas Concept/Current: 1275.49 kB.
    chunkSizeWarningLimit: 1276,
    rollupOptions: {
      external: id => id.includes('app-background.png'),
      input: {
        index: resolve(process.cwd(), 'index.html'),
        concept: resolve(process.cwd(), 'concept.html'),
        conceptReview: resolve(process.cwd(), 'concept-review.html'),
        review: resolve(process.cwd(), 'review.html'),
        login: resolve(process.cwd(), 'login.html'),
        team: resolve(process.cwd(), 'team.html')
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react/jsx-runtime']
        }
      }
    }
  }
});
