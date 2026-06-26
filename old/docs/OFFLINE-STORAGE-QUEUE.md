# Fila de uploads (Storage) e estados

## Modelo no cliente (`src/lib/offline/storage-queue.ts`)

- **`enqueueStorageUpload`**: grava `ArrayBuffer` + metadados na tabela Dexie `storageQueue` com `status: "pending"`.
- **`processStorageQueue(firestore)`** (online): para cada pendente, `uploadBytes` no Firebase Storage, opcionalmente `updateDoc` no Firestore com URL (`firestoreDocPath` + `firestoreField`), depois `status: "done"` e liberta `bytes`.

## Estados sugeridos no Firestore (por documento)

Quando integrarem formulários, campos opcionais podem incluir:

- `attachmentSyncStatus`: `"pending" | "synced" | "error"`
- `attachmentLocalId`: id da fila Dexie (debug)
- `updatedAt`: servidor / cliente para LWW

Isto **não** altera regras até o produto exigir — ver comentário em [`src/firebase/rules/firestore.rules`](../src/firebase/rules/firestore.rules).

## Segurança

- Paths no Storage devem seguir convenções já validadas nas **rules** do Storage (ficheiro separado / consola) e nas **Firestore rules** para leitura/escrita dos documentos que guardam URLs.
- Evitar expor tokens em logs; fila local só em **HTTPS** e dispositivo confiável.

## Próximos passos de produto

1. Substituir `POST /api/uploads/*` gradualmente por **upload direto** + metadados Firestore.
2. Ligar botões “Guardar” dos módulos portal a `enqueueStorageUpload` quando `!navigator.onLine`.
3. Mostrar contador pendente (já exposto em `useOffline().pendingStorage`).
