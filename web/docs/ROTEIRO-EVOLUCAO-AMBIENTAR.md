# Roteiro de evolução e correções – AmbientaR (E:\AmbientaR)

**Objetivo:** Manter **E:\AmbientaR** como projeto final e incorporar melhorias de **layout** e **regras Firestore** identificadas na versão **C:\Users\Andrew\OneDrive\Projects\AmbientaR** (sem alterar a estrutura atual do projeto final).

**Data da análise:** Março 2025.

---

## 1. Resumo executivo

| Área            | OneDrive (referência)     | E:\AmbientaR (final)        | Ação sugerida                          |
|-----------------|---------------------------|-----------------------------|----------------------------------------|
| Regras Firestore| firebase/rules + JSDoc    | `src/firebase/rules/firestore.rules` único | Manter uma fonte; espelhos removidos   |
| Deploy regras   | firebase.json presente    | `firebase.json` na raiz     | OK — aponta para `src/firebase/rules/` |
| Layout (app)    | Cadastro incompleto + gesto| Sem cadastro incompleto    | Portar UX de notificação e gesto       |
| Sidebar mobile  | Toque para fechar + header| Sheet simples              | Portar gesto e botão “Fechar”         |
| Tailwind        | Idêntico                  | Idêntico                    | Nenhuma                                |
| Root layout     | Idêntico                  | Idêntico                    | Nenhuma                                |

---

## 2. Regras Firestore – comparação e melhorias

### 2.1 Onde estão as regras

- **E:\AmbientaR (atual):** um único ficheiro versionado para deploy: `src/firebase/rules/firestore.rules` (referenciado em `firebase.json`). Ficheiros duplicados `src/firestore.rules` e `firestore.rules` na raiz foram removidos para alinhar GitHub com o que se publica.
- **Histórico / cópias antigas (OneDrive, etc.):** podem ainda descrever dois ficheiros; ignorar — a política do repo é **só** `src/firebase/rules/firestore.rules`.

### 2.2 Melhorias nas regras (OneDrive → E:\AmbientaR)

1. **Helpers mais seguros (evitar negação quando doc não existe)**
   - **getRole():** usar `exists(path) ? get(path).data.role : null` em vez de só `get(...).data.role`.
   - **getUserProfile():** retornar `null` se o documento não existir e checar `userProfile != null` em `canViewLicense` / `canViewOutorga`.
   - **Benefício:** menos erros de permissão quando o documento do usuário ainda não foi criado (ex.: primeiro login).

2. **Comentários JSDoc**
   - OneDrive descreve cada bloco `match` com `@description` e `@path`.
   - Sugestão: aplicar o mesmo padrão em `src/firebase/rules/firestore.rules` (ou no arquivo que for escolhido como único).

3. **Regras específicas que valem a pena revisar**
   - **users/notifications:** OneDrive permite `read, write: if request.auth.uid == userId || isAdmin()` (admin pode ler notificações de qualquer usuário). Em E:\AmbientaR está só `request.auth.uid == userId`. Decidir se admin deve poder ler.
   - **clients:** OneDrive usa `allow read: if request.auth != null; allow write: if isSignedIn();` (mais simples; filtro por cliente no app). E:\AmbientaR usa `!isClient()` para write e `isClient()` só read. Manter comportamento atual ou simplificar como no OneDrive conforme regra de negócio.
   - **chats:** OneDrive usa `allow list: if isSignedIn();` (sem filtro na regra). E:\AmbientaR usa `request.query.where[0][2] == request.auth.uid`. O do OneDrive é mais simples; o de E:\AmbientaR restringe listagem pela regra. Escolher um padrão e documentar.
   - **oficios:** OneDrive inclui leitura para o destinatário: `resource.data.recipient == getUserProfile(...).get('name','')` e permite `update`/`delete` por admin. Portar essas regras se o fluxo de ofícios for o mesmo.
   - **licenses / outorgas:** OneDrive usa `allow read: if request.auth != null` (list/get liberado; app filtra). E:\AmbientaR firebase/rules usa `get`/`list` com isManager. Alinhar com o comportamento desejado (cliente listando ou não).
   - **intervencoes / condicionantes:** OneDrive restringe `list`/`write` a manager; em E:\AmbientaR há `list: if isSignedIn()`. Revisar se condicionantes devem ser listáveis por todos os autenticados ou só por manager.
   - **appointments:** OneDrive usa `ownerRole != 'financial'` e `ownerId == request.auth.uid` no `get`. Garantir que E:\AmbientaR tenha a mesma lógica se usar eventos financeiros vs públicos.
   - **commercialProposals / contracts:** Garantir em `src/firebase/rules/firestore.rules` as restrições de update de status (Accepted/Rejected e Aprovado só para admin/financeiro), como no projeto de referência.

4. **Coleções que só existem em E:\AmbientaR**
   - Manter em `src/firebase/rules/firestore.rules`: `consultas`, `laudos`, `rag_index`, `knowledge_sources`, `inventarios`, `inventario_parcelas`, `inventario_individuos`.
   - OneDrive não tem essas coleções nas regras; não remover do projeto final.

### 2.3 Roteiro sugerido para regras

1. **Criar `firebase.json` na raiz de E:\AmbientaR** (se ainda não existir), com:
   ```json
   {
     "firestore": {
       "rules": "src/firebase/rules/firestore.rules"
     }
   }
   ```
   Assim `npm run deploy:rules` passa a publicar o arquivo correto.

2. **Definir um único arquivo de regras como fonte da verdade** (recomendado: `src/firebase/rules/firestore.rules`).

3. **No arquivo escolhido:**
   - Aplicar helpers seguros (getRole com `exists`, getUserProfile com null).
   - Adicionar JSDoc nos blocos `match` principais.
   - Incluir todas as coleções usadas no app (incluindo consultas, laudos, rag_index, knowledge_sources, inventarios, etc.).
   - Manter as restrições de update em `commercialProposals` e `contracts` (status Accepted/Rejected e Aprovado).
   - Revisar oficios (leitura por destinatário, update/delete por admin), clients, chats, licenses, outorgas, intervencoes, condicionantes e appointments conforme itens acima.

4. ~~Manter espelho~~ **Feito:** usar só `src/firebase/rules/firestore.rules`; espelhos na raiz e em `src/firestore.rules` removidos (ver `docs/REPOSITORIO-LOCAL-E-GITHUB.md`).

5. **Testar** com `firebase deploy --only firestore:rules` (ou `npm run deploy:rules`) e validar em ambiente de desenvolvimento antes de produção.

---

## 3. Layout e UX – melhorias a portar do OneDrive

### 3.1 Cadastro incompleto (clientes / representantes)

**No OneDrive:**
- Campo `cadastroIncompleto` no perfil do usuário (ex.: em `users/{uid}`).
- Definido em registro e limpo ao concluir cadastro em cliente ou empreendedor.
- No layout `(app)`:
  - Variável `cadastroIncompleto` com base em `user?.cadastroIncompleto` e role `client` ou `representative`.
  - Contador de notificações: se `cadastroIncompleto`, mostra `notif + 1` (badge no sino).
  - No dropdown de notificações: item fixo “Cadastro incompleto” com link para `/clients` ou `/empreendedores`, estilo destaque (amber).

**Em E:\AmbientaR:** Não existe `cadastroIncompleto` nem essa UX.

**Sugestão de roteiro:**
1. Adicionar `cadastroIncompleto?: boolean` no tipo do usuário (ex.: em `src/lib/types.ts`).
2. Definir `cadastroIncompleto: true` no fluxo de registro (ex.: `register/page.tsx`) para client/representative.
3. Ao salvar cliente ou empreendedor vinculado ao usuário, chamar `updateDoc(doc(firestore, 'users', user.id), { cadastroIncompleto: false })` (como no OneDrive em `client-form.tsx` e `empreendedor-form.tsx`).
4. No formulário de usuário (user-form), ao editar o próprio perfil, enviar `cadastroIncompleto: false`.
5. No `(app)/layout.tsx` de E:\AmbientaR:
   - Calcular `cadastroIncompleto` como no OneDrive.
   - Ajustar `unreadCount` para incluir +1 quando cadastro incompleto.
   - Inserir no dropdown de notificações o item “Cadastro incompleto” com link e estilo (amber), antes da lista de notificações.

### 3.2 Zona de gesto para abrir menu no mobile

**No OneDrive:**
- Bloco entre header e conteúdo: uma faixa fixa à esquerda (`left-0 top-16 bottom-20 w-10 ... z-30`) só em mobile quando o menu está fechado (`isMobile && !openMobile`).
- Clique e toque chamam `setOpenMobile(true)`.
- Acessibilidade: `role="button"`, `aria-label="Abrir menu"`, `onKeyDown` para Enter/Space.

**Em E:\AmbientaR:** Não existe essa zona; o menu abre só pelo botão do header.

**Sugestão de roteiro:**
1. No `(app)/layout.tsx`, após o `</header>` e antes do `<div className="flex flex-1 overflow-hidden">`, inserir o mesmo bloco condicional da “zona de gesto” do OneDrive.
2. Garantir que `useSidebar()` em E:\AmbientaR exporte `openMobile` e `setOpenMobile` (já existe no seu sidebar) e que o layout use `isMobile` e `setOpenMobile` corretamente.

### 3.3 Sidebar mobile – fechar por gesto e header com botão

**No OneDrive:**
- No `Sheet` do sidebar em mobile:
  - `touchStart` / `touchEnd` com `touchStartX.current`; se `deltaX < -60`, chama `setOpenMobile(false)` (arrastar para a esquerda fecha).
  - Header interno no Sheet: barra com botão “Voltar” (ArrowLeft) e label “Menu”; ao clicar no botão, `setOpenMobile(false)`.
  - Classes do Sheet: `w-full max-w-full ... border-0 shadow-xl data-[state=open]:duration-300 data-[state=closed]:duration-200`.
  - Estrutura: header fixo + área rolável para os itens do menu.

**Em E:\AmbientaR:** Sheet sem gesto de fechar e sem header interno com botão.

**Sugestão de roteiro:**
1. Em `src/components/ui/sidebar.tsx`, no bloco `if (isMobile)`:
   - Adicionar `useRef` para `touchStartX`.
   - Implementar `handleTouchStart` / `handleTouchEnd` e passar para o container do conteúdo do Sheet (`onTouchStart` / `onTouchEnd`).
   - Incluir o header interno com `ArrowLeft` e “Menu” e botão que chama `setOpenMobile(false)`.
   - Ajustar classes do `SheetContent` para as do OneDrive (largura, borda, sombra, duração).
   - Manter a mesma estrutura: header + área rolável com `{children}`.

### 3.4 Outros arquivos de layout

- **Root layout (`app/layout.tsx`):** idêntico entre os dois projetos; nenhuma alteração necessária.
- **Tailwind:** idêntico; nenhuma alteração necessária.

---

## 4. Checklist de correções e evolução

Use este checklist ao implementar o roteiro (sem alterar o que não for necessário).

### Regras Firestore
- [x] `firebase.json` na raiz com `firestore.rules` apontando para `src/firebase/rules/firestore.rules`.
- [ ] Adotar getRole() com `exists(path) ? get(path).data.role : null` no arquivo de regras em uso.
- [ ] Adotar getUserProfile() com checagem de existência e uso de `userProfile != null` em canViewLicense/canViewOutorga.
- [ ] Adicionar JSDoc nos blocos match principais.
- [ ] Garantir coleções consultas, laudos, rag_index, knowledge_sources, inventarios, inventario_parcelas, inventario_individuos no arquivo de regras.
- [ ] Manter restrições de update em commercialProposals e contracts (status).
- [ ] Revisar e, se desejado, portar: oficios (recipient + admin update/delete), clients, chats, licenses, outorgas, intervencoes, condicionantes, appointments.
- [ ] Testar deploy com `npm run deploy:rules` e validar em ambiente de teste.

### Layout e UX
- [ ] Tipo do usuário: campo `cadastroIncompleto?: boolean`.
- [ ] Registro: definir `cadastroIncompleto: true` para client/representative.
- [ ] client-form e empreendedor-form: ao salvar, atualizar `cadastroIncompleto: false` no usuário.
- [ ] user-form: ao editar o próprio usuário, enviar `cadastroIncompleto: false`.
- [ ] (app)/layout: variável cadastroIncompleto, unreadCount com +1, item “Cadastro incompleto” no dropdown de notificações.
- [ ] (app)/layout: zona de gesto (faixa à esquerda) para abrir menu no mobile.
- [ ] sidebar.tsx (mobile): gesto de arrastar para esquerda para fechar (touchStart/touchEnd + setOpenMobile(false)).
- [ ] sidebar.tsx (mobile): header interno com botão “Voltar” (ArrowLeft) e “Menu”.

---

## 5. Referências rápidas

- **Projeto final (base):** E:\AmbientaR  
- **Projeto de referência (melhorias):** C:\Users\Andrew\OneDrive\Projects\AmbientaR  
- **Regras:** OneDrive usa `src/firebase/rules/firestore.rules` via `firebase.json`.  
- **Layout:** OneDrive – `src/app/(app)/layout.tsx` (cadastro incompleto, zona de gesto).  
- **Sidebar:** OneDrive – `src/components/ui/sidebar.tsx` (mobile: gesto + header com botão).

Este roteiro não altera a estrutura do projeto em E:\AmbientaR; apenas orienta a incorporação pontual de melhorias de regras e layout a partir do OneDrive.
