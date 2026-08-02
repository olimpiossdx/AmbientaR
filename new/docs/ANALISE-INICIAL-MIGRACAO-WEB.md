# Análise inicial da migração do `web` para o `new`

Data-base: 22/07/2026  
Escopo: inventário funcional, hierarquia de menu, telas, rotas e fronteira front/API. Nenhuma funcionalidade foi migrada nesta etapa.

## Resultado

- **188 funcionalidades** receberam plano individual.
- **20 módulos/pais operacionais** organizam os planos.
- Foram criados **20 planos de módulo** e **188 planos de funcionalidade**, além do índice.
- O inventário de rotas existente registra **285 variações**, **275 URLs canônicas** e **267 padrões de rota**.
- O `web` é Next.js 14/PWA e concentra interface, Firebase/Firestore/Storage e dezenas de APIs Next.
- O `new` é React 19 + Vite + TanStack Router e já possui fundações de autenticação, navegação, usuários, agenda e acompanhamento, mas não possui paridade funcional ampla.
- O `ambientaR-api` é NestJS + MongoDB/MikroORM + Redis para autorização. Há base de autenticação/claims e controllers de usuário, empreendimento, imóvel, estado e município; a maior parte dos 188 contratos ainda não existe.
- Somente **6 planos** encontraram controller total ou parcialmente correspondente na API atual; **182** dependem de contrato/implementação novos.
- **59 claims filhas** de Estudos Técnicos/Georreferenciamento são propostas derivadas da convenção do catálogo e precisam ser ratificadas no refinamento.
- **187 funcionalidades** possuem correspondência direta com página/rota do legado; Sessão é um fluxo/modal transversal e não uma página isolada.

## Hierarquia adotada

Cada item principal do menu virou módulo/pai. Agrupadores internos relevantes, como Fiscal Ambiental Digital e Inventários de campo, permanecem vinculados ao pai visível e recebem pasta própria para evitar planos monolíticos.

| Pasta | Módulo/pai | Funcionalidades |
| --- | --- | ---: |
| `acesso-sessao` | Acesso e sessão | 6 |
| `painel-carteira` | Painel e Carteira | 2 |
| `financeiro` | Financeiro | 25 |
| `cadastro` | Cadastro | 4 |
| `documentos-ambientais` | Documentos Ambientais | 13 |
| `multas-defesas` | Multas e Defesas | 2 |
| `vistoria-tecnica` | Vistoria Técnica | 3 |
| `licenciamento` | Licenciamento | 3 |
| `gestao-processos` | Gestão de Projetos e Processos | 6 |
| `ia` | IA | 9 |
| `ia-fiscal-ambiental-digital` | IA / Fiscal Ambiental Digital | 14 |
| `estudos-tecnicos` | Estudos Técnicos | 49 |
| `georreferenciamento` | Georreferenciamento | 12 |
| `vendas-crm` | Vendas & CRM | 9 |
| `oficios` | Ofícios | 1 |
| `webmail` | Webmail | 1 |
| `acessos-governamentais` | Acessos Governamentais | 8 |
| `ferramentas-sistema` | Ferramentas do Sistema | 19 |
| `agenda` | Agenda | 1 |
| `inventarios-campo` | Estudos Técnicos / Inventários de campo | 1 |

## Constatações arquiteturais

1. A migração não pode ser tratada como cópia de páginas: o legado mistura UI, acesso Firebase, regras de perfil, geração documental, jobs e integrações.
2. O corte seguro é vertical por `FUN-*`: contrato e autorização, domínio/API, serviço frontend, telas, navegação, testes e liberação.
3. Roles do legado devem servir somente como evidência. A solução alvo usa claims cumulativas no pai/filho e policy de escopo no backend.
4. Endpoints Next e Firebase não entram no `new`; toda operação passa pelo cliente HTTP central e pelo `ambientaR-api`.
5. As rotas externas atuais carregam URL em query string. O alvo deve usar identificadores allowlisted resolvidos pela API.
6. Geração de PDF/DOCX, geoprocessamento, IA, sincronização e exportações precisam de jobs assíncronos com progresso e resultado protegido.
7. A API atual ainda reflete permissividade de desenvolvimento em CORS e não possui todos os gates transversais do plano mestre; a fundação deve anteceder a migração em massa.

## Riscos que bloqueiam uma virada direta

- regras funcionais distribuídas em componentes/hooks e não apenas nas páginas;
- autorização por role no legado versus claims no alvo;
- Firestore sem contrato explícito e possíveis dados sem normalização;
- endpoints alvo ainda ausentes ou divergentes (por exemplo, singular/plural de empreendimento);
- documentos, mapas e cálculos que exigem comparação visual/numérica;
- rotas aliases, intercepting routes e telas acessadas por cards, não apenas pela sidebar;
- módulos visuais do `new` sem requisito correspondente no legado devem permanecer fora do backlog até especificação.

## Próxima etapa recomendada

Executar refinamento funcional por ondas, começando por autenticação/claims, Usuários, Agenda e Painel. Para cada arquivo, percorrer dependências importadas, fechar DTOs e escopo, implementar testes negativos na API e somente então construir a tela. A retirada do legado ocorre por funcionalidade, após reconciliação e feature flag, nunca por big bang.

O índice navegável dos planos está em [`planos-migracao/README.md`](planos-migracao/README.md).
