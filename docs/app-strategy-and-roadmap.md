# AmbientaR – Estratégia e roadmap do app (online + offline)

Passos sugeridos para levar o AmbientaR ao app mobile de forma robusta, com segurança e preparação para offline.

---

## 1. Definir escopo por perfil

- **docs/offline-app-scope.md** – coleções e filtros por perfil.
- Cliente: dados ligados a CPF/CNPJ (empreendedores, projetos, contratos, faturas, licenças).
- Outros perfis: cache sob demanda ou download limitado.

---

## 2. Estratégia do app

- **PWA evoluído:** um só código (Next.js), offline (IndexedDB) + sync; instalação pelo navegador.
- **Híbrido (Capacitor):** mesmo front em WebView; publicar nas lojas.
- Recomendação inicial: PWA evoluído ou Capacitor para reutilizar o código atual.

---

## 3. Camada offline e sincronização

- Modelo local espelhando o que cada perfil vê.
- Cliente: “Download dos meus dados” após login (escopo em offline-app-scope.md).
- Outros perfis: cache sob demanda. Sync quando online.

---

## 4. Segurança

- Firestore: regras por perfil; cliente restrito a CPF/CNPJ e derivados.
- Banco local apenas com dados que o usuário poderia ver online.

---

## 5. Navegabilidade

- **loading.tsx** na rota (app) para feedback ao clicar no menu (implementado).
- Menu e dashboards por perfil alinhados (navigation-config, user.role).

---

## Estado atual

- Implementado: regras Firestore (isTechnical, condicionantes, restrições de update), loading.tsx, supressão de erros de extensão, documentação de escopo e deploy.
- Próximos passos: camada de armazenamento local e rotina de sync conforme offline-app-scope.md.
