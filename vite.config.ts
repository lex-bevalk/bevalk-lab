import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { basename, resolve } from 'node:path';

const renderBlockingPages = new Set(['index.html', 'concept.html', 'review.html', 'concept-review.html']);

function blockAppRenderingUntilMount() {
  return {
    name: 'block-app-rendering-until-mount',
    apply: 'build' as const,
    transformIndexHtml: {
      order: 'post' as const,
      handler(html: string, context: { filename: string }) {
        if (!renderBlockingPages.has(basename(context.filename))) return html;
        return html.replace(/<script\b([^>]*)>/gi, (tag, attributes: string) => {
          if (!/\btype=["']module["']/i.test(attributes) || /\bblocking=["']render["']/i.test(attributes)) return tag;
          return `<script${attributes} blocking="render">`;
        });
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), blockAppRenderingUntilMount()],
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
