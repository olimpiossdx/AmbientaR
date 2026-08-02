import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const NEW_ROOT = process.cwd();
const WORKSPACE_ROOT = path.resolve(NEW_ROOT, "..");
const WEB_ROOT = path.join(WORKSPACE_ROOT, "web");
const API_ROOT = path.resolve(WORKSPACE_ROOT, "../ambientaR-api");
const CATALOG_PATH = path.join(NEW_ROOT, "docs/CATALOGO-MENUS-FUNCIONALIDADES-API.md");
const OUTPUT_ROOT = path.join(NEW_ROOT, "docs/planos-migracao");

const PREFIX_MODULE = {
  AUTH: ["Acesso e sessão", "acesso-sessao", "rota pública ou sessão autenticada"],
  CORE: ["Painel e Carteira", "painel-carteira", "entrada principal"],
  FIN: ["Financeiro", "financeiro", "modulo.financeiro=acessar"],
  CAD: ["Cadastro", "cadastro", "modulo.cadastro=acessar"],
  DOC: ["Documentos Ambientais", "documentos-ambientais", "modulo.documentos-ambientais=acessar"],
  LEG: ["Multas e Defesas", "multas-defesas", "modulo.multas-defesas=acessar"],
  VIS: ["Vistoria Técnica", "vistoria-tecnica", "modulo.vistoria=acessar"],
  LIC: ["Licenciamento", "licenciamento", "modulo.licenciamento=acessar"],
  PRO: ["Gestão de Projetos e Processos", "gestao-processos", "modulo.gestao-processos=acessar"],
  IA: ["IA", "ia", "modulo.ia=acessar"],
  FAD: ["IA / Fiscal Ambiental Digital", "ia-fiscal-ambiental-digital", "modulo.ia=acessar + modulo.fiscal-ambiental=acessar"],
  EST: ["Estudos Técnicos", "estudos-tecnicos", "modulo.estudos-tecnicos=acessar"],
  GEO: ["Georreferenciamento", "georreferenciamento", "modulo.georreferenciamento=acessar"],
  CRM: ["Vendas & CRM", "vendas-crm", "modulo.crm=acessar"],
  OFI: ["Ofícios", "oficios", "modulo.oficios=acessar"],
  EXT: ["Webmail", "webmail", "recurso.webmail=acessar"],
  GOV: ["Acessos Governamentais", "acessos-governamentais", "modulo.acessos-governamentais=acessar"],
  SIS: ["Ferramentas do Sistema", "ferramentas-sistema", "modulo.ferramentas-sistema=acessar"],
  AGEN: ["Agenda", "agenda", "recurso.agenda=*"],
  INV: ["Estudos Técnicos / Inventários de campo", "inventarios-campo", "modulo.estudos-tecnicos=acessar + recurso.inventario-campo=*"],
};

const clean = (value) => value.replaceAll("`", "").replace(/\*\*/g, "").trim();
const slug = (value) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const rel = (file) => path.relative(WORKSPACE_ROOT, file).replaceAll("\\", "/");

function walk(dir, predicate = () => true) {
  if (!existsSync(dir)) return [];
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stats = statSync(full);
    if (stats.isDirectory()) files.push(...walk(full, predicate));
    else if (predicate(full)) files.push(full);
  }
  return files;
}

function routeFromPage(file) {
  const appRoot = path.join(WEB_ROOT, "src/app");
  const segments = path.relative(appRoot, path.dirname(file)).replaceAll("\\", "/").split("/")
    .filter((segment) => segment !== "(app)" && !/^\([^)]*\)$/.test(segment))
    .map((segment) => segment.startsWith("(.)") ? segment.slice(3) : segment);
  return `/${segments.join("/")}`.replace(/\/$/, "") || "/";
}

const legacyPages = walk(path.join(WEB_ROOT, "src/app"), (file) => file.endsWith("/page.tsx"))
  .map((file) => ({ file, route: routeFromPage(file) }));

function parseCatalog() {
  const markdown = readFileSync(CATALOG_PATH, "utf8");
  let section = "Catálogo funcional";
  const features = [];
  for (const line of markdown.split("\n")) {
    const heading = line.match(/^##\s+(?:\d+\.?\s*)?(.+)$/);
    if (heading) section = clean(heading[1]);
    if (!/^\|\s*FUN-[A-Z]+-\d+\s*\|/.test(line)) continue;
    const cells = line.split("|").slice(1, -1).map(clean);
    const [id, name, ...details] = cells;
    const prefix = id.split("-")[1];
    const [moduleName, moduleSlug, parentClaim] = PREFIX_MODULE[prefix] ?? [section, slug(section), "claim do módulo a definir"];
    const routeCell = details.find((cell) => /\/(?:app(?:\/|\b)|login\b|register\b|forgot-password\b|politica-privacidade\b|offline\b|sessao-bloqueada\b)/.test(cell)) ?? "";
    const apiCell = details.find((cell) => /\b(?:GET|POST|PUT|PATCH|DELETE|CRUD|OAuth|API-FILE)\b/.test(cell)) ?? "Contrato ainda não identificado";
    const claimCell = details.find((cell) => /(?:modulo|recurso|operacao)\.[\w.-]+/.test(cell) || /^(?:pública|usuário conhecido)\b/i.test(cell)) ?? inferClaim(id, name, apiCell);
    const ruleCell = details.at(-1) ?? "Regras específicas a refinar";
    features.push({ id, name, section, moduleName, moduleSlug, parentClaim, routeCell, apiCell, claimCell, ruleCell });
  }
  return features;
}

function inferClaim(id, name, apiCell) {
  const prefix = id.split("-")[1];
  const action = /^GET\b/.test(apiCell) && !/\b(?:POST|PUT|PATCH|DELETE|CRUD)\b/.test(apiCell)
    ? "visualizar"
    : /\b(?:jobs?|analysis|calculation|exports?)\b/i.test(apiCell) && !/\bCRUD\b/.test(apiCell)
      ? "executar"
      : "*";
  if (prefix === "GEO") return `proposta: recurso.georreferenciamento-${slug(name)}=${action}; validar no refinamento`;
  if (prefix === "EST") return `proposta: recurso.estudo-${slug(name)}=${action}; validar no refinamento`;
  return "Claim específica a confirmar";
}

function destinationRoutes(routeCell) {
  const tokens = [...routeCell.matchAll(/\/(?:app\b|login\b|register\b|forgot-password\b|politica-privacidade\b|offline\b|sessao-bloqueada\b|new\b|\$[\w]+)[\w\-/$?&=#.]*/g)].map((match) => match[0]);
  const first = tokens.find((item) => item.startsWith("/app")) ?? tokens[0] ?? "";
  const base = first.replace(/\?.*$/, "").replace(/\/$/, "");
  return [...new Set(tokens.map((item) => {
    if (item.startsWith("/app") || !first.startsWith("/app")) return item;
    return `${base}${item}`;
  }))];
}

function toLegacyRoute(destination) {
  return destination.replace(/^\/app(?=\/|$)/, "").replace(/[?#].*$/, "").replace(/\$([A-Za-z][\w]*)/g, "[$1]") || "/";
}

function routePattern(route) {
  return route.replace(/\[[^\]]+\]/g, "[]");
}

function findLegacyEvidence(routes) {
  const wanted = routes.map(toLegacyRoute);
  const matches = legacyPages.filter((page) => wanted.some((route) => {
    if (routePattern(page.route) === routePattern(route)) return true;
    const expression = `^${page.route
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\\\[[^\]]+\\\]/g, "[^/]+")}$`;
    return new RegExp(expression).test(route);
  }));
  return [...new Map(matches.map((entry) => [entry.file, entry])).values()];
}

function scanLegacyTouchpoints(evidence) {
  const endpoints = new Set();
  const stores = new Set();
  let firebase = false;
  for (const { file } of evidence) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/["'`](\/api\/[A-Za-z0-9_?&=/${}.[\]-]+)/g)) endpoints.add(match[1]);
    for (const match of source.matchAll(/collection\([^,]+,\s*["'`]([^"'`]+)["'`]/g)) stores.add(match[1]);
    if (/firebase|firestore|useCollection|useDoc\b/.test(source)) firebase = true;
  }
  return { endpoints: [...endpoints].sort(), stores: [...stores].sort(), firebase };
}

const apiControllers = existsSync(path.join(API_ROOT, "src"))
  ? walk(path.join(API_ROOT, "src"), (file) => file.endsWith(".ts") && !/\.(?:spec|test)\.ts$/.test(file)).flatMap((file) => {
      const source = readFileSync(file, "utf8");
      return [...source.matchAll(/@Controller\(['"]([^'"]*)['"]\)/g)].map((match) => ({ prefix: match[1], file }));
    })
  : [];

function apiAssessment(feature) {
  const targetPaths = [...feature.apiCell.matchAll(/\/(?:[a-z][\w-]*)(?:\/[\w{}:$.-]+)*/gi)].map((match) => match[0]);
  const roots = targetPaths.map((item) => item.split("/").filter(Boolean)[0]);
  const exact = [...new Map(apiControllers
    .filter((controller) => roots.includes(controller.prefix.split("/")[0]))
    .map((controller) => [controller.file, controller])).values()];
  if (exact.length) return {
    status: "Parcial/existente — validar aderência ao contrato alvo",
    evidence: exact.map((item) => rel(item.file)),
  };
  if (feature.id === "FUN-CAD-003" && apiControllers.some((item) => item.prefix === "empreendimento")) return {
    status: "Parcial com divergência — API atual usa `/empreendimento`; plano propõe `/empreendimentos`",
    evidence: apiControllers.filter((item) => item.prefix === "empreendimento").map((item) => rel(item.file)),
  };
  return { status: "Não localizado no `ambientaR-api`; tratar como contrato e implementação novos", evidence: [] };
}

function list(items, empty) {
  return items.length ? items.map((item) => `- \`${item}\``).join("\n") : `- ${empty}`;
}

function planMarkdown(feature) {
  const routes = destinationRoutes(feature.routeCell);
  const evidence = findLegacyEvidence(routes);
  const touchpoints = scanLegacyTouchpoints(evidence);
  const api = apiAssessment(feature);
  const isPublic = /^pública\b/i.test(feature.claimCell);
  const frontAccessStep = isPublic
    ? "Marcar a rota como pública, impedir dependência acidental de sessão e manter redirecionamentos autenticados explícitos."
    : `Aplicar guard antes do carregamento e guard de ação para ${feature.claimCell}; não usar \`role\`, \`isAdmin\` ou Firebase como autorização.`;
  const apiAccessStep = isPublic
    ? "Marcar somente os handlers necessários como públicos; aplicar rate limit e respostas que não enumerem dados sensíveis."
    : "Declarar claim no controller e valor em cada ação; aplicar escopo no repositório antes de consultar, agregar ou alterar.";
  return `# ${feature.id} — ${feature.name}

Status: análise inicial; implementação não iniciada por este plano  
Módulo pai: **${feature.moduleName}**  
Origem funcional: seção “${feature.section}” do catálogo  
Dependência de acesso do pai: \`${feature.parentClaim}\`

## Objetivo e escopo

Migrar a funcionalidade **${feature.name}** do \`web\` para o \`new\`, sem dependência de Firebase nem das rotas Next.js do legado. O corte deve ser vertical: navegação, telas, serviço HTTP, contrato, autorização, persistência, testes e observabilidade entram na mesma entrega.

Regra funcional levantada: ${feature.ruleCell}.

## Hierarquia e rotas

- Módulo/menu pai: **${feature.moduleName}**.
- Filho/tela: **${feature.name}**.
- Rotas alvo declaradas: ${feature.routeCell || "a confirmar durante o refinamento"}.
- Claim do filho: ${feature.claimCell}.
- Regra de navegação: o pai só aparece se houver ao menos um filho autorizado; URL direta e menu devem aplicar a mesma claim.

## Evidência no legado

Páginas correspondentes encontradas diretamente:

${list(evidence.map((item) => rel(item.file)), "nenhuma correspondência direta; verificar alias, card de hub ou fluxo incorporado")}

Touchpoints detectados apenas nessas páginas (levantamento estático inicial):

- Firebase/Firestore direto na página: **${touchpoints.firebase ? "sim" : "não detectado"}**.
- Coleções detectadas: ${touchpoints.stores.length ? touchpoints.stores.map((item) => `\`${item}\``).join(", ") : "não detectadas diretamente"}.
- APIs Next detectadas: ${touchpoints.endpoints.length ? touchpoints.endpoints.map((item) => `\`${item}\``).join(", ") : "não detectadas diretamente"}.

> Este rastreio não substitui o refinamento: hooks, componentes importados, regras Firestore, serviços e geradores de documento devem ser percorridos antes da implementação.

## Plano do front-end (\`new\`)

- [ ] Registrar módulo, rotas lazy, item filho e breadcrumb no registro central, mantendo **${feature.moduleName}** como pai.
- [ ] Criar tipos de domínio de apresentação, schemas de URL/formulário e service próprio usando exclusivamente o cliente HTTP central.
- [ ] Implementar todas as variações de tela declaradas (${routes.length || 1}), preservando busca, filtros, paginação, seleção, ações, anexos e exportações existentes que forem confirmados no refinamento.
- [ ] ${frontAccessStep}
- [ ] Cobrir loading, vazio, erro de validação, 401, 403, 404, conflito de versão e indisponibilidade da API.
- [ ] Garantir responsividade, teclado, foco, rótulos, feedback de operação e persistência em URL dos filtros relevantes.
- [ ] Remover qualquer chamada direta a \`/api/*\` do legado; arquivos e jobs devem seguir os contratos comuns do catálogo.

## Plano da API (\`ambientaR-api\`)

Contrato alvo: ${feature.apiCell}.

Situação encontrada: **${api.status}**.

${list(api.evidence, "sem controller correspondente localizado")}

- [ ] Refinar DTOs de entrada/saída, filtros, ordenação, paginação, erros de campo e envelope sem expor schema de banco.
- [ ] Implementar controller fino, caso de uso, regras de domínio/policy, porta de repositório e adaptador de infraestrutura.
- [ ] ${apiAccessStep}
- [ ] Derivar tenant, titularidade e autor da sessão; nunca confiar nesses campos vindos do payload.
- [ ] Aplicar idempotência, controle de versão, auditoria, correlação e exclusão lógica conforme o risco da operação.
- [ ] Para arquivos, integrações e processamento pesado, aplicar respectivamente \`API-FILE\`, \`API-INTEGRATION\` e \`API-JOB\` do catálogo.
- [ ] Criar testes unitários de domínio, integração HTTP e contrato para autorizado, sem claim, fora do escopo, payload inválido e conflito.

## Sequência de migração

1. Refinar o comportamento real percorrendo páginas, componentes, hooks, coleções, regras e documentos vinculados.
2. Congelar contrato e matriz de autorização/escopo antes de desenvolver a tela.
3. Implementar domínio e endpoint no \`ambientaR-api\`, com testes negativos.
4. Implementar o módulo no \`new\`, integrar ao endpoint e completar estados de interface.
5. Executar testes verticais, homologar desktop/mobile e liberar por feature flag.
6. Comparar dados/resultados com o legado e só então retirar a rota antiga.

## Critérios de aceite e saída

- [ ] Regra específica validada: ${feature.ruleCell}.
- [ ] Critérios comuns aplicáveis (\`AC-FRONT\`, \`AC-CRUD\`, \`AC-READ\`, \`AC-WORKFLOW\`, \`AC-FILE\`, \`AC-JOB\`, \`AC-INT\`) atendidos conforme o contrato.
- [ ] Menu pai, filho, rota, botões e endpoint negam acesso de forma coerente.
- [ ] Nenhum import ou chamada para Firebase, Next API ou runtime do \`web\` permanece.
- [ ] Dados migrados/reconciliados, rollback ensaiado e evidências anexadas ao acompanhamento da migração.
- [ ] Produto homologa regras, cálculos, documentos gerados, permissões negativas e comportamento responsivo.

## Pendências para o refinamento

- Confirmar campos, validações, estados, transições e mensagens que hoje vivem em componentes importados.
- Confirmar fonte de dados, estratégia de migração, volume, retenção, anexos e deduplicação.
- Confirmar se rotas auxiliares sem entrada direta de menu são telas do mesmo filho ou ações internas.
- Resolver qualquer divergência entre contrato proposto e endpoints já existentes antes de codificar.
`;
}

function moduleMarkdown(moduleSlug, items) {
  const moduleName = items[0].moduleName;
  const parentClaim = items[0].parentClaim;
  const children = items.map((item) => {
    const file = `${item.id.toLowerCase()}-${slug(item.name)}.md`;
    return `| [${item.id} — ${item.name}](${file}) | ${item.routeCell || "a confirmar"} | ${item.apiCell} |`;
  }).join("\n");
  return `# Plano do módulo — ${moduleName}

Status: análise inicial  
Diretório: \`${moduleSlug}\`  
Dependência de acesso do pai: \`${parentClaim}\`  
Filhos mapeados: **${items.length}**

## Objetivo

Migrar o menu **${moduleName}** como módulo coeso do \`new\`, mantendo cada submenu/tela como entrega vertical separada. O módulo pai é responsável por registro, navegação e contexto compartilhado; regras de negócio permanecem nos domínios dos filhos e no \`ambientaR-api\`.

## Filhos do módulo

| Plano da funcionalidade | Rotas alvo | Contrato alvo |
| --- | --- | --- |
${children}

## Regras do front-end

- [ ] Criar uma fronteira de módulo com arquivo de registro, rotas lazy, navegação, tipos compartilhados e exports públicos mínimos.
- [ ] Exibir o menu pai somente quando a sessão possuir a capacidade do pai e ao menos uma claim filha autorizada.
- [ ] Fazer o filtro da sidebar e o guard das rotas consumirem a mesma fonte de claims; acesso por URL direta não pode contornar a navegação.
- [ ] Manter estado compartilhado apenas quando pertencer ao módulo; filtros e formulários específicos ficam no filho correspondente.
- [ ] Padronizar cabeçalho, breadcrumb, estados de loading/vazio/erro e comportamento responsivo sem criar uma página monolítica.
- [ ] Proibir Firebase, imports do \`web\`, chamadas HTTP diretas e decisões por role.

## Regras da API

- [ ] Definir ownership dos agregados e limites entre recursos antes de criar controllers; evitar um controller único para todo o menu.
- [ ] Aplicar autenticação global, claim do pai/filho e policy de escopo em todos os casos de uso.
- [ ] Compartilhar somente infraestrutura transversal: paginação, arquivos, jobs, auditoria, idempotência, correlação e tratamento de erros.
- [ ] Publicar contratos versionados e testáveis antes da integração das telas.
- [ ] Planejar migração de dados por agregado, com contagem, checksum/reconciliação, relatório de rejeitados e rollback.
- [ ] Medir disponibilidade, latência, erros, negações e filas por recurso/ação.

## Ordem de execução do módulo

1. Fechar claims, escopo e dados mestres compartilhados.
2. Migrar filhos de leitura/hub para validar navegação e autorização.
3. Migrar CRUDs e workflows, começando pelos que desbloqueiam outros filhos.
4. Migrar arquivos, integrações, cálculos, IA e exports como jobs protegidos.
5. Homologar todos os filhos, reconciliar dados e retirar o menu legado por feature flag.

## Critério de conclusão do módulo

- [ ] Todos os ${items.length} planos filhos estão concluídos e possuem evidência.
- [ ] Menu pai, filhos, breadcrumbs, busca de navegação e mobile foram homologados.
- [ ] Chamadas diretas ao legado foram eliminadas.
- [ ] Matriz de claims/escopo possui testes positivos e negativos.
- [ ] Dados e documentos críticos foram comparados com o legado.
- [ ] Rollout e rollback do módulo foram ensaiados.
`;
}

const features = parseCatalog();
mkdirSync(OUTPUT_ROOT, { recursive: true });
for (const feature of features) {
  const moduleDir = path.join(OUTPUT_ROOT, feature.moduleSlug);
  mkdirSync(moduleDir, { recursive: true });
  const planPath = path.join(moduleDir, `${feature.id.toLowerCase()}-${slug(feature.name)}.md`);
  const existingPlan = existsSync(planPath) ? readFileSync(planPath, "utf8") : "";

  if (!existingPlan.includes("Status: **concluído")) {
    writeFileSync(planPath, planMarkdown(feature));
  }
}

const grouped = Map.groupBy(features, (feature) => feature.moduleSlug);
for (const [moduleSlug, items] of grouped) {
  writeFileSync(path.join(OUTPUT_ROOT, moduleSlug, "PLANO-MODULO.md"), moduleMarkdown(moduleSlug, items));
}
const index = [`# Planos de migração por módulo e funcionalidade`, "", `Gerado em: 22/07/2026  `, `Fonte: código do \`web\`, catálogo funcional do \`new\` e inspeção somente leitura do \`ambientaR-api\`.`, "", `Total: **${features.length} funcionalidades** em **${grouped.size} módulos/pais operacionais**.`, "", "## Como usar", "", "Cada arquivo representa uma entrega vertical independente. O agrupamento de diretórios reproduz o menu pai; cada plano filho contém escopo, evidências do legado, plano de front-end, plano de API, sequência e critérios de saída.", ""];
for (const [moduleSlug, items] of grouped) {
  index.push(`## ${items[0].moduleName}`, "", `[Plano do módulo](${moduleSlug}/PLANO-MODULO.md)  `, `Total de filhos: ${items.length}`, "");
  for (const item of items) {
    const file = `${moduleSlug}/${item.id.toLowerCase()}-${slug(item.name)}.md`;
    index.push(`- [${item.id} — ${item.name}](${file})`);
  }
  index.push("");
}
writeFileSync(path.join(OUTPUT_ROOT, "README.md"), index.join("\n"));

const byPrefix = Object.fromEntries([...grouped].map(([key, items]) => [key, items.length]));
const analysis = `# Análise inicial da migração do \`web\` para o \`new\`

Data-base: 22/07/2026  
Escopo: inventário funcional, hierarquia de menu, telas, rotas e fronteira front/API. Nenhuma funcionalidade foi migrada nesta etapa.

## Resultado

- **${features.length} funcionalidades** receberam plano individual.
- **${grouped.size} módulos/pais operacionais** organizam os planos.
- Foram criados **${grouped.size} planos de módulo** e **${features.length} planos de funcionalidade**, além do índice.
- O inventário de rotas existente registra **285 variações**, **275 URLs canônicas** e **267 padrões de rota**.
- O \`web\` é Next.js 14/PWA e concentra interface, Firebase/Firestore/Storage e dezenas de APIs Next.
- O \`new\` é React 19 + Vite + TanStack Router e já possui fundações de autenticação, navegação, usuários, agenda e acompanhamento, mas não possui paridade funcional ampla.
- O \`ambientaR-api\` é NestJS + MongoDB/MikroORM + Redis para autorização. Há base de autenticação/claims e controllers de usuário, empreendimento, imóvel, estado e município; a maior parte dos 188 contratos ainda não existe.
- Somente **6 planos** encontraram controller total ou parcialmente correspondente na API atual; **182** dependem de contrato/implementação novos.
- **59 claims filhas** de Estudos Técnicos/Georreferenciamento são propostas derivadas da convenção do catálogo e precisam ser ratificadas no refinamento.
- **187 funcionalidades** possuem correspondência direta com página/rota do legado; Sessão é um fluxo/modal transversal e não uma página isolada.

## Hierarquia adotada

Cada item principal do menu virou módulo/pai. Agrupadores internos relevantes, como Fiscal Ambiental Digital e Inventários de campo, permanecem vinculados ao pai visível e recebem pasta própria para evitar planos monolíticos.

| Pasta | Módulo/pai | Funcionalidades |
| --- | --- | ---: |
${[...grouped].map(([key, items]) => `| \`${key}\` | ${items[0].moduleName} | ${byPrefix[key]} |`).join("\n")}

## Constatações arquiteturais

1. A migração não pode ser tratada como cópia de páginas: o legado mistura UI, acesso Firebase, regras de perfil, geração documental, jobs e integrações.
2. O corte seguro é vertical por \`FUN-*\`: contrato e autorização, domínio/API, serviço frontend, telas, navegação, testes e liberação.
3. Roles do legado devem servir somente como evidência. A solução alvo usa claims cumulativas no pai/filho e policy de escopo no backend.
4. Endpoints Next e Firebase não entram no \`new\`; toda operação passa pelo cliente HTTP central e pelo \`ambientaR-api\`.
5. As rotas externas atuais carregam URL em query string. O alvo deve usar identificadores allowlisted resolvidos pela API.
6. Geração de PDF/DOCX, geoprocessamento, IA, sincronização e exportações precisam de jobs assíncronos com progresso e resultado protegido.
7. A API atual ainda reflete permissividade de desenvolvimento em CORS e não possui todos os gates transversais do plano mestre; a fundação deve anteceder a migração em massa.

## Riscos que bloqueiam uma virada direta

- regras funcionais distribuídas em componentes/hooks e não apenas nas páginas;
- autorização por role no legado versus claims no alvo;
- Firestore sem contrato explícito e possíveis dados sem normalização;
- endpoints alvo ainda ausentes ou divergentes (por exemplo, singular/plural de empreendimento);
- documentos, mapas e cálculos que exigem comparação visual/numérica;
- rotas aliases, intercepting routes e telas acessadas por cards, não apenas pela sidebar;
- módulos visuais do \`new\` sem requisito correspondente no legado devem permanecer fora do backlog até especificação.

## Próxima etapa recomendada

Executar refinamento funcional por ondas, começando por autenticação/claims, Usuários, Agenda e Painel. Para cada arquivo, percorrer dependências importadas, fechar DTOs e escopo, implementar testes negativos na API e somente então construir a tela. A retirada do legado ocorre por funcionalidade, após reconciliação e feature flag, nunca por big bang.

O índice navegável dos planos está em [\`planos-migracao/README.md\`](planos-migracao/README.md).
`;
writeFileSync(path.join(NEW_ROOT, "docs/ANALISE-INICIAL-MIGRACAO-WEB.md"), analysis);

console.log(`Gerados ${features.length} planos em ${grouped.size} módulos.`);
