# Plano de depuração e estabilização do SaaS AmbientaR

> **Objetivo:** percorrer a aplicação **menu por menu, submenu por submenu**, depurar rotas e permissões, reduzir caminhos redundantes, harmonizar sintaxe e consolidar o que já foi implementado (PCA/RCA A–H, socioambiental, geo CAR, etc.) sem quebrar produção.

**Estado atual (baseline):**

| Métrica | Valor |
|---------|------:|
| Páginas `page.tsx` em `(app)` | ~258 |
| Rotas API `route.ts` | ~108 |
| Menus principais na sidebar | 16 grupos + itens soltos |
| Config de navegação | `src/lib/navigation-config.ts` (~1.500 linhas, monolítico) |
| Debug de menu existente | Cadastro, Financeiro (`*-menu-debug.tsx`) |
| Submenu dinâmico | PCA (`pca-menu.ts`); RCA ainda só link único |

**Produção:** Cloud Run (`ambientar`, `southamerica-east1`) via push em `main`.  
**Gate de qualidade:** `npm run apphosting:check` antes de cada merge/deploy.

---

## 1. Princípios de execução

1. **Uma frente por vez** — fechar um submenu (ou grupo coeso) antes de abrir o próximo.
2. **Menu = contrato** — toda rota no menu deve existir, carregar e respeitar `roles`; rotas órfãs viram redirect ou são removidas do código morto.
3. **Caminho canónico único** — aliases só via `redirect()` em `page.tsx` ou `next.config` (nunca dois hrefs no menu para a mesma função).
4. **Diff mínimo** — refatorar rotas em lotes pequenos com redirect permanente; não mover 50 pastas de uma vez.
5. **Registo obrigatório** — cada etapa fecha com entrada em `docs/REGISTRO-DEPURACAO-SAAS.md` (criar na Fase 0).

---

## 2. Metodologia padrão (repetir em cada submenu)

Para **cada** item ou grupo de submenu:

| Passo | Ação | Entregável |
|------:|------|------------|
| A | **Inventário** — listar `href` do menu vs `src/app/(app)/.../page.tsx` | Linha na matriz de rotas |
| B | **Smoke** — abrir lista, novo, editar (se existir), salvar, voltar | Checklist ✅/❌ |
| C | **Roles** — validar `canAccessNavItem` + guards na página/API | Matriz role × rota |
| D | **Nav match** — `getNavDebugInfo(pathname)` deve retornar `encontrado: true` | Breadcrumb correto na sidebar |
| E | **APIs** — listar `/api/*` usadas pela página; testar 200/401/403 | Lista de endpoints |
| F | **Firestore** — coleções lidas/escritas; regras publicadas | Nota em regras se faltar |
| G | **Redirects** — documentar aliases legados | Tabela canónico → alias |
| H | **Lint/typecheck** — `npm run typecheck` no escopo tocado | Zero erros novos |
| I | **Registo** — data, responsável, issues abertas | `REGISTRO-DEPURACAO-SAAS.md` |

**Critério de “feito” por submenu:**

- [ ] Rota canónica definida e no menu (ou removida de propósito)
- [ ] Sem 404/500 no fluxo lista → novo → editar
- [ ] Admin + pelo menos 1 role não-admin testados
- [ ] Breadcrumb/nav debug OK
- [ ] Redirects legados funcionando
- [ ] Entrada no registro de depuração

---

## 3. Fase 0 — Fundação (fazer antes de depurar módulos)

**Duração estimada:** 1–2 dias  
**Prioridade:** bloqueante

### 0.1 Ferramentas de depuração

- [ ] Generalizar `cadastro-menu-debug.tsx` / `financial-menu-debug.tsx` → `src/lib/nav-menu-debug.ts` (factory por `menuLabel`)
- [ ] Painel dev único: menu atual, breadcrumb, roles visíveis, APIs da página (opt-in `NEXT_PUBLIC_NAV_DEBUG=1`)
- [ ] Script `npm run audit:routes` — cruza `navigation-config` + filesystem + redirects conhecidos → JSON/relatório

### 0.2 Modularizar navegação

Extrair de `navigation-config.ts` para ficheiros dedicados (padrão `pca-menu.ts`):

| Ficheiro | Menu |
|----------|------|
| `lib/menus/financeiro-menu.ts` | Financeiro |
| `lib/menus/cadastro-menu.ts` | Cadastro |
| `lib/menus/documentos-ambientais-menu.ts` | Documentos Ambientais |
| `lib/menus/estudos-tecnicos-menu.ts` | Estudos Técnicos |
| `lib/menus/georef-menu.ts` | Georeferenciamento |
| `lib/menus/ia-menu.ts` | IA |
| `lib/menus/crm-menu.ts` | Vendas & CRM |
| `lib/menus/configuracoes-menu.ts` | Configurações |
| `lib/rca-menu.ts` | RCA (submenu A–H, espelhar PCA) |

`navigation-config.ts` passa a **agregar** imports — reduz conflitos de merge e facilita depuração por ficheiro.

### 0.3 Matriz de rotas canónicas

Criar `docs/ROTAS-CANONICAS.md` com colunas:

`menu | submenu | path_canónico | aliases_redirect | coleção_firestore | status`

### 0.4 Política de URLs (decisão explícita)

| Domínio | Convenção proposta | Exemplo |
|---------|-------------------|---------|
| Cadastro, geo, estudos | **PT** (já dominante) | `/empreendedores`, `/georeferenciamento` |
| Financeiro legado | **EN** (manter + não renomear agora) | `/clients`, `/invoices` |
| Config mista | **Unificar gradualmente** | canónico `/configuracoes/*`; `/settings/*` → redirect |

**Não renomear em massa na Fase 0** — só documentar e planear ondas de redirect.

### 0.5 Registro de depuração

- [ ] Criar `docs/REGISTRO-DEPURACAO-SAAS.md` (log por data/menu/issues)

---

## 4. Mapa de menus e ordem de execução

Ordem sugerida: **dependências primeiro** (cadastro alimenta tudo) → **módulos recentes** (validar PCA/RCA/geo) → **legado financeiro** → **satélites**.

```
Fase 0 Fundação
    ↓
Fase 1 Núcleo (Painel, Carteira, Cadastro)
    ↓
Fase 2 Operacional cliente (Documentos Ambientais, Licenciamento, Vistoria)
    ↓
Fase 3 Estudos + IA + Geo (maior superfície)
    ↓
Fase 4 Financeiro + CRM
    ↓
Fase 5 Configurações + satélites
    ↓
Fase 6 Higiene global (rotas órfãs, APIs, performance)
```

---

## 5. Inventário completo — conferência submenu a submenu

> **Fonte de verdade do menu:** `src/lib/navigation-config.ts` (atualizado em jun/2026).  
> **Legenda de colunas:** cada linha é um item a conferir. Marque `[x]` quando passar na metodologia da secção 2.  
> **Rotas filhas:** páginas `new`, `edit`, `[id]` e aliases que devem ser testadas no mesmo ciclo do submenu pai.

### Resumo quantitativo

| Menu principal | Itens no menu | + Rotas filhas (audit) | Fase sugerida |
|----------------|--------------:|------------------------|---------------|
| Minha Carteira | 1 | 1 | 1 |
| Painel | 1 | widgets por role | 1 |
| Financeiro | 23 | ~40 | 6 |
| Cadastro | 3 | ~12 | 1 |
| Documentos Ambientais | 13 | ~35 | 2 |
| Multas e Defesas | 2 | 2 | 2 |
| Vistoria Técnica | 3 | ~6 | 2 |
| Licenciamento | 2 | ~4 | 2 |
| IA | 9 | ~12 | 4 |
| Estudos Técnicos | 48 | ~80 | 3 |
| Georeferenciamento | 11 | ~4 | 5 |
| Vendas & CRM | 9 | ~10 | 7 |
| Webmail | 1 | 0 | 8 |
| Ofícios | 1 | ~3 | 8 |
| Acessos Governamentais | 8 | 0 (externo) | 8 |
| Configurações | 13 | ~20 | 8 |
| Agenda | 1 | 0 | 8 |
| **Total aproximado** | **~149** | **~230** | |

---

### 5.1 Minha Carteira

| ID | Submenu | Rota canónica | Rotas filhas (conferir) | Status |
|----|---------|---------------|-------------------------|--------|
| CAR-01 | Minha Carteira | `/carteira` | `/carteira/[clientId]` | [ ] |

---

### 5.2 Painel

| ID | Submenu | Rota canónica | Rotas filhas (conferir) | Status |
|----|---------|---------------|-------------------------|--------|
| PNL-01 | Painel | `/` | Dashboards: admin, client, technical, financial, gestor, fauna (widgets em `src/app/app/dashboards/`) | [ ] |

**Foco:** carregamento por role, lazy-load, erros de consola, links dos widgets para rotas válidas.

---

### 5.3 Financeiro (23 submenus)

| ID | Submenu | Rota canónica | Rotas filhas (conferir) | Status |
|----|---------|---------------|-------------------------|--------|
| FIN-01 | Acesso Bancário | `/bank-access` | — | [ ] |
| FIN-02 | Clientes | `/clients` | `/clients/new`, `/clients/[id]/edit` | [ ] |
| FIN-03 | Contratos | `/contracts` | `/contracts/new`, `/contracts/[id]/edit` | [ ] |
| FIN-04 | Contratos Plataforma | `/financial/platform-subscription-contracts` | — | [ ] |
| FIN-05 | Contratos-Fornecedores | `/contracts-suppliers` | — | [ ] |
| FIN-06 | Curva ABC | `/financial/abc-curve` | — | [ ] |
| FIN-07 | Bens e Patrimônio | `/financial/bens-patrimonio` | `/financial/bens-patrimonio/new`, `/financial/bens-patrimonio/[id]/edit` | [ ] |
| FIN-08 | DRE Contábil | `/financial/dre-contabil` | — | [ ] |
| FIN-09 | Faturas | `/invoices` | `/invoices/new`, `/invoices/[id]/edit`, intercept `(.)new`, `(.)[id]/edit` | [ ] |
| FIN-10 | Fornecedores | `/suppliers` | `/suppliers/new`, `/suppliers/[id]/edit` | [ ] |
| FIN-11 | Lançamentos de Caixa | `/cash-flow` | `/cash-flow/new`, `/cash-flow/[id]/edit` | [ ] |
| FIN-12 | NFe-Eletrônica | `/external?…nfse.gov.br…` | Abre em iframe/nova aba | [ ] |
| FIN-13 | Orçamentos e Propostas | `/commercial-proposals` | `/commercial-proposals/new`, `/commercial-proposals/[id]/edit` | [ ] |
| FIN-14 | Painel Financeiro | `/financial/painel` | — | [ ] |
| FIN-15 | Projetos & ROI | `/financial/projetos-roi` | `/financial/projetos-roi/[caseId]` | [ ] |
| FIN-16 | Fluxo de Caixa Projetado | `/financial/fluxo-projetado` | — | [ ] |
| FIN-17 | Conciliação Bancária | `/financial/conciliacao` | — | [ ] |
| FIN-18 | Curva ABC Serviços | `/financial/abc-servicos` | — | [ ] |
| FIN-19 | Curva ABC Fornecedores | `/financial/abc-fornecedores` | — | [ ] |
| FIN-20 | Orçamento Anual | `/financial/orcamento` | — | [ ] |
| FIN-21 | Exportação Contábil | `/financial/export-contabil` | — | [ ] |
| FIN-22 | Assistente Financeiro (IA) | `/studies/assistant?tipo=financeiro` | Duplicado no menu IA — unificar href | [ ] |
| FIN-23 | Tabela de Serviços | `/services` | — | [ ] |

**Órfãs relacionadas (não no menu):** `/proposals` — decidir redirect ou entrada no menu.

**Debug existente:** `src/lib/financial-menu-debug.tsx`

---

### 5.4 Cadastro (3 submenus)

| ID | Submenu | Rota canónica | Rotas filhas (conferir) | Status |
|----|---------|---------------|-------------------------|--------|
| CAD-01 | Empreendedores | `/empreendedores` | `/empreendedores/new`, `/empreendedores/[id]/edit` | [ ] |
| CAD-02 | Empreendimentos | `/projects` | `/projects/new`, `/projects/[id]/edit` (fichas listagem A–H) | [ ] |
| CAD-03 | Empresas | `/responsible-company` | `/responsible-company/new`, `/responsible-company/[id]/edit`, intercept `(.)new`, `(.)[id]/edit`; alias `/environmental-company` | [ ] |

**Debug existente:** `src/lib/cadastro-menu-debug.tsx`

---

### 5.5 Documentos Ambientais (13 submenus)

| ID | Submenu | Rota canónica | Rotas filhas (conferir) | Status |
|----|---------|---------------|-------------------------|--------|
| DOC-01 | CAR | `/car` | — | [ ] |
| DOC-02 | Condicionantes | `/compliance` | — | [ ] |
| DOC-03 | CTF/IBAMA | `/ctf-ibama` | vs link externo em Acessos Gov. | [ ] |
| DOC-04 | DAIA's | `/intervencoes` | — | [ ] |
| DOC-05 | Fauna (documento) | `/fauna` | Diferente de `/studies/fauna` (estudo) | [ ] |
| DOC-06 | Licenças | `/licenses` | `/licenses/new`, `/licenses/[id]/edit`, intercept `(.)new`, `(.)[id]/edit` | [ ] |
| DOC-07 | MTR-Declaração | `/mtr-declaracao` | — | [ ] |
| DOC-08 | Pasta do cliente | `/documentos-ambientais/pasta-cliente` | — | [ ] |
| DOC-09 | Monitoramento → Lançamento Manual | `/monitoring/manual` | alias `/monitoring` | [ ] |
| DOC-10 | Monitoramento → Telemetria | `/monitoring/telemetric` | — | [ ] |
| DOC-11 | Outorgas (documento) | `/outorgas` | `/outorgas/new`, `/outorgas/[id]/edit`, intercept `(.)new`, `(.)[id]/edit` | [ ] |
| DOC-12 | Usos Insignificantes | `/usos-insignificantes` | — | [ ] |
| DOC-13 | Relatórios de Campo | `/inspections/reports` | **Duplicata** com Vistoria Técnica VIS-03 | [ ] |

---

### 5.6 Multas e Defesas (2 submenus)

| ID | Submenu | Rota canónica | Rotas filhas (conferir) | Status |
|----|---------|---------------|-------------------------|--------|
| MUL-01 | Consultar multas e defesas | `/multas-defesas` | `/multas-defesas/[id]`; alias `/autos-infracao-defesa` | [ ] |
| MUL-02 | Nova multa / processo | `/multas-defesas/nova` | — | [ ] |

---

### 5.7 Vistoria Técnica (3 submenus)

| ID | Submenu | Rota canónica | Rotas filhas (conferir) | Status |
|----|---------|---------------|-------------------------|--------|
| VIS-01 | Consultar vistorias | `/inspections` | `/inspections/[id]/edit` | [ ] |
| VIS-02 | Nova vistoria | `/inspections/new` | — | [ ] |
| VIS-03 | Relatórios de Campo | `/inspections/reports` | **Duplicata** com DOC-13 | [ ] |

---

### 5.8 Licenciamento (2 submenus)

| ID | Submenu | Rota canónica | Rotas filhas (conferir) | Status |
|----|---------|---------------|-------------------------|--------|
| LIC-01 | Consultar trâmites | `/requests` | `/requests/[id]/edit` | [ ] |
| LIC-02 | Nova solicitação | `/requests/new` | Integração localizador CAR/GPS | [ ] |

---

### 5.9 IA (9 submenus)

| ID | Submenu | Rota canónica | Rotas filhas (conferir) | Status |
|----|---------|---------------|-------------------------|--------|
| IA-01 | Águas / MIRA-IGAM | `/studies/assistant?tipo=mira` | Página única `assistant` — validar `tipo` | [ ] |
| IA-02 | Análise Geoespacial (IA) | `/analise-ambiental` | — | [ ] |
| IA-03 | Análise Socioambiental | `/studies/analise-socioambiental` | wizard, execução, export PDF | [ ] |
| IA-04 | Cruzamento de dados | `/studies/assistant?tipo=mcp` | — | [ ] |
| IA-05 | Custos e contratos | `/studies/assistant?tipo=financeiro` | Duplicata FIN-22 | [ ] |
| IA-06 | Legislação e estudos | `/studies/assistant?tipo=geral` | — | [ ] |
| IA-07 | Relatórios de IA | `/reporting` | — | [ ] |
| IA-08 | Síntese de texto | `/studies/assistant?tipo=rag` | — | [ ] |
| IA-09 | Automações → Automações IA | `/ai-lab/automations` | — | [ ] |

**Rotas IA/admin fora do submenu (conferir na mesma fase):**

| ID | Rota | Nota | Status |
|----|------|------|--------|
| IA-X01 | `/ai-lab` | redirect → `/configuracoes/mcp-rag` | [ ] |
| IA-X02 | `/configuracoes/mcp-rag` | hub MCP+RAG (canónico admin) | [ ] |
| IA-X03 | `/ai-lab/cloud-library` | Biblioteca OneDrive | [ ] |
| IA-X04 | `/ai-lab/mcp` | — | [ ] |
| IA-X05 | `/ai-lab/rag` | — | [ ] |
| IA-X06 | `/knowledge-sources` | **Órfã** — não está no menu | [ ] |

---

### 5.10 Estudos Técnicos (48 entradas no menu)

#### 5.10.1 Estudos — lista principal

| ID | Submenu | Rota canónica | Rotas filhas (conferir) | Status |
|----|---------|---------------|-------------------------|--------|
| EST-01 | Programa de Educação Ambiental | `/studies/educacao-ambiental` | `/studies/educacao-ambiental/novo` | [ ] |
| EST-02 | Programa de Ação Emergencial | `/studies/acao-emergencial` | — | [ ] |
| EST-03 | EIA/RIMA | `/studies/eia-rima` | `/studies/eia-rima/new`, `/studies/eia-rima/[id]/edit`, intercept `(.)new`, `(.)[id]/edit` | [ ] |
| EST-04 | Estudo de Cavidades | `/studies/cavidades` | — | [ ] |
| EST-05 | Estudos de Fauna | `/studies/fauna` | ver tabela 5.10.2 | [ ] |
| EST-06 | IDE-SisemaNet | `/studies/ide-sisemanet` | — | [ ] |
| EST-07 | Inventário Florestal | `/studies/inventario` | `/studies/inventario/[id]`, `/studies/inventario/[id]/calculadora`, `/studies/inventario/[id]/resultado/[runId]` | [ ] |
| EST-08 | Coleta de campo | `/coleta-campo` | `/coleta-campo/nova`, `/coleta-campo/[id]`, `/coleta-campo/[id]/parcelas/[parcelaId]`; aliases `/inventarios/*`, `/app-campo` | [ ] |
| EST-09 | LAS-RAS | `/studies/las-ras` | — | [ ] |
| EST-10 | Reanálise | `/studies/reanalise` | `/studies/reanalise/new` | [ ] |
| EST-11 | Procuração | `/studies/procuracao` | `/studies/procuracao/[id]/edit` | [ ] |
| EST-12 | Mapas | `/studies/mapas` | — | [ ] |
| EST-13 | Outorgas → Processos | `/studies/outorgas` | vs `/outorgas` (documento) | [ ] |
| EST-14 | Outorgas → Nova outorga | `/studies/outorgas/new` | — | [ ] |
| EST-15 | PIA | `/studies/pia` | `/studies/pia/new`, `/studies/pia/[id]/edit`, intercept; alias `/studies/intervencao-ambiental` | [ ] |
| EST-16 | PRADA | `/studies/prada` | `/studies/prada/new`, `/studies/prada/[id]/edit`, intercept | [ ] |
| EST-17 | Projeto Técnico de Barragem | `/studies/barragem` | — | [ ] |
| EST-18 | Cadastro de Piscinão (off-stream) | `/studies/piscinao-off-stream` | — | [ ] |
| EST-19 | PTRF | `/studies/ptrf` | `/studies/ptrf/new`, `/studies/ptrf/[id]/edit`, intercept | [ ] |
| EST-20 | RCA → Lista | `/studies/rca` | `/studies/rca/new`, `/studies/rca/[id]/edit`, intercept; ver 5.10.4 | [ ] |
| EST-21 | Relatórios Diversos | `/studies/relatorios-diversos` | ver 5.10.3 | [ ] |
| EST-22 | MTR-MG (resíduos) | `/studies/mtr` | vs `/mtr-declaracao` (documento) | [ ] |
| EST-23 | Reserva Legal | `/studies/reserva-legal` | — | [ ] |
| EST-24 | Segurança de Barragens | `/studies/seguranca-barragens` | — | [ ] |

**Redirect legado:** `/studies` → `/studies/educacao-ambiental`

#### 5.10.2 Estudos de Fauna — rotas filhas

| ID | Sub-rota | Path | Status |
|----|----------|------|--------|
| EST-05a | Hub fauna | `/studies/fauna` | [ ] |
| EST-05b | Inventário | `/studies/fauna/inventario`, `/studies/fauna/inventario/[id]` | [ ] |
| EST-05c | Inventário relatório | `/studies/fauna/inventario-relatorio`, `…/[id]` | [ ] |
| EST-05d | Monitoramento | `/studies/fauna/monitoramento`, `…/[id]` | [ ] |
| EST-05e | Monitoramento relatório | `/studies/fauna/monitoramento-relatorio`, `…/[id]` | [ ] |
| EST-05f | Resgate | `/studies/fauna/resgate`, `/studies/fauna/resgate/[id]` | [ ] |
| EST-05g | Resgate relatório | `/studies/fauna/resgate-relatorio`, `…/[id]` | [ ] |

#### 5.10.3 Relatórios Diversos — rotas filhas

| ID | Sub-rota | Path | Status |
|----|----------|------|--------|
| EST-21a | Índice | `/studies/relatorios-diversos` | [ ] |
| EST-21b | Carvão vegetal | `/studies/relatorios-diversos/carvao-vegetal` | [ ] |
| EST-21c | PTRF-PRAD | `/studies/relatorios-diversos/ptrf-prad` | [ ] |
| EST-21d | Transporte resíduos | `/studies/relatorios-diversos/transporte-residuos` | [ ] |

#### 5.10.4 PCA — submenu Listagem A–H (9 entradas)

| ID | Submenu | Rota canónica | Status |
|----|---------|---------------|--------|
| PCA-00 | Lista de PCAs | `/studies/pca` | [ ] |
| PCA-A | Listagem A — minerárias | `/studies/pca/new?listagem=A` | [ ] |
| PCA-B | Listagem B — metalúrgica | `/studies/pca/new?listagem=B` | [ ] |
| PCA-C | Listagem C — química | `/studies/pca/new?listagem=C` | [ ] |
| PCA-D | Listagem D — alimentícia | `/studies/pca/new?listagem=D` | [ ] |
| PCA-E | Listagem E — infraestrutura | `/studies/pca/new?listagem=E` | [ ] |
| PCA-F | Listagem F — resíduos | `/studies/pca/new?listagem=F` | [ ] |
| PCA-G | Listagem G — agrossilvipastoris | `/studies/pca/new?listagem=G` | [ ] |
| PCA-H | Listagem H — outras | `/studies/pca/new?listagem=H` | [ ] |

Rotas filhas: `/studies/pca/[id]/edit`, intercept `(.)new`, `(.)[id]/edit`

#### 5.10.5 RCA — submenu Listagem A–H (a implementar no menu; conferir código)

| ID | Submenu | Rota canónica | Status |
|----|---------|---------------|--------|
| RCA-00 | Lista de RCAs | `/studies/rca` | [ ] |
| RCA-A | Listagem A | `/studies/rca/new?listagem=A` | [ ] |
| RCA-B | Listagem B | `/studies/rca/new?listagem=B` | [ ] |
| RCA-C | Listagem C | `/studies/rca/new?listagem=C` | [ ] |
| RCA-D | Listagem D | `/studies/rca/new?listagem=D` | [ ] |
| RCA-E | Listagem E | `/studies/rca/new?listagem=E` | [ ] |
| RCA-F | Listagem F | `/studies/rca/new?listagem=F` | [ ] |
| RCA-G | Listagem G | `/studies/rca/new?listagem=G` | [ ] |
| RCA-H | Listagem H | `/studies/rca/new?listagem=H` | [ ] |

**Tarefa:** criar `rca-menu.ts` + `buildRcaNavSubItems()` espelhando PCA.

#### 5.10.6 Compensação Ambiental (6 submenus)

| ID | Submenu | Rota canónica | Status |
|----|---------|---------------|--------|
| CMP-01 | Visão geral | `/studies/compensacao-ambiental` | [ ] |
| CMP-02 | Espécies protegidas | `/studies/compensacao-ambiental/especies` | [ ] |
| CMP-03 | SNUC | `/studies/compensacao-ambiental/snuc` | [ ] |
| CMP-04 | Mata Atlântica | `/studies/compensacao-ambiental/mata-atlantica` | [ ] |
| CMP-05 | Minerária | `/studies/compensacao-ambiental/mineraria` | [ ] |
| CMP-06 | Intervenção em APP | `/studies/compensacao-ambiental/app` | [ ] |

---

### 5.11 Georeferenciamento (11 submenus)

| ID | Submenu | Rota canónica | Rotas filhas (conferir) | Status |
|----|---------|---------------|-------------------------|--------|
| GEO-01 | Painel | `/georeferenciamento` | — | [ ] |
| GEO-02 | Trâmites fundiários | `/georeferenciamento/processos` | `/georeferenciamento/processos/[id]` | [ ] |
| GEO-03 | Rural (SIGEF/INCRA) | `/georeferenciamento/rural` | — | [ ] |
| GEO-04 | Urbano (cartório) | `/georeferenciamento/urbano` | — | [ ] |
| GEO-05 | CAR / SICAR | `/georeferenciamento/ambiental` | vs `/car` (DOC-01) | [ ] |
| GEO-06 | Histórico CAR | `/georeferenciamento/historico-car` | — | [ ] |
| GEO-07 | Campo e levantamento | `/georeferenciamento/campo` | — | [ ] |
| GEO-08 | Documentação técnica | `/georeferenciamento/documentos` | — | [ ] |
| GEO-09 | Validações | `/georeferenciamento/validacoes` | — | [ ] |
| GEO-10 | Cartório e registro | `/georeferenciamento/registro` | — | [ ] |
| GEO-11 | Referências normativas | `/georeferenciamento/referencias` | — | [ ] |

**APIs críticas:** `/api/geospatial/*`, `/api/geospatial/resolve-location`, `/api/geospatial/conecta-gov/*`

---

### 5.12 Vendas & CRM (9 submenus)

| ID | Submenu | Rota canónica | Rotas filhas (conferir) | Status |
|----|---------|---------------|-------------------------|--------|
| CRM-01 | Alertas & Notificações | `/crm/alerts` | — | [ ] |
| CRM-02 | Configurações CRM | `/crm/settings` | — | [ ] |
| CRM-03 | Equipe & Desempenho | `/crm/team` | — | [ ] |
| CRM-04 | Gestão de Clientes | `/crm/clients` | — | [ ] |
| CRM-05 | Mídias Sociais | `/social-media` | — | [ ] |
| CRM-06 | Oportunidades & Pipeline | `/crm/opportunities` | `/crm/new`, `/crm/[id]/edit` | [ ] |
| CRM-07 | Painel de Vendas | `/crm` | — | [ ] |
| CRM-08 | Relatórios & Análises | `/crm/reports` | — | [ ] |
| CRM-09 | Vendas & Propostas | `/crm/proposals` | — | [ ] |

---

### 5.13 Configurações (13 submenus)

| ID | Submenu | Rota canónica | Rotas filhas (conferir) | Status |
|----|---------|---------------|-------------------------|--------|
| CFG-01 | MCP + RAG / Inteligência do Sistema | `/configuracoes/mcp-rag` | hub IA admin | [ ] |
| CFG-02 | Backup de Dados Apagados | `/settings/deleted-backups` | — | [ ] |
| CFG-03 | Explorador de Arquivos | `/settings/files` | — | [ ] |
| CFG-04 | Consultas Técnicas | `/consultas` | `/consultas/new`, `/consultas/[id]`, `/consultas/[id]/edit` | [ ] |
| CFG-05 | Laudos | `/laudos` | `/laudos/new`, `/laudos/[id]` | [ ] |
| CFG-06 | Canais (WhatsApp/IG) | `/canais` | — | [ ] |
| CFG-07 | Identidade Visual | `/settings#identidade-visual` | secção em `/settings` | [ ] |
| CFG-08 | Informações da Empresa | `/settings/company` | — | [ ] |
| CFG-09 | Log de Auditoria | `/audit-log` | — | [ ] |
| CFG-10 | Responsáveis Técnicos | `/technical-responsible` | `/technical-responsible/new`, `/technical-responsible/[id]/edit`, intercept | [ ] |
| CFG-11 | Aparência | `/settings/appearance` | — | [ ] |
| CFG-12 | Templates | `/settings/templates` | `/settings/templates/rca` | [ ] |
| CFG-13 | Usuários | `/users` | aprovação representantes | [ ] |

**Rotas settings fora do menu (conferir na mesma fase):**

| ID | Rota | Status |
|----|------|--------|
| CFG-X01 | `/settings` | [ ] |
| CFG-X02 | `/settings/ai-local-source` | [ ] |
| CFG-X03 | `/settings/onedrive-integration` | [ ] |

**Plano:** unificar `/settings/*` → `/configuracoes/*` com redirects (onda 2).

---

### 5.14 Itens soltos e externos

| ID | Menu | Rota canónica | Notas | Status |
|----|------|---------------|-------|--------|
| SAT-01 | Webmail | `/webmail` | redirect para URL externa | [ ] |
| SAT-02 | Ofícios | `/oficios` | `/oficios/new` | [ ] |
| SAT-03 | Agenda | `/calendar` | — | [ ] |

#### Acessos Governamentais (links externos via `/external`)

| ID | Submenu | Status |
|----|---------|--------|
| GOV-01 | Consulta Intervenção Ambiental | [ ] |
| GOV-02 | Consulta Licenciamento | [ ] |
| GOV-03 | Consulta Outorgas | [ ] |
| GOV-04 | CTF/IBAMA (externo) | [ ] |
| GOV-05 | IDE-SisemaNet-MG | [ ] |
| GOV-06 | SEI-IBAMA | [ ] |
| GOV-07 | SEI-MG | [ ] |
| GOV-08 | SLA-Ecossistemas/MG | [ ] |

**Conferência:** URL abre, título correto, `newTab` quando aplicável.

---

### 5.15 Ordem de execução por fase (referência rápida)

| Fase | Menus (secções) | IDs aproximados |
|------|-----------------|-----------------|
| 1 | 5.1, 5.2, 5.4 | CAR, PNL, CAD |
| 2 | 5.5, 5.6, 5.7, 5.8 | DOC, MUL, VIS, LIC |
| 3 | 5.10 | EST, PCA, RCA, CMP |
| 4 | 5.9 | IA, IA-X |
| 5 | 5.11 | GEO |
| 6 | 5.3 | FIN |
| 7 | 5.12 | CRM |
| 8 | 5.13, 5.14 | CFG, SAT, GOV |

---

### Fase 9 — Higiene global (após menus)

- [ ] **Rotas órfãs** — páginas sem entrada no menu (proposals?, knowledge-sources?, proposals)
- [ ] **108 APIs** — inventário; marcar deprecated; garantir auth consistente
- [ ] **Intercept routes** — 24 rotas `(.)*` ; testar modal vs navegação direta
- [ ] **Middleware** — `ENABLE_NEXT_API_ROUTES` documentado em produção
- [ ] **PWA/offline** — rotas críticas de campo (`coleta-campo`, `app-campo`)
- [ ] **Firestore rules** — alinhar com cada módulo depurado; `npm run deploy:rules`
- [ ] **Bundle** — lazy load de mapas, PDF, docx por módulo

---

## 6. Redução de caminhos (plano de consolidação)

### 6.1 Redirects a manter (já no código)

| Alias | Canónico |
|-------|----------|
| `/inventarios`, `/inventarios/*` | `/coleta-campo/*` |
| `/app-campo` | `/coleta-campo` |
| `/environmental-company` | `/responsible-company` |
| `/autos-infracao-defesa` | `/multas-defesas` |
| `/studies/intervencao-ambiental` | `/studies/pia` |
| `/monitoring` | `/monitoring/manual` |
| `/ai-lab` | `/configuracoes/mcp-rag` |
| `/studies` | `/studies/educacao-ambiental` |

### 6.2 Duplicatas de menu a resolver

| Função | Onde aparece hoje | Decisão proposta |
|--------|-------------------|------------------|
| Relatórios de campo | Documentos Ambientais + Vistoria | Manter só em **Vistoria Técnica** |
| CTF/IBAMA | Documentos + Acessos Gov. | Interno: Documentos; externo: Acessos Gov. |
| Assistente financeiro | Financeiro + IA | Um href; segundo item vira âncora mesmo URL |
| CAR | `/car` vs `/georeferenciamento/ambiental` | Documentar: cadastro documento vs painel geo |

### 6.3 Melhorias de sintaxe/caminhos (onda 2 — após estabilizar)

- RCA: submenu `buildRcaNavSubItems()` igual ao PCA
- Unificar `/settings` → `/configuracoes` com redirects
- Query params tipados: `?listagem=X`, `?tipo=Y` → enums em `src/lib/routes.ts`
- Remover pastas vazias/legado após 1 release com redirects

---

## 7. Testes por etapa

### Automatizável (introduzir na Fase 0)

```bash
npm run typecheck
npm run lint
npm run apphosting:check
npm run audit:routes   # a criar
```

### Manual (por submenu)

1. Login como **admin**
2. Login como role **mínimo** do submenu
3. Lista carrega sem erro de consola
4. Criar registro → salvar → reabrir
5. Editar → salvar
6. Upload/anexo (se houver)
7. Export PDF/DOCX (se houver)
8. Mobile 375px — sidebar e formulário usáveis

### Produção pós-deploy

- Smoke nas 5 rotas mais críticas do módulo fechado
- Verificar Cloud Run logs (5 min) por erros 5xx

---

## 8. Cronograma indicativo

| Fase | Escopo | Duração estimada |
|------|--------|------------------|
| 0 | Fundação (tools + modular nav) | 1–2 dias |
| 1 | Núcleo + Cadastro | 2–3 dias |
| 2 | Doc. ambientais + Licenciamento + Vistoria | 3–4 dias |
| 3 | Estudos (10 ondas) | 2–3 semanas |
| 4 | IA | 3–4 dias |
| 5 | Georeferenciamento | 2–3 dias |
| 6 | Financeiro (23 itens, sec. 5.3) | 3–5 dias |
| 7 | CRM (9 itens, sec. 5.12) | 2 dias |
| 8 | Config + satélites | 2–3 dias |
| 9 | Higiene global | contínuo |

**Total:** ~4–6 semanas em ritmo de consultoria (paralelizável por área se 2+ devs).

---

## 9. Riscos e mitigação

| Risco | Mitigação |
|-------|-----------|
| Renomear rotas quebra bookmarks | Sempre redirect 308/ permanent em `page.tsx` |
| Menu e filesystem divergem | Script `audit:routes` no CI |
| PCA/RCA regressão | Smoke por listagem A–H após cada onda |
| Regras Firestore desatualizadas | `deploy:rules` no checklist de cada módulo com coleção nova |
| Deploy quebra APIs | `ENABLE_NEXT_API_ROUTES=true` em Cloud Run (já no workflow) |

---

## 10. Próximo passo imediato

**Começar pela Fase 0** (1–2 dias):

1. Criar `docs/REGISTRO-DEPURACAO-SAAS.md` e `docs/ROTAS-CANONICAS.md` (esqueleto)
2. Implementar `npm run audit:routes`
3. Extrair primeiro menu modular (`cadastro-menu.ts`) como piloto
4. Implementar `rca-menu.ts` + submenu A–H (quick win alinhado ao PCA)
5. Fechar **Fase 1.3–1.5** (Cadastro) como primeiro ciclo completo da metodologia

Quando a Fase 0 estiver pronta, cada sessão de trabalho segue: **um submenu → checklist → registro → commit pequeno → push → smoke produção**.

---

## Referências no repositório

- Navegação: `src/lib/navigation-config.ts`
- Debug nav: `src/lib/nav-debug.ts`, `*-menu-debug.tsx`
- PCA submenu: `src/lib/pca-menu.ts`
- RCA inventário: `docs/RCA-LISTAGEM-INVENTARIO.md`
- Roles: `src/lib/role-guards.ts`
- Plano macro produto: `docs/PLANO-IMPLEMENTACAO.md`
