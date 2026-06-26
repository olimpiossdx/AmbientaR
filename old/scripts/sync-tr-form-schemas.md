# Sincronizar schemas de formulário (termos de referência)

Pré-gera ou atualiza `.form-schema-cache.json` em cada pasta TR vinculada aos estudos:

- RCA (listagens A–H + subatividades)
- PCA (listagens A–H)
- EIA-RIMA, LAS-RAS, REANALISE (listagens A–H + entrada geral)

## Comandos

```bash
npm run tr:sync-forms
npm run tr:sync-forms -- --dry-run
ONLY=rca,pca npm run tr:sync-forms
npm run tr:sync-forms -- --only=eia-rima
```

## Variáveis

| Variável | Descrição |
|----------|-----------|
| `TERMOS_REFERENCIA_DIR` | Pasta base (ex.: `D:\A\termos de referencia`) |
| `ONLY` | Slugs separados por vírgula |

## API (admin)

`POST /api/studies/sync-form-schemas` com body opcional `{ "dryRun": true, "only": ["rca"] }`.

## Telas

Formulário dinâmico: `?form=dynamic` em `/studies/{slug}/new` (RCA, PCA, EIA, LAS-RAS, Reanálise).

Listagens Firestore: coleções `lasRas` e `reanalises` (visualizar, editar, aprovar, exportar, excluir).
