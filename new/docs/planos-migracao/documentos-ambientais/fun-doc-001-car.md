# FUN-DOC-001 — CAR

Status: em implementação; primeira fatia de recibo entregue em 18/10/2026
Módulo pai: **Documentos Ambientais**  
Origem funcional: seção “Documentos Ambientais” do catálogo  
Dependência de acesso do pai: `modulo.documentos-ambientais=acessar`

## Objetivo e escopo

Migrar a funcionalidade **CAR** do `web` para o `new`, sem dependência de Firebase nem das rotas Next.js do legado. O corte deve ser vertical: navegação, telas, serviço HTTP, contrato, autorização, persistência, testes e observabilidade entram na mesma entrega.

Regra funcional levantada: recibo, imóvel, geometria e histórico; AC-CRUD, AC-FILE.

## Hierarquia e rotas

- Módulo/menu pai: **Documentos Ambientais**.
- Filho/tela: **CAR**.
- Rotas alvo declaradas: /app/car.
- Claim do filho: recurso.car=*.
- Regra de navegação: o pai só aparece se houver ao menos um filho autorizado; URL direta e menu devem aplicar a mesma claim.

## Evidência no legado

Páginas correspondentes encontradas diretamente:

- `web/src/app/(app)/car/page.tsx`

Touchpoints detectados apenas nessas páginas (levantamento estático inicial):

- Firebase/Firestore direto na página: **não detectado**.
- Coleções detectadas: não detectadas diretamente.
- APIs Next detectadas: não detectadas diretamente.

> Este rastreio não substitui o refinamento: hooks, componentes importados, regras Firestore, serviços e geradores de documento devem ser percorridos antes da implementação.

## Plano do front-end (`new`)

- [x] Registrar módulo, rotas lazy e item filho, mantendo **Documentos Ambientais** como pai.
- [x] Criar tipos e service HTTP próprio.
- [x] Implementar lista paginada, busca, vínculo de recibo, edição e exclusão.
- [x] Aplicar guards de rota e ações com claims do recurso CAR.
- [x] Cobrir carregamento, vazio, erros HTTP e conflito de versão.
- [ ] Homologar interação por teclado, foco e responsividade.
- [ ] Remover qualquer chamada direta a `/api/*` do legado; arquivos e jobs devem seguir os contratos comuns do catálogo.

## Plano da API (`ambientaR-api`)

Contrato alvo: CRUD /car-records; anexos/geometria.

Situação encontrada: **CRUD básico `/car-records` implementado no `ambientaR-api`; armazenamento de arquivos ainda não disponível**.

- [x] Validar DTOs, filtros e paginação; rejeitar propriedades desconhecidas.
- [x] Implementar controller, serviço e repositório com escopo por organização.
- [x] Exigir claims cumulativas de Documentos Ambientais + CAR.
- [x] Derivar organização e autor da sessão e validar o vínculo ao empreendimento no mesmo tenant.
- [x] Aplicar versão, exclusão lógica e unicidade de um CAR ativo por empreendimento.
- [x] Integrar armazenamento local configurável e biblioteca SharePoint via Microsoft Graph; validar tipo e limite de anexos.
- [ ] Cobrir contrato e isolamento HTTP de anexos com testes de integração.

## Sequência de migração

1. Refinar o comportamento real percorrendo páginas, componentes, hooks, coleções, regras e documentos vinculados.
2. Congelar contrato e matriz de autorização/escopo antes de desenvolver a tela.
3. Implementar domínio e endpoint no `ambientaR-api`, com testes negativos.
4. Implementar o módulo no `new`, integrar ao endpoint e completar estados de interface.
5. Executar testes verticais, homologar desktop/mobile e liberar por feature flag.
6. Comparar dados/resultados com o legado e só então retirar a rota antiga.

## Critérios de aceite e saída

- [ ] Regra específica validada: recibo, imóvel, geometria e histórico; AC-CRUD, AC-FILE.
- [ ] Critérios comuns aplicáveis (`AC-FRONT`, `AC-CRUD`, `AC-READ`, `AC-WORKFLOW`, `AC-FILE`, `AC-JOB`, `AC-INT`) atendidos conforme o contrato.
- [ ] Menu pai, filho, rota, botões e endpoint negam acesso de forma coerente.
- [ ] Nenhum import ou chamada para Firebase, Next API ou runtime do `web` permanece.
- [ ] Dados migrados/reconciliados, rollback ensaiado e evidências anexadas ao acompanhamento da migração.
- [ ] Produto homologa regras, cálculos, documentos gerados, permissões negativas e comportamento responsivo.

## Implementação inicial em 18/10/2026

O new permite vincular o número do recibo a um empreendimento da organização, consultar, buscar, editar e remover o vínculo. A API expõe `GET/POST /car-records`, `GET/PATCH/DELETE /car-records/:id` e `GET /car-records/projects`, com uma relação ativa por empreendimento, claims cumulativas, isolamento por organização e versionamento.

O new/API agora enviam, baixam e removem anexos PDF/ZIP/SHP (até 40 MB), com isolamento por organização, autorização CAR e metadados que identificam o provedor de armazenamento. O ambiente local usa disco persistente; para novas gravações no Microsoft 365, `FILE_STORAGE_PROVIDER=sharepoint` seleciona uma biblioteca do SharePoint Online por Microsoft Graph. A pasta precisa existir e o administrador do tenant precisa conceder acesso de escrita à aplicação. O provedor gravado em cada anexo preserva downloads e remoções após a mudança; mantenha o volume antigo até migrar arquivos previamente gravados nele. A edição substitui o recibo atual; histórico imutável de recibos ainda permanece pendente.

## Pendências para o refinamento

- Confirmar campos, validações, estados, transições e mensagens que hoje vivem em componentes importados.
- Confirmar fonte de dados, estratégia de migração, volume, retenção, anexos e deduplicação.
- Confirmar se rotas auxiliares sem entrada direta de menu são telas do mesmo filho ou ações internas.
- Resolver qualquer divergência entre contrato proposto e endpoints já existentes antes de codificar.
