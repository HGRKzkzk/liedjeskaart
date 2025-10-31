import { PRIVATE_GOOGLE_CLIENT_EMAIL, PRIVATE_GOOGLE_PRIVATE_KEY } from '$env/static/private';
import { google } from 'googleapis';
import { json } from '@sveltejs/kit';

const spreadsheetId = '1e2dCSiN60mImzLLPH4AGL1qWrgg6gKcsGmZ4-4UDj8s';
const sheetName = 'Data';

export async function GET() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: PRIVATE_GOOGLE_CLIENT_EMAIL,
      private_key: PRIVATE_GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${sheetName}!A:D`
  });

  return json(res.data.values || []);
}
