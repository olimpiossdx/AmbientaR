/**
 * Limpa cache de dev quebrada e artefactos PWA em public/ (de `npm run build`).
 * O sw.js antigo intercepta /_next/static/* e causa 404 em main-app.js, layout.js, etc.
 */
import { execSync } from "node:child_process";
import fs from "fs";
import path from "path";
import { setTimeout as sleep } from "node:timers/promises";
import { fileURLToPath } from "url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const nextDir = path.join(root, ".next");
const publicDir = path.join(root, "public");
const DEV_PORT = 9002;

function killDevPort(port = DEV_PORT) {
  if (process.platform !== "win32") return;
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, {
      encoding: "utf8",
    });
    const pids = new Set();
    for (const line of out.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed.includes("LISTENING")) continue;
      const pid = trimmed.split(/\s+/).pop();
      if (pid && /^\d+$/.test(pid)) pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
        console.log(`[clean-next-dev] Processo ${pid} na porta ${port} encerrado.`);
      } catch {
        /* já encerrado */
      }
    }
  } catch {
    /* nenhum processo na porta */
  }
}

killDevPort();

/** Windows: handles ainda abertos após taskkill — rmSync falha com ENOTEMPTY. */
async function removeNextDir() {
  if (!fs.existsSync(nextDir)) {
    console.log("[clean-next-dev] .next inexistente.");
    return;
  }
  if (process.platform === "win32") {
    await sleep(2500);
  }
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      fs.rmSync(nextDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 500 });
      console.log("[clean-next-dev] Pasta .next removida.");
      return;
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? err.code : "";
      if (code !== "ENOTEMPTY" && code !== "EBUSY" && code !== "EPERM") throw err;
      if (attempt === 5) throw err;
      console.warn(`[clean-next-dev] .next ocupada (tentativa ${attempt}/5), aguardando…`);
      await sleep(1500);
    }
  }
}

await removeNextDir();

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
