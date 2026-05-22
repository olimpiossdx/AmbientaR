# Auditoria Fase 3 — interação por perfil

Documento vivo: bugs encontrados no código e correções aplicadas ao repassar menus/rotas por role.

**Checklist de rotas:** `docs/auditoria-menus-fase3-checklist.md` (`npm run audit:menus-by-role`).

**Regras de rota:** `src/lib/route-access.ts`, menu: `src/lib/navigation-config.ts`.

---

## Legenda

| Estado | Significado |
|--------|-------------|
| ✅ Corrigido | Patch no repositório |
| ⚠️ Verificar manual | Login real + consola/rede (porta 9002) |
| 📋 Pendente | Próximo perfil na fila |

---

## 1. Client (`client`) — portal titular

**Menu:** ~22 itens (Painel, Contratos, Licenças, Faturas, Usuários, …).

### Bugs corrigidos

| # | Sintoma | Causa | Correção |
|---|---------|-------|----------|
| C1 | Empreendedores/licenças vazios ou `permission-denied` intermitente | Queries com `user.id` em vez do UID da sessão Auth | `resolvePortalAuthUid()` em `auth-user-id.ts` + uso em portal-titular, requests-portal, representative, hook portal, `client-dashboard`, `licenses`, `users` |
| C2 | Arranque com queries antes do perfil alinhar | `user` Firestore ainda com `id` legado | `(app)/layout.tsx`: queries titular só com `profileAligned` + `sessionUid` (sessão anterior) |
| C3 | `/users` carregava toda `access_requests` | Queries sem filtro de role | `access_requests` só quando `role === 'client'` e `profileAligned` |
| C4 | `/licenses` lia coleções inteiras `empreendedores` / `projects` | `collection()` sem filtro no portal | Queries `in` / `documentId()` limitadas aos IDs do titular |
| C5 | Painel cliente com vínculos errados | `user.id` em `approvedUserIds` / `userId` | `client-dashboard.tsx` usa `resolvePortalAuthUid` |
| C6 | Contratos / Faturas / Clientes / CAR vazios | Mesmo padrão `user.id` | `contracts`, `invoices`, `clients`, `car`, `use-georef-client-project` |

### Verificação manual (⚠️)

1. Login como titular com representantes pendentes → Configurações → Usuários → card "Aprovar acesso".
2. Licenças: lista só empreendimentos do titular; sem erros na consola.
3. Painel: KPIs e agenda carregam após 1–2 s (sem flood de `permission-denied`).

---

## 2. Technical (`technical`) — operacional

**Menu:** ~59 itens; painel = `EnvironmentalDashboard` + hub documentos (como gestor/advogado).

### Bugs corrigidos

| # | Sintoma | Causa | Correção |
|---|---------|-------|----------|
| T1 | `/users` disparava leituras de `access_requests` (pending + approved) | Mesmas queries do titular para todos os roles | Herda fix **C3** — só `client` subscreve |
| T2 | — | `technical` já usa `where("uid", "==", user.uid)` na lista de usuários | OK (só vê a si) |

### Verificação manual (⚠️)

1. `/users`: uma linha (próprio perfil); **sem** pedidos de representante.
2. Licenciamento / mapas / laudos: APIs com Bearer (Fases 1–2) — rede 401 se sessão expirada.
3. Rotas de IA no menu: permitidas para `technical` (diferente de `cliente_autonomo`).

---

## 3. Cliente autônomo (`cliente_autonomo`)

### Bugs corrigidos

| # | Sintoma | Causa | Correção |
|---|---------|-------|----------|
| A1 | `/users` lista vazia / query inválida | Role ausente do ramo `where("uid", …)` | Incluído em `users/page.tsx` junto com `client`, `technical`, … |
| A2 | Empreendedores por `user.id` | UID legado | `resolvePortalAuthUid` no hook e libs portal |

### Verificação manual (⚠️)

- Menu sem prefixos bloqueados de IA (`route-access`); confirmar se é intencional no produto.

---

## 4. Representative (`representative`)

### Bugs corrigidos

- `representative-empreendedor-ids.ts`: `repUid` via `resolvePortalAuthUid`.
- `users/page.tsx`: `repUid` alinhado à sessão.

### Verificação manual (⚠️)

- Só empreendimentos com `approvedUserIds` contendo o representante.

---

## 5. Gestor (`gestor`)

**Menu:** ~70 itens (operacional; sem CRM).

### Bugs corrigidos

| # | Sintoma | Causa | Correção |
|---|---------|-------|----------|
| G1 | `/users` sem botão Editar no próprio perfil | UI só admin + representante | `canEditUserInUsersList()` — gestor edita só a si |
| G2 | Query `users` com `uid` legado | `user.uid \|\| user.id` antes do perfil alinhar | `sessionUid` quando `profileAligned` |
| G3 | `getAppUserProfileUid` preferia `id` legado | Ordem `id \|\| uid` | `uid \|\| id` em `role-guards.ts` |

### Verificação manual (⚠️)

- Painel: hub documentos + `EnvironmentalDashboard`.
- Licenças / condicionantes: escrita operacional (`canPerformOperationalWrite`).
- Responsáveis técnicos: criar/editar (gestor ∈ `canWriteTechnicalResponsibles`).
- Ofícios: aprovar rascunho; não conciliar contador (só admin).
- `/users`: uma linha, lápis no próprio perfil.

---

## 6. Supervisor (`supervisor`)

**Menu:** ~81 itens (operacional + CRM alertas/equipe; sem financeiro completo como admin).

### Bugs corrigidos

| # | Sintoma | Causa | Correção |
|---|---------|-------|----------|
| S1 | Lista todos os utilizadores mas sem Editar | Botão só `admin` | `canEditUserInUsersList` inclui supervisor |
| S2 | Herda fix C3 | `access_requests` no layout/users | Só titular `client` subscreve |

### Verificação manual (⚠️)

- Painel = `AdminDashboard` (variante supervisor).
- `/users`: lista completa; editar outros; exportar logs; sem “Adicionar usuário” (só admin).
- `/audit-log`, `/settings/deleted-backups`: acesso conforme menu.
- CRM: alertas, equipe, pipeline (não gestor).

---

## 7. Financeiro (`financial`)

**Menu:** ~48 itens (módulo financeiro, CRM, faturas, clientes; sem estudos/georef completos como técnico).

### Bugs corrigidos

| # | Sintoma | Causa | Correção |
|---|---------|-------|----------|
| F1 | — | `/users` já filtra `role == financial` | OK; editar só a si (`canEditUserInUsersList`) |
| F2 | Faturas / clientes | `invoices` e `clients` com coleção ampla para admin/financial | OK (regras + papel) |

### Verificação manual (⚠️)

- Painel financeiro + CRM alertas.
- Faturas: lista completa; ações admin/financial (sync vencidas, etc.).
- `/users`: vê outros financeiros (leitura); edita só o próprio perfil.
- Propostas: criar/editar; **aceitar/rejeitar** (financeiro sim, vendas não).

---

## 8. Vendas (`sales`)

**Menu:** ~29 itens (CRM, contratos, propostas, clientes; sem faturas no menu).

### Bugs corrigidos

| # | Sintoma | Causa | Correção |
|---|---------|-------|----------|
| V1 | Menu “Orçamentos e Propostas” sem **Criar Proposta** | `canManageProposalsAndCommercialQuotes` só admin/financial; Firestore já permite `sales` | Incluído `sales` no guard (alinhado a `canWriteContractsCommercial`) |
| V2 | Representante em propostas com `user.id` legado | Mesmo padrão portal | `resolvePortalAuthUid` em `commercial-proposals/page.tsx` |

### Verificação manual (⚠️)

- `/commercial-proposals` e `/crm/proposals` → **Criar Proposta** visível.
- Editar proposta em rascunho/enviada; **sem** botões aceitar/rejeitar (só admin/financial).
- Contratos / contratos-fornecedores: escrita comercial.
- Clientes: criar/editar (`canWriteCommercialClients`).
- Empreendedores: leitura (cadastro operacional é gestor/supervisor/autônomo).

---

## 9. Advogado (`advogado`)

**Menu:** ~67 itens (multas/defesas, ofícios, estudos, documentos; sem CRM/financeiro).

### Bugs corrigidos

| # | Sintoma | Causa | Correção |
|---|---------|-------|----------|
| A1 | `/users` sem editar próprio perfil | Já em `selfServiceRoles` + `sessionUid` na query | Confirmado; exclusão própria usa `sessionTargetUid` |
| A2 | Multas/defesas | UI `canWriteDefesa` = admin + advogado; Firestore `autoInfracaoDefesas` igual | OK |

### Verificação manual (⚠️)

- Painel advogado + hub documentos.
- `/multas-defesas`: criar/editar processos de defesa.
- Ofícios: rascunho (não aprovar contador — só admin).
- `/users`: uma linha; lápis no próprio perfil.

---

## 10. Diretor de fauna (`diretor_fauna`)

**Menu:** ~40 itens (fauna, estudos, georef; sem multas CRM).

### Bugs corrigidos

| # | Sintoma | Causa | Correção |
|---|---------|-------|----------|
| D1 | `/users` lista completa mas **sem Editar** no próprio registo | `diretor_fauna` fora de `canEditUserInUsersList` | Incluído em `selfServiceRoles` |
| D2 | Skeleton de carga | Tratado como perfil “lista ampla” | 5 placeholders (como supervisor) |

### Verificação manual (⚠️)

- Painel = `FaunaDashboard`.
- `/fauna`, `/studies/fauna/*`: estudos concluídos (filtro portal `[]` = vê todos).
- Consultas técnicas: aparece no select de responsável (`consultas/new`).
- `/users`: vê equipa (leitura); edita **só** o próprio perfil.

---

## 11. Administrador (`admin`)

**Menu:** ~116 itens (acesso total na UI).

### Estado (auditoria código)

| Área | Estado |
|------|--------|
| `/users` | Coleção completa; criar/apagar; APIs admin com Bearer |
| Layout | Queries titular só para `client`; notificações com `sessionUid` |
| APIs admin | `credentials-status`, `delete-user`, `delete-user-by-email` com Bearer |
| APIs IA/mapas | Alguns fluxos (`ai-lab`, `study-maps`, formulários) ainda sem Bearer — ver Fases 1–2 / checklist deploy |

### Verificação manual (⚠️)

- Painel admin + financeiro embutido.
- Liberar e-mail órfão / credenciais Admin SDK.
- Rotas `/settings/*` restritas em `route-access` (só admin).
- Após deploy: métricas App Hosting (erros 401/410).

---

## 12. Matriz rápida — quem lê o quê em `/users`

| Role | `users` query | `access_requests` | Editar na lista |
|------|---------------|-------------------|----------------|
| admin | coleção | não | todos |
| supervisor | coleção | não | todos |
| diretor_fauna | coleção | não | só a si |
| financial | `role == financial` | não | só a si |
| sales, technical, gestor, advogado | `uid == próprio` | não | só a si |
| client, cliente_autonomo, representative | `uid == próprio` / portal | só **client** (pedidos) | portal conforme regra |
| outros | query inválida | não | não |

---

## 13. Propostas comerciais — quem faz o quê

| Ação | admin | financial | sales | portal |
|------|-------|-----------|-------|--------|
| Criar / editar rascunho | sim | sim | sim | só leitura (titular/rep) |
| Aceitar / rejeitar | sim | sim | não (UI + Firestore) | não |
| PDF / excluir (UI interna) | sim* | sim* | sim* | não |

\* Perfis internos exceto `client` / `cliente_autonomo` na lista.

---

## 14. APIs sensíveis (todas as roles)

Após Fases 1–2, rotas críticas exigem `Authorization: Bearer`. Cliente deve usar `getBearerApiHeaders` / `fetchApiWithAuth`.

Deploy recomendado após mudanças em regras: `npm run deploy:rules`, `npm run deploy:storage` (se aplicável).

---

*Última atualização: Fase 3 — todos os perfis (auditoria menus concluída).*
