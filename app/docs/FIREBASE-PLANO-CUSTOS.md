# Plano Firebase – custo (Spark / Blaze enxuto)

Checklist alinhado às boas práticas de custo (Firestore, CDN, loops).

## 1. Firestore – menos leituras

- **Cache no cliente (já no projeto):** `src/firebase/load-firebase-client.ts` inicializa o Firestore com **cache persistente** (IndexedDB) e **multi-tab**, para reutilizar dados já obtidos e reduzir leituras de rede em navegação repetida.
- **Queries com limite:** onde faz sentido, use `limit()` / `where` / agregações em vez de baixar coleções inteiras (ex.: import RAG em `ai-lab/rag` limita documentos por coleção na própria query).
- **Console:** em [Firestore → Uso](https://console.firebase.google.com/) acompanhe leituras/escritas; revise índices compostos para evitar scans amplos.

## 2. CDN / Hosting – estáticos

- **`public/`:** ícones, branding e assets estáticos ficam em `public/` (Next.js já os serve com URLs estáveis).
- **`firebase.json` → `hosting`:** configurado com `Cache-Control` longo para imagens e fontes sob `public/`. Para o app Next completo em produção, avalie [Firebase App Hosting](https://firebase.google.com/docs/app-hosting) ou seu provedor atual; o bloco `hosting` aqui cobre sobretudo **estáticos** servidos pelo Hosting quando você publicar `firebase deploy --only hosting`.
- **Storage:** use **Firebase Storage** (ou Hosting) para arquivos grandes públicos; **não** armazene blobs pesados no Firestore.

## 3. Loops e escritas

- Evite `for` com `getDoc`/`setDoc` por item quando um único `getDocs` com query adequada ou **batch** (`writeBatch`, máx. 500 ops) resolver.
- Cloud Functions agendadas: consolide atualizações em lote em vez de N escritas por documento.

## 4. Nota

Preços e cotas mudam; confira sempre as [tabelas oficiais Google Cloud / Firebase](https://firebase.google.com/pricing).
