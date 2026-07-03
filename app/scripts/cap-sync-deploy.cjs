/**
 * Lê a URL de produção de capacitor/deployment-url e corre `cap sync`
 * com CAPACITOR_SERVER_URL definida (WebView remoto).
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const root = path.join(__dirname, "..");
const urlFile = path.join(root, "capacitor", "deployment-url");

if (!fs.existsSync(urlFile)) {
  console.error(
    "Ficheiro em falta: capacitor/deployment-url\n" +
      "Copie capacitor/deployment-url.example para capacitor/deployment-url " +
      "e coloque uma linha com o URL HTTPS público da app (sem barra final).",
  );
  process.exit(1);
}

const raw = fs.readFileSync(urlFile, "utf8").trim();
const firstLine = raw.split(/\r?\n/).find((l) => l.trim() && !l.trim().startsWith("#"));
if (!firstLine) {
  console.error("capacitor/deployment-url está vazio ou só tem comentários.");
  process.exit(1);
}

const url = firstLine.trim().replace(/\uFEFF/g, "").replace(/\/$/, "");
if (!/^https:\/\//i.test(url)) {
  console.error("O URL em capacitor/deployment-url deve começar por https://");
  process.exit(1);
}

const result = spawnSync("npx", ["cap", "sync"], {
  stdio: "inherit",
  cwd: root,
  shell: true,
  env: { ...process.env, CAPACITOR_SERVER_URL: url },
});

if (result.error) {
  console.error(result.error);
  process.exit(1);
}
process.exit(result.status === null || result.status === undefined ? 1 : result.status);
