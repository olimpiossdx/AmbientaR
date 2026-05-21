# Publicar regras do Firestore e ajustar usuários

Use o **terminal** (Cursor ou sistema) com Node.js e os comandos abaixo.

---

## 1. Publicar as regras do Firestore

### O que você precisa

- **Node.js** instalado.
- **Firebase CLI** via `npx` (não precisa instalar globalmente).

### Passos

1. **Abrir o terminal** na pasta do projeto (recomendado: `E:\AmbientaR` — ver `docs/REPOSITORIO-LOCAL-E-GITHUB.md`).

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

**Cadastro (titular):** o documento pode incluir **`allowsCommercialContact`** (boolean), preenchido automaticamente no registo: `true` apenas no plano **básico** após aceitar o contrato; nos planos **intermediário+**, só `true` se o utilizador marcar o opt-in de comunicação comercial no formulário. O plano **gratuito** não define `allowsCommercialContact` como verdadeiro (sem marketing direto da CONTRATADA; publicidade de terceiros, se ativada, regula-se pelo contrato — cláusula do plano Gratuito). O titular pode alterar preferências nos termos da LGPD (revogação/oposição conforme política da empresa).

---

## 3. Assinatura anual da plataforma (titulares Cliente Gestão / Autônomo)

Após o cadastro com plano pago, o documento **`users/{uid}`** pode ter:

- `platformPaymentStatus`: `pending_verification` (aguardando confirmação), `paid`, `exempt`, `pending_contract`, `expired`
- `platformAccessValidUntil`: data ISO (fim do período de 12 meses)
- `platformPaymentMethod`: `pix` | `credit_card` | `debit_card`

**Para liberar o acesso manualmente** (após conferir PIX/cartão): no Firestore, edite o usuário e defina, por exemplo:

- `platformPaymentStatus`: `paid`
- `platformAccessValidUntil`: data de validade em ISO (ex.: um ano à frente)
- Opcional: `platformPaymentVerifiedAt` com timestamp

Pedidos de cadastro ficam em **`platform_payment_requests`** (o titular cria; admin/supervisor podem atualizar).

**Testes sem confirmação manual:** em `.env.local` use `NEXT_PUBLIC_AMBIENTAR_PLATFORM_PAYMENT_AUTO_APPROVE=true` (apenas desenvolvimento).

**PIX no cadastro:** `NEXT_PUBLIC_AMBIENTAR_PIX_COPIA_E_COLA` (código copia e cola). Suporte no ecrã de bloqueio: `NEXT_PUBLIC_AMBIENTAR_SUPPORT_EMAIL`.

---

## Resumo

| Ação | Comando / local |
|------|------------------|
| Publicar regras | `npm run deploy:rules` (terminal) |
| Ajustar role | Firebase Console → Firestore → users → documento do UID |

---

## Atualizações de regras já publicadas (30/03/2026)

- **Admin total (catch-all):** `match /{document=**} { allow read, write: if isAdmin(); }`.
- **Defesa de Auto de Infração:** coleção `autoInfracaoDefesas`.
- **Contratos-Fornecedores:** coleção `supplierContracts` com escrita para `admin`, `sales`, `supervisor`, `financial`.

Se aparecer erro de permissão em módulos novos, confirme que o deploy foi feito no projeto correto (`studio-316805764-e4d13`) e refaça `npm run deploy:rules`.
