# Coleta de campo — Estratégia e plano de execução

Documento de referência para o módulo **Coleta de campo** do AmbientaR (EcoGestão MG).  
Decisões validadas em maio/2026. **Não implementar sem alinhar com este arquivo.**

---

## 1. Objetivo

Permitir que técnico ou fornecedor colete dados de inventário florestal no celular (PWA, offline quando necessário), com fluxo simples de parcelas e espécies/árvores, e **entregue um arquivo Excel** compatível com o importador do submenu **Inventário Florestal** — sem misturar os dois fluxos de trabalho.

Inspiração de processo: software Mata Nativa (Web + Coletor + planilha). O AmbientaR replica **fluxo e colunas**, não marca nem interface do fornecedor.

---

## 2. Princípios (não negociáveis)

| Princípio | Significado |
|-----------|-------------|
| **Sem contaminação** | Inventário Florestal (`/studies/inventario`) continua só escritório: projetos, import Excel, espécies, parcelas do projeto, fórmulas, calculadora, laudo. |
| **Sub-submenu no menu** | Coleta de campo aparece **dentro do agrupamento** Inventário Florestal em Estudos Técnicos, para o técnico não confundir com Fauna, PCA, etc. |
| **Código separado** | Rotas, páginas e dados de campanha **não** gravam em `inventories` nem nas telas do projeto de inventário. |
| **Ponte = Excel** | Único handoff oficial: arquivo `.xlsx` no formato do modelo `ModeloDePlanilhaParaImportacao.xlsx` (ver `import-dialog.tsx`). |
| **Campanha flexível** | Vinculada a empreendimento/empreendedor da base **ou** “solta” (preenchimento manual em campo; vínculo opcional depois). |
| **Uso externo** | Coleta pode atender cliente/obra que **não** está na base; o escritório importa depois num projeto novo ou existente. |
| **Sem limites artificiais** | Sem teto de parcelas nem de lançamentos por parcela. |
| **Fluxo sequencial** | Termina parcela 1 → **Nova parcela** → parcela 2 → … |
| **Multinível opcional** | Modo multinível com colunas UP/US/NI; modo simples mantém formulário enxuto. |

---

## 3. Estrutura de menu (UX)

```
Estudos Técnicos
└── Inventário Florestal          ← rótulo de grupo (expandível)
    ├── Inventário Florestal      → /studies/inventario   (processamento)
    └── Coleta de campo           → /coleta-campo         (campo + export)
```

**Remover de Configurações:**

- `App de Campo (planej.)` → `/app-campo`
- `Inventários de Campo` → `/inventarios` (item de menu; rota com redirecionamento — ver §8)

---

## 4. Fluxo operacional

```mermaid
sequenceDiagram
  participant T as Técnico
  participant CC as Coleta de campo
  participant X as Excel
  participant IF as Inventário Florestal

  T->>CC: Nova campanha (vinculada ou solta)
  loop Parcelas sem limite
    T->>CC: Espécies/árvores na parcela atual
    T->>CC: Nova parcela
  end
  T->>CC: Concluir campanha
  CC->>X: Exportar planilha ordenada
  Note over T: Offline OK; envia arquivo quando houver rede

  participant E as Escritório
  E->>IF: Projeto de inventário
  E->>IF: Importar planilha (fluxo existente)
```

### 4.1 Campanha vinculada

- Escolhe empreendimento (e empreendedor associado) da base.
- Em campo: foco em parcelas e medições.

### 4.2 Campanha solta

- Profissional informa manualmente: nome do empreendimento, empreendedor, observações, local, etc.
- Opcional depois: vincular a cadastro existente (metadado da campanha; **não** altera o projeto de inventário automaticamente).

### 4.3 Conclusão

- Status da campanha: `rascunho` → `em_campo` → `concluida`.
- Botão **Exportar Excel** gera arquivo pronto para import.
- Fotos/GPS: armazenados na campanha (Storage + metadados); laudo pode referenciar; **cálculo** usa colunas da planilha.

---

## 5. Contrato Excel (alinhado ao Inventário Florestal)

Modelo base (já gerado em `studies/inventario/[id]/import-dialog.tsx`):

| Coluna export | Uso |
|---------------|-----|
| Parcela | Código da parcela (P01, P02, …) |
| Área da Parcela | m² (quando informado) |
| Núm. Árvore | Sequencial na parcela |
| Nome Científico | |
| Nome Comum | |
| Família | |
| CAP | Centímetros (validar na coleta) |
| Alt. Total | |
| Alt. Comercial | |

**Modo multinível** (colunas adicionais na mesma aba, mesma simplicidade de tabela):

| Coluna extra | Uso |
|--------------|-----|
| UP | Unidade primária |
| US | Unidade secundária |
| NI | Nível de inclusão |

Import no Inventário Florestal: assistente em 6 passos já existente (carregar, associar colunas, inconsistências, espécies, parcelas, conferir).

Referências Mata Nativa (benchmark, não copiar UI): [preparar planilha multinível](https://matanativa.com.br/central-de-suporte/importar-e-exportar/como-preparar-os-dados-de-campo-no-excel-para-um-projeto-de-inventario-multinivel/), [importar multinível](https://matanativa.com.br/central-de-suporte/importar-e-exportar/como-importar-os-dados-de-campo-do-excel-para-um-projeto-de-inventario-multinivel/).

---

## 6. Modelo de dados (campanhas — independente de `inventories`)

Coleções previstas (podem evoluir nomes na implementação; conceito fixo):

| Entidade | Campos principais |
|----------|-------------------|
| **campanhas_coleta** (ou reutilizar `inventarios` renomeado conceitualmente) | `id`, `modo` (`vinculada` \| `solta`), `empreendimentoId?`, `empreendedorId?`, `nomeEmpreendimentoManual?`, `nomeEmpreendedorManual?`, `tipoInventario` (`simples` \| `multinivel`), `status`, `projectIdInventario?` (opcional, só referência), `createdAt`, `updatedAt` |
| **campanha_parcelas** | `campanhaId`, `codigo`, `area?`, `latitude?`, `longitude?`, `up?`, `us?`, `ni?`, `ordem`, `observacoes` |
| **campanha_individuos** | `campanhaId`, `parcelaId`, `numero`, espécies, CAP, alturas, etc. |
| **campanha_fotos** (opcional fase 2) | `campanhaId`, `parcelaId?`, `individuoId?`, `storagePath`, `latitude?`, `longitude?` |

**Offline (PWA):** cache local (IndexedDB / Dexie) + fila de sync para Firestore e Storage; ao voltar online, persiste campanha. Export Excel pode ser gerado **no dispositivo** (biblioteca xlsx já usada no projeto).

**Não escrever** em `inventories/{projectId}` a partir da coleta.

---

## 7. Rotas

| Rota | Função |
|------|--------|
| `/coleta-campo` | Lista de campanhas + nova campanha |
| `/coleta-campo/nova` | Wizard: vinculada vs solta, tipo simples/multinível |
| `/coleta-campo/[id]` | Detalhe da campanha, lista de parcelas |
| `/coleta-campo/[id]/parcelas/[parcelaId]` | Lançamento de árvores/espécies na parcela |
| `/app-campo` | Redirect → `/coleta-campo` |
| `/inventarios` e filhos | Redirect → `/coleta-campo` (equivalente) |

---

## 8. Decisão item 5 — **5B** (alias / redirect)

- **Menu:** remover `Inventários de Campo` e `App de Campo` de Configurações.
- **Rotas antigas:** `/inventarios`, `/inventarios/new`, `/inventarios/[id]`, etc. redirecionam para `/coleta-campo` (ou equivalente).
- **Dados:** uso em produção ainda não confirmado (apenas testes); coleções `inventarios*` podem ser **reaproveitadas** como backend da campanha ou migradas com script leve — decisão na Fase 1 técnica.
- **Benefício:** links antigos e favoritos não quebram; um único lugar para o técnico.

---

## 9. Plano de execução por fases

### Fase 0 — Documentação e navegação (baixo risco)

- [x] Este documento (`docs/COLETA-CAMPO-ESTRATEGIA.md`)
- [x] Agrupar menu: Inventário Florestal + Coleta de campo em `navigation-config.ts`
- [x] Remover itens de Configurações (`/app-campo`, `/inventarios` do menu)
- [x] Redirects: `/app-campo` → `/coleta-campo`; `/inventarios/*` → `/coleta-campo/*`
- [x] Módulo `/coleta-campo` (lista de campanhas)
- [x] Atualizar `docs/APP-OFFLINE-FASE5.md`, auditoria Config (referência cruzada)

### Fase 1 — Campanhas e parcelas (MVP campo)

- [x] CRUD campanha (vinculada / solta; simples / multinível)
- [x] Fluxo sequencial: parcela ativa → concluir → nova parcela (sem limite)
- [x] Lançamento de indivíduos/árvores por parcela (sem limite)
- [x] UI mobile-first (botões grandes, poucos passos)
- [x] Coleções `inventarios`, `inventario_parcelas`, `inventario_individuos`

### Fase 2 — Export Excel

- [x] `src/lib/coleta-campo/export-excel.ts` — colunas do `ModeloDePlanilhaParaImportacao.xlsx` (+ UP/US/NI se multinível)
- [x] Ordenação: parcela → número da árvore
- [x] Validações mínimas antes de export
- [x] Botão **Marcar concluída** + **Exportar Excel**

### Fase 3 — Offline

- [x] Outbox Firestore via `addColetaDoc` / `setColetaDoc` quando offline
- [x] Tabela Dexie `coletaPending` (v2)
- [x] Banner `ColetaOfflineBanner` + `useColetaPendingCount`
- [ ] Fila de fotos (Storage) — fase posterior

### Fase 4 — Polimento e escritório

- [ ] Vincular campanha solta a empreendimento cadastrado (opcional)
- [ ] Link de ajuda: “Importar no Inventário Florestal” → abre projeto ou instrução
- [ ] Referências Mata Nativa em `mata-nativa-links.ts` (ajuda contextual, sem marca na UI principal)

### Fora do escopo inicial (explicitamente)

- Import automático do Excel para `inventories` sem passar pelo assistente existente
- Cálculos de amostragem/volume dentro da Coleta de campo
- App nativo (React Native) — permanece PWA

---

## 10. Papéis e permissões (sugestão)

| Perfil | Coleta de campo | Inventário Florestal |
|--------|-----------------|----------------------|
| admin, technical, gestor, supervisor | Sim | Sim |
| Fornecedor / técnico externo (futuro) | Só campanhas atribuídas | Não (ou só leitura) |

Ajustar `roles` em `navigation-config.ts` alinhado a `/studies/inventario`.

---

## 11. Critérios de aceite (MVP)

1. Técnico encontra **Coleta de campo** sob **Inventário Florestal** no menu.
2. Cria campanha solta, lança 3 parcelas com várias árvores, exporta Excel.
3. Escritório importa o mesmo arquivo em **Inventário Florestal** sem erro de colunas.
4. Abrir `/inventarios` ou `/app-campo` redireciona para Coleta de campo.
5. Telas de `/studies/inventario/[id]` **não** exibem formulários de coleta de campo.

---

## 12. Referências no repositório

| Arquivo | Relação |
|---------|---------|
| `src/app/(app)/studies/inventario/[id]/import-dialog.tsx` | Modelo Excel e import |
| `src/app/(app)/app-campo/page.tsx` | Substituída por coleta-campo |
| `src/app/(app)/inventarios/**` | Redirect 5B |
| `src/lib/navigation-config.ts` | Menu agrupado |
| `docs/APP-OFFLINE-FASE5.md` | Offline e sync |
| `src/app/(app)/studies/inventario/[id]/mata-nativa-links.ts` | Links de ajuda |

---

*Última atualização: decisão 5B, sem dados reais em `/inventarios` (apenas testes).*
