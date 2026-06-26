/**
 * Verificação completa de coordenadas: conversões + auditoria estática.
 * Uso: npm run coordinates:check
 */
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const require = createRequire(import.meta.url);
const tsxCli = require.resolve("tsx/cli");

function runTsxScript(relativePath) {
  const scriptPath = path.join(root, relativePath);
  const result = spawnSync(process.execPath, [tsxCli, scriptPath], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("\n=== coordinates:verify ===\n");
runTsxScript("scripts/coordinates-verify.ts");

console.log("\n=== coordinates:audit ===\n");
runTsxScript("scripts/coordinates-audit.ts");

console.log("\n[coordinates:check] OK — verify + audit passaram.\n");
