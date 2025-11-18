// scripts/prerender-copy.js
import fs from "fs";
import path from "path";

const jsonPath = "./static/data/markers.json";

// 1️⃣ markers.json controleren
if (!fs.existsSync(jsonPath)) {
  console.error("❌ markers.json niet gevonden");
  process.exit(1);
}
const markers = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

// 2️⃣ index.html zoeken
const possibleBases = ["./build/liedjeskaart", "./build"];
let baseDir = null;
for (const dir of possibleBases) {
  if (fs.existsSync(path.join(dir, "index.html"))) {
    baseDir = dir;
    break;
  }
}
if (!baseDir) {
  console.error("❌ index.html niet gevonden in build/ of build/liedjeskaart/");
  process.exit(1);
}

const indexFile = path.join(baseDir, "index.html");
console.log(`📂 Geselecteerde baseDir: ${baseDir}`);

// 3️⃣ mappen aanmaken
let created = 0;
for (const { place } of markers) {
  if (!place) continue;
  const safeName = encodeURIComponent(place.trim());
  const dir = path.join(baseDir, safeName);
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(indexFile, path.join(dir, "index.html"));
  created++;
}

console.log(`✅ ${created} mappen aangemaakt in ${baseDir}`);
