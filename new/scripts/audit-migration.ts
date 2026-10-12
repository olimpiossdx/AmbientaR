import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { parseFeatureCatalog, initialExecutionProgress } from '../src/modules/migration-plan/migration-plan-data';
import { assertImplementedFeaturesHaveConcreteRoutes, buildMigrationCoverage } from '../src/modules/migration-plan/migration-coverage';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const apiRoot = resolve(process.env.AMBIENTAR_API_PATH || resolve(root, '../../ambientaR-api'));
function files(directory: string): string[] {
 return readdirSync(directory, { withFileTypes: true }).flatMap((item) => {
  if (['node_modules', '.git', 'dist', '.next'].includes(item.name)) return [];
  const path = resolve(directory, item.name);
  return item.isDirectory() ? files(path) : [path];
 });
}
const sourceFiles = files(resolve(root, 'src')).filter((path) => /\.[jt]sx?$/.test(path));
const webFiles = files(resolve(root, '../web/src'));
const apiFiles = files(resolve(apiRoot, 'src')).filter((path) => path.endsWith('.ts') && !path.endsWith('.spec.ts'));
const routeSources = Object.fromEntries(sourceFiles.filter((path) => path.endsWith('.routes.tsx') || path.endsWith('/router.tsx')).map((path) => [relative(root, path), readFileSync(path, 'utf8')]));
const features = parseFeatureCatalog(readFileSync(resolve(root, 'docs/CATALOGO-MENUS-FUNCIONALIDADES-API.md'), 'utf8'));
const coverage = buildMigrationCoverage(readFileSync(resolve(root, 'docs/INVENTARIO-COMPLETO-TELAS-ROTAS.md'), 'utf8'), features, routeSources);
assertImplementedFeaturesHaveConcreteRoutes(features, initialExecutionProgress, coverage);

const endpoints: Array<{ method: string; path: string; source: string }> = [];
for (const path of apiFiles) {
 const source = readFileSync(path, 'utf8');
 const controller = source.match(/@Controller\(\s*['"]([^'"]*)['"]\s*\)/)?.[1];
 if (controller === undefined) continue;
 for (const match of source.matchAll(/@(Get|Post|Put|Patch|Delete)\(\s*(?:['"]([^'"]*)['"])?\s*\)/g)) {
  endpoints.push({ method: match[1].toUpperCase(), path: `/${controller}/${match[2] || ''}`.replace(/\/+$/, ''), source: relative(apiRoot, path) });
 }
}
endpoints.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
const violations: string[] = [];
for (const path of sourceFiles.filter((p) => !p.includes('/__tests__/') && !p.endsWith('.test.ts'))) {
 const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
 const visit = (node: ts.Node) => {
  if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
   const name = node.moduleSpecifier.text;
   if (/^(firebase|firebase-admin|next|server-only)(\/|$)/.test(name) || /(^|\/)web\//.test(name)) violations.push(`${relative(root, path)}: ${name}`);
  }
  ts.forEachChild(node, visit);
 };
 visit(source);
}
const report = {
 schemaVersion: 1,
 scope: 'Todas as funcionalidades do web; frontend no new; backend exclusivo no ambientaR-api.',
 source: {
  webPages: webFiles.filter((path) => /\/page\.[jt]sx?$/.test(path)).length,
  webApiRoutes: webFiles.filter((path) => path.includes('/app/api/') && /\/route\.[jt]s$/.test(path)).length,
  frontendFilesWithFirebase: webFiles.filter((path) => /\.[jt]sx?$/.test(path) && /from\s+['"](?:@\/firebase|firebase)/.test(readFileSync(path, 'utf8'))).length,
 },
 summary: { features: features.length, done: features.filter((f) => initialExecutionProgress[f.id]?.status === 'done').length,
  concreteInventoryPatterns: coverage.inventoryPatternsImplemented, inventoryPatterns: coverage.inventoryPatternsTotal,
  declaredApiEndpoints: endpoints.length, forbiddenFrontendImports: violations.length },
 caveats: ['Rotas e endpoints declarados não comprovam paridade funcional, registro do módulo ou homologação.', 'APIs dinâmicas e chamadas indiretas exigem refinamento individual.', 'Status concluído exige os gates do plano mestre; não é inferido de arquivos existentes.'],
 violations, endpoints,
 features: features.map((feature) => ({ ...feature, progress: initialExecutionProgress[feature.id] ?? { status: 'pending', completedSteps: [] }, routesCoverage: coverage.featureRoutes[feature.id] })),
};
writeFileSync(resolve(root, 'docs/migration-audit.json'), JSON.stringify(report, null, 2) + '\n');
const rows = report.features.map((feature) => `| ${feature.id} | ${feature.name} | ${feature.wave} | ${feature.progress.status} | ${feature.routesCoverage.implemented.length}/${feature.routesCoverage.expected.length} |`).join('\n');
writeFileSync(resolve(root, 'docs/AUDITORIA-MIGRACAO-ATUAL.md'), `# Auditoria executável da migração\n\nGerar com \`npm run migration:audit\` em \`new\`. API padrão: projeto irmão \`ambientaR-api\`; alternativa: \`AMBIENTAR_API_PATH\`.\n\n${report.source.webPages} páginas e ${report.source.webApiRoutes} rotas de API no legado. ${report.summary.features} funcionalidades catalogadas; ${report.summary.done} com status concluído. ${report.summary.concreteInventoryPatterns}/${report.summary.inventoryPatterns} padrões de rota com implementação declarada. ${endpoints.length} endpoints declarados na API; ${violations.length} imports proibidos no frontend.\n\nContagem de rotas não é contagem de funcionalidades migradas. Dados e evidências por funcionalidade, contratos e endpoints: [migration-audit.json](migration-audit.json).\n\n| Funcionalidade | Nome | Onda | Estado | Rotas concretas/esperadas |\n| --- | --- | --- | --- | --- |\n${rows}\n`);
console.log(JSON.stringify(report.summary, null, 2));
if (violations.length) throw new Error(`Dependências proibidas no frontend: ${violations.join(', ')}`);
