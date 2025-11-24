import type { Marker } from '$lib/types';
import { base } from '$app/paths';

function extractYoutubeId(url: string | null) {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/)([^&]+)/);
  return match ? match[1] : null;
}

function normalize(raw: any[]): Marker[] {
  return raw.map((row) => {
    const m: Record<string, any> = {};

    // trim alle keys én alle string values
    for (const key of Object.keys(row)) {
      const cleanKey = key.trim();
      const value = row[key];
      m[cleanKey] = typeof value === 'string' ? value.trim() : value;
    }

    return {
      place: m.Plaats || '',
      song: m.Lied || '',
      artist: m.Artiest || '',
      artistUrl: m.ArtiestLink || null,
      wikiUrl: m.WikiPlaats || null,

      lat: m.Lat ? parseFloat(m.Lat) : null,
      lon: m.Lon ? parseFloat(m.Lon) : null,

      youtubeId: extractYoutubeId(m.Youtube || null),

      componist: m.LiedComponist || null,
      componistUrl: m.ComponistInfo || null,

      tekstschrijver: m.LiedTekstschrijver || null,
      tekstschrijverUrl: m.TekstschrijverInfo || null
    };
  });
}

export async function loadMarkers(): Promise<Marker[]> {
  try {
    const res = await fetch('/api/markers');

    // Werkt in dev + bij Node hosting
    if (res.ok) {
      const data = await res.json();
      return normalize(data);
    }
  } catch (err) {
    // API bestaat niet → static mode
    console.warn('API niet beschikbaar → fallback naar static/data/markers.json');
  }

  // STATIC BUILD FALLBACK → HIER GING HET MIS
  const res2 = await fetch(`${base}/data/markers.json`);
  const raw = await res2.json();
  return normalize(raw);
}
