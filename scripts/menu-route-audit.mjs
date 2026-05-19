import { readdirSync, statSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";

const appRoot = path.join("src", "app", "(app)");
const navConfig = readFileSync(path.join("src", "lib", "navigation-config.ts"), "utf8");
const hrefs = [...navConfig.matchAll(/href:\s*"([^"]+)"/g)]
  .map((m) => m[1])
  .filter((href) => href.startsWith("/") && !href.startsWith("/external"));

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
  if (hrefs.includes(route)) return true;
  return hrefs.some((href) => route === href || route.startsWith(`${href}/`));
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
