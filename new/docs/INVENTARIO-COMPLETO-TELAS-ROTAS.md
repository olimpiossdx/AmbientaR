# Inventário completo de telas e rotas do `new`

Data-base: 21/07/2026  
Fonte de levantamento: arquivos `page.tsx` de `web/src/app`  
Destino: rotas TanStack Router do `new`; nenhuma rota executa ou redireciona para o `web`.

## 1. Cobertura

| Medida | Total |
| --- | ---: |
| Arquivos de página encontrados | 301 |
| URLs canônicas após consolidar rotas interceptadas | 275 |
| Duplicações técnicas de modal/interceptação | 26 |
| Rotas públicas a implementar/manter | 5 |
| Rotas/aliases que não serão recriados | 8 |
| Padrões de rota autenticada a registrar | 262 |
| Padrões reais no destino, incluindo públicas | 267 |
| URLs/variações funcionais autenticadas a homologar | 280 |
| URLs/variações totais a homologar | 285 |

As 26 páginas interceptadas não geram URL adicional no `new`: cada par lista/modal e página direta usa a mesma rota TanStack e o mesmo componente de formulário. A diferença entre 262 padrões e 280 variações ocorre porque PCA e RCA possuem oito valores de `listagem` cada e Compensação Ambiental possui cinco valores válidos de `$tipo`; todas as variações precisam de aceite individual, embora compartilhem a mesma definição de rota.

## 2. Regra de transformação

- `/` torna-se `/app`;
- rota autenticada `/x` torna-se `/app/x`;
- parâmetros Next `[id]` tornam-se parâmetros TanStack `$id`;
- `login`, cadastro, recuperação, privacidade e offline continuam públicos;
- aliases e duplicatas sem função própria são eliminados;
- query params funcionais, como `type` do assistente e `listagem` A–H, são schemas de busca validados pela rota;
- cada rota abaixo deve apontar para uma linha `FUN-*` do catálogo funcional antes de ser implementada.

## 3. Critério de aceite de cada rota

Cada uma das 267 rotas reais deve:

1. estar registrada no módulo funcional, com lazy loading;
2. declarar a claim da funcionalidade no `beforeLoad`;
3. renderizar dentro do layout público ou autenticado correto;
4. carregar dados apenas pelo service HTTP do módulo;
5. tratar loading, vazio, erro, 403 e 404;
6. validar path e search params;
7. preservar filtros/paginação relevantes na URL;
8. funcionar em desktop e mobile e ser navegável por teclado;
9. não importar Firebase, regra de perfil ou código do `web`;
10. possuir ao menos teste de guard/rota e E2E no fluxo crítico da família.

Rotas `new` e `edit` compartilham formulário e schemas. Detalhes e listas compartilham tipos/serviço, sem duplicar contratos.

## 4. Rotas públicas

- `/login`
- `/register`
- `/forgot-password`
- `/politica-privacidade`
- `/offline`

## 5. Rotas autenticadas

### Painel, IA lab e utilidades

- `/app`
- `/app/ai-lab`
- `/app/ai-lab/automations`
- `/app/ai-lab/cloud-library`
- `/app/ai-lab/mcp`
- `/app/ai-lab/rag`
- `/app/analise-ambiental`
- `/app/app-campo`
- `/app/audit-log`
- `/app/calendar`
- `/app/canais`
- `/app/external`
- `/app/reporting`

### Carteira e cadastros

- `/app/carteira`
- `/app/carteira/$clientId`
- `/app/users`
- `/app/empreendedores`
- `/app/empreendedores/new`
- `/app/empreendedores/$id/edit`
- `/app/projects`
- `/app/projects/new`
- `/app/projects/$id/edit`
- `/app/responsible-company`
- `/app/responsible-company/new`
- `/app/responsible-company/$id/edit`
- `/app/technical-responsible`
- `/app/technical-responsible/new`
- `/app/technical-responsible/$id/edit`

### Financeiro

- `/app/bank-access`
- `/app/clients`
- `/app/clients/new`
- `/app/clients/$id/edit`
- `/app/contracts`
- `/app/contracts/new`
- `/app/contracts/$id/edit`
- `/app/contracts-suppliers`
- `/app/invoices`
- `/app/invoices/new`
- `/app/invoices/$id/edit`
- `/app/suppliers`
- `/app/suppliers/new`
- `/app/suppliers/$id/edit`
- `/app/cash-flow`
- `/app/cash-flow/new`
- `/app/cash-flow/$id/edit`
- `/app/proposals`
- `/app/proposals/new`
- `/app/proposals/$id/edit`
- `/app/commercial-proposals`
- `/app/commercial-proposals/new`
- `/app/commercial-proposals/$id/edit`
- `/app/services`
- `/app/services/new`
- `/app/services/$id/edit`
- `/app/financial/abc-curve`
- `/app/financial/abc-fornecedores`
- `/app/financial/abc-servicos`
- `/app/financial/bens-patrimonio`
- `/app/financial/bens-patrimonio/new`
- `/app/financial/bens-patrimonio/$id/edit`
- `/app/financial/billing-debug`
- `/app/financial/conciliacao`
- `/app/financial/dre-contabil`
- `/app/financial/export-contabil`
- `/app/financial/fluxo-projetado`
- `/app/financial/orcamento`
- `/app/financial/painel`
- `/app/financial/platform-subscription-contracts`
- `/app/financial/projetos-roi`
- `/app/financial/projetos-roi/$caseId`

### Documentos ambientais

- `/app/car`
- `/app/compliance`
- `/app/ctf-ibama`
- `/app/intervencoes`
- `/app/fauna`
- `/app/licenses`
- `/app/licenses/new`
- `/app/licenses/$id/edit`
- `/app/tacs`
- `/app/tacs/new`
- `/app/tacs/$id/edit`
- `/app/mtr-declaracao`
- `/app/documentos-ambientais/pasta-cliente`
- `/app/monitoring/manual`
- `/app/monitoring/telemetric`
- `/app/outorgas`
- `/app/outorgas/new`
- `/app/outorgas/$id/edit`
- `/app/usos-insignificantes`

### Multas, vistorias e licenciamento

- `/app/multas-defesas`
- `/app/multas-defesas/nova`
- `/app/multas-defesas/$id`
- `/app/inspections`
- `/app/inspections/new`
- `/app/inspections/$id/edit`
- `/app/inspections/reports`
- `/app/requests`
- `/app/requests/new`
- `/app/requests/$id/edit`
- `/app/requests/$id/aia`

### Gestão de projetos e processos

- `/app/gestao-processos`
- `/app/gestao-processos/projetos`
- `/app/gestao-processos/projetos/$id`
- `/app/gestao-processos/fluxo`
- `/app/gestao-processos/tarefas`
- `/app/gestao-processos/indicadores`
- `/app/gestao-processos/indicadores/analise`
- `/app/gestao-processos/planilha`

### Fiscal Ambiental Digital

- `/app/ia/fiscal-ambiental-digital`
- `/app/ia/fiscal-ambiental-digital/dashboard`
- `/app/ia/fiscal-ambiental-digital/montar-acervo`
- `/app/ia/fiscal-ambiental-digital/biblioteca`
- `/app/ia/fiscal-ambiental-digital/linha-do-tempo`
- `/app/ia/fiscal-ambiental-digital/comparador`
- `/app/ia/fiscal-ambiental-digital/evidencias`
- `/app/ia/fiscal-ambiental-digital/inteligencia`
- `/app/ia/fiscal-ambiental-digital/fiscalizacao`
- `/app/ia/fiscal-ambiental-digital/relatorios`
- `/app/ia/fiscal-ambiental-digital/monitoramento`
- `/app/ia/fiscal-ambiental-digital/esg`
- `/app/ia/fiscal-ambiental-digital/configuracoes`
- `/app/ia/fiscal-ambiental-digital/workspace/novo`
- `/app/ia/fiscal-ambiental-digital/workspace/$workspaceId`

### Estudos — entrada, assistentes e análises

- `/app/studies/acao-emergencial`
- `/app/studies/analise-socioambiental`
- `/app/studies/assistant`
- `/app/studies/ide-sisemanet`
- `/app/studies/mapas`
- `/app/studies/memorial-descritivo`
- `/app/studies/mtr`
- `/app/studies/reserva-legal`

### Educação ambiental

- `/app/studies/educacao-ambiental`
- `/app/studies/educacao-ambiental/novo`
- `/app/studies/educacao-ambiental/$id/edit`
- `/app/studies/educacao-ambiental/solicitar-dispensa`
- `/app/studies/educacao-ambiental/dispensas/$id`

### EIA/RIMA, Cavidades e LAS-RAS

- `/app/studies/eia-rima`
- `/app/studies/eia-rima/new`
- `/app/studies/eia-rima/$id/edit`
- `/app/studies/cavidades`
- `/app/studies/cavidades/new`
- `/app/studies/cavidades/$id/edit`
- `/app/studies/las-ras`
- `/app/studies/las-ras/new`
- `/app/studies/las-ras/$id/edit`

### Estudos de fauna

- `/app/studies/fauna`
- `/app/studies/fauna/inventario`
- `/app/studies/fauna/inventario/$id`
- `/app/studies/fauna/inventario-relatorio`
- `/app/studies/fauna/inventario-relatorio/$id`
- `/app/studies/fauna/monitoramento`
- `/app/studies/fauna/monitoramento/$id`
- `/app/studies/fauna/monitoramento-relatorio`
- `/app/studies/fauna/monitoramento-relatorio/$id`
- `/app/studies/fauna/resgate`
- `/app/studies/fauna/resgate/$id`
- `/app/studies/fauna/resgate-relatorio`
- `/app/studies/fauna/resgate-relatorio/$id`

### Inventário florestal e coleta de campo

- `/app/studies/inventario`
- `/app/studies/inventario/$id`
- `/app/studies/inventario/$id/arvores`
- `/app/studies/inventario/$id/parcelas`
- `/app/studies/inventario/$id/especies`
- `/app/studies/inventario/$id/formulas`
- `/app/studies/inventario/$id/calculadora`
- `/app/studies/inventario/$id/resultado/$runId`
- `/app/coleta-campo`
- `/app/coleta-campo/nova`
- `/app/coleta-campo/$id`
- `/app/coleta-campo/$id/parcelas/$parcelaId`
- `/app/inventarios`
- `/app/inventarios/new`
- `/app/inventarios/$id`
- `/app/inventarios/$id/parcelas/$parcelaId`

### Processos de outorga

- `/app/studies/outorgas`
- `/app/studies/outorgas/new`
- `/app/studies/outorgas/$id/edit`
- `/app/studies/outorgas/processo/$id`

### PCA, PIA, PRADA, PTRF e RCA

- `/app/studies/pca`
- `/app/studies/pca/new?listagem=A`
- `/app/studies/pca/new?listagem=B`
- `/app/studies/pca/new?listagem=C`
- `/app/studies/pca/new?listagem=D`
- `/app/studies/pca/new?listagem=E`
- `/app/studies/pca/new?listagem=F`
- `/app/studies/pca/new?listagem=G`
- `/app/studies/pca/new?listagem=H`
- `/app/studies/pca/$id/edit`
- `/app/studies/pia`
- `/app/studies/pia/new`
- `/app/studies/pia/$id/edit`
- `/app/studies/prada`
- `/app/studies/prada/new`
- `/app/studies/prada/$id/edit`
- `/app/studies/ptrf`
- `/app/studies/ptrf/new`
- `/app/studies/ptrf/$id/edit`
- `/app/studies/rca`
- `/app/studies/rca/new?listagem=A`
- `/app/studies/rca/new?listagem=B`
- `/app/studies/rca/new?listagem=C`
- `/app/studies/rca/new?listagem=D`
- `/app/studies/rca/new?listagem=E`
- `/app/studies/rca/new?listagem=F`
- `/app/studies/rca/new?listagem=G`
- `/app/studies/rca/new?listagem=H`
- `/app/studies/rca/$id/edit`

As variações A–H são uma única rota por estudo com oito valores válidos do search param, mas representam oito submenus e oito schemas funcionais que devem ser homologados individualmente.

### Barragens

- `/app/studies/barragens`
- `/app/studies/barragem`
- `/app/studies/barragem/new`
- `/app/studies/barragem/$id/edit`
- `/app/studies/seguranca-barragens`
- `/app/studies/seguranca-barragens/new`
- `/app/studies/seguranca-barragens/$id/edit`
- `/app/studies/piscinao-off-stream`
- `/app/studies/piscinao-off-stream/new`
- `/app/studies/piscinao-off-stream/$id/edit`

### Reanálise, procuração, compensação e relatórios

- `/app/studies/reanalise`
- `/app/studies/reanalise/new`
- `/app/studies/reanalise/$id/edit`
- `/app/studies/procuracao`
- `/app/studies/procuracao/new`
- `/app/studies/procuracao/$id/edit`
- `/app/studies/compensacao-ambiental`
- `/app/studies/compensacao-ambiental/especies`
- `/app/studies/compensacao-ambiental/snuc`
- `/app/studies/compensacao-ambiental/mata-atlantica`
- `/app/studies/compensacao-ambiental/mineraria`
- `/app/studies/compensacao-ambiental/app`
- `/app/studies/relatorios-diversos`
- `/app/studies/relatorios-diversos/carvao-vegetal`
- `/app/studies/relatorios-diversos/ptrf-prad`
- `/app/studies/relatorios-diversos/transporte-residuos`

### Georreferenciamento

- `/app/georeferenciamento`
- `/app/georeferenciamento/processos`
- `/app/georeferenciamento/processos/$id`
- `/app/georeferenciamento/rural`
- `/app/georeferenciamento/urbano`
- `/app/georeferenciamento/ambiental`
- `/app/georeferenciamento/historico-car`
- `/app/georeferenciamento/campo`
- `/app/georeferenciamento/documentos`
- `/app/georeferenciamento/memorial-descritivo`
- `/app/georeferenciamento/validacoes`
- `/app/georeferenciamento/registro`
- `/app/georeferenciamento/referencias`

### CRM

- `/app/crm`
- `/app/crm/new`
- `/app/crm/$id/edit`
- `/app/crm/alerts`
- `/app/crm/settings`
- `/app/crm/team`
- `/app/crm/clients`
- `/app/crm/opportunities`
- `/app/crm/reports`
- `/app/crm/proposals`
- `/app/social-media`

### Ofícios, consultas, laudos e fontes

- `/app/oficios`
- `/app/oficios/new`
- `/app/oficios/$id/edit`
- `/app/consultas`
- `/app/consultas/new`
- `/app/consultas/$id`
- `/app/consultas/$id/edit`
- `/app/laudos`
- `/app/laudos/new`
- `/app/laudos/$id`
- `/app/knowledge-sources`
- `/app/knowledge-sources/new`
- `/app/knowledge-sources/$id`

### Configurações

- `/app/settings`
- `/app/settings/company`
- `/app/settings/appearance`
- `/app/settings/templates`
- `/app/settings/templates/rca`
- `/app/settings/onedrive-integration`
- `/app/settings/ai-local-source`
- `/app/settings/deleted-backups`
- `/app/settings/files`
- `/app/configuracoes/mcp-rag`

## 6. Rotas inventariadas que não serão implementadas

| Origem observada | Decisão no `new` | Motivo |
| --- | --- | --- |
| `/autos-infracao-defesa` | não criar; usar `/app/multas-defesas` | alias sem funcionalidade própria |
| `/environmental-company` | não criar; usar `/app/responsible-company` | duplicata de Empresas |
| `/monitoring` | não criar; menus apontam diretamente para manual/telemetria | raiz placeholder |
| `/studies` | não criar; Estudos é agrupador sem landing page | alias histórico |
| `/studies/intervencao-ambiental` | não criar; usar `/app/studies/pia` | nome anterior de PIA |
| `/studies/intervencao-ambiental/new` | não criar; usar `/app/studies/pia/new` | duplicata funcional |
| `/studies/intervencao-ambiental/[id]/edit` | não criar; usar `/app/studies/pia/$id/edit` | duplicata funcional |
| `/webmail` | não criar; usar `/app/external?target=webmail` | destino externo cadastrado no API |

Não serão criados redirects para o `web`. Se compatibilidade de bookmarks for exigida, o próprio `new` poderá manter redirects internos temporários para a rota canônica, sem qualquer dependência de runtime externo; isso requer decisão explícita fora deste plano.

## 7. Verificação de cobertura

Antes de concluir cada onda, comparar este inventário com:

- registro de módulos do `new`;
- árvore real do TanStack Router;
- catálogo `FUN-*`;
- controllers e decorators descobertos pelo `ambientaR-api`;
- catálogo de claims sincronizado.

O build deve falhar quando houver rota autenticada sem claim, item de menu sem rota, rota sem `FUN-*`, `FUN-*` sem endpoint ou endpoint protegido sem metadados completos de claim.
