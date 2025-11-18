import type { Marker } from '$lib/types';

/**
 * Centrale loader voor markers:
 * - Probeer eerst /api/markers (dev + Node-hosting)
 * - Als dat faalt → val terug op /data/markers.json (static)
 */
export async function loadMarkers(): Promise<Marker[]> {
  // 1️⃣ Probeer server-API (dev / Node hosting)
  try {
    const res = await fetch('/api/markers', { method: 'GET' });

    if (res.ok) {
      const data = await res.json();

      // We verwachten een lijst van markers
      if (Array.isArray(data)) {
        return data as Marker[];
      }
    }
  } catch {
    // Negeer fouten – we vallen gewoon terug op static JSON
  }

  // 2️⃣ Fallback: static JSON uit /data/markers.json (werkt altijd op static hosting)
  const resStatic = await fetch('/data/markers.json');

  if (!resStatic.ok) {
    throw new Error('Kon /data/markers.json niet laden');
  }

  const json = await resStatic.json();
  return (Array.isArray(json) ? json : []) as Marker[];
}
