/**
 * Verifica .env.local: chaves IA + ficheiro Firebase Admin.
 * Uso: npm run verify:env
 * Não imprime chaves completas.
 */

import { existsSync, readFileSync } from "fs";
import { resolve } from "path";
import { config } from "dotenv";

const root = resolve(process.cwd());
config({ path: resolve(root, ".env.local") });

function mask(value) {
  if (!value || value.length < 8) return value ? "(definida, curta)" : "(ausente)";
  return `${value.slice(0, 6)}…${value.slice(-4)} (${value.length} chars)`;
}

function ok(msg) {
  console.log(`  OK  ${msg}`);
}
function warn(msg) {
  console.log(`  AVISO  ${msg}`);
}
function fail(msg) {
  console.log(`  FALHA  ${msg}`);
}

async function testGemini(apiKey, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: 'Responda só: "ok"' }] }],
      generationConfig: { maxOutputTokens: 16, temperature: 0 },
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    let err = text.slice(0, 200);
    try {
      const j = JSON.parse(text);
      err = j.error?.message || err;
    } catch {
      /* ignore */
    }
    return { ok: false, detail: `HTTP ${res.status}: ${err}` };
  }
  return { ok: true, detail: "resposta recebida" };
}

async function testDeepseek(apiKey, model) {
  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: 'Responda só: ok' }],
      max_tokens: 16,
      temperature: 0,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    let err = text.slice(0, 200);
    try {
      const j = JSON.parse(text);
      err = j.error?.message || err;
    } catch {
      /* ignore */
    }
    return { ok: false, detail: `HTTP ${res.status}: ${err}` };
  }
  return { ok: true, detail: "resposta recebida" };
}

console.log("\n=== AmbientaR — verificação .env.local ===\n");

const geminiKey = process.env.GOOGLE_GENAI_API_KEY?.trim();
const deepseekKey = process.env.DEEPSEEK_API_KEY?.trim();
const geminiModel =
  process.env.GEMINI_LIGHT_MODEL?.trim() || "gemini-2.5-flash";
const deepseekModel =
  process.env.DEEPSEEK_HEAVY_MODEL?.trim() || "deepseek-v4-flash";
const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
const iaRouter = process.env.IA_ROUTER || "on";

console.log("Variáveis (mascaradas):");
console.log(`  GOOGLE_GENAI_API_KEY     ${mask(geminiKey)}`);
console.log(`  DEEPSEEK_API_KEY         ${mask(deepseekKey)}`);
console.log(`  GEMINI_LIGHT_MODEL       ${geminiModel}`);
console.log(`  DEEPSEEK_HEAVY_MODEL     ${deepseekModel}`);
console.log(`  IA_ROUTER                ${iaRouter}`);
console.log(`  GOOGLE_APPLICATION_CREDENTIALS  ${credPath || "(ausente)"}`);
console.log("");

if (credPath) {
  if (existsSync(credPath)) {
    try {
      const j = JSON.parse(readFileSync(credPath, "utf8"));
      if (j.project_id) ok(`Firebase Admin JSON encontrado (project: ${j.project_id})`);
      else warn("JSON existe mas sem project_id — verifique o ficheiro");
    } catch {
      fail("Ficheiro Firebase Admin não é JSON válido");
    }
  } else {
    fail(
      `Ficheiro Firebase Admin não existe: ${credPath}\n` +
        "       → Firebase Console → Contas de serviço → Gerar chave → copiar para config\\firebase-service-account.json",
    );
  }
} else {
  warn("GOOGLE_APPLICATION_CREDENTIALS não definido — Admin local limitado");
}

console.log("\nTestes de API (rede):");

if (geminiKey) {
  process.stdout.write(`  Gemini (${geminiModel})… `);
  const r = await testGemini(geminiKey, geminiModel);
  console.log(r.ok ? "OK" : r.detail);
} else {
  warn("Gemini: chave ausente — pulado");
}

if (deepseekKey) {
  process.stdout.write(`  DeepSeek (${deepseekModel})… `);
  const r = await testDeepseek(deepseekKey, deepseekModel);
  console.log(r.ok ? "OK" : r.detail);
} else {
  warn("DeepSeek: chave ausente — pulado");
}

console.log("\nNext.js em dev carrega o mesmo .env.local automaticamente.");
console.log("Após alterar o ficheiro: pare o servidor (Ctrl+C) e npm run dev\n");
console.log("App: http://localhost:9002\n");
