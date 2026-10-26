import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    modulePreload: { polyfill: false },
    // Prototipo de una página con carga eager: permitir el chunk mayor resultante.
    chunkSizeWarningLimit: 1198,
    rollupOptions: {
      external: id => id.includes('app-background.png'),
      input: {
        index: resolve(process.cwd(), 'index.html'),
        login: resolve(process.cwd(), 'login.html')
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom']
        }
      }
    }
  }
});
