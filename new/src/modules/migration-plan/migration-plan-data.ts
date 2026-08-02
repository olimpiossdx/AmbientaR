export type MigrationStatus = "pending" | "in_progress" | "blocked" | "done";

export type MigrationFeature = {
 id: string;
 group: string;
 name: string;
 routes: string;
 api: string;
 claims: string;
 acceptance: string;
 wave: number;
};

export type ExecutionProgress = {
 status: MigrationStatus;
 completedSteps: number[];
 evidence?: string;
};

export const initialExecutionProgress: Record<string, ExecutionProgress> = {
 "FUN-AUTH-001": {
  status: "done",
  completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  evidence: "Concluído em 22/07/2026: login público por e-mail/CPF/CNPJ, sessão por cookies HttpOnly, claims efetivas, redirecionamento interno validado, mensagens sem enumeração, rate limiting e auditoria sem PII. Evidências: 42 testes + build do new; 68 testes + build do ambientaR-api.",
 },
 "FUN-CAD-001": {
  status: "in_progress",
  completedSteps: [],
  evidence: "Front parcial: rota, listagem paginada, formulário CRUD, service /user e painel de grupos/claims implementados. Ainda faltam contrato final, edição própria versus administração, escopo, testes negativos de integração, navegação pertencente ao módulo e aceite vertical.",
 },
 "FUN-AGEN-001": {
  status: "blocked",
  completedSteps: [],
  evidence: "Front parcial: tela responsiva, filtros, CRUD, convite/resposta, claims por ação e service /calendar-events implementados. Bloqueado até domínio, persistência, endpoints, escopo e testes verticais existirem na API ambientaR-api.",
 },
};

export type MigrationWave = {
 id: number;
 title: string;
 featureIds: string;
 dependencies: string;
};

export type ExecutionStep = {
 id: number;
 title: string;
 output: string;
 acceptance: string[];
};

export const migrationBaseline = {
 catalogFeatures: 188,
 totalRouteVariations: 285,
 authenticatedRouteVariations: 280,
 canonicalUrls: 275,
 routePatterns: 267,
 authenticatedRoutePatterns: 262,
 publicRoutes: 5,
 removedAliases: 8,
} as const;

export const sourceDocuments = [
 { id: "DOC-PLANO", label: "Plano mestre", path: "new/docs/PLANO-MIGRACAO-WEB-PARA-NEW.md" },
 { id: "DOC-CATALOGO", label: "Catálogo FUN/API", path: "new/docs/CATALOGO-MENUS-FUNCIONALIDADES-API.md" },
 { id: "DOC-ROTAS", label: "Inventário de telas e rotas", path: "new/docs/INVENTARIO-COMPLETO-TELAS-ROTAS.md" },
] as const;

export const executionSteps: ExecutionStep[] = [
 {
  id: 1,
  title: "Refinamento funcional",
  output: "Critérios específicos aprovados e nenhuma tela órfã.",
  acceptance: ["Telas ligadas ao FUN-*", "Ações, estados e limites identificados", "Autorização descrita somente por capacidade, claim e escopo"],
 },
 {
  id: 2,
  title: "Contrato e autorização",
  output: "Contrato testável antes da interface.",
  acceptance: ["DTOs e erros definidos", "Claim do controller e de cada ação definida", "Escopo, paginação, idempotência e versão definidos"],
 },
 {
  id: 3,
  title: "Domínio na API",
  output: "Domínio executável sem HTTP.",
  acceptance: ["Invariantes e policies implementadas", "Portas de infraestrutura definidas", "Testes unitários cobrem regras e negativas"],
 },
 {
  id: 4,
  title: "Aplicação e infraestrutura",
  output: "Casos de uso testados com infraestrutura real ou containerizada.",
  acceptance: ["Escopo aplicado no repositório", "Jobs, arquivos e integrações seguem contratos", "Auditoria, correlação e observabilidade presentes"],
 },
 {
  id: 5,
  title: "HTTP na API",
  output: "Endpoint pronto para consumo e independente do frontend.",
  acceptance: ["Controller fino, DTO e validação", "AuthGuard e ClaimsGuard com metadados completos", "Testes cobrem autorizado, sem claim, fora do escopo, inválido e conflito"],
 },
 {
  id: 6,
  title: "Fundação do módulo no front",
  output: "Módulo registrável sem página monolítica.",
  acceptance: ["Módulo, rotas, navegação e claims", "Tipos e schemas de formulário/URL", "Service usa somente o cliente HTTP central"],
 },
 {
  id: 7,
  title: "Telas e ações",
  output: "Todas as rotas da funcionalidade operam contra a API.",
  acceptance: ["Lista, detalhe e formulário conforme catálogo", "Guard de rota e ClaimGuard nas ações", "Loading, vazio, erro, 403, 404, conflito, responsividade e teclado"],
 },
 {
  id: 8,
  title: "Navegação",
  output: "Menu, URL direta e endpoint tomam decisões coerentes.",
  acceptance: ["Pai e filho usam claims cumulativas", "Agrupador vazio desaparece", "Breadcrumb, item ativo, busca e mobile validados"],
 },
 {
  id: 9,
  title: "Testes verticais e aceite",
  output: "FUN-* concluída e liberável isoladamente.",
  acceptance: ["AC-* compartilhado e regra específica executados", "E2E cobre claim, escopo e negativas", "Evidência anexada e homologada"],
 },
 {
  id: 10,
  title: "Liberação",
  output: "Funcionalidade estável no conjunto new + ambientaR-api.",
  acceptance: ["Feature flag e grupo controlado", "Erro, p95, negações, jobs e auditoria observados", "Métricas e documentação atualizadas"],
 },
];

export const migrationWaves: MigrationWave[] = [
 { id: 1, title: "Fundação", featureIds: "FUN-AUTH-* e padrões AC-*", dependencies: "MongoDB, Redis, sessão, claims, arquivos, jobs e auditoria" },
 { id: 2, title: "Pilotos", featureIds: "FUN-CAD-001, FUN-AGEN-001, FUN-CORE-001", dependencies: "Fundação" },
 { id: 3, title: "Escopo base", featureIds: "FUN-CAD-002..004, FUN-CORE-002", dependencies: "Pilotos" },
 { id: 4, title: "Operação ambiental", featureIds: "FUN-DOC-001..013", dependencies: "Cadastros, arquivos e escopo" },
 { id: 5, title: "Fluxos legais e operacionais", featureIds: "FUN-LEG-*, FUN-VIS-*, FUN-LIC-*, FUN-PRO-*, FUN-OFI-*", dependencies: "Cadastros, agenda e documentos" },
 { id: 6, title: "Financeiro", featureIds: "FUN-FIN-001..025", dependencies: "Cadastros, auditoria e integrações" },
 { id: 7, title: "CRM", featureIds: "FUN-CRM-001..009", dependencies: "Financeiro e cadastros" },
 { id: 8, title: "Estudos convencionais", featureIds: "FUN-EST-001..004, 020..022, 025..030, 035..037", dependencies: "Cadastros, documentos, arquivos e jobs" },
 { id: 9, title: "Inventário, fauna e campo", featureIds: "FUN-EST-005..019, FUN-INV-001", dependencies: "Estudos e coleta" },
 { id: 10, title: "Barragens, compensações e relatórios", featureIds: "FUN-EST-031..049", dependencies: "Estudos e jobs" },
 { id: 11, title: "Georreferenciamento", featureIds: "FUN-GEO-001..012", dependencies: "Arquivos, jobs e integrações geoespaciais" },
 { id: 12, title: "IA e FAD", featureIds: "FUN-IA-*, FUN-FAD-*", dependencies: "Arquivos, jobs, observabilidade e integrações" },
 { id: 13, title: "Sistema e integrações", featureIds: "FUN-SIS-*, FUN-GOV-*, FUN-EXT-*", dependencies: "Módulos anteriores" },
 { id: 14, title: "Gaps de produto", featureIds: "GAP-*", dependencies: "Especificação própria aprovada; fora das 188 FUN-*" },
 { id: 15, title: "Homologação global", featureIds: "285 URLs/variações", dependencies: "Matriz de claims, evidências e gates aprovados" },
];

const cleanMarkdown = (value: string) => value.replaceAll("`", "").replace(/\*\*/g, "").trim();

function waveFor(id: string): number {
 if (/^FUN-(AUTH)/.test(id)) return 1;
 if (["FUN-CAD-001", "FUN-AGEN-001", "FUN-CORE-001"].includes(id)) return 2;
 if (/^FUN-CAD-00[2-4]$/.test(id) || id === "FUN-CORE-002") return 3;
 if (id.startsWith("FUN-DOC-")) return 4;
 if (/^FUN-(LEG|VIS|LIC|PRO|OFI)-/.test(id)) return 5;
 if (id.startsWith("FUN-FIN-")) return 6;
 if (id.startsWith("FUN-CRM-")) return 7;
 if (id.startsWith("FUN-EST-")) {
  const number = Number(id.slice(-3));
  if (number >= 5 && number <= 19) return 9;
  if (number >= 31 && number <= 49) return 10;
  return 8;
 }
 if (id.startsWith("FUN-INV-")) return 9;
 if (id.startsWith("FUN-GEO-")) return 11;
 if (/^FUN-(IA|FAD)-/.test(id)) return 12;
 if (/^FUN-(SIS|GOV|EXT)-/.test(id)) return 13;
 return 5;
}

function valueContaining(cells: string[], patterns: RegExp[]) {
 return cells.find((cell) => patterns.some((pattern) => pattern.test(cell))) ?? "";
}

export function parseFeatureCatalog(markdown: string): MigrationFeature[] {
 let group = "Catálogo funcional";
 let parentClaim = "";
 const features: MigrationFeature[] = [];

 for (const rawLine of markdown.split("\n")) {
  const heading = rawLine.match(/^##\s+(?:\d+\.?\s*)?(.+)$/);
  if (heading) {
   group = cleanMarkdown(heading[1]);
   parentClaim = "";
  }
  const parentMatch = cleanMarkdown(rawLine).match(/^Pai:\s*((?:modulo|recurso|operacao)\.[\w.-]+\s*=\s*[\w*-]+)/i);
  if (parentMatch) parentClaim = parentMatch[1].replace(/\s+/g, "");
  if (!/^\|\s*FUN-[A-Z]+-\d+\s*\|/.test(rawLine)) continue;

  const cells = rawLine.split("|").slice(1, -1).map(cleanMarkdown);
  const [id, name, ...details] = cells;
  const routes = valueContaining(details, [/\/(?:app(?:\/|\b)|login\b|register\b|forgot-password\b|politica-privacidade\b|offline\b|sessao-bloqueada\b)/]);
  const api = valueContaining(details, [/\b(?:GET|POST|PUT|PATCH|DELETE|CRUD)\b/])
   || details.find((cell) => /\/(?!app(?:\/|\b))\{?[a-z][\w/-]*/i.test(cell))
   || "";
  const featureClaim = valueContaining(details, [/(?:modulo|recurso|operacao)\.[\w.-]+/]);
  const claims = [parentClaim, featureClaim || "Claim da funcionalidade definida pela família no DOC-CATALOGO"].filter(Boolean).join(" + ");
  const acceptance = details.at(-1) ?? "";

  features.push({
   id,
   group,
   name,
   routes: routes || "Consultar inventário DOC-ROTAS",
   api: api || "Contrato detalhado em DOC-CATALOGO",
   claims,
   acceptance,
   wave: waveFor(id),
  });
 }

 return features;
}

export function canComplete(progress: ExecutionProgress): boolean {
 return executionSteps.every((step) => progress.completedSteps.includes(step.id))
  && Boolean(progress.evidence?.trim());
}

export function normalizeExecutionProgress(progress: ExecutionProgress): ExecutionProgress {
 if (progress.status !== "done" || canComplete(progress)) return progress;
 return { ...progress, status: progress.completedSteps.length > 0 ? "in_progress" : "pending" };
}

export function initializeProgress(existing: Record<string, ExecutionProgress>): Record<string, ExecutionProgress> {
 const merged = { ...initialExecutionProgress, ...existing };
 return Object.fromEntries(Object.entries(merged).map(([id, progress]) => [id, normalizeExecutionProgress(progress)]));
}

export function summarizeProgress(features: MigrationFeature[], progress: Record<string, ExecutionProgress>) {
 const count = (status: MigrationStatus) => features.filter((feature) => (progress[feature.id]?.status ?? "pending") === status).length;
 return {
  total: features.length,
  pending: count("pending"),
  inProgress: count("in_progress"),
  blocked: count("blocked"),
  done: count("done"),
  completedSteps: features.reduce((sum, feature) => sum + (progress[feature.id]?.completedSteps.length ?? 0), 0),
  totalSteps: features.length * executionSteps.length,
 };
}
