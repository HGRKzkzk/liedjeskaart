import { exec } from "child_process";
import os from "os";
import qrcode from "qrcode-terminal";

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

const ip = getLocalIP();
const port = 5173; // pas dit aan als je een andere dev-poort gebruikt
const url = `http://${ip}:${port}/`;

console.log(`\n🚀 Je kunt je app openen op:\n`);
console.log(`   👉  ${url}\n`);
console.log("📱 Scan deze QR-code om direct op je telefoon te testen:\n");

qrcode.generate(url, { small: true });

// Start de SvelteKit dev-server
const child = exec(`npm run dev -- --host`, { stdio: "inherit" });

child.stdout?.pipe(process.stdout);
child.stderr?.pipe(process.stderr);
