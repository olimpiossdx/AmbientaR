# FUN-EST-030 — PRADA

Status: análise inicial; implementação não iniciada por este plano  
Módulo pai: **Estudos Técnicos**  
Origem funcional: seção “Estudos Técnicos” do catálogo  
Dependência de acesso do pai: `modulo.estudos-tecnicos=acessar`

## Objetivo e escopo

Migrar a funcionalidade **PRADA** do `web` para o `new`, sem dependência de Firebase nem das rotas Next.js do legado. O corte deve ser vertical: navegação, telas, serviço HTTP, contrato, autorização, persistência, testes e observabilidade entram na mesma entrega.

Regra funcional levantada: diagnóstico, ações, cronograma e indicadores; AC-CRUD, AC-JOB.

## Hierarquia e rotas

- Módulo/menu pai: **Estudos Técnicos**.
- Filho/tela: **PRADA**.
- Rotas alvo declaradas: /app/studies/prada, /new, /$id/edit.
- Claim do filho: proposta: recurso.estudo-prada=*; validar no refinamento.
- Regra de navegação: o pai só aparece se houver ao menos um filho autorizado; URL direta e menu devem aplicar a mesma claim.

## Evidência no legado

Páginas correspondentes encontradas diretamente:

- `web/src/app/(app)/studies/prada/(.)[id]/edit/page.tsx`
- `web/src/app/(app)/studies/prada/(.)new/page.tsx`
- `web/src/app/(app)/studies/prada/[id]/edit/page.tsx`
- `web/src/app/(app)/studies/prada/new/page.tsx`
- `web/src/app/(app)/studies/prada/page.tsx`

Touchpoints detectados apenas nessas páginas (levantamento estático inicial):

- Firebase/Firestore direto na página: **não detectado**.
- Coleções detectadas: não detectadas diretamente.
- APIs Next detectadas: não detectadas diretamente.

> Este rastreio não substitui o refinamento: hooks, componentes importados, regras Firestore, serviços e geradores de documento devem ser percorridos antes da implementação.

## Plano do front-end (`new`)

- [ ] Registrar módulo, rotas lazy, item filho e breadcrumb no registro central, mantendo **Estudos Técnicos** como pai.
- [ ] Criar tipos de domínio de apresentação, schemas de URL/formulário e service próprio usando exclusivamente o cliente HTTP central.
- [ ] Implementar todas as variações de tela declaradas (3), preservando busca, filtros, paginação, seleção, ações, anexos e exportações existentes que forem confirmados no refinamento.
- [ ] Aplicar guard antes do carregamento e guard de ação para proposta: recurso.estudo-prada=*; validar no refinamento; não usar `role`, `isAdmin` ou Firebase como autorização.
- [ ] Cobrir loading, vazio, erro de validação, 401, 403, 404, conflito de versão e indisponibilidade da API.
- [ ] Garantir responsividade, teclado, foco, rótulos, feedback de operação e persistência em URL dos filtros relevantes.
- [ ] Remover qualquer chamada direta a `/api/*` do legado; arquivos e jobs devem seguir os contratos comuns do catálogo.

## Plano da API (`ambientaR-api`)

Contrato alvo: CRUD /studies/prada; exports.

Situação encontrada: **Não localizado no `ambientaR-api`; tratar como contrato e implementação novos**.

- sem controller correspondente localizado

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

- [ ] Regra específica validada: diagnóstico, ações, cronograma e indicadores; AC-CRUD, AC-JOB.
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
