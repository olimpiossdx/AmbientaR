# Publicar regras do Firestore e ajustar usuários

Use o **terminal** (Cursor ou sistema) com Node.js e os comandos abaixo.

---

## 1. Publicar as regras do Firestore

### O que você precisa

- **Node.js** instalado.
- **Firebase CLI** via `npx` (não precisa instalar globalmente).

### Passos

1. **Abrir o terminal** na pasta do projeto (ex.: `F:\SERVIDOR\OneDrive\Projects\AmbientaR`).

2. **Login no Firebase** (só na primeira vez; abre o navegador):
   ```bash
   npx firebase login
   ```

3. **Publicar as regras**:
   ```bash
   npm run deploy:rules
   ```

O deploy usa o arquivo definido em **`firebase.json`**: `src/firebase/rules/firestore.rules`.  
Se aparecer "Project must be specified", configure o projeto em **`.firebaserc`** (campo `default`) para o mesmo `projectId` do `src/firebase/config.ts`.

---

## 2. Ajustar o role do usuário no Firestore

O app lê o **role** do documento em:

**Firestore** → coleção **`users`** → documento com ID = **UID do Firebase Auth**.

### Pelo Firebase Console

1. Acesse [console.firebase.google.com](https://console.firebase.google.com).
2. Selecione o projeto.
3. **Firestore Database** → **Dados** → coleção **`users`**.
4. Localize o documento com ID = UID do usuário (ou crie).
5. Edite o campo **`role`** com um dos valores: `admin`, `gestor`, `supervisor`, `technical`, `client`, `financial`, `sales`, etc.

Salve. Na próxima vez que o usuário fizer login, o app usará esse role.

---

## Resumo

| Ação | Comando / local |
|------|------------------|
| Publicar regras | `npm run deploy:rules` (terminal) |
| Ajustar role | Firebase Console → Firestore → users → documento do UID |
