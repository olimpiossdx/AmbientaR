/**
 * Gera checklist de menus visíveis por role (Fase 3).
 * Uso: node scripts/menu-role-audit.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const ROLES = [
  "admin",
  "gestor",
  "supervisor",
  "technical",
  "sales",
  "financial",
  "client",
  "cliente_autonomo",
  "representative",
  "diretor_fauna",
  "advogado",
];

const ROLE_LABELS = {
  admin: "Administrador",
  gestor: "Gestor",
  supervisor: "Supervisor",
  technical: "Técnico",
  sales: "Vendas",
  financial: "Financeiro",
  client: "Cliente Gestão",
  cliente_autonomo: "Cliente Autônomo",
  representative: "Representante",
  diretor_fauna: "Diretor Fauna",
  advogado: "Advogado",
};

const DENIED_PREFIXES_CLIENTE_AUTONOMO = [
  "/ai-lab",
  "/studies",
  "/georeferenciamento",
  "/analise-ambiental",
  "/requests",
];

const navPath = path.join("src", "lib", "navigation-config.ts");
const raw = readFileSync(navPath, "utf8");

/** Extrai entradas com href + label + roles do ficheiro de menu. */
function parseNavEntries(content) {
  const entries = [];
  const blocks = content.split(/\n\s*\{/);
  for (const block of blocks) {
    const hrefMatch =
      block.match(/href:\s*"([^"]+)"/) ||
      block.match(/href:\s*MULTAS_DEFESAS_PATH/);
    if (!hrefMatch) continue;
    const href = hrefMatch[0].includes("MULTAS")
      ? "/multas-defesas"
      : hrefMatch[1];
    const labelMatch = block.match(/label:\s*"([^"]+)"/);
    const rolesMatch = block.match(/roles:\s*\[([\s\S]*?)\]/);
    const roles = rolesMatch
      ? [...rolesMatch[1].matchAll(/"([a-z_]+)"/g)].map((m) => m[1])
      : [];
    entries.push({
      href: href.split("?")[0].split("#")[0],
      label: labelMatch?.[1] ?? href,
      roles,
    });
  }
  return entries;
}

function canAccessNavItem(role, allowedRoles) {
  if (role === "admin") return true;
  if (!allowedRoles.length) return true;
  return allowedRoles.includes(role);
}

function isDeniedForAutonomo(role, href) {
  if (role !== "cliente_autonomo") return false;
  const base = href.split("?")[0];
  return DENIED_PREFIXES_CLIENTE_AUTONOMO.some(
    (p) => base === p || base.startsWith(`${p}/`),
  );
}

function normalizeHref(href) {
  if (href.startsWith("/external")) return "/external";
  return href;
}

const entries = parseNavEntries(raw);
const unique = new Map();
for (const e of entries) {
  const key = `${e.href}|${e.label}`;
  if (!unique.has(key)) unique.set(key, e);
}

const byRole = {};
for (const role of ROLES) {
  byRole[role] = [...unique.values()]
    .filter((e) => canAccessNavItem(role, e.roles))
    .filter((e) => !isDeniedForAutonomo(role, e.href))
    .map((e) => ({ ...e, href: normalizeHref(e.href) }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

const lines = [
  "# Checklist Fase 3 — Menus por perfil",
  "",
  `Gerado em: ${new Date().toISOString()}`,
  "",
  "Use com `npm run dev` (porta 9002), utilizador de teste por role, DevTools → Rede + Consola.",
  "",
  "## Critérios por item",
  "",
  "- [ ] Página abre sem erro vermelho no boundary",
  "- [ ] Rede: sem 4xx/5xx em `/api/*` (exceto 401 antes do login)",
  "- [ ] Consola: sem `permission-denied` repetido",
  "- [ ] PDF/imagem: se usar Storage, proxy `/api/branding/image` com sessão ativa",
  "",
  "## Perfis",
  "",
];

for (const role of ROLES) {
  const items = byRole[role];
  lines.push(`### ${ROLE_LABELS[role] || role} (\`${role}\`)`);
  lines.push("");
  lines.push(`Itens de menu visíveis: **${items.length}**`);
  lines.push("");
  if (items.length === 0) {
    lines.push("_Nenhum item no menu para este perfil._");
    lines.push("");
    continue;
  }
  lines.push("| Menu | Rota |");
  lines.push("|------|------|");
  for (const item of items) {
    lines.push(`| ${item.label} | \`${item.href}\` |`);
  }
  lines.push("");
  lines.push("<details>");
  lines.push("<summary>Checklist copiável</summary>");
  lines.push("");
  for (const item of items) {
    lines.push(`- [ ] ${item.label} — \`${item.href}\``);
  }
  lines.push("");
  lines.push("</details>");
  lines.push("");
}

lines.push("## Rotas legadas (redirect)");
lines.push("");
lines.push("| Rota | Destino |");
lines.push("|------|---------|");
lines.push("| `/autos-infracao-defesa` | `/multas-defesas` |");
lines.push("| `/environmental-company` | `/responsible-company` |");
lines.push("| `/monitoring` | `/monitoring/manual` |");
lines.push("| `/studies` | `/studies/educacao-ambiental` |");
lines.push("| `/studies/intervencao-ambiental` | `/studies/pia` |");
lines.push("| `/webmail` | `/external?…` |");
lines.push("");
lines.push("## APIs a observar na Rede");
lines.push("");
lines.push("| API | Quando |");
lines.push("|-----|--------|");
lines.push("| `/api/branding/image` | PDFs, laudos, vistorias (Bearer) |");
lines.push("| `/api/geospatial/analyze` | Licenciamento locacional |");
lines.push("| `/api/package/check` | Criar empreendimento / módulos portal |");
lines.push("| `/api/study-maps/*` | Mapas (Bearer) |");
lines.push("| `/api/laudos/gerar-docx` | Laudos |");
lines.push("");
lines.push("## Comandos úteis");
lines.push("");
lines.push("```bash");
lines.push("npm run audit:routes");
lines.push("npm run audit:menus-by-role");
lines.push("```");
lines.push("");

const out = path.join("docs", "auditoria-menus-fase3-checklist.md");
mkdirSync("docs", { recursive: true });
writeFileSync(out, lines.join("\n"));
console.log(`Checklist escrito em ${out}`);
for (const role of ROLES) {
  console.log(`  ${role}: ${byRole[role].length} itens`);
}
