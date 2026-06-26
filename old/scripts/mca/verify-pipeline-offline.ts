/**
 * Atalho E05–E11 — delega para verify-all-etapas (pipeline offline).
 * Uso legado: npm run mca:verify-pipeline-offline
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const script = path.join(process.cwd(), "scripts/mca/verify-all-etapas.ts");
const r = spawnSync("npx", ["tsx", script], { stdio: "inherit", shell: true });
process.exit(r.status ?? 1);
