import type { Marker } from './types';

// 🌍 Detecteer runtime (browser vs Node)
const isNode =
  typeof process !== 'undefined' &&
  process.release &&
  process.release.name === 'node';

// 📦 Hulpfunctie voor lokale markers (werkt overal)
async function loadLocalData(): Promise<Marker[]> {
  try {
    const module = await import('./data/markers.json', {
      assert: { type: 'json' }
    });
    return module.default;
  } catch (err) {
    
    return [];
  }
}

// -------------------------------------------------------------
// 📤 Hoofdfunctie: markers ophalen uit Sheet of lokaal
// -------------------------------------------------------------
export async function getMarkersFromApi(forceRefresh = false): Promise<Marker[]> {
  // 🧠 Alleen in Node de Google API laden
  if (isNode) {
    const dotenv = await import('dotenv');
    dotenv.config();

    // 👇 Belangrijk: import googleapis pas hier binnen!
    const { google } = await import('googleapis');

    const SHEET_ID = process.env.PRIVATE_SHEET_ID;
    const CLIENT_EMAIL = process.env.PRIVATE_GOOGLE_CLIENT_EMAIL;
    const PRIVATE_KEY = process.env.PRIVATE_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!SHEET_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
      throw new Error('❌ Google service credentials ontbreken in .env');
    }

    

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: CLIENT_EMAIL,
        private_key: PRIVATE_KEY
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Data!A:Z'
    });

    const rows = res.data.values;
    if (!rows || rows.length < 2) {
      
      return [];
    }

    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const data = rows.slice(1);

    const markers: Marker[] = data.map((r) => {
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => (row[h] = (r[idx] || '').trim()));

      let youtubeId = row['youtube'] || '';
      youtubeId = youtubeId.includes('v=')
        ? new URL(youtubeId).searchParams.get('v') || ''
        : youtubeId.replace(/.*youtu\.be\//, '');

      return {
        place: row['plaats'] || row['place'] || '',
        lon: parseFloat(row['lon']),
        lat: parseFloat(row['lat']),
        song: row['lied'] || row['song'] || '',
        artist: row['artiest'] || row['artist'] || '',
        description: row['omschrijving'] || row['description'] || '',
        youtubeId,
        wikiUrl: row['wikiplaats'] || row['wiki'] || '',
        artistUrl: row['artiestlink'] || row['artistlink'] || '',
        componist: row['liedcomponist'] || '',
        componistUrl: row['componistinfo'] || '',
        tekstschrijver: row['liedtekstschrijver'] || '',
        tekstschrijverUrl: row['tekstschrijverinfo'] || ''
      };
    });

    const valid = markers.filter((m) => m.place && !isNaN(m.lon) && !isNaN(m.lat));
    
    return valid;
  }

  // 🌐 In browser → API endpoint gebruiken
  try {
    
    const res = await fetch('/api/sheet');
    if (!res.ok) throw new Error(`Sheet API-fout: ${res.status}`);

    const rows: string[][] = await res.json();
    if (!rows || rows.length < 2) return [];

    const headers = rows[0].map((h) => h.trim().toLowerCase());
    const data = rows.slice(1);

    const markers: Marker[] = data.map((r) => {
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => (row[h] = (r[idx] || '').trim()));

      let youtubeId = row['youtube'] || '';
      youtubeId = youtubeId.includes('v=')
        ? new URL(youtubeId).searchParams.get('v') || ''
        : youtubeId.replace(/.*youtu\.be\//, '');

      return {
        place: row['plaats'] || row['place'] || '',
        lon: parseFloat(row['lon']),
        lat: parseFloat(row['lat']),
        song: row['lied'] || row['song'] || '',
        artist: row['artiest'] || row['artist'] || '',
        description: row['omschrijving'] || row['description'] || '',
        youtubeId,
        wikiUrl: row['wikiplaats'] || row['wiki'] || '',
        artistUrl: row['artiestlink'] || row['artistlink'] || '',
        componist: row['liedcomponist'] || '',
        componistUrl: row['componistinfo'] || '',
        tekstschrijver: row['liedtekstschrijver'] || '',
        tekstschrijverUrl: row['tekstschrijverinfo'] || ''
      };
    });

    return markers;
  } catch (err) {
    
    return await loadLocalData();
  }
}
