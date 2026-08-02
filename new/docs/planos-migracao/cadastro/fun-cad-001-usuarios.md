# FUN-CAD-001 — Usuários

Status: frontend parcial em execução; migração vertical não concluída  
Módulo pai: **Cadastro**  
Origem funcional: seção “Cadastro” do catálogo  
Dependência de acesso do pai: `modulo.cadastro=acessar`

## Objetivo e escopo

Migrar a funcionalidade **Usuários** do `web` para o `new`, sem dependência de Firebase nem das rotas Next.js do legado. O corte deve ser vertical: navegação, telas, serviço HTTP, contrato, autorização, persistência, testes e observabilidade entram na mesma entrega.

Regra funcional levantada: edição própria separada da administração; senha nunca retorna; grupos usam versão; AC-CRUD.

## Hierarquia e rotas

- Módulo/menu pai: **Cadastro**.
- Filho/tela: **Usuários**.
- Rotas alvo declaradas: /app/users e formulário/modal.
- Claim do filho: recurso.usuario=*; claims de grupo existentes.
- Regra de navegação: o pai só aparece se houver ao menos um filho autorizado; URL direta e menu devem aplicar a mesma claim.

## Evidência no legado

Páginas correspondentes encontradas diretamente:

- `web/src/app/(app)/users/page.tsx`

Touchpoints detectados apenas nessas páginas (levantamento estático inicial):

- Firebase/Firestore direto na página: **não detectado**.
- Coleções detectadas: não detectadas diretamente.
- APIs Next detectadas: não detectadas diretamente.

> Este rastreio não substitui o refinamento: hooks, componentes importados, regras Firestore, serviços e geradores de documento devem ser percorridos antes da implementação.

## Plano do front-end (`new`)

- [x] Registrar módulo e rota concreta no registro central, mantendo **Cadastro** como pai.
- [x] Criar tipos de apresentação e service próprio usando exclusivamente o cliente HTTP central.
- [x] Implementar listagem, busca, paginação, formulário CRUD e painel de grupos/claims.
- [x] Aplicar guard de rota e guards de experiência por claim; não usar `role`, `isAdmin` ou Firebase como autorização.
- [x] Mover a definição do item de navegação de Usuários para o próprio módulo, preservando a composição com os filhos ainda legados de Cadastro.
- [ ] Fechar schemas/DTOs, edição própria versus administração, escopo e controle de versão do usuário.
- [ ] Cobrir loading, vazio, erro de validação, 401, 403, 404, conflito de versão e indisponibilidade da API.
- [ ] Garantir responsividade, teclado, foco, rótulos, feedback de operação e persistência em URL dos filtros relevantes.
- [ ] Remover qualquer chamada direta a `/api/*` do legado; arquivos e jobs devem seguir os contratos comuns do catálogo.

## Plano da API (`ambientaR-api`)

Contrato alvo: CRUD existente /user; /authorization/groups; /authorization/claims.

Situação encontrada: **Parcial/existente — validar aderência ao contrato alvo**.

- `../ambientaR-api/src/authorization/controllers/authorization-group.controller.ts`
- `../ambientaR-api/src/authorization/controllers/claim-catalog.controller.ts`
- `../ambientaR-api/src/controllers/user/controller.ts`

- [ ] Refinar DTOs de entrada/saída, filtros, ordenação, paginação, erros de campo e envelope sem expor schema de banco.
- [ ] Implementar controller fino, caso de uso, regras de domínio/policy, porta de repositório e adaptador de infraestrutura.
- [ ] Declarar claim no controller e valor em cada ação; aplicar escopo no repositório antes de consultar, agregar ou alterar.
- [ ] Derivar tenant, titularidade e autor da sessão; nunca confiar nesses campos vindos do payload.
- [ ] Aplicar idempotência, controle de versão, auditoria, correlação e exclusão lógica conforme o risco da operação.
- [ ] Para arquivos, integrações e processamento pesado, aplicar respectivamente `API-FILE`, `API-INTEGRATION` e `API-JOB` do catálogo.
- [ ] Criar testes unitários de domínio, integração HTTP e contrato para autorizado, sem claim, fora do escopo, payload inválido e conflito.

## Sequência de migração

1. Refinar o comportamento real percorrendo páginas, componentes, hooks, coleções, regras e documentos vinculados.
2. Congelar contrato e matriz de autorização/escopo antes de desenvolver a tela.
3. Implementar domínio e endpoint no `ambientaR-api`, com testes negativos.
4. Implementar o módulo no `new`, integrar ao endpoint e completar estados de interface.
5. Executar testes verticais, homologar desktop/mobile e liberar por feature flag.
6. Comparar dados/resultados com o legado e só então retirar a rota antiga.

## Critérios de aceite e saída

- [ ] Regra específica validada: edição própria separada da administração; senha nunca retorna; grupos usam versão; AC-CRUD.
- [ ] Critérios comuns aplicáveis (`AC-FRONT`, `AC-CRUD`, `AC-READ`, `AC-WORKFLOW`, `AC-FILE`, `AC-JOB`, `AC-INT`) atendidos conforme o contrato.
- [ ] Menu pai, filho, rota, botões e endpoint negam acesso de forma coerente.
- [ ] Nenhum import ou chamada para Firebase, Next API ou runtime do `web` permanece.
- [ ] Dados migrados/reconciliados, rollback ensaiado e evidências anexadas ao acompanhamento da migração.
- [ ] Produto homologa regras, cálculos, documentos gerados, permissões negativas e comportamento responsivo.

## Pendências para o refinamento

- Confirmar campos, validações, estados, transições e mensagens que hoje vivem em componentes importados.
- Confirmar fonte de dados, estratégia de migração, volume, retenção, anexos e deduplicação.
- Confirmar se rotas auxiliares sem entrada direta de menu são telas do mesmo filho ou ações internas.
- Resolver qualquer divergência entre contrato proposto e endpoints já existentes antes de codificar.
- Cobrir API e frontend com testes negativos de claim, escopo, 401, 403, 404 e conflito.
- Homologar a tela integrada contra o `ambientaR-api`; os testes unitários atuais do service não substituem esse aceite.
