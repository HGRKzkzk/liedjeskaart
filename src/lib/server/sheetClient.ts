// --- sheetClient.ts ---
// Eén versie die werkt in SvelteKit én Node scripts, met Google Service Account.
// Gebruikt PRIVATE_GOOGLE_CLIENT_EMAIL, PRIVATE_GOOGLE_PRIVATE_KEY, PRIVATE_SHEET_ID.

// 1. Dotenv in Node (SvelteKit negeert dit vanzelf)
if (typeof process !== "undefined" && process?.versions?.node) {
  try {
    await import("dotenv/config");
  } catch {}
}

// 2. Env loader (SvelteKit → $env, Node → process.env)
async function getEnv(name: string): Promise<string | undefined> {
  try {
    const kitEnv = await import("$env/static/private");
    // @ts-ignore Dynamo lookup
    return kitEnv[name];
  } catch {
    return process.env[name];
  }
}

// 3. Vars ophalen
const CLIENT_EMAIL = await getEnv("PRIVATE_GOOGLE_CLIENT_EMAIL");
let PRIVATE_KEY = await getEnv("PRIVATE_GOOGLE_PRIVATE_KEY");

// Fix: Google private key uit .env bevat '\n', maar Node heeft echte nieuwe regels nodig
if (PRIVATE_KEY) {
  PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, "\n");
}

const SHEET_ID     = await getEnv("PRIVATE_SHEET_ID");

if (!CLIENT_EMAIL || !PRIVATE_KEY || !SHEET_ID) {
  throw new Error("Missing PRIVATE_GOOGLE_CLIENT_EMAIL, PRIVATE_GOOGLE_PRIVATE_KEY or PRIVATE_SHEET_ID");
}

// 4. Access token genereren via Google OAuth2 (JWT flow)
async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);

  const header = {
    alg: "RS256",
    typ: "JWT"
  };

  const claimSet = {
    iss: CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now
  };

  // Base64 helper (Node + browser compatibel)
  const encode = (obj: any) => Buffer.from(JSON.stringify(obj)).toString("base64url");

  const unsigned = `${encode(header)}.${encode(claimSet)}`;

  // Signeren met private key
  const crypto = await import("crypto");
  const signature = crypto.createSign("RSA-SHA256")
    .update(unsigned)
    .end()
    .sign(PRIVATE_KEY, "base64url");

  const jwt = `${unsigned}.${signature}`;

  // Exchange JWT → access token
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error("Failed to obtain access token: " + text);
  }

  const data = await res.json();
  return data.access_token;
}


// 5. MARKERS OPHALEN VIA SHEETS API
export async function getMarkersFromApi(log = false) {
  const token = await getAccessToken();

  const url =
    `https://sheets.googleapis.com/v4/spreadsheets/` +
    `${SHEET_ID}/values/Data!A:Z`;

  if (log) console.log("🌐 Fetching Google Sheet:", url);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error(`❌ Sheet fetch failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const rows = data.values ?? [];

  if (rows.length === 0) return [];

  const headers = rows.shift();
  if (!headers) return [];

  return rows.map((row: string[]) => {
    const obj: Record<string, string | null> = {};
    headers.forEach((h: string, i: number) => {
      obj[h] = row[i] ?? null;
    });
    return obj;
  });
}
