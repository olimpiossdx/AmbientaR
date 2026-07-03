# Questionário MCP + RAG — respostas prontas (pt-BR e EN)

Use para colar em formulários do Cursor, planejamento interno ou feedback de sessão.

---

## A) Decisões do projeto (pt-BR)

| # | Pergunta | Resposta |
|---|----------|----------|
| 1 | Automações IA ficam no hub MCP+RAG? | **Não.** Ficam em **IA → Automações** (admin), com espaço para fluxos futuros. |
| 2 | Nome do hub | **MCP + RAG / Inteligência do Sistema** |
| 3 | Integração OneDrive no hub? | **Sim**, aba dedicada dentro de Configurações → MCP+RAG. |
| 4 | Import local legado | **Visível** por enquanto (aba Legado local), sem ocultar. |
| 5 | Implementação | **Incremental:** Fase A (menu + links) → B (abas) → C (fontes oficiais, ingestão, custos, logs, MCP). |
| 6 | Fonte legislativa primária | **ALMG Dados Abertos** (`dadosabertos.almg.gov.br`); portal HTML só fallback. |
| 7 | Backend enterprise | **PostgreSQL + pgvector** + worker Python (`infra/legislation-pipeline`). |
| 8 | Stack atual (curto prazo) | Firestore (`knowledge_sources`, `rag_index`, `cloud_rag_*`, `mcp_rag_*`) + APIs Next.js. |

---

## B) Decisões do projeto (EN — se o formulário só aceitar inglês)

| # | Question | Answer |
|---|----------|--------|
| 1 | Should AI Automations live inside the MCP+RAG hub? | **No.** They stay under **AI → Automations** (admin). |
| 2 | Hub display name | **MCP + RAG / System Intelligence** (pt: *Inteligência do Sistema*) |
| 3 | OneDrive integration in the hub? | **Yes**, dedicated tab under Settings → MCP+RAG. |
| 4 | Legacy local import | **Visible** for now (Legacy tab). |
| 5 | Rollout approach | **Incremental:** Phase A → B → C. |
| 6 | Primary legislation source | **ALMG Open Data**; portal HTML only as fallback. |
| 7 | Enterprise backend | **PostgreSQL + pgvector** + Python worker. |
| 8 | Short-term stack | Firestore + Next.js APIs. |

---

## C) Feedback Cursor / agente (pt-BR)

**O que estava a fazer?**  
Consolidar o hub MCP+RAG no AmbientaR, validar produção, melhorar descoberta ALMG e iniciar o pipeline enterprise (worker Python, pgvector).

**A tarefa foi concluída?**  
Em grande parte sim: hub com abas, APIs admin, deploy em produção e scaffold do pipeline. Pendente: ingestão completa CSV→embeddings em Cloud SQL/Cloud Run.

**Comentários:**  
Bom alinhamento com plano incremental. Útil ter script `npm run verify:mcp-rag-hub` e documentação do worker em `infra/legislation-pipeline/README.md`.

**Nota sugerida:** 4–5 / 5

---

## D) Feedback Cursor / agent (EN)

**What were you trying to accomplish?**  
Unify the MCP+RAG hub in AmbientaR, validate production, improve ALMG discovery, and bootstrap the enterprise legislation pipeline.

**Was the task completed?**  
Mostly yes: tabbed hub, admin APIs, production deploy, and pipeline scaffold. Full CSV→embedding ingestion on Cloud SQL/Run is still pending.

**Comments:**  
Good incremental delivery. Smoke test script and pipeline README are helpful.

**Suggested rating:** 4–5 / 5
