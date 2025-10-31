import type { Marker } from '$lib/types';

/**
 * Haalt markerdata op uit Google Sheets via /api/sheet.
 * - Herkent en verwijdert lege eerste kolom
 * - Ondersteunt Nederlandse en Engelse kolomnamen
 * - Cachet resultaten in sessionStorage
 */
export async function getMarkersFromApi(forceRefresh = false): Promise<Marker[]> {
  const CACHE_KEY = 'nl_liedjes_markers_v7';

  // 1️⃣ Cache check
  if (!forceRefresh && typeof sessionStorage !== 'undefined') {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        if (Array.isArray(data) && data.length > 0) {
          console.log('📦 Loaded markers from cache');
          return data;
        }
      } catch {
        /* ignore */
      }
    }
  }

  console.log('🌐 Fetching markers from /api/sheet...');
  const res = await fetch('/api/sheet');
  if (!res.ok) throw new Error(`Sheet API-fout: ${res.status}`);

  let rows: string[][] = await res.json();
  if (!rows || rows.length < 2) {
    console.warn('⚠️ Geen data ontvangen van de Sheet.');
    return [];
  }

  // ✅ Controleer en verwijder lege eerste kolom als die voorkomt
  if (rows[0].length > 0 && rows[0][0].trim() === '') {
    console.warn('⚠️ Eerste kolom is leeg — verwijderen bij alle rijen...');
    rows = rows.map((r) => r.slice(1)); // verwijder eerste kolom bij alle rijen
  }

  // 2️⃣ Headers normaliseren
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  console.log('🧾 Headers gevonden:', headers);

  const data = rows.slice(1);

  // 3️⃣ Rijen omzetten naar Marker-objecten
  const markers: Marker[] = data.map((r, i) => {
    console.log(`📄 Rij ${i + 2} ruwe data:`, r);

    // Maak een mapping van kolomnaam → waarde
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (r[idx] || '').trim();
    });

    // 🎬 YouTube ID extraheren
    let youtubeId = row['youtube'] || '';
    youtubeId = youtubeId.includes('v=')
      ? new URL(youtubeId).searchParams.get('v') || ''
      : youtubeId.replace(/.*youtu\.be\//, '');

    const marker: Marker = {
      place: row['plaats'] || row['place'] || '',
      lon: parseFloat(row['lon']),
      lat: parseFloat(row['lat']),
      song: row['lied'] || row['song'] || '',
      artist: row['artiest'] || row['artist'] || '',
      description: row['omschrijving'] || row['description'] || '',
      youtubeId
    };

    console.log(`✅ Rij ${i + 2} geconverteerd:`, marker);
    return marker;
  });

  // 4️⃣ Filter geldige markers
  const validMarkers = markers.filter(
    (m) => m.place && !isNaN(m.lon) && !isNaN(m.lat)
  );

  console.log(`✅ ${validMarkers.length} geldige markers geladen`);

  // 5️⃣ Cache geldig resultaat
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(validMarkers));
  }

  return validMarkers;
}
