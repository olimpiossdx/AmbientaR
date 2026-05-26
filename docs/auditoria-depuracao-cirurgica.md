# Auditoria de depuração cirúrgica — AmbientaR

Atualizado em: 2026-05-25 (revisão pendências)

Registo vivo da depuração **menu → submenu → rota → função**. Complementa [`auditoria-menus-indice.md`](./auditoria-menus-indice.md) e [`menu-route-audit.md`](./menu-route-audit.md).

## Gates automáticos

| Comando | Última corrida | Resultado |
|---------|----------------|-----------|
| `npm run audit:routes` | 2026-05-25 | 211 rotas ativas, 14 órfãs, 5 dinâmicas |
| `npm run audit:menus-by-role` | 2026-05-25 | Checklist regenerado |
| `npm run deploy:rules` | 2026-05-25 | OK — `pea_programs`, `dispensaPea`, `compensacao_drafts` |
| `node scripts/verify-pea-route-roles.mjs` | 2026-05-25 | OK |
| `npm run typecheck` | 2026-05-25 | OK |
| `npm run lint` | 2026-05-25 | OK (avisos hooks/img pré-existentes) |
| HTTP smoke (dev :9002) | 2026-05-25 | Rotas principais 200 (ver tabela abaixo) |
| `npm run apphosting:check` | 2026-05-25 18:39 UTC | **OK** — `status=0` (~3 min; ESLint só warnings) |

## Legenda

| Estado | Significado |
|--------|-------------|
| OK | Código revisto + gates |
| FIX | Corrigido nesta sessão |
| WARN | Limitação documentada |
| MANUAL | Teste com login em dev (porta 9002) |

---

## Fase 1 — Programa de Educação Ambiental (piloto)

| Rota | Estado |
|------|--------|
| `/studies/educacao-ambiental/*` | FIX (lista, geo, TR, export) |

### Bugs corrigidos (resumo)

| ID | Correção |
|----|----------|
| PEA-1…PEA-6 | Lista, geo loop, sanitize, TR FEAM, KMZ WARN |
| EST-1 | PRADA/PIA/RCA `limit(200)` |
| MAP-1, COMP-1/2, GEO-1/2 | Mapas, compensação Firestore, georef |
| FIN-1/2, CRM-1, CAD-1, OF-1, AG-1 | Ver ondas 2–4 abaixo |

### E2E geo (checklist **MANUAL**)

- [x] Código: `empreendimentoId` + KML + link PEA
- [ ] PEA → ABEA/Geo → vincular + aplicar textos/perímetro/KML
- [ ] Salvar → reabrir → campos geo persistidos
- [ ] Export PDF + Word com branding

---

## Fase 2 — Menus de topo

| # | Menu | Estado código | Notas |
|---|------|---------------|-------|
| 1 | Painel | OK | Dashboards por role |
| 2 | Financeiro | PARCIAL | Cash-flow, contratos, propostas, faturas, fornecedores, serviços: `limit`; invoices portal filtrado |
| 3 | Cadastro | PARCIAL | Empreendedores, projetos, clientes: `limit(200)` |
| 4 | Documentos Ambientais | PARCIAL | Licenças, outorgas, monitoramento manual/telemetria: `limit` |
| 5 | Multas e Defesas | OK | `/multas-defesas` |
| 6 | Vistoria Técnica | PARCIAL | Inspeções + relatórios + form: `limit(200)` |
| 7 | Licenciamento | PARCIAL | `/requests` + forms: `limit(200)` |
| 8 | IA | PARCIAL | Análise geoespacial FIX; ai-lab admin-only (sem alteração) |
| 9 | Estudos Técnicos | PARCIAL | PEA/PRADA/PIA/RCA/Mapas/Compensação FIX; inventário/coleta/outorgas `limit`; EIA/PTRF MANUAL |
| 10 | Georeferenciamento | PARCIAL | Processos `limit(200)`; secções checklist local |
| 11 | Vendas e CRM | PARCIAL | Oportunidades/clientes/propostas `limit(200)` |
| 12 | Webmail | OK | redirect `/external` |
| 13 | Ofícios | PARCIAL | Lista `limit(200)`; aprovação MANUAL |
| 14 | Acessos Gov. | OK | Links externos (sem Firestore) |
| 15 | Configurações | PARCIAL | Backups apagados `limit(100)`; resto MANUAL por subpágina |
| 16 | Agenda | PARCIAL | Appointments `limit(500)` |

### Onda 4 — limites Firestore (esta revisão)

| ID | Módulo | Ficheiros |
|----|--------|-----------|
| LIC-1 | Licenciamento | `requests/page.tsx`, `new`, `[id]/edit` |
| LIC-2 | Licenças | `licenses/page.tsx`, `license-form.tsx` |
| VIST-1 | Vistorias | `inspections/page.tsx`, `reports`, `inspection-form.tsx` |
| DOC-1 | Outorgas | `outorgas/page.tsx`, `studies/outorgas`, `monitoring/*` |
| DOC-2 | Monitoramento | `monitoring/manual`, `telemetric` |
| EST-2 | Inventário / coleta | `inventario/page.tsx`, `coleta-campo/*` |
| FIN-3 | Faturas / fornecedores / serviços | `invoices`, `suppliers`, `services` |
| CFG-1 | Config backups | `settings/deleted-backups` |
| DASH-1 | Painéis + compliance + intervenções + PCA/EIA/barragem | vários dashboards e `compliance/page.tsx` |
| FIX-TS | `barragem` shadow de `query`; cast PDF vistoria | `barragem/page.tsx`, `inspection-attachment-media.ts` |

---

## Fase 3 — Rotas órfãs

Todas validadas em código (redirect ou entrada alternativa). Ver tabela anterior no histórico — **OK**.

---

## Fase 5 — Perfis

| Perfil | Código | MANUAL |
|--------|--------|--------|
| client / cliente_autonomo | `resolvePortalAuthUid`, queries filtradas | Login titular: licenças, contratos, PEA bloqueado |
| representative | Idem + `approvedUserIds` | Pedidos de acesso |
| technical / admin | PEA + estudos | Fluxo geo E2E |

Script: `npm run verify:pea-roles`. Detalhe: [`auditoria-perfis-interacao.md`](./auditoria-perfis-interacao.md).

---

## Teste manual rápido (`npm run dev` → http://localhost:9002)

| Rota | O que validar |
|------|----------------|
| `/studies/educacao-ambiental` | Tabs, geo, export PDF/Word |
| `/requests` | Lista processos (portal só seus empreendimentos) |
| `/licenses` | Lista filtrada titular |
| `/inspections` | Lista + novo |
| `/outorgas` | Lista |
| `/monitoring/manual` | Outorgas manuais |
| `/invoices` | Faturas portal |
| `/studies/compensacao-ambiental/especies` | Badge sincronizado |
| `/crm/opportunities` | Kanban / lista |

## O que permanece MANUAL (não é bug de código)

1. **PEA E2E** no browser (3 itens checklist geo/export).
2. **Import TR FEAM** 403 — links manuais na UI.
3. **KMZ** — extrair KML ou usar Mapas.
4. **Ofícios** — fluxo aprovar/rejeitar por perfil.
5. **ai-lab** — só admin; sem mudança de produto.
6. **Formulários dinâmicos** EIA/PTRF/laudos — smoke por rota, sem refactor.
7. **`apphosting:check`** — OK em 2026-05-25; repetir antes de cada rollout App Hosting.
8. **Comparar erros produção** 7 dias pós-deploy regras.

## Compensação

Persistência **`compensacao_drafts`** implementada (Firestore + localStorage). Export PDF/Word automático continua planeado.
