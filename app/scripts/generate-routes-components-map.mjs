/**
 * Gera MAPA-ROTAS-COMPONENTES-AMBIENTAR.md na raiz do repositório.
 * Uso: npm run docs:routes-map
 */
import {
  readdirSync,
  statSync,
  readFileSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APP_ROOT = path.join(ROOT, "src", "app");
const APP_AUTH_ROOT = path.join(APP_ROOT, "(app)");
const COMPONENTS_ROOT = path.join(ROOT, "src", "components");
const API_ROOT = path.join(APP_ROOT, "api");
const OUTPUT = path.join(ROOT, "MAPA-ROTAS-COMPONENTES-AMBIENTAR.md");

// ─── Utilitários de ficheiro ───────────────────────────────────────────────

function walk(dir, filter = () => true) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full, filter));
    else if (filter(full, entry)) out.push(full);
  }
  return out;
}

function relPosix(file) {
  return path.relative(ROOT, file).replaceAll("\\", "/");
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeHref(href) {
  if (!href) return "";
  let base = href.split("?")[0].split("#")[0];
  if (base.startsWith("/external")) return "/external";
  if (base.endsWith("/") && base.length > 1) base = base.slice(0, -1);
  return base;
}

// ─── Navegação ─────────────────────────────────────────────────────────────

function parseNavigationConfig() {
  const src = readFileSync(path.join(ROOT, "src/lib/navigation-config.ts"), "utf8");
  const entries = [];

  // Parser linha-a-linha: acumula href/label/roles por bloco de menu
  let cur = null;
  for (const line of src.split("\n")) {
    const hrefM = line.match(/href:\s*"([^"]+)"/);
    if (hrefM) {
      if (cur?.href) entries.push(cur);
      cur = { href: normalizeHref(hrefM[1]), label: "", roles: [] };
      continue;
    }
    if (!cur) continue;
    const labelM = line.match(/label:\s*"([^"]+)"/);
    if (labelM && !cur.label) {
      cur.label = labelM[1];
      continue;
    }
    const inlineRoles = line.match(/roles:\s*\[([^\]]*)\]/);
    if (inlineRoles) {
      for (const r of inlineRoles[1].matchAll(/"([^"]+)"/g)) cur.roles.push(r[1]);
      entries.push(cur);
      cur = null;
      continue;
    }
    const roleM = line.match(/^\s*"([^"]+)",?\s*$/);
    if (roleM && !line.includes("href") && !line.includes("label") && !line.includes("icon")) {
      cur.roles.push(roleM[1]);
    }
    if (line.match(/^\s*\],?\s*$/) && cur.roles.length) {
      entries.push(cur);
      cur = null;
    }
  }
  if (cur?.href) entries.push(cur);

  // Determina módulo por prefixo de rota
  const modulePrefixes = [
    { module: "Minha Carteira", prefixes: ["/carteira"] },
    { module: "Painel", prefixes: ["/"] },
    { module: "Financeiro", prefixes: ["/bank-access", "/clients", "/contracts", "/financial", "/invoices", "/suppliers", "/cash-flow", "/commercial-proposals", "/services", "/proposals"] },
    { module: "Cadastro", prefixes: ["/empreendedores", "/projects", "/responsible-company", "/technical-responsible", "/environmental-company"] },
    { module: "Documentos Ambientais", prefixes: ["/documentos-ambientais", "/car", "/compliance", "/intervencoes", "/fauna", "/licenses", "/tacs", "/monitoring", "/outorgas", "/usos-insignificantes", "/inspections/reports"] },
    { module: "Multas e Defesas", prefixes: ["/multas-defesas", "/autos-infracao-defesa"] },
    { module: "Vistoria Técnica", prefixes: ["/inspections"] },
    { module: "Licenciamento", prefixes: ["/requests"] },
    { module: "IA", prefixes: ["/studies/assistant", "/analise-ambiental", "/reporting", "/ai-lab", "/configuracoes/mcp-rag", "/knowledge-sources"] },
    { module: "Estudos Técnicos", prefixes: ["/studies", "/coleta-campo", "/inventarios", "/app-campo"] },
    { module: "Georreferenciamento", prefixes: ["/georeferenciamento"] },
    { module: "Vendas & CRM", prefixes: ["/crm", "/social-media", "/canais"] },
    { module: "Webmail", prefixes: ["/webmail", "/external"] },
    { module: "Ofícios e Comunicações", prefixes: ["/oficios"] },
    { module: "Configurações", prefixes: ["/settings", "/users", "/audit-log", "/consultas", "/laudos"] },
    { module: "Agenda", prefixes: ["/calendar"] },
  ];

  const hrefToNav = new Map();
  for (const e of entries) {
    if (!e.href.startsWith("/")) continue;
    // Preferir entrada com roles preenchidos
    const prev = hrefToNav.get(e.href);
    if (!prev || (e.roles.length && !prev.roles.length)) {
      hrefToNav.set(e.href, e);
    }
  }

  function getModule(route) {
    if (route === "/") return "Painel";
    for (const { module, prefixes } of modulePrefixes) {
      for (const p of prefixes) {
        if (p === "/" && route === "/") return module;
        if (p !== "/" && (route === p || route.startsWith(`${p}/`))) return module;
      }
    }
    return "Outras rotas";
  }

  function getMenuLabel(route) {
    const exact = hrefToNav.get(route);
    if (exact) return exact.label;
    // Procura prefixo mais longo
    let best = null;
    for (const [href, entry] of hrefToNav) {
      if (route === href || route.startsWith(`${href}/`)) {
        if (!best || href.length > best.href.length) best = { href, ...entry };
      }
    }
    return best?.label ?? "";
  }

  function getRoles(route) {
    const exact = hrefToNav.get(route);
    if (exact?.roles?.length) return exact.roles;
    let best = null;
    for (const [href, entry] of hrefToNav) {
      if (route === href || route.startsWith(`${href}/`)) {
        if (!best || href.length > best.href.length) best = { href, ...entry };
      }
    }
    if (best?.roles?.length) return best.roles;
    return ["herdado do menu pai / admin"];
  }

  return { entries, hrefToNav, getModule, getMenuLabel, getRoles };
}

// ─── Rotas ─────────────────────────────────────────────────────────────────

function routeFromPage(file, baseRoot) {
  const rel = path.relative(baseRoot, path.dirname(file)).replaceAll("\\", "/");
  if (rel === "" || rel === ".") return "/";
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

function isInterceptingPage(file) {
  return file.includes(`${path.sep}(.)`) || file.includes("/(.)");
}

function collectPages() {
  const publicPages = walk(APP_ROOT, (_, name) => name === "page.tsx").filter(
    (f) => !f.includes(`${path.sep}(app)${path.sep}`),
  );
  const authPages = walk(APP_AUTH_ROOT, (_, name) => name === "page.tsx");

  const all = [
    ...publicPages.map((file) => ({
      file,
      route: routeFromPage(file, APP_ROOT),
      auth: false,
      intercepting: false,
    })),
    ...authPages.map((file) => ({
      file,
      route: routeFromPage(file, APP_AUTH_ROOT),
      auth: true,
      intercepting: isInterceptingPage(file),
    })),
  ];

  // Agrupa por rota — prioriza página não-intercepting
  const byRoute = new Map();
  for (const p of all) {
    const existing = byRoute.get(p.route);
    if (!existing) {
      byRoute.set(p.route, p);
    } else if (existing.intercepting && !p.intercepting) {
      byRoute.set(p.route, { ...p, modalFile: existing.file });
    } else if (!existing.intercepting && p.intercepting) {
      byRoute.set(p.route, { ...existing, modalFile: p.file });
    }
  }

  return [...byRoute.values()].sort((a, b) => a.route.localeCompare(b.route));
}

// ─── Análise de ficheiros ──────────────────────────────────────────────────

function extractImports(content, pageDir) {
  const components = new Set();
  const local = new Set();

  // import from @/components
  for (const m of content.matchAll(
    /from\s+["']@\/components\/([^"']+)["']/g,
  )) {
    components.add(`@/components/${m[1]}`);
  }

  // dynamic import
  for (const m of content.matchAll(
    /import\s*\(\s*["']([^"']+)["']\s*\)/g,
  )) {
    const imp = m[1];
    if (imp.startsWith("@/components/")) components.add(imp);
    else if (imp.startsWith("./") || imp.startsWith("../")) {
      const resolved = path.normalize(path.join(pageDir, imp));
      local.add(relPosix(resolved));
    }
  }

  // import local relativo
  for (const m of content.matchAll(
    /from\s+["'](\.\.?\/[^"']+)["']/g,
  )) {
    const imp = m[1];
    const resolved = path.normalize(path.join(pageDir, imp));
    const rel = relPosix(resolved);
    if (rel.endsWith(".tsx") || rel.endsWith(".ts")) local.add(rel);
  }

  return { components: [...components].sort(), local: [...local].sort() };
}

function inferRouteType(route, content) {
  if (content.includes("redirect(") || content.includes("permanentRedirect("))
    return "redirect";
  if (route.includes("/new") || route.endsWith("/nova") || route.endsWith("/novo"))
    return "formulário (criação)";
  if (route.includes("/edit")) return "formulário (edição)";
  if (route.includes("[") && !route.includes("/new") && !route.includes("/edit"))
    return "detalhe";
  if (
    content.includes("CardSearchInput") ||
    content.includes("<Table") ||
    content.includes("useCollection")
  )
    return "listagem";
  if (content.includes("PageHeader") && content.length < 800) return "hub/redirect";
  return "página";
}

function inferDescription(route, content, menuLabel) {
  const custom = getRouteDescription(route);
  if (custom) return custom;

  if (menuLabel) return menuLabel;

  // PageHeader title (só na própria página, não em imports)
  const titleMatch = content.match(
    /<PageHeader[^>]*\s+title=["'{]([^"'}\n]+)["'}]/,
  );
  if (titleMatch && !titleMatch[1].includes("${")) return titleMatch[1].trim();

  const commentMatch = content.match(/\/\*\*?\s*([^*]+)\*\//);
  if (commentMatch) return commentMatch[1].trim().split("\n")[0];

  const last = route.split("/").filter(Boolean).pop() ?? "";
  if (last === "new" || last === "nova" || last === "novo")
    return `Criar novo registo`;
  if (last === "edit") return `Editar registo`;
  if (last.includes("[")) return `Detalhe / visualização de registo`;

  return `Tela ${route}`;
}

function getRouteDescription(route) {
  if (ROUTE_DESCRIPTIONS[route]) return ROUTE_DESCRIPTIONS[route];
  for (const { pattern, desc } of ROUTE_PATTERNS) {
    if (pattern.test(route)) return desc;
  }
  return null;
}

const ROUTE_DESCRIPTIONS = {
  "/": "Painel principal — dashboard adaptado ao perfil do utilizador (admin, financeiro, cliente, CRM, fauna, etc.)",
  "/login": "Autenticação Firebase — entrada na aplicação",
  "/register": "Registo de novos utilizadores",
  "/forgot-password": "Recuperação de palavra-passe",
  "/politica-privacidade": "Política de privacidade (página pública)",
  "/offline": "Página PWA exibida quando não há ligação à rede",
  "/carteira": "Minha carteira — visão do consultor ou cliente sobre empreendimentos vinculados",
  "/clients": "Listagem e gestão de clientes (cadastro financeiro)",
  "/licenses": "Listagem e gestão de licenças ambientais",
  "/tacs": "Listagem e gestão de TAC — Termo de Ajustamento de Conduta",
  "/compliance": "Condicionantes de licenças — acompanhamento de cumprimento",
  "/car": "Cadastro e consulta de CAR (Cadastro Ambiental Rural)",
  "/outorgas": "Outorgas de recursos hídricos — documentos e processos",
  "/monitoring/manual": "Monitoramento manual de outorgas — lançamentos periódicos",
  "/monitoring/telemetric": "Monitoramento telemétrico em tempo real",
  "/requests": "Pedidos de licenciamento ambiental",
  "/multas-defesas": "Multas ambientais e processos de defesa administrativa",
  "/inspections": "Vistorias técnicas em campo",
  "/oficios": "Ofícios e comunicações oficiais",
  "/analise-ambiental": "Análise geoespacial automatizada com IA (camadas, CAR, áreas de influência)",
  "/reporting": "Relatórios gerados por IA",
  "/configuracoes/mcp-rag": "Hub MCP + RAG — orquestração de IA, ingestão, fontes oficiais e biblioteca",
  "/ai-lab/automations": "Automações de IA para fluxos repetitivos",
  "/georeferenciamento": "Hub de georreferenciamento — processos, rural, urbano, ambiental",
  "/georeferenciamento/processos": "Listagem de processos de georreferenciamento",
  "/crm": "Dashboard CRM — vendas, oportunidades e pipeline",
  "/settings": "Configurações administrativas da plataforma",
  "/users": "Gestão de utilizadores, perfis e pedidos de acesso de representantes",
  "/calendar": "Agenda e compromissos",
  "/coleta-campo": "Campanhas de coleta de campo (inventário florestal offline-first)",
  "/studies/inventario": "Projetos de inventário florestal SIG",
  "/studies/assistant": "Assistente IA (MIRA, MCP, financeiro, geral, RAG)",
  "/cash-flow": "Lançamentos de caixa — receitas e despesas",
  "/commercial-proposals": "Orçamentos e propostas comerciais",
  "/contracts-suppliers": "Contratos com fornecedores",
  "/financial/painel": "Painel financeiro consolidado",
  "/documentos-ambientais/pasta-cliente": "Pasta de documentos do cliente (integração OneDrive)",
  "/external": "Embed de URLs externas (gov.br, NFSe, webmail)",
  "/knowledge-sources": "Base jurídica e fontes de conhecimento para RAG",
  "/intervencoes": "DAIA's — documentos de intervenção e diagnóstico ambiental",
  "/fauna": "Documentos de fauna (módulo documentos ambientais)",
  "/usos-insignificantes": "Usos insignificantes de recursos hídricos",
  "/inspections/reports": "Relatórios de campo das vistorias",
  "/empreendedores": "Cadastro de empreendedores (pessoas físicas/jurídicas)",
  "/projects": "Empreendimentos e projetos ambientais",
  "/responsible-company": "Empresas responsáveis pelo empreendimento",
  "/technical-responsible": "Responsáveis técnicos (RT)",
  "/audit-log": "Log de auditoria de ações na plataforma",
  "/bank-access": "Credenciais e acesso a contas bancárias",
  "/invoices": "Faturas emitidas e recebidas",
  "/suppliers": "Cadastro de fornecedores",
  "/contracts": "Contratos com clientes",
  "/services": "Tabela de serviços e preços",
  "/financial/abc-curve": "Curva ABC de clientes/receitas",
  "/financial/bens-patrimonio": "Bens e património da empresa",
  "/financial/dre-contabil": "Demonstração de resultado (DRE) contábil",
  "/financial/conciliacao": "Conciliação bancária",
  "/financial/orcamento": "Orçamento anual",
  "/financial/export-contabil": "Exportação de dados para contabilidade",
  "/financial/fluxo-projetado": "Fluxo de caixa projetado",
  "/financial/projetos-roi": "Análise de retorno (ROI) de projetos",
  "/financial/platform-subscription-contracts": "Contratos de subscrição da plataforma",
  "/studies/educacao-ambiental": "Programas de Educação Ambiental (PEA)",
  "/studies/eia-rima": "Estudos de Impacto Ambiental (EIA) e RIMA",
  "/studies/cavidades": "Estudos de cavidades naturais e artificiais",
  "/studies/fauna": "Hub de estudos de fauna (inventário, monitoramento, resgate)",
  "/studies/las-ras": "Laudos Ambientais Simplificados (LAS) e Relatórios Ambientais Simplificados (RAS)",
  "/studies/reanalise": "Reanálise de estudos ambientais",
  "/studies/procuracao": "Procurações para representação em processos",
  "/studies/mapas": "Workbench de mapas e análise cartográfica",
  "/studies/outorgas": "Processos de outorga no módulo de estudos",
  "/studies/pca": "Plano de Controle Ambiental (PCA)",
  "/studies/pia": "Plano de Intervenção Ambiental (PIA)",
  "/studies/prada": "Plano de Recuperação de Áreas Degradadas (PRADA)",
  "/studies/barragem": "Estudos e documentação de barragens",
  "/studies/ptrf": "Plano de Trabalho de Recuperação Florestal (PTRF)",
  "/studies/rca": "Relatório de Controle Ambiental (RCA)",
  "/studies/compensacao-ambiental": "Compensação ambiental — espécies, SNUC, APP, etc.",
  "/studies/reserva-legal": "Estudos de reserva legal",
  "/studies/seguranca-barragens": "Segurança de barragens",
  "/studies/analise-socioambiental": "Análise socioambiental",
  "/studies/acao-emergencial": "Programa de Ação Emergencial (PAE)",
  "/studies/ide-sisemanet": "Integração IDE-SisemaNet MG",
  "/studies/relatorios-diversos": "Relatórios técnicos diversos (carvão vegetal, PTRF-PRAD, transporte de resíduos)",
  "/georeferenciamento/rural": "Georreferenciamento de imóveis rurais",
  "/georeferenciamento/urbano": "Georreferenciamento urbano",
  "/georeferenciamento/ambiental": "Georreferenciamento ambiental",
  "/georeferenciamento/campo": "Coleta de vértices em campo",
  "/georeferenciamento/documentos": "Documentos de georreferenciamento",
  "/georeferenciamento/validacoes": "Validações de geometrias e processos",
  "/georeferenciamento/registro": "Registro de georreferenciamento",
  "/georeferenciamento/referencias": "Referências e normas de georef",
  "/crm/clients": "Clientes no módulo CRM",
  "/crm/opportunities": "Oportunidades de venda",
  "/crm/proposals": "Propostas comerciais (atalho CRM)",
  "/crm/reports": "Relatórios do CRM",
  "/crm/team": "Equipa comercial",
  "/crm/settings": "Configurações do CRM",
  "/crm/alerts": "Alertas e notificações CRM",
  "/social-media": "Gestão de redes sociais",
  "/canais": "Canais WhatsApp e Instagram",
  "/settings/company": "Informações da empresa consultora",
  "/settings/appearance": "Aparência e tema da interface",
  "/settings/templates": "Templates de documentos",
  "/settings/files": "Explorador de ficheiros da plataforma",
  "/settings/deleted-backups": "Backups de registos apagados",
  "/settings/onedrive-integration": "Integração Microsoft OneDrive",
  "/settings/ai-local-source": "Fonte local de referências para IA",
  "/consultas": "Consultas técnicas solicitadas",
  "/laudos": "Laudos técnicos ambientais",
  "/ai-lab/rag": "Laboratório RAG — testes de recuperação de contexto",
  "/ai-lab/mcp": "Ferramentas MCP (Model Context Protocol)",
  "/ai-lab/cloud-library": "Biblioteca IA na nuvem (OneDrive)",
};

const ROUTE_PATTERNS = [
  { pattern: /^\/carteira\/[^/]+$/, desc: "Detalhe de cliente/empreendimento na carteira do consultor" },
  { pattern: /^\/clients\/[^/]+\/edit$/, desc: "Editar cadastro de cliente" },
  { pattern: /^\/clients\/new$/, desc: "Cadastrar novo cliente" },
  { pattern: /^\/empreendedores/, desc: "Gestão de empreendedores" },
  { pattern: /^\/projects\/[^/]+\/edit$/, desc: "Editar empreendimento/projeto" },
  { pattern: /^\/projects\/new$/, desc: "Cadastrar novo empreendimento" },
  { pattern: /^\/licenses\/new$/, desc: "Cadastrar nova licença ambiental" },
  { pattern: /^\/licenses\/[^/]+\/edit$/, desc: "Editar licença ambiental" },
  { pattern: /^\/tacs\/new$/, desc: "Cadastrar novo TAC" },
  { pattern: /^\/tacs\/[^/]+\/edit$/, desc: "Editar TAC" },
  { pattern: /^\/requests\/[^/]+\/aia$/, desc: "Fluxo AIA (Avaliação de Impacto Ambiental) do pedido de licenciamento" },
  { pattern: /^\/requests/, desc: "Pedidos de licenciamento ambiental" },
  { pattern: /^\/multas-defesas\/[^/]+$/, desc: "Trâmite de multa ou defesa administrativa" },
  { pattern: /^\/multas-defesas\/nova$/, desc: "Abrir novo processo de multa/defesa" },
  { pattern: /^\/inspections\/new$/, desc: "Registrar nova vistoria técnica" },
  { pattern: /^\/inspections\/[^/]+\/edit$/, desc: "Editar vistoria técnica" },
  { pattern: /^\/oficios\/new$/, desc: "Criar novo ofício" },
  { pattern: /^\/oficios\/[^/]+\/edit$/, desc: "Editar ofício" },
  { pattern: /^\/coleta-campo\/nova$/, desc: "Criar nova campanha de coleta de campo" },
  { pattern: /^\/coleta-campo\/[^/]+\/parcelas/, desc: "Parcela de inventário em campanha de campo" },
  { pattern: /^\/coleta-campo\/[^/]+$/, desc: "Detalhe de campanha de coleta de campo" },
  { pattern: /^\/studies\/inventario\/[^/]+\/arvores$/, desc: "Cadastro de árvores do inventário florestal" },
  { pattern: /^\/studies\/inventario\/[^/]+\/especies$/, desc: "Espécies arbóreas do inventário" },
  { pattern: /^\/studies\/inventario\/[^/]+\/parcelas$/, desc: "Parcelas amostrais do inventário florestal" },
  { pattern: /^\/studies\/inventario\/[^/]+\/formulas$/, desc: "Fórmulas volumétricas do inventário" },
  { pattern: /^\/studies\/inventario\/[^/]+\/calculadora$/, desc: "Calculadora de volumes do inventário florestal" },
  { pattern: /^\/studies\/inventario\/[^/]+\/resultado/, desc: "Resultado de execução de cálculo do inventário" },
  { pattern: /^\/studies\/inventario\/[^/]+$/, desc: "Projeto de inventário florestal — dados gerais, importação e fotos" },
  { pattern: /^\/studies\/fauna/, desc: "Estudos de fauna — inventário, monitoramento ou resgate" },
  { pattern: /^\/studies\/outorgas\/processo/, desc: "Processo de outorga hídrica (wizard completo)" },
  { pattern: /^\/studies\/compensacao-ambiental\/[^/]+$/, desc: "Checklist de compensação ambiental por tipo" },
  { pattern: /^\/studies\/[^/]+\/new$/, desc: "Criar novo documento de estudo técnico" },
  { pattern: /^\/studies\/[^/]+\/[^/]+\/edit$/, desc: "Editar documento de estudo técnico" },
  { pattern: /^\/georeferenciamento\/processos\/[^/]+$/, desc: "Detalhe de processo de georreferenciamento — checklist, vértices e mapa" },
  { pattern: /^\/financial\/projetos-roi\/[^/]+$/, desc: "Caso de análise ROI de projeto" },
  { pattern: /^\/financial\/bens-patrimonio/, desc: "Bens e património" },
  { pattern: /^\/cash-flow/, desc: "Lançamentos de fluxo de caixa" },
  { pattern: /^\/commercial-proposals/, desc: "Orçamentos e propostas comerciais" },
  { pattern: /^\/knowledge-sources/, desc: "Fontes de conhecimento para RAG" },
  { pattern: /^\/consultas/, desc: "Consultas técnicas" },
  { pattern: /^\/laudos/, desc: "Laudos técnicos" },
  { pattern: /^\/crm/, desc: "Módulo CRM" },
  { pattern: /^\/settings/, desc: "Configurações da plataforma" },
];

const MODULE_INTROS = {
  "Minha Carteira":
    "Visão do consultor representante ou cliente titular sobre empreendimentos e documentos vinculados.",
  Painel:
    "Dashboard inicial com widgets por perfil (admin, financeiro, ambiental, cliente, CRM, fauna).",
  Financeiro:
    "Gestão financeira: clientes, contratos, faturas, fornecedores, fluxo de caixa, análises ABC, DRE, orçamento e ROI.",
  Cadastro:
    "Cadastro de empreendedores, empreendimentos (projetos), empresas responsáveis e responsáveis técnicos.",
  "Documentos Ambientais":
    "Licenças, CAR, outorgas, condicionantes, DAIA, fauna, monitoramento e pasta do cliente.",
  "Multas e Defesas":
    "Autos de infração, multas ambientais e petições de defesa administrativa.",
  "Vistoria Técnica":
    "Vistorias em campo, relatórios e inspeções técnicas.",
  Licenciamento:
    "Pedidos de licenciamento ambiental e fluxo AIA.",
  IA:
    "Assistentes IA, análise geoespacial, relatórios, MCP, RAG e automações.",
  "Estudos Técnicos":
    "EIA/RIMA, PEA, PIA, PRADA, inventário florestal, fauna, mapas, outorgas e demais estudos ambientais.",
  Georreferenciamento:
    "Processos de georreferenciamento rural, urbano, ambiental e validações.",
  "Vendas & CRM":
    "CRM, oportunidades, propostas, equipa e canais de comunicação.",
  Webmail:
    "Acesso a webmail e portais externos embutidos.",
  "Ofícios e Comunicações":
    "Gestão de ofícios e comunicações oficiais.",
  Configurações:
    "Configurações da empresa, templates, ficheiros, consultas técnicas, laudos e integrações.",
  Agenda: "Calendário e agenda de compromissos.",
  "Rotas públicas": "Páginas acessíveis sem autenticação.",
  "Outras rotas": "Rotas auxiliares, redirects legados ou sub-rotas dinâmicas.",
};

const COMPONENT_DESCRIPTIONS = {
  "page-header.tsx": "Cabeçalho padrão de páginas — título, descrição e botão voltar",
  "nav-content.tsx": "Menu lateral com filtro por role e grupos colapsáveis",
  "card-search-input.tsx": "Campo de pesquisa reutilizável em listagens em cards",
  "documentos-ambientais-hub-card.tsx": "Card atalho para o hub de documentos ambientais",
  "dynamic-study-form.tsx": "Motor de formulário dinâmico baseado em schema Firestore",
  "mcp-rag-hub.tsx": "Orquestrador do hub MCP+RAG com tabs",
  "study-dynamic-creation-page.tsx": "Página de criação de estudo com schema dinâmico",
  "study-dynamic-edit-page.tsx": "Página de edição de estudo com schema dinâmico",
  "study-documents-list-page.tsx": "Listagem genérica de documentos de estudo",
  "georef-subnav.tsx": "Sub-navegação do módulo de georreferenciamento",
  "georef-section-page.tsx": "Página secção reutilizável de georef",
  "geo-influence-areas-panel.tsx": "Painel de áreas de influência na análise ambiental",
  "study-area-map.tsx": "Mapa Leaflet para área de estudo e polígonos",
  "upload-preparation-dialog.tsx": "Diálogo de preparação e upload de ficheiros",
  "abc-analysis-view.tsx": "Visualização de análise ABC financeira",
  "br-date-input.tsx": "Input de data no formato brasileiro",
  "brl-currency-input.tsx": "Input de moeda BRL",
  "mcp-rag-status-overview.tsx": "Visão geral do estado do hub MCP+RAG",
  "mcp-rag-search-tester.tsx": "Testador de busca RAG",
  "georef-projects-panel.tsx": "Painel de listagem de processos de georef",
  "georef-checklist.tsx": "Checklist de etapas do processo de georef",
  "georef-vertices-import-panel.tsx": "Importação de vértices para georreferenciamento",
  "georef-client-project-fields.tsx": "Campos de cliente e projeto no processo de georef",
  "aia-workflow-panel.tsx": "Painel do fluxo AIA em pedidos de licenciamento",
  "licensing-locational-block.tsx": "Bloco de dados locacionais em licenciamento",
  "coleta-offline-banner.tsx": "Banner de estado offline na coleta de campo",
  "project-roi-badge.tsx": "Badge de ROI em projetos e contratos",
  "project-roi-alerts-panel.tsx": "Alertas de ROI em painel financeiro",
  "project-roi-case-select.tsx": "Seletor de caso de análise ROI",
  "multa-defesa-abertura-acoes.tsx": "Ações de abertura de processo de multa/defesa",
  "multa-defesa-docs-panel.tsx": "Painel de documentos do processo de defesa",
  "multa-defesa-peticao-panel.tsx": "Painel de petição de defesa administrativa",
  "outorga-processo-wizard.tsx": "Wizard completo de processo de outorga",
  "outorga-checklist-panel.tsx": "Checklist de etapas de outorga",
  "compensacao-checklist-panel.tsx": "Checklist de compensação ambiental",
  "chat-widget.tsx": "Widget de chat integrado no layout",
  "upgrade-dialog.tsx": "Diálogo de upgrade de plano",
  "offline-queue-badge.tsx": "Badge de fila de sincronização offline",
  "portal-advertising-layer.tsx": "Camada de publicidade e acesso portal",
  "delegate-access-portfolio-card.tsx": "Card de acesso delegado na carteira",
  "titular-onboarding-card.tsx": "Onboarding do perfil titular (cliente)",
  "profile-navigation-hub-card.tsx": "Hub de navegação do perfil cliente",
  "FirebaseErrorListener.tsx": "Listener de erros Firebase no cliente",
  "theme-provider.tsx": "Provider de tema claro/escuro",
  "theme-toggle.tsx": "Botão de alternância de tema",
};

function componentDescription(filePath) {
  const base = path.basename(filePath);
  if (COMPONENT_DESCRIPTIONS[base]) return COMPONENT_DESCRIPTIONS[base];
  const name = base.replace(/\.tsx$/, "").replace(/-/g, " ");
  if (base.includes("export")) return `Botões de exportação — ${name}`;
  if (base.includes("row-actions")) return `Ações por linha na tabela — ${name}`;
  if (base.includes("panel")) return `Painel de interface — ${name}`;
  if (base.includes("dialog")) return `Diálogo modal — ${name}`;
  if (base.includes("form")) return `Formulário — ${name}`;
  if (filePath.includes("/ui/")) return `Primitivo UI (design system) — ${base}`;
  return `Componente — ${name}`;
}

// ─── Componentes ─────────────────────────────────────────────────────────────

function collectComponents() {
  return walk(COMPONENTS_ROOT, (_, name) => name.endsWith(".tsx")).map(
    (file) => ({
      file,
      rel: relPosix(file),
      folder: path.relative(COMPONENTS_ROOT, path.dirname(file)).replaceAll("\\", "/") || "(raiz)",
      name: path.basename(file, ".tsx"),
    }),
  );
}

const SKIP_APP_FILES = new Set([
  "page.tsx",
  "layout.tsx",
  "loading.tsx",
  "error.tsx",
  "not-found.tsx",
  "template.tsx",
  "default.tsx",
]);

function collectAppColocated() {
  return walk(APP_AUTH_ROOT, (_, name) => name.endsWith(".tsx"))
    .filter((f) => !SKIP_APP_FILES.has(path.basename(f)))
    .map((file) => ({
      file,
      rel: relPosix(file),
      folder: path
        .relative(APP_AUTH_ROOT, path.dirname(file))
        .replaceAll("\\", "/"),
      name: path.basename(file, ".tsx"),
    }));
}

// ─── APIs ──────────────────────────────────────────────────────────────────

function collectApiRoutes() {
  const files = walk(API_ROOT, (_, name) => name === "route.ts");
  return files
    .map((file) => {
      const rel = path.relative(API_ROOT, path.dirname(file)).replaceAll("\\", "/");
      const apiPath = `/api/${rel}`;
      const content = readFileSync(file, "utf8");
      const methods = [];
      if (content.includes("export async function GET")) methods.push("GET");
      if (content.includes("export async function POST")) methods.push("POST");
      if (content.includes("export async function PUT")) methods.push("PUT");
      if (content.includes("export async function PATCH")) methods.push("PATCH");
      if (content.includes("export async function DELETE")) methods.push("DELETE");
      const prefix = apiPath.split("/").slice(0, 4).join("/");
      return { apiPath, file: relPosix(file), methods, prefix };
    })
    .sort((a, b) => a.apiPath.localeCompare(b.apiPath));
}

const API_PREFIX_PURPOSE = {
  "/api/admin": "Operações administrativas (utilizadores, migrações, credenciais)",
  "/api/ai": "Chamadas IA (DeepSeek, enriquecimento de processos)",
  "/api/ai-lab": "AI Lab (autofill, relatórios, importação de referências)",
  "/api/cloud-rag": "RAG na nuvem (OneDrive) — indexação, busca, sync",
  "/api/mcp-rag": "Hub MCP+RAG — overview, fontes oficiais, ingestão",
  "/api/geospatial": "Análise geoespacial (CAR, onda A, streaming)",
  "/api/geo-analyses": "Análises geo persistidas e complementos",
  "/api/mca": "Motor cartográfico MCA (projetos, agentes, debug)",
  "/api/onedrive": "Integração OneDrive (catálogo, sync, autofill)",
  "/api/onedrive-consumer": "OAuth OneDrive consumidor",
  "/api/uploads": "Upload de ficheiros para Storage (licenças, CAR, etc.)",
  "/api/notifications": "Push notifications (FCM)",
  "/api/package": "Planos e pacotes da plataforma",
  "/api/studies": "Schemas de formulários dinâmicos de estudos",
  "/api/study-maps": "Mapas de estudo (export, jobs, perímetro)",
  "/api/multas-defesas": "Sugestões IA para defesas",
  "/api/laudos": "Geração de laudos DOCX",
  "/api/barragens": "Export DOCX barragens",
  "/api/pradas": "Export DOCX PRADA",
};

function apiPurpose(apiPath) {
  for (const [prefix, purpose] of Object.entries(API_PREFIX_PURPOSE)) {
    if (apiPath.startsWith(prefix)) return purpose;
  }
  const segment = apiPath.split("/").pop();
  return `Endpoint API — ${segment}`;
}

// ─── Geração Markdown ───────────────────────────────────────────────────────

function buildComponentRouteMap(pages) {
  const map = new Map();
  for (const p of pages) {
    const content = readFileSync(p.file, "utf8");
    const { components } = extractImports(content, path.dirname(p.file));
    for (const c of components) {
      const key = c.replace("@/components/", "");
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p.route);
    }
  }
  return map;
}

function table(rows, headers) {
  const lines = [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((r) => `| ${r.join(" | ")} |`),
  ];
  return lines.join("\n");
}

function escapeCell(s) {
  return String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function generate() {
  const nav = parseNavigationConfig();
  const pages = collectPages();
  const components = collectComponents();
  const appColocated = collectAppColocated();
  const apis = collectApiRoutes();
  const componentRouteMap = buildComponentRouteMap(pages);

  const intercepting = pages.filter((p) => p.modalFile || p.intercepting);

  // Agrupa rotas por módulo
  const byModule = new Map();
  for (const p of pages) {
    const mod = p.auth === false ? "Rotas públicas" : nav.getModule(p.route);
    if (!byModule.has(mod)) byModule.set(mod, []);
    byModule.get(mod).push(p);
  }

  const moduleOrder = [
    "Rotas públicas",
    "Minha Carteira",
    "Painel",
    "Financeiro",
    "Cadastro",
    "Documentos Ambientais",
    "Multas e Defesas",
    "Vistoria Técnica",
    "Licenciamento",
    "IA",
    "Estudos Técnicos",
    "Georreferenciamento",
    "Vendas & CRM",
    "Webmail",
    "Ofícios e Comunicações",
    "Configurações",
    "Agenda",
    "Outras rotas",
  ];

  const lines = [];

  lines.push("# AmbientaR — Mapa de Rotas, Telas e Componentes");
  lines.push("");
  lines.push(`> Gerado em: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`);
  lines.push(">");
  lines.push("> Regenerar: `npm run docs:routes-map`");
  lines.push("");
  lines.push("Documento mestre com inventário de rotas, componentes e APIs do sistema EcoGestão MG (AmbientaR).");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Sumário
  lines.push("## Sumário");
  lines.push("");
  lines.push(`- [Arquitetura de navegação](#arquitetura-de-navegação)`);
  lines.push(`- [Autenticação e acesso](#autenticação-e-acesso)`);
  lines.push(`- [Índice por módulo](#índice-por-módulo)`);
  for (const mod of moduleOrder) {
    if (byModule.has(mod)) {
      lines.push(`- [${mod}](#${slugify(mod)})`);
    }
  }
  lines.push(`- [Catálogo de componentes (src/components)](#catálogo-de-componentes-srccomponents)`);
  lines.push(`- [Componentes co-localizados (app)](#componentes-co-localizados-app)`);
  lines.push(`- [API Routes](#api-routes)`);
  lines.push(`- [Apêndice](#apêndice)`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Estatísticas
  lines.push("## Estatísticas");
  lines.push("");
  lines.push(`| Métrica | Total |`);
  lines.push(`|---------|-------|`);
  const totalPageFiles = walk(APP_ROOT, (_, name) => name === "page.tsx").length;
  lines.push(`| Rotas URL únicas (deduplicadas) | ${pages.length} |`);
  lines.push(`| Ficheiros page.tsx no total | ${totalPageFiles} |`);
  lines.push(`| Componentes em src/components | ${components.length} |`);
  lines.push(`| Componentes co-localizados em app | ${appColocated.length} |`);
  lines.push(`| API routes | ${apis.length} |`);
  lines.push(`| Rotas com modal intercepting | ${intercepting.length} |`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Arquitetura
  lines.push("## Arquitetura de navegação");
  lines.push("");
  lines.push("```mermaid");
  lines.push("flowchart TB");
  lines.push("  rootLayout[\"app/layout.tsx\"] --> theme[ThemeProvider]");
  lines.push("  rootLayout --> toasts[ToastContainer]");
  lines.push("  appLayout[\"app/(app)/layout.tsx\"] --> sidebar[Sidebar + NavContent]");
  lines.push("  appLayout --> offline[OfflineProvider]");
  lines.push("  appLayout --> portal[PortalAdvertisingLayer]");
  lines.push("  pages[\"page.tsx\"] --> pageHeader[PageHeader]");
  lines.push("  pages --> domain[Componentes de domínio]");
  lines.push("  domain --> ui[\"ui/* primitivos\"]");
  lines.push("```");
  lines.push("");
  lines.push("| Camada | Ficheiro | Função |");
  lines.push("|--------|----------|--------|");
  lines.push("| Layout raiz | `src/app/layout.tsx` | Providers globais, tema, PWA dev |");
  lines.push("| Layout autenticado | `src/app/(app)/layout.tsx` | Sidebar, nav mobile, chat, offline |");
  lines.push("| Menu | `src/lib/navigation-config.ts` | Itens de navegação e roles |");
  lines.push("| Acesso | `src/lib/route-access.ts` | Guards client-side por perfil |");
  lines.push("| Cabeçalho | `src/components/page-header.tsx` | Título e descrição das páginas |");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Auth
  lines.push("## Autenticação e acesso");
  lines.push("");
  lines.push("- **Rotas públicas:** `/login`, `/register`, `/forgot-password`, `/politica-privacidade`, `/offline`");
  lines.push("- **Guard:** `src/app/(app)/layout.tsx` redireciona para `/login` se não autenticado");
  lines.push("- **Roles:** definidos em `users/{uid}.role` no Firestore; menu filtrado por `allNavItems.roles`");
  lines.push("- **Admin:** bypass total em `route-access.ts`");
  lines.push("- **`cliente_autonomo`:** bloqueado em `/ai-lab`, `/studies`, `/georeferenciamento`, `/analise-ambiental`, `/requests`");
  lines.push("- **Middleware:** `src/middleware.ts` — apenas `/api/*` (503 se APIs desativadas)");
  lines.push("");
  lines.push("---");
  lines.push("");

  // Índice módulos
  lines.push("## Índice por módulo");
  lines.push("");
  for (const mod of moduleOrder) {
    const routes = byModule.get(mod);
    if (!routes) continue;
    lines.push(`### ${mod}`);
    lines.push("");
    if (MODULE_INTROS[mod]) lines.push(MODULE_INTROS[mod]);
    lines.push("");
    lines.push(`${routes.length} rota(s). Ver [catálogo detalhado](#${slugify(mod)}).`);
    lines.push("");
  }
  lines.push("---");
  lines.push("");

  // Catálogo de rotas por módulo
  lines.push("## Catálogo de rotas");
  lines.push("");

  for (const mod of moduleOrder) {
    const routes = byModule.get(mod);
    if (!routes) continue;

    lines.push(`### ${mod}`);
    lines.push("");
    if (MODULE_INTROS[mod]) {
      lines.push(MODULE_INTROS[mod]);
      lines.push("");
    }

    const rows = routes.map((p) => {
      const content = readFileSync(p.file, "utf8");
      const menuLabel = nav.getMenuLabel(p.route);
      const desc = inferDescription(p.route, content, menuLabel);
      const type = inferRouteType(p.route, content);
      const roles = nav.getRoles(p.route).join(", ");
      const { components, local } = extractImports(content, path.dirname(p.file));
      const compList = [
        ...components.map((c) => c.replace("@/components/", "")),
        ...local.map((l) => path.basename(l)),
      ]
        .slice(0, 8)
        .join(", ");
      const extra = compList ? `${compList}${components.length + local.length > 8 ? "…" : ""}` : "—";
      const modal = p.modalFile ? " (tem modal intercepting)" : "";
      return [
        `\`${escapeCell(p.route)}\``,
        escapeCell(desc + modal),
        escapeCell(type),
        escapeCell(roles),
        escapeCell(extra),
        `\`${relPosix(p.file)}\``,
      ];
    });

    lines.push(
      table(rows, ["Rota", "Função", "Tipo", "Roles", "Componentes", "Ficheiro"]),
    );
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  // Componentes src/components
  lines.push("## Catálogo de componentes (src/components)");
  lines.push("");

  const byFolder = new Map();
  for (const c of components) {
    if (!byFolder.has(c.folder)) byFolder.set(c.folder, []);
    byFolder.get(c.folder).push(c);
  }

  for (const folder of [...byFolder.keys()].sort()) {
    lines.push(`### ${folder}`);
    lines.push("");
    const rows = byFolder.get(folder).map((c) => {
      const key = c.rel.replace("src/components/", "");
      const routes = componentRouteMap.get(key) ?? [];
      return [
        `\`${c.name}\``,
        escapeCell(componentDescription(c.rel)),
        routes.length ? routes.slice(0, 5).map((r) => `\`${r}\``).join(", ") + (routes.length > 5 ? "…" : "") : "—",
        `\`${c.rel}\``,
      ];
    });
    lines.push(table(rows, ["Componente", "Função", "Usado em rotas", "Caminho"]));
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  // App colocated
  lines.push("## Componentes co-localizados (app)");
  lines.push("");
  lines.push("Formulários, workbenches e componentes específicos de rota em `src/app/(app)/`.");
  lines.push("");

  const byAppFolder = new Map();
  for (const c of appColocated) {
    const top = c.folder.split("/")[0] || "(raiz)";
    if (!byAppFolder.has(top)) byAppFolder.set(top, []);
    byAppFolder.get(top).push(c);
  }

  for (const folder of [...byAppFolder.keys()].sort()) {
    lines.push(`### ${folder}`);
    lines.push("");
    const rows = byAppFolder.get(folder).map((c) => [
      `\`${c.name}\``,
      escapeCell(componentDescription(c.rel)),
      `\`${c.rel}\``,
    ]);
    lines.push(table(rows, ["Componente", "Função", "Caminho"]));
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  // APIs
  lines.push("## API Routes");
  lines.push("");
  lines.push(`Total: **${apis.length}** endpoints em \`src/app/api/\`.`);
  lines.push("");

  const byApiPrefix = new Map();
  for (const a of apis) {
    const parts = a.apiPath.split("/").filter(Boolean);
    const prefix = parts.length >= 3 ? `/${parts.slice(0, 3).join("/")}` : a.apiPath;
    if (!byApiPrefix.has(prefix)) byApiPrefix.set(prefix, []);
    byApiPrefix.get(prefix).push(a);
  }

  for (const prefix of [...byApiPrefix.keys()].sort()) {
    const purpose = API_PREFIX_PURPOSE[prefix] ?? `Grupo ${prefix}`;
    lines.push(`### ${prefix}`);
    lines.push("");
    lines.push(purpose);
    lines.push("");
    const rows = byApiPrefix.get(prefix).map((a) => [
      `\`${a.apiPath}\``,
      a.methods.join(", ") || "—",
      escapeCell(apiPurpose(a.apiPath)),
    ]);
    lines.push(table(rows, ["Endpoint", "Métodos", "Propósito"]));
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  // Apêndice
  lines.push("## Apêndice");
  lines.push("");
  lines.push("### Rotas intercepting (modais)");
  lines.push("");
  lines.push("Navegação client-side abre modal sem mudar URL. Pares página + `(.)`:");
  lines.push("");
  const intRows = intercepting
    .filter((p) => p.modalFile || p.intercepting)
    .map((p) => [
      `\`${p.route}\``,
      `\`${relPosix(p.file)}\``,
      p.modalFile ? `\`${relPosix(p.modalFile)}\`` : "—",
    ]);
  lines.push(table(intRows, ["Rota", "Página", "Modal intercepting"]));
  lines.push("");

  lines.push("### Redirects legados");
  lines.push("");
  lines.push("| Rota | Destino |");
  lines.push("|------|---------|");
  lines.push("| `/monitoring` | `/monitoring/manual` |");
  lines.push("| `/studies` | `/studies/educacao-ambiental` |");
  lines.push("| `/environmental-company` | `/responsible-company` |");
  lines.push("| `/studies/intervencao-ambiental` | `/studies/pia` |");
  lines.push("| `/proposals` | `/commercial-proposals` |");
  lines.push("| `/autos-infracao-defesa` | `/multas-defesas` |");
  lines.push("| `/inventarios`, `/app-campo` | `/coleta-campo` |");
  lines.push("| `/ai-lab` | `/configuracoes/mcp-rag` |");
  lines.push("| `/webmail` | `/external?url=...webmail` |");
  lines.push("");

  lines.push("### Pages Router (legado)");
  lines.push("");
  lines.push("| Ficheiro | Função |");
  lines.push("|----------|--------|");
  lines.push("| `src/pages/_app.tsx` | Wrapper fallback |");
  lines.push("| `src/pages/_document.tsx` | Document HTML fallback |");
  lines.push("| `src/pages/_error.tsx` | Erro global fallback |");
  lines.push("| `src/pages/404.tsx` | 404 fallback |");
  lines.push("");

  lines.push("### Documentação relacionada");
  lines.push("");
  lines.push("- [`docs/ARQUITETURA_ATUAL.md`](docs/ARQUITETURA_ATUAL.md) — arquitetura e roles");
  lines.push("- [`docs/menu-route-audit.md`](docs/menu-route-audit.md) — auditoria automática de rotas");
  lines.push("- [`docs/auditoria-menus-indice.md`](docs/auditoria-menus-indice.md) — índice de auditorias por menu");
  lines.push("- [`AGENTS.md`](AGENTS.md) — guia de desenvolvimento");
  lines.push("");

  return lines.join("\n");
}

// ─── Main ──────────────────────────────────────────────────────────────────

const markdown = generate();
writeFileSync(OUTPUT, markdown, "utf8");
console.log(`✓ Escrito: ${OUTPUT}`);
console.log(`  Tamanho: ${(markdown.length / 1024).toFixed(1)} KB`);
