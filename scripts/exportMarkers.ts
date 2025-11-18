// scripts/exportMarkers.js
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 🧩 Fix voor __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🧭 Importeer sheetClient zonder $lib-alias
import { getMarkersFromApi } from '../src/lib/server/sheetClient.ts';

async function exportMarkers() {
  console.log('📥 Ophalen van data uit Google Sheet...');

  try {
    const markers = await getMarkersFromApi(true);

    // ✅ Pad naar outputbestand
    const outPath = path.resolve(__dirname, '../static/data/markers.json');

    // ✍️ Bestand schrijven
    fs.writeFileSync(outPath, JSON.stringify(markers, null, 2), 'utf-8');

    console.log(`✅ ${markers.length} markers opgeslagen naar ${outPath}`);
    console.log(`🕓 ${new Date().toLocaleString('nl-NL')}`);
  } catch (err) {
    console.error('❌ Fout bij exporteren van markers:', err);
  }
}

exportMarkers();
