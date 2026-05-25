/**
 * Limpa cache de dev quebrada e artefactos PWA em public/ (de `npm run build`).
 * O sw.js antigo intercepta /_next/static/* e causa 404 em main-app.js, layout.js, etc.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const nextDir = path.join(root, ".next");
const publicDir = path.join(root, "public");

if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log("[clean-next-dev] Pasta .next removida.");
} else {
  console.log("[clean-next-dev] .next inexistente.");
}

if (fs.existsSync(publicDir)) {
  const stalePwa = fs
    .readdirSync(publicDir)
    .filter(
      (name) =>
        name === "sw.js" ||
        name.startsWith("workbox-") ||
        name.startsWith("fallback-"),
    );
  for (const name of stalePwa) {
    fs.unlinkSync(path.join(publicDir, name));
    console.log(`[clean-next-dev] Removido public/${name}`);
  }
}
