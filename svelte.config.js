import adapter from '@sveltejs/adapter-static';
import autoAdapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const dev = process.argv.includes('dev');
const isStatic = process.env.STATIC === 'true';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: isStatic
      ? adapter({
          fallback: 'index.html', // SPA gedrag
        })
      : autoAdapter(),

    alias: {
      $lib: './src/lib',
    },

    paths: {
      base: dev ? '' : '/liedjeskaart', // 👈 essentieel voor deploy
    },

    prerender: {
      handleHttpError: 'warn',
    },
  },
};
