import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMarkersFromApi } from '$lib/server/sheetClient';

export const GET: RequestHandler = async () => {
  try {
    // Haal markers uit Google Sheets
    const markers = await getMarkersFromApi(true);
    return json(markers);
  } catch (err) {
    console.error('❌ Fout bij laden markers uit Google Sheets:', err);
    // In dev/Node kun je hier later desnoods nog fallback naar een lokaal bestand doen
    return json({ error: 'Failed to load markers from Sheets' }, { status: 500 });
  }
};
