/**
 * Limpa cache de dev quebrada e artefactos PWA em public/ (de `npm run build`).
 * O sw.js antigo intercepta /_next/static/* e causa 404 em main-app.js, layout.js, etc.
 */
import { execSync } from "node:child_process";
import fs from "fs";
import path from "path";
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
