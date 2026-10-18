# Execução da migração web → new + ambientaR-api

## Escopo e decisões

Migrar todas as funcionalidades, preservando o `web` como fonte de requisitos. O `new` contém apresentação e consumo HTTP. Domínio, autorização, persistência, integrações e processamento ficam exclusivamente no projeto irmão `ambientaR-api`.

O usuário confirmou várias empresas com dados isolados. Não há empresa padrão. O contexto é consultado no banco a partir da identidade autenticada e compartilhado apenas dentro da mesma requisição. Headers, filtros e bodies não escolhem uma empresa. A implementação inicial admite uma empresa por conta; memberships múltiplos e troca de empresa não estão implementados.

## Alterações realizadas

- Auditoria executável das 188 funcionalidades, rotas reais, APIs declaradas e imports proibidos. Testes do plano que antes não entravam em `npm test` agora são executados.
- Domínio Agenda na API: CRUD, busca/paginação, período, tipos reunião/prazo/auditoria, visibilidade, convites e respostas. Convites só aceitam usuários da empresa. Apenas proprietário gerencia; convidados respondem. Eventos públicos nunca atravessam a empresa.
- Concorrência: PATCH, DELETE, invite e respond exigem `?version=N`. Atualização atômica inclui ID, empresa, proprietário, versão e não-exclusão. Falhas devolvem 409; exclusão é lógica.
- Front da Agenda usa a versão observada, o escopo retornado pela API e datas convertidas do fuso do navegador. Mostra a resposta do próprio convite e preserva erros de operação.
- `GET /dashboard` consulta totais e próximos compromissos pelo mesmo repositório escopado. Exige a claim de visualizar Agenda antes de incluir seus widgets. Não inventa números financeiros/ambientais.
- Cadastro: claim do módulo cumulativa à claim da ação; descoberta e guard da API reconhecem ambas. `/user` usa contexto de empresa, filtro permitido e DTO explícito sem senha/hash. O seletor de usuários dos grupos pagina em blocos de 100.
- Grupos: listagem, mutação e vínculo de usuários verificados por empresa. Índice de nome passa a ser composto por empresa + nome normalizado.
- Imóveis já existentes na API: filtro de empresa, validação de referências à mesma empresa e 404 para ID externo.
- Organização: criação de espaço para conta ainda sem empresa e consulta do vínculo atual; tela `/app/organization`. Criar a empresa não concede automaticamente permissões administrativas.

## Validação e limites

Executados: build do `new`; build da API; testes de frontend; testes de serviço e HTTP da API; lint dos arquivos novos e da área alterada. As contagens atualizadas devem ser registradas ao fim da execução.

Atualização em 20/09/2026: 96 testes da API passaram (30 suítes). Além dos testes unitários, passaram dois verificadores com MongoDB real e um fluxo HTTP NestJS com Redis, login real, claims cumulativas, usuários, grupos, Agenda e Painel. As tentativas de acesso entre empresas foram negadas e os bancos descartáveis foram removidos ao final. Não foram executados deploy, importação de dados, atribuição de empresa em dados existentes, testes com credenciais reais ou homologação visual autenticada. Nenhuma nova FUN foi marcada concluída.

## Preparação do ambiente integrado

1. Usar banco/Redis de teste exclusivos. Sincronizar o catálogo de claims após registrar os novos controllers.
2. Provisionar contas e vínculos de empresa de teste A/B. As contas antigas sem `organizationId` são bloqueadas nos dados empresariais; não associar automaticamente todos os registros a uma empresa.
3. Em bancos existentes, revisar o índice antigo `uk_authorization_group_normalized_name`: criar/verificar `uk_authorization_group_organization_name` e somente então remover o índice global antigo em uma migração controlada. O código não remove índices nem redistribui dados automaticamente.
4. Atribuir claims explicitamente. Para Usuários: `modulo.cadastro=acessar` e ações `recurso.usuario`. Para Agenda/Painel: claims dos respectivos recursos. Grupos precisam pertencer à empresa administrada. O bootstrap exige usuário vinculado a uma empresa e cria/localiza o grupo nessa empresa; não provisiona um grupo global.
5. Testar A tentando consultar, alterar, excluir, convidar e vincular registros de B, inclusive eventos públicos; repetir com claims administrativas. Esperado: nenhuma leitura/gravação cruzada.
6. Testar simultaneamente duas alterações do mesmo evento. Esperado: uma vence; a outra recebe 409. Validar reload, fuso horário e convites.

## Ordem de execução das próximas entregas

| Onda | Escopo | Critério de avanço |
| --- | --- | --- |
| 1 | Organizações, identidade, membros, sessão e claims | isolamento real A/B; bootstrap por empresa; ausência de vazamento |
| 2 | Usuários, Agenda e Painel | todos os estados e contratos; versão; escopo; comparação com legado |
| 3 | Empreendedores, empreendimentos, empresas e carteira | separar identidade de cadastros comerciais; vínculos por empresa |
| 4 | Documentos ambientais | CRUD, arquivos, validade, condicionantes, exportações |
| 5 | Multas/defesas, vistorias, licenciamento, processos, ofícios | workflows, responsáveis, prazos e auditoria |
| 6 | Financeiro completo | 25 funcionalidades e integrações; cálculos oficiais no backend |
| 7 | CRM completo | 9 funcionalidades; clientes, oportunidades, propostas e canais |
| 8–10 | Estudos, fauna, inventários, campo, barragens e compensações | formulários, cálculos, relatórios, arquivos e jobs |
| 11 | Georreferenciamento | 12 funcionalidades, mapas, validações e exportações |
| 12 | IA e Fiscal Ambiental Digital | 23 funcionalidades; provedores, contexto, jobs e rastreabilidade |
| 13 | Ferramentas, governo e webmail | integrações, configurações, auditoria e arquivos |
| Final | Paridade global | 188 FUN, todas as rotas/variações, desktop/mobile, corte e rollback |

Para cada funcionalidade: requisito → contrato → claim/empresa → domínio/API → frontend → testes negativos → persistência real → comparação com `web` → homologação. Rotas genéricas, menus e CRUD genérico não substituem comportamentos específicos.

## Reprodução dos testes integrados (20/09/2026)

No `ambientaR-api`, executar `npm run test:migration:persistence` com MongoDB exclusivo em `127.0.0.1:27029`. Para `npm run test:migration:http`, disponibilizar também Redis descartável em `127.0.0.1:6399`, sem persistência. Os scripts geram bancos com nomes aleatórios de teste e removem apenas esses bancos. O teste HTTP gera segredos JWT efêmeros e usa porta HTTP aleatória. Não apontar esses serviços para produção.

O bootstrap foi coberto por testes que rejeitam identidade sem empresa antes de alterar claims e verificam o escopo da busca/criação do grupo. Isso não conclui a migração de membros, alternância de empresas ou reconciliação dos dados legados.

Validação adicional: dois testes de datas da Agenda passaram, cobrindo datas impossíveis e ano bissexto com mudança de dia em UTC. Build da API aprovado após a correção. Redis descartável encerrado; ao tentar encerrar o container de teste, o Docker já estava indisponível. Se ele reaparecer após reiniciar o Docker, remover somente `ambientar-migration-test-20260920`.

## Onda de cadastros — Empreendedores (27/09/2026)

Implementado núcleo de `FUN-CAD-002`: três rotas concretas no `new`, API exclusiva em `ambientaR-api`, campos cadastrais, busca/paginação, detalhes, versão e exclusão lógica. Cadastro comercial separado das contas de acesso; unicidade por empresa/documento e claims cumulativas. Testes: 81 no frontend; 106 na API; builds e lint dos arquivos do módulo aprovados. Verificação HTTP com MongoDB e Redis reais aprovada após corrigir o índice único, incluindo alteração simultânea, documento repetido e tentativas cruzadas de leitura/gravação/exclusão. Nenhuma FUN adicional foi declarada concluída; as integrações e o aceite visual permanecem no plano específico.

Próximo encadeamento: vínculo de empreendimentos com a nova coleção comercial, sem reutilizar IDs de `User`; cadastro de empresas responsáveis separado de `Organization` (a fronteira de isolamento). O formulário legado de empresas contém dados bancários/Pix e seleção de empresa ativa, que exigem contrato específico e não devem ser tratados como campos de configuração da organização.

A auditoria agora resolve pais de rotas declarados no mesmo arquivo e registra 11/267 padrões concretos, 67 endpoints declarados e zero imports proibidos. Isso não representa conclusão funcional de todas essas rotas.


## Onda seguinte — base de Empreendimentos (12/10/2026)

Iniciada FUN-CAD-003 com listagem e CRUD no new e API `ambientaR-api:/empreendimentos`. O backend valida vínculo a Empreendedor da mesma empresa, deriva tenant/autor da sessão, usa claims cumulativas, versionamento e exclusão lógica. Os dados técnicos do legado são preservados em JSON limitado na edição enquanto as Listagens A–H são migradas. Builds do new e API passaram; o build front reporta o aviso já conhecido de chunk principal acima de 500 kB. A FUN continua em andamento. Limite do plano no servidor, anexos, CAR/perímetro, escopo de portal/equipe, campos completos, integração com módulos dependentes e homologação precisam vir antes de produção.
