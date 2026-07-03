/**
 * Next.js `output: "standalone"` não inclui `public/` nem `.next/static` no bundle.
 * App Hosting / Cloud Run precisam desta cópia para servir manifest, SW, ícones, etc.
 * Ver: https://nextjs.org/docs/app/api-reference/next-config-js/output
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const distDir = process.env.NEXT_DIST_DIR || ".next";
const standaloneDir = path.join(root, distDir, "standalone");
const publicDir = path.join(root, "public");
const staticDir = path.join(root, distDir, "static");

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

if (!fs.existsSync(standaloneDir)) {
  console.log(
    `[copy-standalone-assets] Sem pasta ${distDir}/standalone — ignorado (dev ou build sem standalone).`,
  );
  process.exit(0);
}

copyRecursive(publicDir, path.join(standaloneDir, "public"));
copyRecursive(staticDir, path.join(standaloneDir, ".next", "static"));
console.log("[copy-standalone-assets] public/ e .next/static copiados para standalone.");
