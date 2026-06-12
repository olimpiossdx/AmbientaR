import { readdirSync, statSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";

const appRoot = path.join("src", "app", "(app)");
const libDir = path.join("src", "lib");

function extractHrefs(content) {
  return [...content.matchAll(/href:\s*["']([^"']+)["']/g)]
    .map((m) => m[1])
    .filter((href) => href.startsWith("/"));
}

const menuSources = [
  path.join(libDir, "navigation-config.ts"),
  ...readdirSync(libDir)
    .filter((name) => name.endsWith("-menu.ts"))
    .map((name) => path.join(libDir, name)),
];

const hrefs = menuSources.flatMap((file) =>
  extractHrefs(readFileSync(file, "utf8")),
);

// Rotas com query (?listagem=) geradas em pca-menu / rca-menu
hrefs.push("/studies/pca", "/studies/pca/new", "/studies/rca", "/studies/rca/new");
for (const code of ["A", "B", "C", "D", "E", "F", "G", "H"]) {
  hrefs.push(`/studies/pca/new?listagem=${code}`);
  hrefs.push(`/studies/rca/new?listagem=${code}`);
}

/** Aliases com redirect intencional (não aparecem como string literal no navigation-config). */
hrefs.push(
  "/multas-defesas",
  "/multas-defesas/nova",
  "/ai-lab",
  "/app-campo",
  "/autos-infracao-defesa",
  "/environmental-company",
  "/inventarios",
  "/inventarios/new",
  "/monitoring",
  "/proposals",
  "/proposals/new",
  "/studies",
  "/studies/intervencao-ambiental",
  "/studies/intervencao-ambiental/new",
  "/studies/relatorios-diversos/carvao-vegetal",
  "/studies/relatorios-diversos/ptrf-prad",
  "/studies/relatorios-diversos/transporte-residuos",
  "/webmail",
  "/knowledge-sources/new",
  "/crm/new",
);

function normalizeMenuHref(href) {
  if (href.startsWith("/external")) return "/external";
  const base = href.split("?")[0].split("#")[0];
  return base.endsWith("/") && base.length > 1 ? base.slice(0, -1) : base;
}

const menuBases = [...new Set(hrefs.map(normalizeMenuHref))];

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    if (st.isFile() && entry === "page.tsx") out.push(full);
  }
  return out;
}

function routeFromPage(file) {
  const rel = path.relative(appRoot, path.dirname(file)).replaceAll("\\", "/");
  if (rel === "") return "/";
  const segments = rel
    .split("/")
    .map((segment) => {
      if (/^\([^)]*\)$/.test(segment)) return "";
      if (segment.startsWith("(.)")) return segment.slice(3);
      if (segment.startsWith("(..)")) return segment.slice(4);
      return segment;
    })
    .filter(Boolean);
  return `/${segments.join("/")}`;
}

function normalize(route) {
  return route;
}

const pages = walk(appRoot)
  .map((file) => ({ file, route: normalize(routeFromPage(file)) }))
  .sort((a, b) => a.route.localeCompare(b.route));

function isDynamic(route) {
  return route.includes("[");
}

function routeCovered(route) {
  if (menuBases.includes(route)) return true;
  return menuBases.some((base) => route === base || route.startsWith(`${base}/`));
}

const active = pages.filter((p) => routeCovered(p.route));
const experimental = pages.filter((p) => !routeCovered(p.route) && isDynamic(p.route));
const orphan = pages.filter((p) => !routeCovered(p.route) && !isDynamic(p.route));

const section = (title, rows) => [
  `## ${title}`,
  "",
  `Total: ${rows.length}`,
  "",
  "| Rota | Arquivo |",
  "|------|---------|",
  ...rows.map((r) => `| \`${r.route}\` | \`${r.file.replaceAll("\\", "/")}\` |`),
  "",
].join("\n");

const markdown = [
  "# Auditoria de Rotas e Menu",
  "",
  `Gerado em: ${new Date().toISOString()}`,
  "",
  "Classificação inicial para limpeza cirúrgica. Rotas órfãs não devem ser removidas automaticamente; precisam de validação funcional antes.",
  "",
  section("Código ativo ou coberto por menu", active),
  section("Rotas dinâmicas sem entrada direta no menu", experimental),
  section("Rotas estáticas sem entrada direta no menu", orphan),
].join("\n");

mkdirSync("docs", { recursive: true });
writeFileSync(path.join("docs", "menu-route-audit.md"), markdown);
console.log(markdown);
console.log("\nRelatório escrito em docs/menu-route-audit.md");
