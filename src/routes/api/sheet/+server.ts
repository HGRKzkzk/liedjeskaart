import { PRIVATE_GOOGLE_CLIENT_EMAIL, PRIVATE_GOOGLE_PRIVATE_KEY } from '$env/static/private';
import { google } from 'googleapis';
import { json } from '@sveltejs/kit';

const spreadsheetId = '1e2dCSiN60mImzLLPH4AGL1qWrgg6gKcsGmZ4-4UDj8s';
const sheetName = 'Data';

export async function GET() {
  try {
    // 1️⃣ Authenticatie
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: PRIVATE_GOOGLE_CLIENT_EMAIL,
        private_key: PRIVATE_GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // 2️⃣ Sheet uitlezen (alle kolommen tot Z)
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetName}!A:Z`,
    });

    // 3️⃣ Fallback als sheet leeg is
    if (!res.data.values || res.data.values.length === 0) {
      console.warn('⚠️ Geen data gevonden in de sheet.');
      return json([]);
    }

    console.log(`✅ ${res.data.values.length - 1} rijen opgehaald uit Google Sheet`);
    return json(res.data.values);
  } catch (err: any) {
    console.error('❌ Fout bij ophalen van Google Sheet:', err.message || err);
    return json({ error: err.message || 'Interne serverfout bij het ophalen van de sheet' }, { status: 500 });
  }
}
