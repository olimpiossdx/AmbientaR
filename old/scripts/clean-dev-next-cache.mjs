/**
 * Limpa cache Next.js de dev após `npm run build` (evita MODULE_NOT_FOUND em vendor-chunks).
 * Uso: npm run dev:clean-cache
 */
import { rmSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

for (const rel of [".next/server", ".next/cache"]) {
  const full = path.join(root, rel);
  if (existsSync(full)) {
    rmSync(full, { recursive: true, force: true });
    console.log(`[dev:clean-cache] removido ${rel}`);
  }
}

console.log("[dev:clean-cache] OK — reinicie com npm run dev");
