# Comparação: GitHub AmbientaR vs Projeto Final (AmbientaR)

**Referência:** `F:\SERVIDOR\OneDrive\Projects\GitHub\AmbientaR`  
**Projeto final:** `F:\SERVIDOR\OneDrive\Projects\AmbientaR`

---

## 1. Configuração (raiz)

| Item | GitHub | Final | Observação |
|------|--------|--------|------------|
| **Next** | next.config.ts | next.config.mjs | Final usa .mjs; GitHub usa .ts |
| **Next versão** | 15.0.7 | 14.2.21 | Final fixado em 14 para evitar React 19 RC |
| **PWA** | @ducanh2912/next-pwa (next.config.ts) | Não | GitHub tem PWA; Final não |
| **React** | ^18.3.1 (sem override) | 18.3.1 (override no package.json) | Final fixa versão para evitar conflito |
| **firebase.json** | `"rules": "firestore.rules"` | `"rules": "src/firebase/rules/firestore.rules"` | Final centraliza regras em firebase/rules |
| **Script deploy:rules** | Sim | Sim | Ambos têm `npm run deploy:rules` |
| **Script dev:turbo** | Não | Sim | Final tem opção --turbo |
| **firebase-tools (devDep)** | Sim | Não no package.json | Final pode precisar para deploy:rules |
| **.firebaserc** | Sim | Verificar na raiz | Necessário para `firebase deploy` |
| **apphosting.yaml** | maxInstances: 1 | maxInstances: 1 | Iguais |
| **storage.rules** | Idêntico ao Final | Idêntico | branding + invoices/contracts/receipts/signed-contracts |

---

## 2. Firestore rules

| Aspecto | GitHub (raiz firestore.rules) | Final (src/firebase/rules/firestore.rules) |
|---------|-------------------------------|-------------------------------------------|
| **Catch-all admin** | `match /{document=**} { allow read, write: if isAdmin(); }` | Igual (implementado) |
| **isTechnical()** | Usado em empreendedores/projects mas **não definido** (bug) | Definido e usado |
| **condicionantes** | list/write só isManager() | list: isManager() \|\| isTechnical() \|\| isClient(); write: isManager() \|\| isTechnical() |
| **commercialProposals** | allow write geral | create/delete + update com restrição de status (Accepted/Rejected só admin/financial) |
| **contracts** | allow write geral | create/delete + update com restrição (Aprovado só admin/financial) |
| **canViewLicense / canViewOutorga** | Não no raiz | Sim (em src/firestore.rules) | Final tem helpers para cliente |

**Conclusão:** O projeto final está à frente nas regras (isTechnical, condicionantes, restrições de update em proposals/contracts). O GitHub tem bug: isTechnical() usada e não definida no firestore.rules da raiz.

---

## 3. Estrutura src/

| Pasta / recurso | GitHub | Final |
|-----------------|--------|--------|
| **src/app/(app)/** | dashboard, commercial-proposals, documents, monitoring/manual, analise-ambiental, study-templates, etc. | page.tsx (router de dashboards), proposals, licenses, compliance, etc. |
| **Rotas** | (app)/dashboard, (app)/commercial-proposals | (app)/page (dashboard único), (app)/proposals |
| **Navegação** | navigation-config, nav-content, nav-debug | Idem (navigation-config, sidebar) |
| **Offline** | offline-db, offline-sync, offline-scope, use-offline-client | Verificar se existe no Final |
| **IA/Genkit** | genkit.ts, flows (fill-study-with-ai-flow), use-fill-study-with-ai, actions-fill-with-ai | Verificar ai/ no Final |
| **Estudos dinâmicos** | dynamic-study-form, use-study-template, study-template-types, fill-with-ai-button | Verificar no Final |
| **docs/** | 9 arquivos (templates-estudos-dinamicos, estudos-preencher-com-ia, firestore-client-cpf-cnpj, seguranca-e-robustez-aplicados, firebase-deploy-rules, app-strategy-and-roadmap, offline-app-scope, backend.json, blueprint) | 6 arquivos (EVITAR-ERRO, ERRO-UNKNOWN-READ, PROXIMOS-PASSOS, ARQUITETURA-IA, backend.json, blueprint) |

---

## 4. Documentação em docs/ que existe no GitHub e não no Final

- `templates-estudos-dinamicos.md`
- `estudos-preencher-com-ia.md`
- `firestore-client-cpf-cnpj.md`
- `seguranca-e-robustez-aplicados.md`
- `firebase-deploy-rules.md`
- `app-strategy-and-roadmap.md`
- `offline-app-scope.md`

(backend.json e blueprint existem nos dois.)

---

## 5. Resumo de melhorias já aplicadas no Final

- Regra catch-all para admin (firebase/rules).
- isTechnical() definido e usado (condicionantes, empreendedores, projects).
- Condicionantes: list para manager, technical e client; write para manager e technical.
- commercialProposals e contracts: create/delete + update com restrição de status (espelho do GitHub).
- Script deploy:rules e firebase.json apontando para firebase/rules; .firebaserc para projeto default.
- AGENTS.md atualizado com deploy:rules e observações.
- **Componentes de estabilidade:** SuppressExtensionErrors no layout; loading.tsx em (app).
- **Documentação:** firebase-deploy-rules.md, seguranca-e-robustez-aplicados.md, offline-app-scope.md, app-strategy-and-roadmap.md, firestore-client-cpf-cnpj.md, COMPARACAO-GITHUB-AMBIENTAR.md.

---

## 6. Próximos passos sugeridos

1. **Firebase deploy:** Garantir que o projeto está configurado em `.firebaserc` (default) e executar `npm run deploy:rules` após alterar regras.
2. **Documentação:** Consultar `docs/seguranca-e-robustez-aplicados.md`, `docs/offline-app-scope.md`, `docs/app-strategy-and-roadmap.md`, `docs/firestore-client-cpf-cnpj.md` e `docs/COMPARACAO-GITHUB-AMBIENTAR.md`.
3. **PWA:** Manter Next 14 sem PWA para estabilidade; quando desejar, avaliar inclusão de `@ducanh2912/next-pwa` conforme repositório de referência.
4. **GitHub (referência):** Corrigir o `firestore.rules` da raiz definindo `function isTechnical()` para evitar falha de deploy.
