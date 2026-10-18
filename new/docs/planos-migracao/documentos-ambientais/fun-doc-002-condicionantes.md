# FUN-DOC-002 — Condicionantes

Status: implementação parcial em `new` e `ambientaR-api`; pendente homologação e notificações automáticas
Módulo pai: **Documentos Ambientais**  
Origem funcional: seção “Documentos Ambientais” do catálogo  
Dependência de acesso do pai: `modulo.documentos-ambientais=acessar`

## Objetivo e escopo

Migrar a funcionalidade **Condicionantes** do `web` para o `new`, sem dependência de Firebase nem das rotas Next.js do legado. O corte deve ser vertical: navegação, telas, serviço HTTP, contrato, autorização, persistência, testes e observabilidade entram na mesma entrega.

Regra funcional levantada: prazo, recorrência, evidência e alerta; AC-WORKFLOW, AC-FILE.

## Hierarquia e rotas

- Módulo/menu pai: **Documentos Ambientais**.
- Filho/tela: **Condicionantes**.
- Rotas alvo declaradas: /app/compliance.
- Claim do filho: recurso.condicionante=*.
- Regra de navegação: o pai só aparece se houver ao menos um filho autorizado; URL direta e menu devem aplicar a mesma claim.

## Evidência no legado

Páginas correspondentes encontradas diretamente:

- `web/src/app/(app)/compliance/page.tsx`

Touchpoints detectados apenas nessas páginas (levantamento estático inicial):

- Firebase/Firestore direto na página: **não detectado**.
- Coleções detectadas: não detectadas diretamente.
- APIs Next detectadas: não detectadas diretamente.

> Este rastreio não substitui o refinamento: hooks, componentes importados, regras Firestore, serviços e geradores de documento devem ser percorridos antes da implementação.

## Plano do front-end (`new`)

- [x] Registrar módulo, rotas lazy e item filho no registro central, mantendo **Documentos Ambientais** como pai.
- [x] Criar tipos de domínio e service próprio usando exclusivamente o cliente HTTP central; filtros de busca, status e página ficam na URL.
- [x] Implementar lista paginada, busca, filtro de status, cadastro, edição, exclusão lógica, mudança de status, cumprimento e evidências.
- [x] Aplicar guard antes do carregamento e guard de ação para `recurso.condicionante=*`; não usar `role`, `isAdmin` ou Firebase como autorização.
- [x] Cobrir carregamento, lista vazia e mensagens para 401, 403, 404, 409 e indisponibilidade.
- [x] Usar layout responsivo, controles rotulados e feedback de operação.
- [ ] Substituir a digitação manual do ID do documento vinculado por seletor após migrar as telas/endpoints de licença, outorga, TAC e intervenção.
- [ ] Remover qualquer chamada direta a `/api/*` do legado; arquivos e jobs devem seguir os contratos comuns do catálogo.

## Plano da API (`ambientaR-api`)

Contrato alvo: CRUD /conditions; ação fulfill.

Situação encontrada: **Não localizado no `ambientaR-api`; tratar como contrato e implementação novos**.

- sem controller correspondente localizado

- [x] Definir DTOs, filtros, paginação e validação de entrada sem expor schema de banco.
- [x] Implementar controller, serviço de aplicação, repositório Mongo, autorização e exclusão lógica.
- [x] Declarar `recurso.condicionante` e restringir consultas/mutações à organização da sessão.
- [x] Derivar organização e autor da sessão; rejeitar tenant/autor enviados no payload.
- [x] Aplicar controle de versão em edição, status e exclusão, log de auditoria e cumprimento idempotente.
- [x] Salvar evidências PDF/JPG/PNG pelo `FILE_STORAGE_PROVIDER` (local ou SharePoint/Microsoft Graph).
- [ ] Completar testes do serviço, integração HTTP e autorização negativa (claim ausente, outro tenant e conflito).
- [ ] Automatizar notificações de prazo; nesta entrega, vencimento é calculado e sinalizado visualmente na lista.

## Sequência de migração

1. [x] Refinar o comportamento principal do formulário e da listagem legados.
2. [x] Definir contrato inicial, claims e escopo organizacional.
3. [x] Implementar domínio e endpoint; testes de integração e autorização negativa seguem pendentes.
4. [x] Integrar o módulo `new` ao endpoint com CRUD, filtros, status e evidências.
5. [ ] Executar testes verticais, homologar desktop/mobile e liberar por feature flag.
6. [ ] Reconciliar dados com o legado e retirar a rota antiga após homologação.

## Critérios de aceite e saída

- [ ] Regra específica homologada: prazo e recorrência disponíveis; evidência obrigatória para cumprimento; alerta visual de atraso. Notificação automática segue pendente.
- [ ] Critérios comuns aplicáveis (`AC-FRONT`, `AC-CRUD`, `AC-READ`, `AC-WORKFLOW`, `AC-FILE`, `AC-JOB`, `AC-INT`) atendidos conforme o contrato.
- [x] Menu filho, rota, ações e endpoint aplicam as claims da funcionalidade.
- [x] O módulo `new` não importa Firebase, Next API ou runtime do `web`.
- [ ] Dados migrados/reconciliados, rollback ensaiado e evidências anexadas ao acompanhamento da migração.
- [ ] Produto homologa regras, cálculos, documentos gerados, permissões negativas e comportamento responsivo.

## Pendências para o refinamento

- [x] Confirmar os campos principais, status, recorrência e anexos do formulário legado.
- [ ] Confirmar estratégia de migração, volume, retenção e reconciliação de referências; os IDs externos são preservados como texto nesta etapa.
- [ ] Definir regra e canal das notificações automáticas de prazo.
- Confirmar se rotas auxiliares sem entrada direta de menu são telas do mesmo filho ou ações internas.
- Resolver qualquer divergência entre contrato proposto e endpoints já existentes antes de codificar.
