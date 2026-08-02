import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { canComplete, executionSteps, initializeProgress, migrationBaseline, parseFeatureCatalog, summarizeProgress } from "./migration-plan-data";

test("converte linhas FUN-* do catálogo em entregas executáveis", () => {
 const markdown = `## 7. Documentos\n| ID | Menu | Tela | API | Claim | Aceite |\n| --- | --- | --- | --- | --- | --- |\n| FUN-DOC-006 | Licenças | \`/app/licenses\` | CRUD \`/licenses\` | \`recurso.licenca=*\` | validade; \`AC-CRUD\` |`;
 const [feature] = parseFeatureCatalog(markdown);
 assert.equal(feature.id, "FUN-DOC-006");
 assert.equal(feature.wave, 4);
 assert.match(feature.routes, /\/app\/licenses/);
 assert.match(feature.api, /CRUD/);
 assert.match(feature.claims, /recurso\.licenca/);
});

test("ignora GAP e cabeçalhos, pois somente FUN-* compõe as 188 entregas", () => {
 const markdown = `| ID | Nome |\n| --- | --- |\n| GAP-001 | Sem especificação |\n| FUN-CORE-001 | Painel |`;
 assert.deepEqual(parseFeatureCatalog(markdown).map((item) => item.id), ["FUN-CORE-001"]);
});

test("resume os dez passos e estados persistidos", () => {
 const features = parseFeatureCatalog("| FUN-CORE-001 | Painel | /app | GET /dashboard | recurso.dashboard=visualizar | AC-READ |");
 const summary = summarizeProgress(features, { "FUN-CORE-001": { status: "in_progress", completedSteps: [1, 2] } });
 assert.equal(executionSteps.length, 10);
 assert.equal(summary.inProgress, 1);
 assert.equal(summary.completedSteps, 2);
 assert.equal(summary.totalSteps, 10);
 assert.equal(migrationBaseline.totalRouteVariations, 285);
});

test("documento normativo fornece exatamente as 188 funcionalidades esperadas", () => {
 const catalogUrl = new URL("../../../docs/CATALOGO-MENUS-FUNCIONALIDADES-API.md", import.meta.url);
 const features = parseFeatureCatalog(readFileSync(catalogUrl, "utf8"));
 assert.equal(features.length, migrationBaseline.catalogFeatures);
 assert.equal(new Set(features.map((feature) => feature.id)).size, migrationBaseline.catalogFeatures);
});

test("propaga a claim pai cumulativa até as funcionalidades da seção", () => {
 const markdown = `## 6. Cadastro\nPai: \`modulo.cadastro=acessar\`.\n| FUN-CAD-001 | Usuários | \`/app/users\` | CRUD \`/user\` | \`recurso.usuario=*\` | AC-CRUD |\n## 7. Sem pai\n| FUN-CORE-001 | Painel | \`/app\` | GET \`/dashboard\` | \`recurso.dashboard=visualizar\` | AC-READ |`;
 const [users, dashboard] = parseFeatureCatalog(markdown);
 assert.equal(users.claims, "modulo.cadastro=acessar + recurso.usuario=*");
 assert.equal(dashboard.claims, "recurso.dashboard=visualizar");
});

test("conclusão exige os dez passos e evidência não vazia", () => {
 const completedSteps = executionSteps.map((step) => step.id);
 assert.equal(canComplete({ status: "done", completedSteps, evidence: "  " }), false);
 assert.equal(canComplete({ status: "done", completedSteps: completedSteps.slice(0, 9), evidence: "PR-42" }), false);
 assert.equal(canComplete({ status: "done", completedSteps, evidence: "PR-42" }), true);
});

test("inicializa pilotos sem substituir progresso existente", () => {
 const initialized = initializeProgress({
  "FUN-CAD-001": { status: "blocked", completedSteps: [1], evidence: "Decisão existente" },
 });
 assert.deepEqual(initialized["FUN-CAD-001"], { status: "blocked", completedSteps: [1], evidence: "Decisão existente" });
 assert.equal(initialized["FUN-AGEN-001"].status, "blocked");
 assert.match(initialized["FUN-AGEN-001"].evidence ?? "", /API/);
});

test("rebaixa done inválido carregado sem apagar passos ou evidência", () => {
 const initialized = initializeProgress({
  "FUN-CORE-001": { status: "done", completedSteps: [1, 2], evidence: "parcial" },
 });
 assert.deepEqual(initialized["FUN-CORE-001"], { status: "in_progress", completedSteps: [1, 2], evidence: "parcial" });
});
