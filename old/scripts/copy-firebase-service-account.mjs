#!/usr/bin/env node
/**
 * Copia o JSON da conta de serviço Firebase para config/firebase-service-account.json
 *
 * Uso:
 *   node scripts/copy-firebase-service-account.mjs "C:\Users\...\Downloads\studio-....json"
 */
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dest = resolve(root, "config/firebase-service-account.json");
const src = process.argv[2]?.trim();

if (!src) {
  console.error(
    "Uso: node scripts/copy-firebase-service-account.mjs \"C:\\caminho\\para\\chave.json\"",
  );
  process.exit(1);
}

const srcResolved = resolve(src);
if (!existsSync(srcResolved)) {
  console.error("Ficheiro de origem não encontrado:", srcResolved);
  process.exit(1);
}

mkdirSync(dirname(dest), { recursive: true });
copyFileSync(srcResolved, dest);
console.log("OK — copiado para:", dest);
console.log("Reinicie o servidor: npm run dev");
