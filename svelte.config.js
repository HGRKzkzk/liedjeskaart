import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const mode = process.env.BUILD_MODE || 'spa';
const isStatic = mode === 'static';

export default {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      fallback: mode === 'spa' ? 'index.html' : undefined,
      strict: false
    }),

    paths: {
      base: isStatic ? '/liedjeskaart' : ''
    },

    prerender: {
      entries: ['*'],
      handleHttpError: 'warn'
    }
  }
};
 