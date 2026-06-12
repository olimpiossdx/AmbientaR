# Registro de depuração SaaS AmbientaR

Ordem: **alfabética por menu principal** (plano em `PLANO-DEPURACAO-ESTABILIZACAO-SAAS.md`).

Legenda status: `OK` | `CORRIGIDO` | `PENDENTE` | `N/A`

---

## Acessos Governamentais (GOV-01 … GOV-08)

| ID | Submenu | Ação | Status |
|----|---------|------|--------|
| GOV-01 … GOV-08 | Links externos SEI/SLA/MG/IBAMA | Extraídos para `src/lib/gov-access-menu.ts`; URLs legíveis via `URLSearchParams` | CORRIGIDO |

---

## Agenda (SAT-03)

| ID | Rota | Ação | Status |
|----|------|------|--------|
| SAT-03 | `/calendar` | Página existe; CRUD Firestore `appointments` | OK |

---

## Cadastro (CAD-01 … CAD-03)

| ID | Submenu | Ação | Status |
|----|---------|------|--------|
| CAD-01 | Empreendedores | Rotas `/empreendedores/*` auditadas no `audit:routes` | OK |
| CAD-02 | Empreendimentos | Rotas `/projects/*` | OK |
| CAD-03 | Empresas | Redirect `/environmental-company` → `/responsible-company` já existente | OK |

---

## Configurações

| ID | Submenu | Ação | Status |
|----|---------|------|--------|
| CFG-01 | MCP + RAG | `/configuracoes/mcp-rag` | OK |
| CFG-02 | Central de Configurações | Adicionado `/settings` ao menu | CORRIGIDO |
| CFG-03 | Backup de Dados Apagados | `/settings/deleted-backups` | OK |
| CFG-04 | Explorador de Arquivos | `/settings/files` | OK |
| CFG-05 | Consultas Técnicas | `/consultas/*` | OK |
| CFG-06 | Laudos | `/laudos/*` | OK |
| CFG-07 | Canais | `/canais` | OK |
| CFG-08 | Identidade Visual | `/settings#identidade-visual` | OK |
| CFG-09 | Informações da Empresa | `/settings/company` | OK |
| CFG-10 | Log de Auditoria | `/audit-log` | OK |
| CFG-11 | Responsáveis Técnicos | `/technical-responsible/*` | OK |
| CFG-12 | Aparência | `/settings/appearance` | OK |
| CFG-13 | Templates | `/settings/templates`, `/settings/templates/rca` | OK |
| CFG-14 | Usuários | `/users` | OK |
| CFG-15 | Fontes de Conhecimento (RAG) | Entrada no menu `/knowledge-sources` | CORRIGIDO |
| CFG-16 | Ferramentas MCP / Lab RAG | `/ai-lab/mcp`, `/ai-lab/rag` no menu | CORRIGIDO |
| CFG-17 | Biblioteca OneDrive | `/ai-lab/cloud-library` | CORRIGIDO |
| CFG-18 | Integração OneDrive | `/settings/onedrive-integration` | CORRIGIDO |
| CFG-19 | Importação IA (legado) | `/settings/ai-local-source` no menu | CORRIGIDO |

---

## Documentos Ambientais

| ID | Submenu | Ação | Status |
|----|---------|------|--------|
| DOC-01 … DOC-10 | CAR … Telemetria | Rotas auditadas (`audit:routes`) | OK |
| DOC-11 | Outorgas | Criadas `/outorgas/new` e `/outorgas/[id]/edit` (antes só intercept modal → 404 em URL direta) | CORRIGIDO |
| DOC-12 | Usos Insignificantes | Rota OK | OK |
| DOC-13 | Relatórios de Campo | Removido duplicata do menu (mantido só em Vistoria Técnica) | CORRIGIDO |

---

## Estudos Técnicos

| ID | Submenu | Ação | Status |
|----|---------|------|--------|
| EST-* | Lista principal (edu, EIA, fauna, inventário, etc.) | Rotas auditadas; PCA/RCA `[id]/edit` OK | OK |
| EST-15 | PIA / intervenção ambiental | Redirects `intervencao-ambiental/*` → `/studies/pia/*` | CORRIGIDO |
| EST-21 | Relatórios diversos | Submenu com 4 tipos no nav | CORRIGIDO |
| PCA-* / RCA-* | Listagens A–H | Submenus dinâmicos (`pca-menu`, `rca-menu`) | CORRIGIDO |
| CMP-* | Compensação ambiental | Rotas `/studies/compensacao-ambiental/[tipo]` validadas | OK |

---

## Financeiro

| ID | Submenu | Ação | Status |
|----|---------|------|--------|
| FIN-01 … FIN-23 | Todos os submenus | Rotas e páginas existem (`audit:routes` 0 órfãs) | OK |
| FIN-12 | NFe-Eletrônica | URL extraída para `financeiro-external-menu.ts` | CORRIGIDO |
| FIN-22 / IA-05 | Assistente financeiro | Removida duplicata no menu IA (canónico: Financeiro) | CORRIGIDO |

---

## Georeferenciamento (GEO-01 … GEO-11)

| ID | Submenu | Ação | Status |
|----|---------|------|--------|
| GEO-01 | Painel | `georef-menu.ts` + hub com `GEOREF_HUB_MODULES` (inclui Histórico CAR e Referências) | CORRIGIDO |
| GEO-02 | Trâmites fundiários | `/georeferenciamento/processos` (+ `[id]` dinâmico) | OK |
| GEO-03 … GEO-11 | Rural … Referências | Rotas auditadas; `/car` (documento) ≠ `/georeferenciamento/ambiental` (painel geo) | OK |

---

## IA (IA-01 … IA-08)

| ID | Submenu | Ação | Status |
|----|---------|------|--------|
| IA-01 … IA-08 | Assistentes, análises, relatórios, automações | Extraído para `ia-menu.ts`; sem duplicata assistente financeiro | CORRIGIDO |

---

## Licenciamento

| ID | Submenu | Ação | Status |
|----|---------|------|--------|
| LIC-01 | Listagem | `/requests` | OK |
| LIC-02 | Novo pedido | `/requests/new` | OK |

---

## Minha Carteira

| ID | Submenu | Ação | Status |
|----|---------|------|--------|
| CAR-01 | Lista | `/carteira` | OK |
| CAR-02 | Detalhe cliente | `/carteira/[clientId]` | OK |

---

## Multas e Defesas

| ID | Submenu | Ação | Status |
|----|---------|------|--------|
| MUL-01 | Listagem | `/multas-defesas` | OK |
| MUL-02 | Nova defesa | `/multas-defesas/nova` | OK |

---

## Ofícios

| ID | Submenu | Ação | Status |
|----|---------|------|--------|
| OFI-01 | Listagem | `/oficios` | OK |
| OFI-02 | Novo | `/oficios/new` | OK |
| OFI-03 | Edição | `/oficios/[id]/edit` | OK |

---

## Painel

| ID | Submenu | Ação | Status |
|----|---------|------|--------|
| PNL-01 | Dashboard | `/` (dashboards por role) | OK |

---

## Vendas & CRM (CRM-01 … CRM-09)

| ID | Submenu | Ação | Status |
|----|---------|------|--------|
| CRM-01 … CRM-09 | Alertas … Propostas | Extraído para `crm-menu.ts`; `/crm/new` alias no audit | CORRIGIDO |

---

## Vistoria Técnica (VIS-01 … VIS-03)

| ID | Submenu | Ação | Status |
|----|---------|------|--------|
| VIS-01 | Consultar vistorias | `/inspections` | OK |
| VIS-02 | Nova vistoria | `/inspections/new` | OK |
| VIS-03 | Relatórios de Campo | `/inspections/reports` (único no menu) | OK |

---

## Webmail

| ID | Submenu | Ação | Status |
|----|---------|------|--------|
| WEB-01 | Webmail externo | `/external?url=…` + redirect `/webmail` | OK |

---

## Navegação / debug

| Item | Ação | Status |
|------|------|--------|
| `nav-debug.ts` | Match de rotas com query (`?tipo=`, `?listagem=`) | CORRIGIDO |
| `menu-route-audit.mjs` | Lê `navigation-config.ts` + `*-menu.ts`; PCA/RCA listagens; aliases redirect | CORRIGIDO |
| `audit:routes` (2026-06-12) | 260 rotas cobertas, **0 órfãs estáticas**, **0 dinâmicas sem menu** | OK |

---

## Conclusão da varredura alfabética

Todos os menus principais do plano foram auditados. Próximos passos opcionais: smoke manual por role em produção, `npm run apphosting:check` antes de deploy, e commit quando desejado.
