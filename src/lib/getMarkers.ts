// src/lib/getMarkers.ts
import { getMarkersFromApi } from '$lib/sheetClient';
import { dev } from '$app/environment';
let localData: any = [];

try {
  localData = (await import('$lib/data/markers.json')).default;
} catch (e) {
  
  localData = [];
}

export async function getMarkers() {
  const useLocal =
    !dev && (process.env.VITE_USE_LOCAL === 'true' || import.meta.env.VITE_USE_LOCAL === 'true');

  

  if (useLocal) {
    
    return localData;
  }

  
  try {
    return await getMarkersFromApi();
  } catch (err) {
    
    return localData;
  }
}
