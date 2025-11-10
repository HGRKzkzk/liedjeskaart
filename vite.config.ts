import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],

  optimizeDeps: {
    exclude: ['googleapis', 'node-fetch'] // 🚫 niet pre-bunden voor browser
  },

  ssr: {
    external: ['googleapis'], // ✅ laat Node zelf deze CommonJS-module importeren
    noExternal: []            // (zorg dat hij niet als ESM wordt gedwongen)
  },

  build: {
    rollupOptions: {
      external: [
        'googleapis',
        'node-fetch',
        'stream',
        'util',
        'buffer'
      ]
    }
  }
});
