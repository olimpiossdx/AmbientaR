# Critérios: app nativo (React Native + WatermelonDB) vs web + PWA

## Ficar em **web + PWA + Dexie** (stack atual) quando

- Equipa pequena e um só repositório é prioridade.
- Uso offline é **moderado** (formulários, listagens, poucos MB de fotos por sessão).
- Utilizadores aceitam **primeira abertura com rede** (ou PWA “Add to Home” após visita online).

## Avançar para **app nativo dedicado** quando

- Coleta em campo com **milhares de fotos**, **dias sem rede**, ou **GPS em segundo plano** de forma intensa.
- Necessidade de **armazenamento local grande** (> centenas de MB) com performance previsível.
- APIs do browser/WebView limitam (background sync, Bluetooth, sensores).

## Decisão de transição

1. Medir: falhas de sync, reclamações de perda de dados, tamanho médio de anexos.
2. Prototipar **um** fluxo (inventário) em RN + WatermelonDB partilhando **mesmas** coleções Firestore.
3. Manter web para admin/consultoria; app nativo só para “campo” se o custo for aceitável.
