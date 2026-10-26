import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    // Prototipo de una página con carga eager: permitir el chunk mayor resultante.
    chunkSizeWarningLimit: 1201,
    rollupOptions: {
      external: id => id.includes('app-background.png'),
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom']
        }
      }
    }
  }
});
