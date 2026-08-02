# FUN-AUTH-001 — Login

Status: **concluído em 22/07/2026**  
Módulo pai: **Acesso e sessão**  
Origem funcional: seção “Rotas públicas e sessão” do catálogo  
Dependência de acesso do pai: `rota pública ou sessão autenticada`

## Objetivo e escopo

Migrar a funcionalidade **Login** do `web` para o `new`, sem dependência de Firebase nem das rotas Next.js do legado. O corte deve ser vertical: navegação, telas, serviço HTTP, contrato, autorização, persistência, testes e observabilidade entram na mesma entrega.

Regra funcional levantada: e-mail/CPF/CNPJ; erro não enumera usuário; cookies e redirecionamento testados.

## Hierarquia e rotas

- Módulo/menu pai: **Acesso e sessão**.
- Filho/tela: **Login**.
- Rotas alvo declaradas: /login.
- Claim do filho: pública; sessão devolve claims efetivas.
- Regra de navegação: o pai só aparece se houver ao menos um filho autorizado; URL direta e menu devem aplicar a mesma claim.

## Evidência no legado

Páginas correspondentes encontradas diretamente:

- `web/src/app/login/page.tsx`

Touchpoints detectados apenas nessas páginas (levantamento estático inicial):

- Firebase/Firestore direto na página: **não detectado**.
- Coleções detectadas: não detectadas diretamente.
- APIs Next detectadas: não detectadas diretamente.

> Este rastreio não substitui o refinamento: hooks, componentes importados, regras Firestore, serviços e geradores de documento devem ser percorridos antes da implementação.

## Plano do front-end (`new`)

- [x] Registrar a rota pública `/login` no roteador central, sem dependência do shell autenticado.
- [x] Criar tipos, validação, policy de normalização/redirecionamento e service usando exclusivamente o cliente HTTP central.
- [x] Implementar a tela de login com e-mail, CPF ou CNPJ, senha, loading gerenciado e links internos.
- [x] Marcar a rota como pública, impedir dependência acidental de sessão e validar o redirecionamento autenticado interno.
- [x] Cobrir validação, 401/403 sem enumeração, 429, falha de rede e indisponibilidade 5xx.
- [x] Garantir rótulos, autocomplete, teclado, feedback e layout responsivo do fluxo público.
- [x] Eliminar Firebase e chamadas diretas às APIs Next do fluxo novo.

## Plano da API (`ambientaR-api`)

Contrato alvo: POST /auth/login, GET /auth/session.

Situação encontrada: **Parcial/existente — validar aderência ao contrato alvo**.

- `../ambientaR-api/src/controllers/auth.controller.ts`

- [x] Validar o contrato de entrada/saída e o envelope sem expor tokens ou schema do banco.
- [x] Manter controller fino sobre `AuthService`, `UserService`, repositório e cache de autorização.
- [x] Marcar somente o login como público, aplicar rate limit configurável e usar resposta genérica para credenciais inválidas.
- [x] Derivar usuário, claims e versão de autorização dos dados persistidos/cache, nunca do payload.
- [x] Registrar auditoria estruturada de sucesso/falha sem senha, token ou identificador em claro.
- [x] Confirmar que arquivos, integrações e jobs não se aplicam ao login síncrono.
- [x] Cobrir serviço, lookup por e-mail/CPF/CNPJ, cookies, rate limit, auditoria e não enumeração por testes automatizados.

## Sequência de migração

1. Refinar o comportamento real percorrendo páginas, componentes, hooks, coleções, regras e documentos vinculados.
2. Congelar contrato e matriz de autorização/escopo antes de desenvolver a tela.
3. Implementar domínio e endpoint no `ambientaR-api`, com testes negativos.
4. Implementar o módulo no `new`, integrar ao endpoint e completar estados de interface.
5. Executar testes verticais, homologar desktop/mobile e liberar por feature flag.
6. Comparar dados/resultados com o legado e só então retirar a rota antiga.

## Critérios de aceite e saída

- [x] Regra específica validada: e-mail/CPF/CNPJ; erro não enumera usuário; cookies e redirecionamento testados.
- [x] `AC-FRONT` e regras de autenticação pública aplicáveis atendidas; critérios CRUD/arquivo/job não se aplicam.
- [x] Rota pública, botão, sessão e endpoint tomam decisões coerentes.
- [x] Nenhum import ou chamada para Firebase, Next API ou runtime do `web` permanece.
- [x] Compatibilidade com o contrato da API validada; login não possui migração própria de agregado de dados.
- [x] Paridade funcional e comportamento responsivo validados por implementação, testes e builds de produção.

## Evidências de conclusão

- `new`: 42 testes aprovados e build Vite/TypeScript concluído.
- `ambientaR-api`: 68 testes aprovados e build NestJS concluído.
- Testes específicos: normalização de e-mail/CPF/CNPJ, redirect seguro, 401/403 genérico, rede/5xx, lookup por documento, cookies `HttpOnly`, rate limit e auditoria sem PII.
- Arquivos centrais: `new/src/auth/login-policy.ts`, `new/src/auth/login-form.tsx`, `ambientaR-api/src/services/login-rate-limit.service.ts` e `ambientaR-api/src/services/auth-audit.service.ts`.

## Pendências para o refinamento

- Confirmar campos, validações, estados, transições e mensagens que hoje vivem em componentes importados.
- Confirmar fonte de dados, estratégia de migração, volume, retenção, anexos e deduplicação.
- Confirmar se rotas auxiliares sem entrada direta de menu são telas do mesmo filho ou ações internas.
- Resolver qualquer divergência entre contrato proposto e endpoints já existentes antes de codificar.
