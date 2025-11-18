import { base } from '$app/paths';

export const prerender = true;
export const trailingSlash = 'always';
export const ssr = false;

export const load = async ({ fetch }) => {
  try {
    const res = await fetch(`${base}/data/markers.json`);
    const markers = await res.json();

    return {
      markerCount: markers.length
    };
  } catch (err) {
    console.error('❌ markers.json kon niet worden geladen in layout', err);
    return { markerCount: 0 };
  }
};
