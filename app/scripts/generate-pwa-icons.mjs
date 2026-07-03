/**
 * Gera PNG 192/512 em public/icons/ a partir de src/app/icon.svg (PWA + push).
 * Requer @napi-rs/canvas (dependência opcional de pdfjs-dist).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const svgPath = path.join(root, "src", "app", "icon.svg");
const outDir = path.join(root, "public", "icons");

async function main() {
  let createCanvas;
  let loadImage;
  try {
    ({ createCanvas, loadImage } = await import("@napi-rs/canvas"));
  } catch {
    console.warn("[generate-pwa-icons] @napi-rs/canvas indisponível; ícones PNG não atualizados.");
    process.exit(0);
  }

  if (!fs.existsSync(svgPath)) {
    console.warn("[generate-pwa-icons] icon.svg não encontrado.");
    process.exit(0);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const svg = fs.readFileSync(svgPath);

  for (const size of [192, 512]) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext("2d");
    const img = await loadImage(svg);
    ctx.drawImage(img, 0, 0, size, size);
    const out = path.join(outDir, `icon-${size}x${size}.png`);
    const png = await canvas.encode("png");
    fs.writeFileSync(out, png);
    console.log(`[generate-pwa-icons] OK → public/icons/icon-${size}x${size}.png`);
  }
}

main().catch((err) => {
  console.error("[generate-pwa-icons]", err);
  process.exit(1);
});
