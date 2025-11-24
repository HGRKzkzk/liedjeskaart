<?php
// ============================================================================
//  markers-update.php
//  PHP vervanger voor Node/SvelteKit loader
//  - Haalt Google Sheet op als CSV
//  - Normaliseert data (zoals je JS-code)
//  - Maakt markers.json op de server
// ============================================================================

// ---------------------------
// CONFIG
// ---------------------------

// 1) URL van jouw Google Sheet → CSV export link
//    (voorbeeld: https://docs.google.com/spreadsheets/d/.../export?format=csv)
$sheetUrl = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTIVV69vc79CUAiYa-sisJBCaWIbQ4nk_ORNl2PpcSsgKFVTIBun-ylpsZBUWU7inPiT8NLZDkVebKL/pub?gid=0&single=true&output=csv";

// 2) Locatie van markers.json
$targetFile = __DIR__ . "/../data/markers.json";

// ---------------------------
// HELPERS
// ---------------------------

function extractYoutubeId($url) {
    if (!$url) return null;

    // dezelfde regex als in JS-versie
    if (preg_match('/(?:v=|youtu\.be\/)([^&]+)/', $url, $m)) {
        return $m[1];
    }
    return null;
}

function normalizeMarkers($rows) {
    $normalized = [];

    foreach ($rows as $row) {

        // Trim alle keys
        $m = [];
        foreach ($row as $k => $v) {
            $cleanKey = trim($k);
            $m[$cleanKey] = trim($v);
        }

        $normalized[] = [
            "place"            => $m["Plaats"] ?? ($m["Plaats "] ?? ""),
            "song"             => $m["Lied"] ?? "",
            "artist"           => $m["Artiest"] ?? ($m["Artiest "] ?? ""),
            "artistUrl"        => $m["ArtiestLink"] ?? null,
            "wikiUrl"          => $m["WikiPlaats"] ?? null,

            "lat"              => isset($m["Lat"]) ? floatval($m["Lat"]) : null,
            "lon"              => isset($m["Lon"]) ? floatval($m["Lon"]) : null,

            "youtubeId"        => extractYoutubeId($m["Youtube"] ?? null),

            "componist"        => $m["LiedComponist"] ?? null,
            "componistUrl"     => $m["ComponistInfo"] ?? null,

            "tekstschrijver"   => $m["LiedTekstschrijver"] ?? null,
            "tekstschrijverUrl"=> $m["TekstschrijverInfo"] ?? null
        ];
    }

    return $normalized;
}


// ---------------------------
// 1) Haal CSV binnen
// ---------------------------

$csvRaw = @file_get_contents($sheetUrl);

if (!$csvRaw) {
    http_response_code(500);
    exit("❌ Kan de Google Sheet niet ophalen.");
}

// ---------------------------
// 2) Parse CSV naar array
// ---------------------------

$rows = [];
$lines = explode("\n", $csvRaw);
$headers = [];

foreach ($lines as $index => $line) {
    $line = trim($line);
    if ($line === "") continue;

    $cols = str_getcsv($line);

    if ($index === 0) {
        // Header row
        $headers = $cols;
    } else {
        // Data row
        $row = [];
        foreach ($cols as $i => $val) {
            $key = $headers[$i] ?? "col$i";
            $row[$key] = $val;
        }
        $rows[] = $row;
    }
}

// ---------------------------
// 3) Normaliseren
// ---------------------------

$markers = normalizeMarkers($rows);

// ---------------------------
// 4) JSON wegschrijven
// ---------------------------

$json = json_encode($markers, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

if (!file_put_contents($targetFile, $json)) {
    http_response_code(500);
    exit("❌ markers.json kon niet worden weggeschreven.");
}

echo "✔️ markers.json succesvol geüpdatet — " . count($markers) . " records.\n";

?>
