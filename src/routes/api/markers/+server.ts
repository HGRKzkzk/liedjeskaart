import { json } from '@sveltejs/kit';
import fs from 'fs';
import path from 'path';

// ------------------------------
// Helpers
// ------------------------------
function loadMarkersFile() {
  const filePath = path.resolve('static/data/markers.json');

  if (!fs.existsSync(filePath)) {
    console.warn('⚠️ static/data/markers.json ontbreekt');
    return [];
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('❌ markers.json is geen geldige JSON:', e);
    return [];
  }
}

function extractYoutubeId(url: string | null) {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/)([^&]+)/);
  return match ? match[1] : null;
}

function normalizeMarkers(data: any[]) {
  return data.map((raw) => {
    // trim alle keys
    const m: Record<string, any> = {};
    for (const key of Object.keys(raw)) {
      m[key.trim()] = raw[key];
    }

    return {
      ...m,

      place: (m.Plaats || m['Plaats '] || '').trim(),
      song: (m.Lied || '').trim(),
      artist: (m.Artiest || m['Artiest '] || '').trim(),
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

// ------------------------------
// GET handler
// ------------------------------
export async function GET() {
  try {
    // 1) Probeer Google Sheets (alleen als sheetClient bestaat)
    try {
      const sheetModule = await import('$lib/server/sheetClient');
      const live = await sheetModule.getMarkersFromApi(false);
      return json(normalizeMarkers(live), {
        headers: {
          'Cache-Control': 'public, max-age=300' // 5 min cache
        }
      });
    } catch (err) {
      console.warn('⚠️ Live API mislukt → fallback markers.json');
    }

    // 2) Altijd fallback naar local file
    const fileData = loadMarkersFile();
    const normalized = normalizeMarkers(fileData);

    return json(normalized, {
      headers: {
        'Cache-Control': 'public, max-age=86400' // 1 dag
      }
    });

  } catch (err) {
    console.error('❌ /api/markers: fatale fout:', err);
    return json({ error: 'Marker load failed' }, { status: 500 });
  }
}
