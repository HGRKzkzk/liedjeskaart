import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],

  // voorkomt dat node-fetch gebundeld wordt (dit is essentieel)
  optimizeDeps: {
    exclude: ['googleapis', 'node-fetch']
  },

  ssr: {
    // hiermee voorkomt SSR dat node-fetch wil bundelen in static builds
    noExternal: ['googleapis', 'node-fetch']
  }
});