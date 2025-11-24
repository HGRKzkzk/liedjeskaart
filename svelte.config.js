import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const dev = process.env.NODE_ENV === 'development';

export default {
  preprocess: vitePreprocess(),

  kit: {
    adapter: adapter({
      fallback: 'index.html'
    }),

    paths: {
      base: dev ? '' : '/liedjeskaart'
    },

    // ✔ SvelteKit 2 correcte manier om prerender uit te zetten
    prerender: {
      entries: [],          // niets prerenderen
      crawl: false,         // niet crawlen
      handleHttpError: 'ignore',   // voorkom build errors
      handleMissingId: 'ignore',
      handleUnseenRoutes: 'ignore'
    }
  }
};
