# Validação — formulários dinâmicos por listagem (A–H)

Checklist para validar o fluxo **antes** de criar overrides por listagem.

## Pré-requisitos

1. Pasta TR acessível (padrão: `termos de referencia/` na raiz do projeto, ou `TERMOS_REFERENCIA_DIR` no `.env.local`).
2. Subpastas por estudo: `RCA/`, `PCA/`, `EIA-RIMA/`, `LAS-RAS/`, `REANALISE/` com ficheiros `.docx` / `.dotx`.
3. Utilizador autenticado na app; regras Firestore publicadas (`npm run deploy:rules`).

## 1. Pré-gerar cache

```bash
npm run tr:sync-forms
```

Opcional por estudo:

```bash
ONLY=rca npm run tr:sync-forms
npm run tr:sync-forms -- --dry-run
```

Esperado: resumo com `ok` onde existir documento; `skipped` se não houver ficheiro para aquela combinação (normal).

## 2. Testar na interface

| Estudo | Rota | O que verificar |
|--------|------|-----------------|
| RCA | `/studies/rca/new?form=dynamic` | Listagem A–H + subatividade; badge da listagem; secções em acordeão |
| PCA | `/studies/pca/new?form=dynamic` | Listagem A–H; formulário muda ao trocar listagem |
| EIA-RIMA | `/studies/eia-rima/new?form=dynamic` | Schema ajusta ao escolher empreendimento (listagem do cadastro) |
| LAS-RAS | `/studies/las-ras/new?form=dynamic` | Grava em `lasRas`; lista em `/studies/las-ras` |
| Reanálise | `/studies/reanalise/new?form=dynamic` | Grava em `reanalises`; lista em `/studies/reanalise` |

Em cada tela:

1. Selecionar **empreendedor** → **empreendimento** (campos compatíveis preenchem).
2. Confirmar **barra de progresso** e secções **Empreendedor / Empreendimento** no topo.
3. **Salvar rascunho** e abrir na listagem: visualizar, editar, exportar (com branding configurado).

## 3. Quando pedir overrides (fase 2)

Só faz sentido ficheiros `overrides/` se, para uma listagem concreta:

- um campo do TR deve ser **obrigatório** e não é no documento;
- um rótulo precisa de **nome fixo** diferente do Word;
- uma secção deve ser **reagrupada** ou um campo **oculto** por regra interna.

Anote: estudo + listagem (A–H) + subatividade (RCA) + id do campo + regra desejada.

## 4. API admin (opcional)

`POST /api/studies/sync-form-schemas` com body `{ "only": ["rca"] }` (requer perfil admin).
