# FUN-CAD-003 — Empreendimentos

Status: em implementação; fluxo base entregue em 12/10/2026
Módulo pai: **Cadastro**  
Origem funcional: seção “Cadastro” do catálogo  
Dependência de acesso do pai: `modulo.cadastro=acessar`

## Objetivo e escopo

Migrar a funcionalidade **Empreendimentos** do `web` para o `new`, sem dependência de Firebase nem das rotas Next.js do legado. O corte deve ser vertical: navegação, telas, serviço HTTP, contrato, autorização, persistência, testes e observabilidade entram na mesma entrega.

Regra funcional levantada: vínculo autorizado, coordenadas, pacote e status; AC-CRUD.

## Hierarquia e rotas

- Módulo/menu pai: **Cadastro**.
- Filho/tela: **Empreendimentos**.
- Rotas alvo declaradas: /app/projects, /new, /$id/edit.
- Claim do filho: recurso.empreendimento=*.
- Regra de navegação: o pai só aparece se houver ao menos um filho autorizado; URL direta e menu devem aplicar a mesma claim.

## Evidência no legado

Páginas correspondentes encontradas diretamente:

- `web/src/app/(app)/projects/[id]/edit/page.tsx`
- `web/src/app/(app)/projects/new/page.tsx`
- `web/src/app/(app)/projects/page.tsx`

Touchpoints detectados apenas nessas páginas (levantamento estático inicial):

- Firebase/Firestore direto na página: **não detectado**.
- Coleções detectadas: não detectadas diretamente.
- APIs Next detectadas: não detectadas diretamente.

> Este rastreio não substitui o refinamento: hooks, componentes importados, regras Firestore, serviços e geradores de documento devem ser percorridos antes da implementação.

## Plano do front-end (`new`)

- [x] Registrar módulo, rotas lazy, item filho e breadcrumb no registro central, mantendo **Cadastro** como pai.
- [x] Criar tipos de apresentação, busca/paginação por URL e service pelo cliente HTTP central; schema do formulário segue parcial.
- [ ] Implementar todas as variações de tela declaradas (3), preservando busca, filtros, paginação, seleção, ações, anexos e exportações existentes que forem confirmados no refinamento.
- [x] Guard de rota e ações no new e claims cumulativas `modulo.cadastro=acessar` + `recurso.empreendimento`; o escopo por usuário/empreendedor ainda falta.
- [ ] Cobrir loading, vazio, erro de validação, 401, 403, 404, conflito de versão e indisponibilidade da API.
- [ ] Garantir responsividade, teclado, foco, rótulos, feedback de operação e persistência em URL dos filtros relevantes.
- [ ] Remover qualquer chamada direta a `/api/*` do legado; arquivos e jobs devem seguir os contratos comuns do catálogo.

## Plano da API (`ambientaR-api`)

Contrato alvo: CRUD `/empreendimentos`, iniciado na API.

Situação atual: **API nova `/empreendimentos` no projeto irmão; API legado `/empreendimento` continua com divergência e não deve ser usada pelo new**.

- `../ambientaR-api/src/controllers/empreendimento/controller.ts`

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

- [ ] Regra específica validada: vínculo autorizado, coordenadas, pacote e status; AC-CRUD.
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

## Execução inicial em 12/10/2026

No `new`: listagem, busca por nome/município/atividade/empreendedor, filtro de situação, paginação, visualização, criação, edição, exclusão lógica e rotas de detalhe. A edição mantém no payload os campos técnicos existentes, mesmo que o formulário desta etapa ainda não os renderize. Formulário cobre empreendedor responsável, dados cadastrais, imóvel, endereço de correspondência, condição do empreendedor, situação e coordenadas UTM/GMS. Validação no browser/API cobre estrutura GMS, limites angulares e formato/fuso UTM; cálculo decimal é derivado para GMS e para UTM SIRGAS 2000 nos fusos sul 22–24.

Na API: `GET/POST /empreendimentos`, `GET/PATCH/DELETE /empreendimentos/:id` e `GET /empreendimentos/usage`, com empresa/autor da sessão, claims cumulativas e versão em PATCH/DELETE. O cadastro referenciado precisa existir na coleção comercial `Entrepreneur` na mesma empresa. Dados técnicos restantes são guardados como JSON limitado para permitir a migração em etapas; campos reservados como `id`, `organizationId`, `userId`, `assignedTeam` e `clientId` são rejeitados. A organização passa a ser titular do pacote (decisão aprovada em 12/10/2026); organizações novas começam em `gratuito`, e a API aplica o limite de criação por empresa com reserva atômica de capacidade e contador inicializado a partir dos registros ativos existentes. O `new` exibe uso e bloqueia o botão quando a consulta confirma limite esgotado; a API segue como autoridade. Ainda falta migrar cobranças/assinaturas pagas e oferecer mudança de pacote com validação de pagamento.

O formulário converte UTM para latitude/longitude decimal quando o datum é SIRGAS 2000, nos fusos sul 22–24. A tela mostra o resultado antes de salvar e remove o valor derivado quando os campos de coordenada ou datum mudam. Os demais datums continuam sem conversão automática.

**Não concluído:** formulários Listagens A–H; conversão para os demais datums e outros cálculos; campos ambientais condicionais (restrições, unidades de conservação, reserva legal e DN130); CAR, perímetro e upload/download de arquivos; escopo de representantes/titulares e equipes; vínculos com estudos, licenças, processos e demais FUN; migração de assinaturas pagas; importação/reconciliação e homologação visual. A migração dos IDs Firestore não pode reaproveitar IDs de login nem assume que todo funcionário da empresa vê todos os registros.

## Decisão funcional — pacote por empresa (12/10/2026)

O usuário aprovou que o plano pertence à empresa e que o limite vale para todos os membros do tenant. O contador inclui apenas empreendimentos ativos; exclusão lógica libera uma vaga. Para documentos de organização já existentes sem pacote ou contador, o plano efetivo é `gratuito` e a API inicializa o contador com a quantidade atual antes de reservar novas vagas. A mudança de plano depende de migração de assinatura/pagamento e permanece fora desta fatia.

O limite da criação usa reserva atômica no documento da empresa para impedir que solicitações simultâneas ultrapassem a cota. A tela consulta `GET /empreendimentos/usage`, comunica o plano e desabilita “Novo empreendimento” quando a cota reportada está esgotada; a API verifica novamente durante a criação. A busca da API inclui nome do empreendedor somente dentro da mesma empresa, além de nome da propriedade, município, atividade e CNPJ; o filtro de situação é executado no servidor.
