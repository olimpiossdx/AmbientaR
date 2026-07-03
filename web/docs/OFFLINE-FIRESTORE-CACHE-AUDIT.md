# Auditoria — cache persistente Firestore (Trilho B)

## Data da auditoria (código)

- Pesquisa em `src/` por `source: 'server'`, `GetOptionsSource` e `getDocFromCache`: **nenhuma ocorrência** forçando leitura só no servidor.
- Os hooks principais [`src/firebase/firestore/use-doc.tsx`](src/firebase/firestore/use-doc.tsx) e [`src/firebase/firestore/use-collection.tsx`](src/firebase/firestore/use-collection.tsx) usam **`onSnapshot`** sem opções que desativem o cache local.

## Comportamento esperado

- A inicialização em [`src/firebase/load-firebase-client.ts`](src/firebase/load-firebase-client.ts) com `persistentLocalCache` + `persistentMultipleTabManager` faz com que o SDK:
  - sirva dados **em cache** quando apropriado;
  - enfileire escritas quando a rede falhar (comportamento documentado do Firestore web).

## Recomendações (evitar regressões)

1. **Não** introduzir `getDoc(..., { source: 'server' })` em massa sem necessidade de negócio.
2. Para “forçar refresh” pontual, preferir **invalidação de UI** ou **pull-to-refresh** que refaça a subscrição em vez de desligar o cache globalmente.
3. Novos hooks de leitura devem seguir o mesmo padrão que `useDoc` / `useCollection` (snapshot em tempo real, sem forçar servidor por omissão).

## Relação com Dexie (`src/lib/offline/`)

- Dexie/outbox cobre **API + fila de Storage** e metadados; **não** substitui o cache do Firestore para documentos já modelados só no Firestore.
