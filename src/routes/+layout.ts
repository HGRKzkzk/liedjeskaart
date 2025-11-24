export const ssr = false;
export const prerender = false;
export const csr = true;
export const trailingSlash = 'ignore';

import { base } from '$app/paths';

export const load = async ({ fetch }) => {
  try {
    const res = await fetch(`${base}/data/markers.json`);
    const markers = await res.json();

    return { markerCount: markers.length };
  } 
  catch (err) {
    console.error('❌ markers.json kon niet worden geladen', err);
    return { markerCount: 0 };
  }
};