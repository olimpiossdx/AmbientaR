# FUN-AUTH-002 — Cadastro

Status: **prioridade P0 — fluxo pós-cadastro implementado; FUN-AUTH-002 continua em execução até homologar a paridade integral**
Módulo pai: **Acesso e sessão**  
Origem funcional: seção “Rotas públicas e sessão” do catálogo  
Dependência de acesso do pai: `rota pública ou sessão autenticada`

## Atualização de execução — 12/10/2026

Implementado no corte atual:

- API de sessão retorna `registrationMode`, `onboardingStatus` e `onboarding.nextAction` em registro, login, sessão e refresh.
- O `new` direciona cadastro e login para `/app/primeiros-passos` quando a conta precisa de empresa, vínculo ou permissões; URLs de negócio continuam exigindo claims.
- Titular sem empresa pode criar a empresa. A API só permite essa criação ao titular e provisiona um grupo inicial de gestão da própria empresa, sem claims de módulos de negócio.
- Representante/consultor pode criar pedido de acesso e consultar os próprios pedidos. O titular só lista/aprova/recusa pedidos para o documento persistido da própria conta; a aprovação vincula a conta à empresa, sem atribuir claims.
- Depois da aprovação, o titular/administrador precisa atribuir o grupo apropriado. A sessão atualiza os próximos passos e o menu só apresenta opções declaradas por claims.
- O menu oculta folhas sem claim e o catch-all legado nega rotas sem requisito catalogado.

Validação executada: build e **83 testes do `new`**; compilação TypeScript e **110 testes da API**. Ainda pendem homologação real entre titulares/representantes em empresas diferentes, confirmação das mensagens/transições da jornada legada e paridade integral do cadastro (campos, contratos, pagamento e demais etapas existentes no `web`).

## Objetivo e escopo

Migrar a funcionalidade **Cadastro** do `web` para o `new`, sem dependência de Firebase nem das rotas Next.js do legado. O corte deve ser vertical: navegação, telas, serviço HTTP, contrato, autorização, persistência, testes e observabilidade entram na mesma entrega.

Regra funcional levantada: documento único, senha com hash, cadastro parcial consistente e sessão válida. O cadastro precisa terminar em uma tela de próximos passos contextualizada pelo estado persistido da conta. A conta só poderá navegar e abrir telas para as quais tenha claims efetivas; o tipo escolhido no formulário não concede autorização.

## Hierarquia e rotas

- Módulo/menu pai: **Acesso e sessão**.
- Filho/tela: **Cadastro**.
- Rotas alvo declaradas: /register.
- Rota autenticada proposta para continuidade: `/app/primeiros-passos` (nome provisório a validar no refinamento visual).
- Claim do filho: pública; vínculos criados pelo caso de uso.
- Regra de navegação: o pai só aparece se houver ao menos um filho autorizado; URL direta e menu devem aplicar a mesma claim.

## História prioritária — continuar após o cadastro com acesso coerente

**Como** pessoa que acabou de criar uma conta, **quero** receber a próxima ação adequada ao estado da minha conta e aos acessos efetivamente concedidos, **para** conseguir começar a usar o sistema sem encontrar um painel vazio ou opções que não posso abrir.

### Cenários de aceite

```gherkin
Cenário: cadastro autenticado com onboarding incompleto
  Dado que a API criou a conta e retornou a sessão autenticada
  E que a sessão informa o modo de cadastro e o estado de onboarding persistidos
  Quando o cadastro terminar
  Então a pessoa deve chegar à tela de primeiros passos
  E deve ver a próxima ação compatível com seu estado e suas claims efetivas
  E não deve ser enviada a um painel genérico sem ação útil

Cenário: usuário titular precisa preparar sua conta empresarial
  Dado que o cadastro corresponde ao modo cliente autônomo
  E que o onboarding ainda exige configuração da empresa ou do titular
  Quando a tela de primeiros passos for exibida
  Então ela deve oferecer somente as etapas que o estado persistido ainda exige
  E cada ação deve verificar a claim necessária antes de navegar ou executar

Cenário: representante ou consultor ainda não possui vínculo aprovado
  Dado que o cadastro corresponde a representante ou consultor representante
  E que não existe vínculo de acesso aprovado para a conta
  Quando a tela de primeiros passos for exibida
  Então deve informar o estado do acesso e apresentar a ação disponível para solicitá-lo
  E não deve mostrar dados, menus ou telas de um titular/carteira sem vínculo autorizado

Cenário: menu é filtrado pelas permissões efetivas
  Dado que a API resolveu as claims a partir dos grupos persistidos do usuário
  Quando o shell autenticado montar o menu
  Então cada item visível deve exigir as claims cumulativas do pai e do filho
  E agrupadores sem itens visíveis devem desaparecer

Cenário: tentativa de abrir rota sem permissão
  Dado que a sessão não possui uma claim exigida por uma rota
  Quando a pessoa abrir essa URL diretamente
  Então o guard deve negar o acesso e apresentar a tela de acesso negado
  E a API deve também negar qualquer endpoint protegido por essa capacidade

Cenário: permissões mudam durante uma sessão
  Dado que a composição de grupos do usuário foi alterada
  Quando a versão de autorização for renovada
  Então menu, guard e ações devem refletir as novas claims
  E uma permissão removida não pode continuar utilizável por estado antigo do frontend
```

### Regras e limites

- `registrationMode` orienta a experiência de próximos passos; não funciona como role nem concede acesso.
- `onboardingStatus` e estado de vínculo precisam vir da API, tanto no cadastro quanto em login/refresh da sessão. O frontend não infere conclusão a partir dos campos do formulário.
- As claims efetivas originam-se dos grupos e vínculos persistidos. Menus, rotas e ações no `new` usam a mesma fonte; o `ambientaR-api` permanece autoridade final para cada endpoint.
- A tela de primeiros passos pode mostrar progresso e instruções disponíveis sem abrir áreas protegidas; cada CTA só aparece quando a ação for aplicável e autorizada.
- A matriz exata de etapas por modo, estados de associação e claims necessárias deve ser extraída do `web` e validada com Produto antes de congelar os fluxos. Os cenários acima cobrem o comportamento mínimo, não substituem o rastreio funcional.

### Tarefas de implementação

1. **Rastrear jornadas do legado** — mapear telas, decisões e transições dos três modos, onboarding, solicitação/aprovação de vínculos e respectivos destinos. Saída: matriz evidenciada modo × estado × próxima ação.
2. **Fechar política de grupos e claims** — identificar grupos atribuídos na criação e permissões esperadas por funcionalidade. Saída: matriz revisada sem autorização derivada do modo de cadastro.
3. **Completar contrato de sessão na API** — incluir modo/estado persistidos nos contratos de register, login, session e refresh; definir consulta e comandos de onboarding. Saída: DTO versionado e regras de autorização/tenant testáveis.
4. **Implementar experiência no `new`** — tela de primeiros passos, resolução do destino pós-cadastro/login, estados sem vínculo e CTAs protegidas por claims. Saída: nenhuma conta incompleta cai em painel vazio ou rota não autorizada.
5. **Fechar autorização ponta a ponta** — alinhar filtragem do menu, guard de rotas, ações e endpoint; propagar atualização de versão de claims. Saída: tabela automatizada de casos positivos/negativos por grupo.
6. **Homologar e liberar** — percorrer os três modos, vínculos pendentes/aprovados, acesso direto, alteração de grupo, tenant, teclado e mobile. Saída: evidências vinculadas à feature e liberação vertical aprovada.

### Definition of Ready

- [ ] As três jornadas e seus estados têm evidência nos arquivos/comportamentos do legado.
- [ ] Produto revisou próximos passos, mensagens e transições de vínculo por modo.
- [ ] A matriz associa cada item de menu, rota e ação à claim e ao escopo do endpoint correspondente.
- [ ] API definiu contrato de sessão e ownership multiempresa dos estados do onboarding.

### Definition of Done

- [ ] Cenários Gherkin acima passam no fluxo integrado `new` + `ambientaR-api`.
- [ ] Menu, URL direta e API têm resultados coerentes para cada grupo validado, incluindo negações.
- [ ] Sessão e refresh carregam estado persistido e atualização de claims não deixa permissões antigas utilizáveis.
- [ ] Nenhum modo chega a tela genérica sem orientação; nenhuma tela/ação protegida aparece sem a claim necessária.
- [ ] Jornada homologada em desktop e mobile, com evidências e critérios de rollback registrados.

## Evidência no legado

Páginas correspondentes encontradas diretamente:

- `web/src/app/register/page.tsx`

Touchpoints detectados apenas nessas páginas (levantamento estático inicial):

- Firebase/Firestore direto na página: **não detectado**.
- Coleções detectadas: não detectadas diretamente.
- APIs Next detectadas: não detectadas diretamente.

> Este rastreio não substitui o refinamento: hooks, componentes importados, regras Firestore, serviços e geradores de documento devem ser percorridos antes da implementação.

## Plano do front-end (`new`)

- [ ] Registrar módulo, rotas lazy, item filho e breadcrumb no registro central, mantendo **Acesso e sessão** como pai.
- [ ] Criar tipos de domínio de apresentação, schemas de URL/formulário e service próprio usando exclusivamente o cliente HTTP central.
- [ ] Implementar todas as variações de tela declaradas (1), preservando busca, filtros, paginação, seleção, ações, anexos e exportações existentes que forem confirmados no refinamento.
- [ ] Marcar a rota como pública, impedir dependência acidental de sessão e manter redirecionamentos autenticados explícitos.
- [ ] Substituir o redirecionamento incondicional pós-cadastro para `/app` por um destino calculado a partir da sessão/estado retornado pela API; implementar `/app/primeiros-passos` como entrada para onboarding incompleto.
- [ ] No shell, renderizar somente menu/ações autorizados por claims efetivas cumulativas; proteger cada URL direta com os mesmos requisitos de claim e escopo usados na navegação.
- [ ] Exibir estado sem acesso ou vínculo pendente com orientação útil e ação permitida, sem revelar dados de outro tenant ou titular.
- [ ] Reutilizar a política de destino após login e refresh para que uma conta incompleta retome o próximo passo, preservando redirects internos autorizados.
- [ ] Atualizar menu, guards e estado das ações quando a versão de autorização/claims mudar.
- [ ] Cobrir loading, vazio, erro de validação, 401, 403, 404, conflito de versão e indisponibilidade da API.
- [ ] Garantir responsividade, teclado, foco, rótulos, feedback de operação e persistência em URL dos filtros relevantes.
- [ ] Remover qualquer chamada direta a `/api/*` do legado; arquivos e jobs devem seguir os contratos comuns do catálogo.

## Plano da API (`ambientaR-api`)

Contrato alvo: POST /auth/register, POST /auth/register/document-preview.

Situação encontrada: **Parcial/existente — validar aderência ao contrato alvo**.

- `../ambientaR-api/src/controllers/auth.controller.ts`

- [ ] Refinar DTOs de entrada/saída, filtros, ordenação, paginação, erros de campo e envelope sem expor schema de banco.
- [ ] Incluir na sessão pública campos tipados e persistidos para `registrationMode`, `onboardingStatus` e estado mínimo dos vínculos necessários à resolução dos próximos passos; retorná-los de forma consistente em register, login, session e refresh.
- [ ] Garantir que o bootstrap de acesso/grupos na criação da conta seja definido no servidor por política aprovada e que as claims da sessão sejam sempre resolvidas dos grupos; nunca aceitar claims, grupo ou papel enviados pelo navegador.
- [ ] Definir endpoint/caso de uso para consultar e avançar o onboarding; derivar usuário, organização, titular e vínculos da sessão e validar claims e escopo em cada transição.
- [ ] Padronizar resposta de sem-permissão e vínculo pendente sem expor existência ou dados de contas de terceiros.
- [ ] Implementar controller fino, caso de uso, regras de domínio/policy, porta de repositório e adaptador de infraestrutura.
- [ ] Marcar somente os handlers necessários como públicos; aplicar rate limit e respostas que não enumerem dados sensíveis.
- [ ] Derivar tenant, titularidade e autor da sessão; nunca confiar nesses campos vindos do payload.
- [ ] Aplicar idempotência, controle de versão, auditoria, correlação e exclusão lógica conforme o risco da operação.
- [ ] Para arquivos, integrações e processamento pesado, aplicar respectivamente `API-FILE`, `API-INTEGRATION` e `API-JOB` do catálogo.
- [ ] Criar testes unitários de domínio, integração HTTP e contrato para autorizado, sem claim, fora do escopo, payload inválido e conflito.

## Sequência de migração

1. **P0 — homologar a jornada pós-cadastro do `web`**: percorrer cadastro, dashboards por modo, onboarding, solicitações e aprovações de vínculo, menu, guards, hooks, dados e regras; registrar telas e transições com evidências.
2. Fechar a matriz modo × estado de onboarding/vínculo × próxima ação × claim de menu/rota/endpoint. Confirmar o catálogo de grupos inicial no servidor; modo de cadastro não é uma permissão.
3. Congelar DTO de sessão, transições e contratos; incluir estado de onboarding na sessão de register/login/session/refresh e endpoints de leitura/avanço na API.
4. Implementar domínio/policies e endpoints no `ambientaR-api`; validar isolamento multiempresa e testes positivos/negativos.
5. Implementar tela de primeiros passos e shell/menu/guards no `new`; destinos protegidos exigem claims cumulativas e ações coerentes com a API.
6. Homologar as três jornadas de cadastro, solicitações pendentes, ausência de claims, mudança de grupo durante sessão, URL direta, mobile e teclado.
7. Só então retomar as próximas funcionalidades funcionais, incluindo Empreendimentos; reconciliar dados e evidências antes de retirar a rota antiga.

## Critérios de aceite e saída

- [ ] Regra específica validada: documento único, senha com hash, cadastro parcial consistente e sessão válida.
- [ ] Os três modos de cadastro possuem jornada pós-cadastro documentada, implementada e homologada conforme estado real da conta.
- [ ] Sessão retorna modo e onboarding persistidos em register/login/session/refresh; decisão de interface nunca depende somente do payload local do formulário.
- [ ] Menu, acesso por URL, botões/ações e endpoints concordam com a matriz de claims efetivas cumulativas; usuário sem permissão não acessa pelo endereço direto nem pela API.
- [ ] Claims vêm dos grupos/vínculos persistidos e são atualizadas segundo a versão de autorização; modo de cadastro não funciona como role.
- [ ] Conta sem vínculo aprovado recebe estado e próximos passos sem acesso a registros fora do escopo.
- [ ] Critérios comuns aplicáveis (`AC-FRONT`, `AC-CRUD`, `AC-READ`, `AC-WORKFLOW`, `AC-FILE`, `AC-JOB`, `AC-INT`) atendidos conforme o contrato.
- [ ] Menu pai, filho, rota, botões e endpoint negam acesso de forma coerente.
- [ ] Nenhum import ou chamada para Firebase, Next API ou runtime do `web` permanece.
- [ ] Dados migrados/reconciliados, rollback ensaiado e evidências anexadas ao acompanhamento da migração.
- [ ] Produto homologa regras, cálculos, documentos gerados, permissões negativas e comportamento responsivo.

## Pendências para o refinamento

- Mapear todos os passos dos modos `cliente_autonomo`, `representative` e `consultor_representante`, incluindo perfil, empresa/titular, vínculo, solicitação, aprovação e conclusão.
- Confirmar os grupos padrão de cada novo cadastro e quais telas/ações cada grupo pode usar; atribuição e composição permanecem decisão da API/administrador autorizado.
- Confirmar campos, validações, estados, transições e mensagens que hoje vivem em componentes importados.
- Confirmar fonte de dados, estratégia de migração, volume, retenção, anexos e deduplicação.
- Confirmar se rotas auxiliares sem entrada direta de menu são telas do mesmo filho ou ações internas.
- Resolver qualquer divergência entre contrato proposto e endpoints já existentes antes de codificar.
