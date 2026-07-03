# Fase 5 – Aplicativo Offline (campo)

Este documento descreve o escopo inicial e o modelo de dados previstos para o **App de campo** do AmbientaR 2.0. A tela **Coleta de campo** (`/coleta-campo`) no app web implementa este escopo. A rota legada `/app-campo` redireciona para `/coleta-campo`. Ver também `docs/COLETA-CAMPO-ESTRATEGIA.md`.

---

## 1. Objetivo

Permitir **coleta de dados em campo** (inventário florestal, fauna, medições, fotos, coordenadas) no celular ou tablet, **offline**, com **sincronização posterior** quando houver conexão. Objetivos:

- Menos risco de perder dados de campo.
- Menos planilhas soltas; dados já no formato do sistema.
- Dados prontos para alimentar laudos e estudos automatizados.

---

## 2. Escopo inicial (fluxo prioritário)

**Sugestão:** **Inventário florestal** como primeiro fluxo.

Motivos:

- Usa dados estruturados (parcelas, árvores, DAP, altura, espécie).
- Envolve fotos e coordenadas (GPS).
- É um estudo já presente no menu "Estudos Técnicos" do AmbientaR.
- Ambiente típico: área rural, conexão instável ou inexistente.

**Outros candidatos para fases seguintes:** relatório de fauna (pontos de amostragem, espécies, fotos), monitoramento de outorga (leituras, fotos), vistoria (checklist + fotos).

---

## 3. Modelo de dados para coleta offline (inventário florestal)

Conceito: os dados coletados no app são uma **cópia local** das estruturas que depois existirão (ou já existem) no backend. Na sincronização, o app envia **novos** ou **alterados** e o backend persiste no Firestore (ou API).

### Entidades principais (exemplo – inventário)

- **Projeto/Empreendimento** – referência (baixada quando online; só leitura no campo).  
  - Campos mínimos no app: `id`, `nome`, `empreendedorId`, talvez `geometry` ou área.

- **Inventário (cabeçalho)** – uma "campanha" de inventário por projeto.  
  - Campos: `id`, `empreendimentoId`, `dataInicio`, `dataFim`, `responsavel`, `sincronizado`, `createdAt`, `updatedAt`.

- **Parcela** – ponto de amostragem.  
  - Campos: `id`, `inventarioId`, `codigo` (ex.: P01), `latitude`, `longitude`, `observacoes`, `sincronizado`.

- **Indivíduo (árvore)** – árvore dentro de uma parcela.  
  - Campos: `id`, `parcelaId`, `numero`, `especie`, `dap`, `altura`, `fotoUrl` (ou caminho local até sincronizar), `sincronizado`.

- **Fotos** – anexos (parcela ou árvore).  
  - No dispositivo: arquivo local; na sincronização: upload para Storage (ex.: Firebase Storage), gravar URL no documento.

Cada registro pode ter um campo **`sincronizado`** (boolean) ou **`syncStatus`** (`pending` | `synced` | `conflict`) e **`updatedAt`** para decidir o que enviar na próxima sincronização.

### Coleções Firestore (definidas no AmbientaR)

- **`inventarios`** – cabeçalho da campanha (empreendimentoId, dataInicio, dataFim, responsavelUserId, status, sincronizado). Tipos em `src/lib/types.ts`: `Inventario`, `InventarioStatus`.
- **`inventario_parcelas`** – parcelas (inventarioId, codigo, latitude, longitude, observacoes). Tipo: `InventarioParcela`.
- **`inventario_individuos`** – árvores/indivíduos (parcelaId, numero, especie, dap, altura, fotoStoragePath). Tipo: `InventarioIndividuo`.

Regras de segurança: leitura e escrita para usuários autenticados (`isSignedIn()`). Ver `src/firebase/rules/firestore.rules`.

### Regras de sincronização

- **Criação/edição no app:** marca como "não sincronizado"; na próxima conexão, envia para o backend.
- **Backend (Firestore):** recebe os documentos, valida, grava nas coleções acima.
- **Conflitos:** se o mesmo registro foi editado no app e no web, definir política (última escrita vence, ou merge manual). Primeira versão pode ser "última escrita vence" com timestamp.

---

## 4. Opções de implementação

### Opção A – React Native + WatermelonDB

- **React Native:** app nativo (iOS/Android), melhor experiência offline e acesso a câmera/GPS.
- **WatermelonDB:** banco local no dispositivo, otimizado para React Native, com sincronização manual (você implementa o "push" dos dados para o backend quando online).
- **Backend:** Firestore (e Storage para fotos). O app usa SDK do Firebase; em modo offline o Firestore mantém cache, mas para controle fino de "sincronizado" muitas vezes se usa uma camada própria (WatermelonDB) e se envia em batch quando há rede.

**Prós:** desempenho, experiência nativa, uso intenso offline.  
**Contras:** outro repositório/stack (React Native), curva de aprendizado e manutenção.

### Opção B – PWA com Service Worker + IndexedDB

- O próprio **Next.js** (ou um PWA separado) com **Service Worker** e **IndexedDB** (ex.: Dexie.js) para armazenar dados localmente.
- Coleta em formulários web no celular; fotos via `input type="file"` ou API de câmera; geolocalização via API do browser.
- Sincronização: quando online, envia fila de operações para API/Cloud Function que grava no Firestore.

**Prós:** um único código (web), sem app nas lojas.  
**Contras:** limites de uso em segundo plano e de armazenamento no browser; experiência pode ser inferior à nativa em conexão muito ruim.

### Opção C – Híbrido

- **Curto prazo:** esboçar fluxo de inventário no **app web** (formulários que gravam direto no Firestore quando há rede), para validar modelo de dados e telas.
- **Médio prazo:** evoluir para React Native + WatermelonDB quando a necessidade de uso offline intenso estiver clara.

---

## 5. Próximos passos recomendados

### Implementado no app web (entrada online)

- Menu **Estudos Técnicos → Inventário Florestal → Coleta de campo** (`/coleta-campo`): campanhas, parcelas, export Excel. Rotas legadas `/inventarios` redirecionam para `/coleta-campo`.
- Detalhe do inventário: parcelas e **Nova parcela** (código, lat/long, observações).
- Detalhe da parcela: indivíduos e **Novo indivíduo** (número, espécie, DAP, altura). Mesmas coleções Firestore para uso pelo app offline depois.

- [ ] **Confirmar** o fluxo prioritário (inventário florestal ou outro) com o time.
- [ ] **Detalhar** no Firestore as coleções que receberão os dados de campo (inventário, parcelas, indivíduos, fotos) e ajustar regras de segurança.
- [ ] **Escolher** a opção de implementação (A, B ou C).
- [ ] **Prototipar:**  
  - Se A: criar projeto React Native (ex.: `apps/ambientar-campo`), configurar Firebase e WatermelonDB, uma tela de lista de parcelas e uma de coleta de árvore.  
  - Se B: uma página no Next.js com formulário de parcela + árvores + foto + GPS e fila de sync em IndexedDB.
- [ ] **Testar** em cenário real (área rural, baixa conexão) e ajustar política de sincronização e UX.

---

## 6. Onde isso se encaixa no AmbientaR

- Os dados sincronizados (inventário, parcelas, indivíduos) alimentam o **contexto ambiental** e os **laudos** (ex.: relatório de inventário florestal), assim como hoje os dados cadastrados no app web.
- O **App de campo** é mais uma **fonte de dados** do mesmo ecossistema AmbientaR (Firestore + Storage), com foco em coleta offline e sync posterior.

O módulo **Coleta de campo** (`/coleta-campo`) é o ponto de entrada PWA para coleta offline e exportação de planilha para o Inventário Florestal.
