# Checklist Fase 3 — Menus por perfil

Gerado em: 2026-06-08T14:17:34.159Z

Use com `npm run dev` (porta 9002), utilizador de teste por role, DevTools → Rede + Consola.

## Critérios por item

- [ ] Página abre sem erro vermelho no boundary
- [ ] Rede: sem 4xx/5xx em `/api/*` (exceto 401 antes do login)
- [ ] Consola: sem `permission-denied` repetido
- [ ] PDF/imagem: se usar Storage, proxy `/api/branding/image` com sessão ativa

## Perfis

### Administrador (`admin`)

Itens de menu visíveis: **129**

| Menu | Rota |
|------|------|
| /georeferenciamento/processos | `/georeferenciamento/processos` |
| /multas-defesas | `/multas-defesas` |
| /oficios | `/oficios` |
| /requests | `/requests` |
| /requests/new | `/requests/new` |
| Acesso Bancário | `/bank-access` |
| Agenda | `/calendar` |
| Águas / MIRA-IGAM | `/studies/assistant` |
| Alertas & Notificações | `/crm/alerts` |
| Análise Geoespacial (IA) | `/analise-ambiental` |
| Análise socioambiental | `/studies/analise-socioambiental` |
| Aparência | `/settings/appearance` |
| Assistente Financeiro (IA) | `/studies/assistant` |
| Automações IA | `/ai-lab/automations` |
| Backup de Dados Apagados | `/settings/deleted-backups` |
| Base de Conhecimento (RAG) | `/ai-lab/rag` |
| Bens e Patrimônio | `/financial/bens-patrimonio` |
| Biblioteca IA (OneDrive) | `/ai-lab/cloud-library` |
| Campo e levantamento | `/georeferenciamento/campo` |
| Canais (WhatsApp/IG) | `/canais` |
| CAR | `/car` |
| CAR / SICAR | `/georeferenciamento/ambiental` |
| Cartório e registro | `/georeferenciamento/registro` |
| Clientes | `/clients` |
| Coleta de campo | `/coleta-campo` |
| Conciliação Bancária | `/financial/conciliacao` |
| Condicionantes | `/compliance` |
| Configurações CRM | `/crm/settings` |
| Consulta Intervenção Ambiental | `/external` |
| Consulta Licenciamento | `/external` |
| Consulta Outorgas | `/external` |
| Consultar vistorias | `/inspections` |
| Consultas Técnicas | `/consultas` |
| Contratos | `/contracts` |
| Contratos Plataforma | `/financial/platform-subscription-contracts` |
| Contratos-Fornecedores | `/contracts-suppliers` |
| Cruzamento de dados | `/studies/assistant` |
| CTF/IBAMA | `/external` |
| Curva ABC | `/financial/abc-curve` |
| Curva ABC Fornecedores | `/financial/abc-fornecedores` |
| Curva ABC Serviços | `/financial/abc-servicos` |
| Custos e contratos | `/studies/assistant` |
| DAIA's | `/intervencoes` |
| Documentação técnica | `/georeferenciamento/documentos` |
| DRE Contábil | `/financial/dre-contabil` |
| EIA/RIMA | `/studies/eia-rima` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Equipe & Desempenho | `/crm/team` |
| Espécies protegidas | `/studies/compensacao-ambiental/especies` |
| Estudo de Cavidades | `/studies/cavidades` |
| Estudos de Fauna | `/studies/fauna` |
| Explorador de Arquivos | `/settings/files` |
| Exportação Contábil | `/financial/export-contabil` |
| Faturas | `/invoices` |
| Fauna | `/fauna` |
| Fluxo de Caixa Projetado | `/financial/fluxo-projetado` |
| Fontes Normativas | `/knowledge-sources` |
| Fornecedores | `/suppliers` |
| Gestão de Clientes | `/crm/clients` |
| Hub IA + MCP + RAG | `/ai-lab` |
| IDE-SisemaNet | `/studies/ide-sisemanet` |
| IDE-SisemaNet-MG | `/external` |
| Identidade Visual | `/settings` |
| Informações da Empresa | `/settings/company` |
| Integração OneDrive | `/settings/onedrive-integration` |
| Intervenção em APP | `/studies/compensacao-ambiental/app` |
| Inventário Florestal | `/studies/inventario` |
| Lançamento Manual | `/monitoring/manual` |
| Lançamentos de Caixa | `/cash-flow` |
| LAS-RAS | `/studies/las-ras` |
| Laudos | `/laudos` |
| Legislação e estudos | `/studies/assistant` |
| Licenças | `/licenses` |
| Log de Auditoria | `/audit-log` |
| Mapas | `/studies/mapas` |
| Mata Atlântica | `/studies/compensacao-ambiental/mata-atlantica` |
| MCP & Ferramentas IA | `/ai-lab/mcp` |
| Mídias Sociais | `/social-media` |
| Minerária | `/studies/compensacao-ambiental/mineraria` |
| Minha Carteira | `/carteira` |
| NFe-Eletrônica | `/external` |
| Nova outorga | `/studies/outorgas/new` |
| Nova vistoria | `/inspections/new` |
| Oportunidades & Pipeline | `/crm/opportunities` |
| Orçamento Anual | `/financial/orcamento` |
| Orçamentos e Propostas | `/commercial-proposals` |
| Outorgas | `/outorgas` |
| Painel | `/` |
| Painel | `/georeferenciamento` |
| Painel de Vendas | `/crm` |
| Painel Financeiro | `/financial/painel` |
| Pasta Base IA (Local) | `/settings/ai-local-source` |
| Pasta do cliente | `/documentos-ambientais/pasta-cliente` |
| PCA | `/studies/pca` |
| PIA | `/studies/pia` |
| PRADA | `/studies/prada` |
| Processos | `/studies/outorgas` |
| Programa de Educação Ambiental | `/studies/educacao-ambiental` |
| Projeto Técnico de Barragem | `/studies/barragem` |
| Projetos & ROI | `/financial/projetos-roi` |
| PTRF | `/studies/ptrf` |
| RCA | `/studies/rca` |
| Reanálise | `/studies/reanalise` |
| Referências normativas | `/georeferenciamento/referencias` |
| Relatórios & Análises | `/crm/reports` |
| Relatórios de Campo | `/inspections/reports` |
| Relatórios de IA | `/reporting` |
| Relatórios Diversos | `/studies/relatorios-diversos` |
| Reserva Legal | `/studies/reserva-legal` |
| Responsáveis Técnicos | `/technical-responsible` |
| Rural (SIGEF/INCRA) | `/georeferenciamento/rural` |
| Segurança de Barragens | `/studies/seguranca-barragens` |
| SEI-IBAMA | `/external` |
| SEI-MG | `/external` |
| Síntese de texto | `/studies/assistant` |
| SLA-Ecossistemas/MG | `/external` |
| SNUC | `/studies/compensacao-ambiental/snuc` |
| Tabela de Serviços | `/services` |
| Telemetria (Real-time) | `/monitoring/telemetric` |
| Templates | `/settings/templates` |
| Urbano (cartório) | `/georeferenciamento/urbano` |
| Usos Insignificantes | `/usos-insignificantes` |
| Usuários | `/users` |
| Validações | `/georeferenciamento/validacoes` |
| Vendas & Propostas | `/crm/proposals` |
| Visão geral | `/studies/compensacao-ambiental` |
| Webmail | `/external` |

<details>
<summary>Checklist copiável</summary>

- [ ] /georeferenciamento/processos — `/georeferenciamento/processos`
- [ ] /multas-defesas — `/multas-defesas`
- [ ] /oficios — `/oficios`
- [ ] /requests — `/requests`
- [ ] /requests/new — `/requests/new`
- [ ] Acesso Bancário — `/bank-access`
- [ ] Agenda — `/calendar`
- [ ] Águas / MIRA-IGAM — `/studies/assistant`
- [ ] Alertas & Notificações — `/crm/alerts`
- [ ] Análise Geoespacial (IA) — `/analise-ambiental`
- [ ] Análise socioambiental — `/studies/analise-socioambiental`
- [ ] Aparência — `/settings/appearance`
- [ ] Assistente Financeiro (IA) — `/studies/assistant`
- [ ] Automações IA — `/ai-lab/automations`
- [ ] Backup de Dados Apagados — `/settings/deleted-backups`
- [ ] Base de Conhecimento (RAG) — `/ai-lab/rag`
- [ ] Bens e Patrimônio — `/financial/bens-patrimonio`
- [ ] Biblioteca IA (OneDrive) — `/ai-lab/cloud-library`
- [ ] Campo e levantamento — `/georeferenciamento/campo`
- [ ] Canais (WhatsApp/IG) — `/canais`
- [ ] CAR — `/car`
- [ ] CAR / SICAR — `/georeferenciamento/ambiental`
- [ ] Cartório e registro — `/georeferenciamento/registro`
- [ ] Clientes — `/clients`
- [ ] Coleta de campo — `/coleta-campo`
- [ ] Conciliação Bancária — `/financial/conciliacao`
- [ ] Condicionantes — `/compliance`
- [ ] Configurações CRM — `/crm/settings`
- [ ] Consulta Intervenção Ambiental — `/external`
- [ ] Consulta Licenciamento — `/external`
- [ ] Consulta Outorgas — `/external`
- [ ] Consultar vistorias — `/inspections`
- [ ] Consultas Técnicas — `/consultas`
- [ ] Contratos — `/contracts`
- [ ] Contratos Plataforma — `/financial/platform-subscription-contracts`
- [ ] Contratos-Fornecedores — `/contracts-suppliers`
- [ ] Cruzamento de dados — `/studies/assistant`
- [ ] CTF/IBAMA — `/external`
- [ ] Curva ABC — `/financial/abc-curve`
- [ ] Curva ABC Fornecedores — `/financial/abc-fornecedores`
- [ ] Curva ABC Serviços — `/financial/abc-servicos`
- [ ] Custos e contratos — `/studies/assistant`
- [ ] DAIA's — `/intervencoes`
- [ ] Documentação técnica — `/georeferenciamento/documentos`
- [ ] DRE Contábil — `/financial/dre-contabil`
- [ ] EIA/RIMA — `/studies/eia-rima`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Equipe & Desempenho — `/crm/team`
- [ ] Espécies protegidas — `/studies/compensacao-ambiental/especies`
- [ ] Estudo de Cavidades — `/studies/cavidades`
- [ ] Estudos de Fauna — `/studies/fauna`
- [ ] Explorador de Arquivos — `/settings/files`
- [ ] Exportação Contábil — `/financial/export-contabil`
- [ ] Faturas — `/invoices`
- [ ] Fauna — `/fauna`
- [ ] Fluxo de Caixa Projetado — `/financial/fluxo-projetado`
- [ ] Fontes Normativas — `/knowledge-sources`
- [ ] Fornecedores — `/suppliers`
- [ ] Gestão de Clientes — `/crm/clients`
- [ ] Hub IA + MCP + RAG — `/ai-lab`
- [ ] IDE-SisemaNet — `/studies/ide-sisemanet`
- [ ] IDE-SisemaNet-MG — `/external`
- [ ] Identidade Visual — `/settings`
- [ ] Informações da Empresa — `/settings/company`
- [ ] Integração OneDrive — `/settings/onedrive-integration`
- [ ] Intervenção em APP — `/studies/compensacao-ambiental/app`
- [ ] Inventário Florestal — `/studies/inventario`
- [ ] Lançamento Manual — `/monitoring/manual`
- [ ] Lançamentos de Caixa — `/cash-flow`
- [ ] LAS-RAS — `/studies/las-ras`
- [ ] Laudos — `/laudos`
- [ ] Legislação e estudos — `/studies/assistant`
- [ ] Licenças — `/licenses`
- [ ] Log de Auditoria — `/audit-log`
- [ ] Mapas — `/studies/mapas`
- [ ] Mata Atlântica — `/studies/compensacao-ambiental/mata-atlantica`
- [ ] MCP & Ferramentas IA — `/ai-lab/mcp`
- [ ] Mídias Sociais — `/social-media`
- [ ] Minerária — `/studies/compensacao-ambiental/mineraria`
- [ ] Minha Carteira — `/carteira`
- [ ] NFe-Eletrônica — `/external`
- [ ] Nova outorga — `/studies/outorgas/new`
- [ ] Nova vistoria — `/inspections/new`
- [ ] Oportunidades & Pipeline — `/crm/opportunities`
- [ ] Orçamento Anual — `/financial/orcamento`
- [ ] Orçamentos e Propostas — `/commercial-proposals`
- [ ] Outorgas — `/outorgas`
- [ ] Painel — `/`
- [ ] Painel — `/georeferenciamento`
- [ ] Painel de Vendas — `/crm`
- [ ] Painel Financeiro — `/financial/painel`
- [ ] Pasta Base IA (Local) — `/settings/ai-local-source`
- [ ] Pasta do cliente — `/documentos-ambientais/pasta-cliente`
- [ ] PCA — `/studies/pca`
- [ ] PIA — `/studies/pia`
- [ ] PRADA — `/studies/prada`
- [ ] Processos — `/studies/outorgas`
- [ ] Programa de Educação Ambiental — `/studies/educacao-ambiental`
- [ ] Projeto Técnico de Barragem — `/studies/barragem`
- [ ] Projetos & ROI — `/financial/projetos-roi`
- [ ] PTRF — `/studies/ptrf`
- [ ] RCA — `/studies/rca`
- [ ] Reanálise — `/studies/reanalise`
- [ ] Referências normativas — `/georeferenciamento/referencias`
- [ ] Relatórios & Análises — `/crm/reports`
- [ ] Relatórios de Campo — `/inspections/reports`
- [ ] Relatórios de IA — `/reporting`
- [ ] Relatórios Diversos — `/studies/relatorios-diversos`
- [ ] Reserva Legal — `/studies/reserva-legal`
- [ ] Responsáveis Técnicos — `/technical-responsible`
- [ ] Rural (SIGEF/INCRA) — `/georeferenciamento/rural`
- [ ] Segurança de Barragens — `/studies/seguranca-barragens`
- [ ] SEI-IBAMA — `/external`
- [ ] SEI-MG — `/external`
- [ ] Síntese de texto — `/studies/assistant`
- [ ] SLA-Ecossistemas/MG — `/external`
- [ ] SNUC — `/studies/compensacao-ambiental/snuc`
- [ ] Tabela de Serviços — `/services`
- [ ] Telemetria (Real-time) — `/monitoring/telemetric`
- [ ] Templates — `/settings/templates`
- [ ] Urbano (cartório) — `/georeferenciamento/urbano`
- [ ] Usos Insignificantes — `/usos-insignificantes`
- [ ] Usuários — `/users`
- [ ] Validações — `/georeferenciamento/validacoes`
- [ ] Vendas & Propostas — `/crm/proposals`
- [ ] Visão geral — `/studies/compensacao-ambiental`
- [ ] Webmail — `/external`

</details>

### Gestor (`gestor`)

Itens de menu visíveis: **80**

| Menu | Rota |
|------|------|
| /georeferenciamento/processos | `/georeferenciamento/processos` |
| /multas-defesas | `/multas-defesas` |
| /oficios | `/oficios` |
| /requests | `/requests` |
| /requests/new | `/requests/new` |
| Agenda | `/calendar` |
| Águas / MIRA-IGAM | `/studies/assistant` |
| Análise Geoespacial (IA) | `/analise-ambiental` |
| Análise socioambiental | `/studies/analise-socioambiental` |
| Aparência | `/settings/appearance` |
| Campo e levantamento | `/georeferenciamento/campo` |
| CAR | `/car` |
| CAR / SICAR | `/georeferenciamento/ambiental` |
| Cartório e registro | `/georeferenciamento/registro` |
| Coleta de campo | `/coleta-campo` |
| Condicionantes | `/compliance` |
| Consulta Intervenção Ambiental | `/external` |
| Consulta Licenciamento | `/external` |
| Consulta Outorgas | `/external` |
| Consultar vistorias | `/inspections` |
| Consultas Técnicas | `/consultas` |
| Cruzamento de dados | `/studies/assistant` |
| CTF/IBAMA | `/external` |
| Custos e contratos | `/studies/assistant` |
| DAIA's | `/intervencoes` |
| Documentação técnica | `/georeferenciamento/documentos` |
| EIA/RIMA | `/studies/eia-rima` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Espécies protegidas | `/studies/compensacao-ambiental/especies` |
| Estudo de Cavidades | `/studies/cavidades` |
| Estudos de Fauna | `/studies/fauna` |
| Fauna | `/fauna` |
| IDE-SisemaNet | `/studies/ide-sisemanet` |
| IDE-SisemaNet-MG | `/external` |
| Intervenção em APP | `/studies/compensacao-ambiental/app` |
| Inventário Florestal | `/studies/inventario` |
| Lançamento Manual | `/monitoring/manual` |
| LAS-RAS | `/studies/las-ras` |
| Laudos | `/laudos` |
| Legislação e estudos | `/studies/assistant` |
| Licenças | `/licenses` |
| Mapas | `/studies/mapas` |
| Mata Atlântica | `/studies/compensacao-ambiental/mata-atlantica` |
| Minerária | `/studies/compensacao-ambiental/mineraria` |
| Nova outorga | `/studies/outorgas/new` |
| Nova vistoria | `/inspections/new` |
| Outorgas | `/outorgas` |
| Painel | `/` |
| Painel | `/georeferenciamento` |
| Pasta do cliente | `/documentos-ambientais/pasta-cliente` |
| PCA | `/studies/pca` |
| PIA | `/studies/pia` |
| PRADA | `/studies/prada` |
| Processos | `/studies/outorgas` |
| Programa de Educação Ambiental | `/studies/educacao-ambiental` |
| Projeto Técnico de Barragem | `/studies/barragem` |
| PTRF | `/studies/ptrf` |
| RCA | `/studies/rca` |
| Reanálise | `/studies/reanalise` |
| Referências normativas | `/georeferenciamento/referencias` |
| Relatórios de Campo | `/inspections/reports` |
| Relatórios Diversos | `/studies/relatorios-diversos` |
| Reserva Legal | `/studies/reserva-legal` |
| Responsáveis Técnicos | `/technical-responsible` |
| Rural (SIGEF/INCRA) | `/georeferenciamento/rural` |
| Segurança de Barragens | `/studies/seguranca-barragens` |
| SEI-IBAMA | `/external` |
| SEI-MG | `/external` |
| Síntese de texto | `/studies/assistant` |
| SLA-Ecossistemas/MG | `/external` |
| SNUC | `/studies/compensacao-ambiental/snuc` |
| Telemetria (Real-time) | `/monitoring/telemetric` |
| Urbano (cartório) | `/georeferenciamento/urbano` |
| Usos Insignificantes | `/usos-insignificantes` |
| Usuários | `/users` |
| Validações | `/georeferenciamento/validacoes` |
| Visão geral | `/studies/compensacao-ambiental` |
| Webmail | `/external` |

<details>
<summary>Checklist copiável</summary>

- [ ] /georeferenciamento/processos — `/georeferenciamento/processos`
- [ ] /multas-defesas — `/multas-defesas`
- [ ] /oficios — `/oficios`
- [ ] /requests — `/requests`
- [ ] /requests/new — `/requests/new`
- [ ] Agenda — `/calendar`
- [ ] Águas / MIRA-IGAM — `/studies/assistant`
- [ ] Análise Geoespacial (IA) — `/analise-ambiental`
- [ ] Análise socioambiental — `/studies/analise-socioambiental`
- [ ] Aparência — `/settings/appearance`
- [ ] Campo e levantamento — `/georeferenciamento/campo`
- [ ] CAR — `/car`
- [ ] CAR / SICAR — `/georeferenciamento/ambiental`
- [ ] Cartório e registro — `/georeferenciamento/registro`
- [ ] Coleta de campo — `/coleta-campo`
- [ ] Condicionantes — `/compliance`
- [ ] Consulta Intervenção Ambiental — `/external`
- [ ] Consulta Licenciamento — `/external`
- [ ] Consulta Outorgas — `/external`
- [ ] Consultar vistorias — `/inspections`
- [ ] Consultas Técnicas — `/consultas`
- [ ] Cruzamento de dados — `/studies/assistant`
- [ ] CTF/IBAMA — `/external`
- [ ] Custos e contratos — `/studies/assistant`
- [ ] DAIA's — `/intervencoes`
- [ ] Documentação técnica — `/georeferenciamento/documentos`
- [ ] EIA/RIMA — `/studies/eia-rima`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Espécies protegidas — `/studies/compensacao-ambiental/especies`
- [ ] Estudo de Cavidades — `/studies/cavidades`
- [ ] Estudos de Fauna — `/studies/fauna`
- [ ] Fauna — `/fauna`
- [ ] IDE-SisemaNet — `/studies/ide-sisemanet`
- [ ] IDE-SisemaNet-MG — `/external`
- [ ] Intervenção em APP — `/studies/compensacao-ambiental/app`
- [ ] Inventário Florestal — `/studies/inventario`
- [ ] Lançamento Manual — `/monitoring/manual`
- [ ] LAS-RAS — `/studies/las-ras`
- [ ] Laudos — `/laudos`
- [ ] Legislação e estudos — `/studies/assistant`
- [ ] Licenças — `/licenses`
- [ ] Mapas — `/studies/mapas`
- [ ] Mata Atlântica — `/studies/compensacao-ambiental/mata-atlantica`
- [ ] Minerária — `/studies/compensacao-ambiental/mineraria`
- [ ] Nova outorga — `/studies/outorgas/new`
- [ ] Nova vistoria — `/inspections/new`
- [ ] Outorgas — `/outorgas`
- [ ] Painel — `/`
- [ ] Painel — `/georeferenciamento`
- [ ] Pasta do cliente — `/documentos-ambientais/pasta-cliente`
- [ ] PCA — `/studies/pca`
- [ ] PIA — `/studies/pia`
- [ ] PRADA — `/studies/prada`
- [ ] Processos — `/studies/outorgas`
- [ ] Programa de Educação Ambiental — `/studies/educacao-ambiental`
- [ ] Projeto Técnico de Barragem — `/studies/barragem`
- [ ] PTRF — `/studies/ptrf`
- [ ] RCA — `/studies/rca`
- [ ] Reanálise — `/studies/reanalise`
- [ ] Referências normativas — `/georeferenciamento/referencias`
- [ ] Relatórios de Campo — `/inspections/reports`
- [ ] Relatórios Diversos — `/studies/relatorios-diversos`
- [ ] Reserva Legal — `/studies/reserva-legal`
- [ ] Responsáveis Técnicos — `/technical-responsible`
- [ ] Rural (SIGEF/INCRA) — `/georeferenciamento/rural`
- [ ] Segurança de Barragens — `/studies/seguranca-barragens`
- [ ] SEI-IBAMA — `/external`
- [ ] SEI-MG — `/external`
- [ ] Síntese de texto — `/studies/assistant`
- [ ] SLA-Ecossistemas/MG — `/external`
- [ ] SNUC — `/studies/compensacao-ambiental/snuc`
- [ ] Telemetria (Real-time) — `/monitoring/telemetric`
- [ ] Urbano (cartório) — `/georeferenciamento/urbano`
- [ ] Usos Insignificantes — `/usos-insignificantes`
- [ ] Usuários — `/users`
- [ ] Validações — `/georeferenciamento/validacoes`
- [ ] Visão geral — `/studies/compensacao-ambiental`
- [ ] Webmail — `/external`

</details>

### Supervisor (`supervisor`)

Itens de menu visíveis: **91**

| Menu | Rota |
|------|------|
| /georeferenciamento/processos | `/georeferenciamento/processos` |
| /multas-defesas | `/multas-defesas` |
| /oficios | `/oficios` |
| /requests | `/requests` |
| /requests/new | `/requests/new` |
| Agenda | `/calendar` |
| Águas / MIRA-IGAM | `/studies/assistant` |
| Alertas & Notificações | `/crm/alerts` |
| Análise Geoespacial (IA) | `/analise-ambiental` |
| Análise socioambiental | `/studies/analise-socioambiental` |
| Aparência | `/settings/appearance` |
| Backup de Dados Apagados | `/settings/deleted-backups` |
| Campo e levantamento | `/georeferenciamento/campo` |
| CAR | `/car` |
| CAR / SICAR | `/georeferenciamento/ambiental` |
| Cartório e registro | `/georeferenciamento/registro` |
| Coleta de campo | `/coleta-campo` |
| Condicionantes | `/compliance` |
| Configurações CRM | `/crm/settings` |
| Consulta Intervenção Ambiental | `/external` |
| Consulta Licenciamento | `/external` |
| Consulta Outorgas | `/external` |
| Consultar vistorias | `/inspections` |
| Consultas Técnicas | `/consultas` |
| Cruzamento de dados | `/studies/assistant` |
| CTF/IBAMA | `/external` |
| Custos e contratos | `/studies/assistant` |
| DAIA's | `/intervencoes` |
| Documentação técnica | `/georeferenciamento/documentos` |
| EIA/RIMA | `/studies/eia-rima` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Equipe & Desempenho | `/crm/team` |
| Espécies protegidas | `/studies/compensacao-ambiental/especies` |
| Estudo de Cavidades | `/studies/cavidades` |
| Estudos de Fauna | `/studies/fauna` |
| Fauna | `/fauna` |
| Gestão de Clientes | `/crm/clients` |
| IDE-SisemaNet | `/studies/ide-sisemanet` |
| IDE-SisemaNet-MG | `/external` |
| Intervenção em APP | `/studies/compensacao-ambiental/app` |
| Inventário Florestal | `/studies/inventario` |
| Lançamento Manual | `/monitoring/manual` |
| LAS-RAS | `/studies/las-ras` |
| Laudos | `/laudos` |
| Legislação e estudos | `/studies/assistant` |
| Licenças | `/licenses` |
| Log de Auditoria | `/audit-log` |
| Mapas | `/studies/mapas` |
| Mata Atlântica | `/studies/compensacao-ambiental/mata-atlantica` |
| Mídias Sociais | `/social-media` |
| Minerária | `/studies/compensacao-ambiental/mineraria` |
| Nova outorga | `/studies/outorgas/new` |
| Nova vistoria | `/inspections/new` |
| Oportunidades & Pipeline | `/crm/opportunities` |
| Outorgas | `/outorgas` |
| Painel | `/` |
| Painel | `/georeferenciamento` |
| Painel de Vendas | `/crm` |
| Pasta do cliente | `/documentos-ambientais/pasta-cliente` |
| PCA | `/studies/pca` |
| PIA | `/studies/pia` |
| PRADA | `/studies/prada` |
| Processos | `/studies/outorgas` |
| Programa de Educação Ambiental | `/studies/educacao-ambiental` |
| Projeto Técnico de Barragem | `/studies/barragem` |
| PTRF | `/studies/ptrf` |
| RCA | `/studies/rca` |
| Reanálise | `/studies/reanalise` |
| Referências normativas | `/georeferenciamento/referencias` |
| Relatórios & Análises | `/crm/reports` |
| Relatórios de Campo | `/inspections/reports` |
| Relatórios Diversos | `/studies/relatorios-diversos` |
| Reserva Legal | `/studies/reserva-legal` |
| Responsáveis Técnicos | `/technical-responsible` |
| Rural (SIGEF/INCRA) | `/georeferenciamento/rural` |
| Segurança de Barragens | `/studies/seguranca-barragens` |
| SEI-IBAMA | `/external` |
| SEI-MG | `/external` |
| Síntese de texto | `/studies/assistant` |
| SLA-Ecossistemas/MG | `/external` |
| SNUC | `/studies/compensacao-ambiental/snuc` |
| Telemetria (Real-time) | `/monitoring/telemetric` |
| Urbano (cartório) | `/georeferenciamento/urbano` |
| Usos Insignificantes | `/usos-insignificantes` |
| Usuários | `/users` |
| Validações | `/georeferenciamento/validacoes` |
| Vendas & Propostas | `/crm/proposals` |
| Visão geral | `/studies/compensacao-ambiental` |
| Webmail | `/external` |

<details>
<summary>Checklist copiável</summary>

- [ ] /georeferenciamento/processos — `/georeferenciamento/processos`
- [ ] /multas-defesas — `/multas-defesas`
- [ ] /oficios — `/oficios`
- [ ] /requests — `/requests`
- [ ] /requests/new — `/requests/new`
- [ ] Agenda — `/calendar`
- [ ] Águas / MIRA-IGAM — `/studies/assistant`
- [ ] Alertas & Notificações — `/crm/alerts`
- [ ] Análise Geoespacial (IA) — `/analise-ambiental`
- [ ] Análise socioambiental — `/studies/analise-socioambiental`
- [ ] Aparência — `/settings/appearance`
- [ ] Backup de Dados Apagados — `/settings/deleted-backups`
- [ ] Campo e levantamento — `/georeferenciamento/campo`
- [ ] CAR — `/car`
- [ ] CAR / SICAR — `/georeferenciamento/ambiental`
- [ ] Cartório e registro — `/georeferenciamento/registro`
- [ ] Coleta de campo — `/coleta-campo`
- [ ] Condicionantes — `/compliance`
- [ ] Configurações CRM — `/crm/settings`
- [ ] Consulta Intervenção Ambiental — `/external`
- [ ] Consulta Licenciamento — `/external`
- [ ] Consulta Outorgas — `/external`
- [ ] Consultar vistorias — `/inspections`
- [ ] Consultas Técnicas — `/consultas`
- [ ] Cruzamento de dados — `/studies/assistant`
- [ ] CTF/IBAMA — `/external`
- [ ] Custos e contratos — `/studies/assistant`
- [ ] DAIA's — `/intervencoes`
- [ ] Documentação técnica — `/georeferenciamento/documentos`
- [ ] EIA/RIMA — `/studies/eia-rima`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Equipe & Desempenho — `/crm/team`
- [ ] Espécies protegidas — `/studies/compensacao-ambiental/especies`
- [ ] Estudo de Cavidades — `/studies/cavidades`
- [ ] Estudos de Fauna — `/studies/fauna`
- [ ] Fauna — `/fauna`
- [ ] Gestão de Clientes — `/crm/clients`
- [ ] IDE-SisemaNet — `/studies/ide-sisemanet`
- [ ] IDE-SisemaNet-MG — `/external`
- [ ] Intervenção em APP — `/studies/compensacao-ambiental/app`
- [ ] Inventário Florestal — `/studies/inventario`
- [ ] Lançamento Manual — `/monitoring/manual`
- [ ] LAS-RAS — `/studies/las-ras`
- [ ] Laudos — `/laudos`
- [ ] Legislação e estudos — `/studies/assistant`
- [ ] Licenças — `/licenses`
- [ ] Log de Auditoria — `/audit-log`
- [ ] Mapas — `/studies/mapas`
- [ ] Mata Atlântica — `/studies/compensacao-ambiental/mata-atlantica`
- [ ] Mídias Sociais — `/social-media`
- [ ] Minerária — `/studies/compensacao-ambiental/mineraria`
- [ ] Nova outorga — `/studies/outorgas/new`
- [ ] Nova vistoria — `/inspections/new`
- [ ] Oportunidades & Pipeline — `/crm/opportunities`
- [ ] Outorgas — `/outorgas`
- [ ] Painel — `/`
- [ ] Painel — `/georeferenciamento`
- [ ] Painel de Vendas — `/crm`
- [ ] Pasta do cliente — `/documentos-ambientais/pasta-cliente`
- [ ] PCA — `/studies/pca`
- [ ] PIA — `/studies/pia`
- [ ] PRADA — `/studies/prada`
- [ ] Processos — `/studies/outorgas`
- [ ] Programa de Educação Ambiental — `/studies/educacao-ambiental`
- [ ] Projeto Técnico de Barragem — `/studies/barragem`
- [ ] PTRF — `/studies/ptrf`
- [ ] RCA — `/studies/rca`
- [ ] Reanálise — `/studies/reanalise`
- [ ] Referências normativas — `/georeferenciamento/referencias`
- [ ] Relatórios & Análises — `/crm/reports`
- [ ] Relatórios de Campo — `/inspections/reports`
- [ ] Relatórios Diversos — `/studies/relatorios-diversos`
- [ ] Reserva Legal — `/studies/reserva-legal`
- [ ] Responsáveis Técnicos — `/technical-responsible`
- [ ] Rural (SIGEF/INCRA) — `/georeferenciamento/rural`
- [ ] Segurança de Barragens — `/studies/seguranca-barragens`
- [ ] SEI-IBAMA — `/external`
- [ ] SEI-MG — `/external`
- [ ] Síntese de texto — `/studies/assistant`
- [ ] SLA-Ecossistemas/MG — `/external`
- [ ] SNUC — `/studies/compensacao-ambiental/snuc`
- [ ] Telemetria (Real-time) — `/monitoring/telemetric`
- [ ] Urbano (cartório) — `/georeferenciamento/urbano`
- [ ] Usos Insignificantes — `/usos-insignificantes`
- [ ] Usuários — `/users`
- [ ] Validações — `/georeferenciamento/validacoes`
- [ ] Vendas & Propostas — `/crm/proposals`
- [ ] Visão geral — `/studies/compensacao-ambiental`
- [ ] Webmail — `/external`

</details>

### Técnico (`technical`)

Itens de menu visíveis: **69**

| Menu | Rota |
|------|------|
| /multas-defesas | `/multas-defesas` |
| /oficios | `/oficios` |
| /requests | `/requests` |
| /requests/new | `/requests/new` |
| Agenda | `/calendar` |
| Águas / MIRA-IGAM | `/studies/assistant` |
| Análise Geoespacial (IA) | `/analise-ambiental` |
| Análise socioambiental | `/studies/analise-socioambiental` |
| Aparência | `/settings/appearance` |
| CAR | `/car` |
| Coleta de campo | `/coleta-campo` |
| Condicionantes | `/compliance` |
| Consulta Intervenção Ambiental | `/external` |
| Consulta Licenciamento | `/external` |
| Consulta Outorgas | `/external` |
| Consultar vistorias | `/inspections` |
| Consultas Técnicas | `/consultas` |
| Cruzamento de dados | `/studies/assistant` |
| CTF/IBAMA | `/external` |
| Custos e contratos | `/studies/assistant` |
| DAIA's | `/intervencoes` |
| EIA/RIMA | `/studies/eia-rima` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Espécies protegidas | `/studies/compensacao-ambiental/especies` |
| Estudo de Cavidades | `/studies/cavidades` |
| Estudos de Fauna | `/studies/fauna` |
| Fauna | `/fauna` |
| IDE-SisemaNet | `/studies/ide-sisemanet` |
| IDE-SisemaNet-MG | `/external` |
| Intervenção em APP | `/studies/compensacao-ambiental/app` |
| Inventário Florestal | `/studies/inventario` |
| Lançamento Manual | `/monitoring/manual` |
| LAS-RAS | `/studies/las-ras` |
| Laudos | `/laudos` |
| Legislação e estudos | `/studies/assistant` |
| Licenças | `/licenses` |
| Mapas | `/studies/mapas` |
| Mata Atlântica | `/studies/compensacao-ambiental/mata-atlantica` |
| Minerária | `/studies/compensacao-ambiental/mineraria` |
| Nova outorga | `/studies/outorgas/new` |
| Nova vistoria | `/inspections/new` |
| Outorgas | `/outorgas` |
| Painel | `/` |
| Pasta do cliente | `/documentos-ambientais/pasta-cliente` |
| PCA | `/studies/pca` |
| PIA | `/studies/pia` |
| PRADA | `/studies/prada` |
| Processos | `/studies/outorgas` |
| Programa de Educação Ambiental | `/studies/educacao-ambiental` |
| Projeto Técnico de Barragem | `/studies/barragem` |
| PTRF | `/studies/ptrf` |
| RCA | `/studies/rca` |
| Reanálise | `/studies/reanalise` |
| Relatórios de Campo | `/inspections/reports` |
| Relatórios Diversos | `/studies/relatorios-diversos` |
| Reserva Legal | `/studies/reserva-legal` |
| Segurança de Barragens | `/studies/seguranca-barragens` |
| SEI-IBAMA | `/external` |
| SEI-MG | `/external` |
| Síntese de texto | `/studies/assistant` |
| SLA-Ecossistemas/MG | `/external` |
| SNUC | `/studies/compensacao-ambiental/snuc` |
| Telemetria (Real-time) | `/monitoring/telemetric` |
| Usos Insignificantes | `/usos-insignificantes` |
| Usuários | `/users` |
| Visão geral | `/studies/compensacao-ambiental` |
| Webmail | `/external` |

<details>
<summary>Checklist copiável</summary>

- [ ] /multas-defesas — `/multas-defesas`
- [ ] /oficios — `/oficios`
- [ ] /requests — `/requests`
- [ ] /requests/new — `/requests/new`
- [ ] Agenda — `/calendar`
- [ ] Águas / MIRA-IGAM — `/studies/assistant`
- [ ] Análise Geoespacial (IA) — `/analise-ambiental`
- [ ] Análise socioambiental — `/studies/analise-socioambiental`
- [ ] Aparência — `/settings/appearance`
- [ ] CAR — `/car`
- [ ] Coleta de campo — `/coleta-campo`
- [ ] Condicionantes — `/compliance`
- [ ] Consulta Intervenção Ambiental — `/external`
- [ ] Consulta Licenciamento — `/external`
- [ ] Consulta Outorgas — `/external`
- [ ] Consultar vistorias — `/inspections`
- [ ] Consultas Técnicas — `/consultas`
- [ ] Cruzamento de dados — `/studies/assistant`
- [ ] CTF/IBAMA — `/external`
- [ ] Custos e contratos — `/studies/assistant`
- [ ] DAIA's — `/intervencoes`
- [ ] EIA/RIMA — `/studies/eia-rima`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Espécies protegidas — `/studies/compensacao-ambiental/especies`
- [ ] Estudo de Cavidades — `/studies/cavidades`
- [ ] Estudos de Fauna — `/studies/fauna`
- [ ] Fauna — `/fauna`
- [ ] IDE-SisemaNet — `/studies/ide-sisemanet`
- [ ] IDE-SisemaNet-MG — `/external`
- [ ] Intervenção em APP — `/studies/compensacao-ambiental/app`
- [ ] Inventário Florestal — `/studies/inventario`
- [ ] Lançamento Manual — `/monitoring/manual`
- [ ] LAS-RAS — `/studies/las-ras`
- [ ] Laudos — `/laudos`
- [ ] Legislação e estudos — `/studies/assistant`
- [ ] Licenças — `/licenses`
- [ ] Mapas — `/studies/mapas`
- [ ] Mata Atlântica — `/studies/compensacao-ambiental/mata-atlantica`
- [ ] Minerária — `/studies/compensacao-ambiental/mineraria`
- [ ] Nova outorga — `/studies/outorgas/new`
- [ ] Nova vistoria — `/inspections/new`
- [ ] Outorgas — `/outorgas`
- [ ] Painel — `/`
- [ ] Pasta do cliente — `/documentos-ambientais/pasta-cliente`
- [ ] PCA — `/studies/pca`
- [ ] PIA — `/studies/pia`
- [ ] PRADA — `/studies/prada`
- [ ] Processos — `/studies/outorgas`
- [ ] Programa de Educação Ambiental — `/studies/educacao-ambiental`
- [ ] Projeto Técnico de Barragem — `/studies/barragem`
- [ ] PTRF — `/studies/ptrf`
- [ ] RCA — `/studies/rca`
- [ ] Reanálise — `/studies/reanalise`
- [ ] Relatórios de Campo — `/inspections/reports`
- [ ] Relatórios Diversos — `/studies/relatorios-diversos`
- [ ] Reserva Legal — `/studies/reserva-legal`
- [ ] Segurança de Barragens — `/studies/seguranca-barragens`
- [ ] SEI-IBAMA — `/external`
- [ ] SEI-MG — `/external`
- [ ] Síntese de texto — `/studies/assistant`
- [ ] SLA-Ecossistemas/MG — `/external`
- [ ] SNUC — `/studies/compensacao-ambiental/snuc`
- [ ] Telemetria (Real-time) — `/monitoring/telemetric`
- [ ] Usos Insignificantes — `/usos-insignificantes`
- [ ] Usuários — `/users`
- [ ] Visão geral — `/studies/compensacao-ambiental`
- [ ] Webmail — `/external`

</details>

### Vendas (`sales`)

Itens de menu visíveis: **30**

| Menu | Rota |
|------|------|
| /oficios | `/oficios` |
| Agenda | `/calendar` |
| Alertas & Notificações | `/crm/alerts` |
| Aparência | `/settings/appearance` |
| Clientes | `/clients` |
| Configurações CRM | `/crm/settings` |
| Consulta Intervenção Ambiental | `/external` |
| Consulta Licenciamento | `/external` |
| Consulta Outorgas | `/external` |
| Contratos | `/contracts` |
| Contratos-Fornecedores | `/contracts-suppliers` |
| CTF/IBAMA | `/external` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Equipe & Desempenho | `/crm/team` |
| Gestão de Clientes | `/crm/clients` |
| Mídias Sociais | `/social-media` |
| Oportunidades & Pipeline | `/crm/opportunities` |
| Orçamentos e Propostas | `/commercial-proposals` |
| Painel | `/` |
| Painel de Vendas | `/crm` |
| Projetos & ROI | `/financial/projetos-roi` |
| Relatórios & Análises | `/crm/reports` |
| SEI-IBAMA | `/external` |
| SEI-MG | `/external` |
| SLA-Ecossistemas/MG | `/external` |
| Usuários | `/users` |
| Vendas & Propostas | `/crm/proposals` |
| Webmail | `/external` |

<details>
<summary>Checklist copiável</summary>

- [ ] /oficios — `/oficios`
- [ ] Agenda — `/calendar`
- [ ] Alertas & Notificações — `/crm/alerts`
- [ ] Aparência — `/settings/appearance`
- [ ] Clientes — `/clients`
- [ ] Configurações CRM — `/crm/settings`
- [ ] Consulta Intervenção Ambiental — `/external`
- [ ] Consulta Licenciamento — `/external`
- [ ] Consulta Outorgas — `/external`
- [ ] Contratos — `/contracts`
- [ ] Contratos-Fornecedores — `/contracts-suppliers`
- [ ] CTF/IBAMA — `/external`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Equipe & Desempenho — `/crm/team`
- [ ] Gestão de Clientes — `/crm/clients`
- [ ] Mídias Sociais — `/social-media`
- [ ] Oportunidades & Pipeline — `/crm/opportunities`
- [ ] Orçamentos e Propostas — `/commercial-proposals`
- [ ] Painel — `/`
- [ ] Painel de Vendas — `/crm`
- [ ] Projetos & ROI — `/financial/projetos-roi`
- [ ] Relatórios & Análises — `/crm/reports`
- [ ] SEI-IBAMA — `/external`
- [ ] SEI-MG — `/external`
- [ ] SLA-Ecossistemas/MG — `/external`
- [ ] Usuários — `/users`
- [ ] Vendas & Propostas — `/crm/proposals`
- [ ] Webmail — `/external`

</details>

### Financeiro (`financial`)

Itens de menu visíveis: **51**

| Menu | Rota |
|------|------|
| /oficios | `/oficios` |
| Acesso Bancário | `/bank-access` |
| Agenda | `/calendar` |
| Alertas & Notificações | `/crm/alerts` |
| Aparência | `/settings/appearance` |
| Assistente Financeiro (IA) | `/studies/assistant` |
| Bens e Patrimônio | `/financial/bens-patrimonio` |
| Clientes | `/clients` |
| Conciliação Bancária | `/financial/conciliacao` |
| Configurações CRM | `/crm/settings` |
| Consulta Intervenção Ambiental | `/external` |
| Consulta Licenciamento | `/external` |
| Consulta Outorgas | `/external` |
| Consultas Técnicas | `/consultas` |
| Contratos | `/contracts` |
| Contratos Plataforma | `/financial/platform-subscription-contracts` |
| Contratos-Fornecedores | `/contracts-suppliers` |
| CTF/IBAMA | `/external` |
| Curva ABC | `/financial/abc-curve` |
| Curva ABC Fornecedores | `/financial/abc-fornecedores` |
| Curva ABC Serviços | `/financial/abc-servicos` |
| DRE Contábil | `/financial/dre-contabil` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Equipe & Desempenho | `/crm/team` |
| Exportação Contábil | `/financial/export-contabil` |
| Faturas | `/invoices` |
| Fluxo de Caixa Projetado | `/financial/fluxo-projetado` |
| Fornecedores | `/suppliers` |
| Gestão de Clientes | `/crm/clients` |
| Lançamentos de Caixa | `/cash-flow` |
| Mídias Sociais | `/social-media` |
| NFe-Eletrônica | `/external` |
| Oportunidades & Pipeline | `/crm/opportunities` |
| Orçamento Anual | `/financial/orcamento` |
| Orçamentos e Propostas | `/commercial-proposals` |
| Painel | `/` |
| Painel de Vendas | `/crm` |
| Painel Financeiro | `/financial/painel` |
| Pasta do cliente | `/documentos-ambientais/pasta-cliente` |
| Projetos & ROI | `/financial/projetos-roi` |
| Relatórios & Análises | `/crm/reports` |
| Relatórios de IA | `/reporting` |
| SEI-IBAMA | `/external` |
| SEI-MG | `/external` |
| SLA-Ecossistemas/MG | `/external` |
| Tabela de Serviços | `/services` |
| Usuários | `/users` |
| Vendas & Propostas | `/crm/proposals` |
| Webmail | `/external` |

<details>
<summary>Checklist copiável</summary>

- [ ] /oficios — `/oficios`
- [ ] Acesso Bancário — `/bank-access`
- [ ] Agenda — `/calendar`
- [ ] Alertas & Notificações — `/crm/alerts`
- [ ] Aparência — `/settings/appearance`
- [ ] Assistente Financeiro (IA) — `/studies/assistant`
- [ ] Bens e Patrimônio — `/financial/bens-patrimonio`
- [ ] Clientes — `/clients`
- [ ] Conciliação Bancária — `/financial/conciliacao`
- [ ] Configurações CRM — `/crm/settings`
- [ ] Consulta Intervenção Ambiental — `/external`
- [ ] Consulta Licenciamento — `/external`
- [ ] Consulta Outorgas — `/external`
- [ ] Consultas Técnicas — `/consultas`
- [ ] Contratos — `/contracts`
- [ ] Contratos Plataforma — `/financial/platform-subscription-contracts`
- [ ] Contratos-Fornecedores — `/contracts-suppliers`
- [ ] CTF/IBAMA — `/external`
- [ ] Curva ABC — `/financial/abc-curve`
- [ ] Curva ABC Fornecedores — `/financial/abc-fornecedores`
- [ ] Curva ABC Serviços — `/financial/abc-servicos`
- [ ] DRE Contábil — `/financial/dre-contabil`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Equipe & Desempenho — `/crm/team`
- [ ] Exportação Contábil — `/financial/export-contabil`
- [ ] Faturas — `/invoices`
- [ ] Fluxo de Caixa Projetado — `/financial/fluxo-projetado`
- [ ] Fornecedores — `/suppliers`
- [ ] Gestão de Clientes — `/crm/clients`
- [ ] Lançamentos de Caixa — `/cash-flow`
- [ ] Mídias Sociais — `/social-media`
- [ ] NFe-Eletrônica — `/external`
- [ ] Oportunidades & Pipeline — `/crm/opportunities`
- [ ] Orçamento Anual — `/financial/orcamento`
- [ ] Orçamentos e Propostas — `/commercial-proposals`
- [ ] Painel — `/`
- [ ] Painel de Vendas — `/crm`
- [ ] Painel Financeiro — `/financial/painel`
- [ ] Pasta do cliente — `/documentos-ambientais/pasta-cliente`
- [ ] Projetos & ROI — `/financial/projetos-roi`
- [ ] Relatórios & Análises — `/crm/reports`
- [ ] Relatórios de IA — `/reporting`
- [ ] SEI-IBAMA — `/external`
- [ ] SEI-MG — `/external`
- [ ] SLA-Ecossistemas/MG — `/external`
- [ ] Tabela de Serviços — `/services`
- [ ] Usuários — `/users`
- [ ] Vendas & Propostas — `/crm/proposals`
- [ ] Webmail — `/external`

</details>

### Cliente Gestão (`client`)

Itens de menu visíveis: **23**

| Menu | Rota |
|------|------|
| /oficios | `/oficios` |
| /requests | `/requests` |
| Agenda | `/calendar` |
| Aparência | `/settings/appearance` |
| CAR | `/car` |
| Condicionantes | `/compliance` |
| Contratos | `/contracts` |
| DAIA's | `/intervencoes` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Faturas | `/invoices` |
| Fauna | `/fauna` |
| Lançamento Manual | `/monitoring/manual` |
| Licenças | `/licenses` |
| Minha Carteira | `/carteira` |
| Orçamentos e Propostas | `/commercial-proposals` |
| Outorgas | `/outorgas` |
| Painel | `/` |
| Relatórios de Campo | `/inspections/reports` |
| Telemetria (Real-time) | `/monitoring/telemetric` |
| Usos Insignificantes | `/usos-insignificantes` |
| Usuários | `/users` |

<details>
<summary>Checklist copiável</summary>

- [ ] /oficios — `/oficios`
- [ ] /requests — `/requests`
- [ ] Agenda — `/calendar`
- [ ] Aparência — `/settings/appearance`
- [ ] CAR — `/car`
- [ ] Condicionantes — `/compliance`
- [ ] Contratos — `/contracts`
- [ ] DAIA's — `/intervencoes`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Faturas — `/invoices`
- [ ] Fauna — `/fauna`
- [ ] Lançamento Manual — `/monitoring/manual`
- [ ] Licenças — `/licenses`
- [ ] Minha Carteira — `/carteira`
- [ ] Orçamentos e Propostas — `/commercial-proposals`
- [ ] Outorgas — `/outorgas`
- [ ] Painel — `/`
- [ ] Relatórios de Campo — `/inspections/reports`
- [ ] Telemetria (Real-time) — `/monitoring/telemetric`
- [ ] Usos Insignificantes — `/usos-insignificantes`
- [ ] Usuários — `/users`

</details>

### Cliente Autônomo (`cliente_autonomo`)

Itens de menu visíveis: **20**

| Menu | Rota |
|------|------|
| /oficios | `/oficios` |
| Agenda | `/calendar` |
| Aparência | `/settings/appearance` |
| CAR | `/car` |
| Condicionantes | `/compliance` |
| DAIA's | `/intervencoes` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Fauna | `/fauna` |
| Lançamento Manual | `/monitoring/manual` |
| Licenças | `/licenses` |
| Minha Carteira | `/carteira` |
| Orçamentos e Propostas | `/commercial-proposals` |
| Outorgas | `/outorgas` |
| Painel | `/` |
| Relatórios de Campo | `/inspections/reports` |
| Telemetria (Real-time) | `/monitoring/telemetric` |
| Usos Insignificantes | `/usos-insignificantes` |
| Usuários | `/users` |

<details>
<summary>Checklist copiável</summary>

- [ ] /oficios — `/oficios`
- [ ] Agenda — `/calendar`
- [ ] Aparência — `/settings/appearance`
- [ ] CAR — `/car`
- [ ] Condicionantes — `/compliance`
- [ ] DAIA's — `/intervencoes`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Fauna — `/fauna`
- [ ] Lançamento Manual — `/monitoring/manual`
- [ ] Licenças — `/licenses`
- [ ] Minha Carteira — `/carteira`
- [ ] Orçamentos e Propostas — `/commercial-proposals`
- [ ] Outorgas — `/outorgas`
- [ ] Painel — `/`
- [ ] Relatórios de Campo — `/inspections/reports`
- [ ] Telemetria (Real-time) — `/monitoring/telemetric`
- [ ] Usos Insignificantes — `/usos-insignificantes`
- [ ] Usuários — `/users`

</details>

### Representante (`representative`)

Itens de menu visíveis: **21**

| Menu | Rota |
|------|------|
| /requests | `/requests` |
| Agenda | `/calendar` |
| Aparência | `/settings/appearance` |
| CAR | `/car` |
| Condicionantes | `/compliance` |
| Contratos | `/contracts` |
| DAIA's | `/intervencoes` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Faturas | `/invoices` |
| Fauna | `/fauna` |
| Lançamento Manual | `/monitoring/manual` |
| Licenças | `/licenses` |
| Orçamentos e Propostas | `/commercial-proposals` |
| Outorgas | `/outorgas` |
| Painel | `/` |
| Relatórios de Campo | `/inspections/reports` |
| Telemetria (Real-time) | `/monitoring/telemetric` |
| Usos Insignificantes | `/usos-insignificantes` |
| Usuários | `/users` |

<details>
<summary>Checklist copiável</summary>

- [ ] /requests — `/requests`
- [ ] Agenda — `/calendar`
- [ ] Aparência — `/settings/appearance`
- [ ] CAR — `/car`
- [ ] Condicionantes — `/compliance`
- [ ] Contratos — `/contracts`
- [ ] DAIA's — `/intervencoes`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Faturas — `/invoices`
- [ ] Fauna — `/fauna`
- [ ] Lançamento Manual — `/monitoring/manual`
- [ ] Licenças — `/licenses`
- [ ] Orçamentos e Propostas — `/commercial-proposals`
- [ ] Outorgas — `/outorgas`
- [ ] Painel — `/`
- [ ] Relatórios de Campo — `/inspections/reports`
- [ ] Telemetria (Real-time) — `/monitoring/telemetric`
- [ ] Usos Insignificantes — `/usos-insignificantes`
- [ ] Usuários — `/users`

</details>

### Diretor Fauna (`diretor_fauna`)

Itens de menu visíveis: **40**

| Menu | Rota |
|------|------|
| /georeferenciamento/processos | `/georeferenciamento/processos` |
| /oficios | `/oficios` |
| Agenda | `/calendar` |
| Águas / MIRA-IGAM | `/studies/assistant` |
| Análise Geoespacial (IA) | `/analise-ambiental` |
| Análise socioambiental | `/studies/analise-socioambiental` |
| Aparência | `/settings/appearance` |
| Campo e levantamento | `/georeferenciamento/campo` |
| CAR / SICAR | `/georeferenciamento/ambiental` |
| Cartório e registro | `/georeferenciamento/registro` |
| Coleta de campo | `/coleta-campo` |
| Consulta Intervenção Ambiental | `/external` |
| Consulta Licenciamento | `/external` |
| Consulta Outorgas | `/external` |
| Cruzamento de dados | `/studies/assistant` |
| CTF/IBAMA | `/external` |
| Custos e contratos | `/studies/assistant` |
| Documentação técnica | `/georeferenciamento/documentos` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Estudo de Cavidades | `/studies/cavidades` |
| Estudos de Fauna | `/studies/fauna` |
| Fauna | `/fauna` |
| IDE-SisemaNet-MG | `/external` |
| Legislação e estudos | `/studies/assistant` |
| Painel | `/` |
| Painel | `/georeferenciamento` |
| Programa de Educação Ambiental | `/studies/educacao-ambiental` |
| Referências normativas | `/georeferenciamento/referencias` |
| Relatórios Diversos | `/studies/relatorios-diversos` |
| Rural (SIGEF/INCRA) | `/georeferenciamento/rural` |
| SEI-IBAMA | `/external` |
| SEI-MG | `/external` |
| Síntese de texto | `/studies/assistant` |
| SLA-Ecossistemas/MG | `/external` |
| Urbano (cartório) | `/georeferenciamento/urbano` |
| Usuários | `/users` |
| Validações | `/georeferenciamento/validacoes` |
| Webmail | `/external` |

<details>
<summary>Checklist copiável</summary>

- [ ] /georeferenciamento/processos — `/georeferenciamento/processos`
- [ ] /oficios — `/oficios`
- [ ] Agenda — `/calendar`
- [ ] Águas / MIRA-IGAM — `/studies/assistant`
- [ ] Análise Geoespacial (IA) — `/analise-ambiental`
- [ ] Análise socioambiental — `/studies/analise-socioambiental`
- [ ] Aparência — `/settings/appearance`
- [ ] Campo e levantamento — `/georeferenciamento/campo`
- [ ] CAR / SICAR — `/georeferenciamento/ambiental`
- [ ] Cartório e registro — `/georeferenciamento/registro`
- [ ] Coleta de campo — `/coleta-campo`
- [ ] Consulta Intervenção Ambiental — `/external`
- [ ] Consulta Licenciamento — `/external`
- [ ] Consulta Outorgas — `/external`
- [ ] Cruzamento de dados — `/studies/assistant`
- [ ] CTF/IBAMA — `/external`
- [ ] Custos e contratos — `/studies/assistant`
- [ ] Documentação técnica — `/georeferenciamento/documentos`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Estudo de Cavidades — `/studies/cavidades`
- [ ] Estudos de Fauna — `/studies/fauna`
- [ ] Fauna — `/fauna`
- [ ] IDE-SisemaNet-MG — `/external`
- [ ] Legislação e estudos — `/studies/assistant`
- [ ] Painel — `/`
- [ ] Painel — `/georeferenciamento`
- [ ] Programa de Educação Ambiental — `/studies/educacao-ambiental`
- [ ] Referências normativas — `/georeferenciamento/referencias`
- [ ] Relatórios Diversos — `/studies/relatorios-diversos`
- [ ] Rural (SIGEF/INCRA) — `/georeferenciamento/rural`
- [ ] SEI-IBAMA — `/external`
- [ ] SEI-MG — `/external`
- [ ] Síntese de texto — `/studies/assistant`
- [ ] SLA-Ecossistemas/MG — `/external`
- [ ] Urbano (cartório) — `/georeferenciamento/urbano`
- [ ] Usuários — `/users`
- [ ] Validações — `/georeferenciamento/validacoes`
- [ ] Webmail — `/external`

</details>

### Advogado (`advogado`)

Itens de menu visíveis: **75**

| Menu | Rota |
|------|------|
| /georeferenciamento/processos | `/georeferenciamento/processos` |
| /multas-defesas | `/multas-defesas` |
| /oficios | `/oficios` |
| /requests | `/requests` |
| /requests/new | `/requests/new` |
| Agenda | `/calendar` |
| Águas / MIRA-IGAM | `/studies/assistant` |
| Análise Geoespacial (IA) | `/analise-ambiental` |
| Análise socioambiental | `/studies/analise-socioambiental` |
| Aparência | `/settings/appearance` |
| Campo e levantamento | `/georeferenciamento/campo` |
| CAR | `/car` |
| CAR / SICAR | `/georeferenciamento/ambiental` |
| Cartório e registro | `/georeferenciamento/registro` |
| Condicionantes | `/compliance` |
| Consulta Intervenção Ambiental | `/external` |
| Consulta Licenciamento | `/external` |
| Consulta Outorgas | `/external` |
| Consultar vistorias | `/inspections` |
| Cruzamento de dados | `/studies/assistant` |
| CTF/IBAMA | `/external` |
| Custos e contratos | `/studies/assistant` |
| DAIA's | `/intervencoes` |
| Documentação técnica | `/georeferenciamento/documentos` |
| EIA/RIMA | `/studies/eia-rima` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Espécies protegidas | `/studies/compensacao-ambiental/especies` |
| Estudo de Cavidades | `/studies/cavidades` |
| Estudos de Fauna | `/studies/fauna` |
| Fauna | `/fauna` |
| IDE-SisemaNet | `/studies/ide-sisemanet` |
| IDE-SisemaNet-MG | `/external` |
| Intervenção em APP | `/studies/compensacao-ambiental/app` |
| Inventário Florestal | `/studies/inventario` |
| Lançamento Manual | `/monitoring/manual` |
| LAS-RAS | `/studies/las-ras` |
| Legislação e estudos | `/studies/assistant` |
| Licenças | `/licenses` |
| Mapas | `/studies/mapas` |
| Mata Atlântica | `/studies/compensacao-ambiental/mata-atlantica` |
| Minerária | `/studies/compensacao-ambiental/mineraria` |
| Nova outorga | `/studies/outorgas/new` |
| Nova vistoria | `/inspections/new` |
| Outorgas | `/outorgas` |
| Painel | `/` |
| Painel | `/georeferenciamento` |
| PCA | `/studies/pca` |
| PIA | `/studies/pia` |
| PRADA | `/studies/prada` |
| Processos | `/studies/outorgas` |
| Programa de Educação Ambiental | `/studies/educacao-ambiental` |
| Projeto Técnico de Barragem | `/studies/barragem` |
| PTRF | `/studies/ptrf` |
| RCA | `/studies/rca` |
| Reanálise | `/studies/reanalise` |
| Referências normativas | `/georeferenciamento/referencias` |
| Relatórios de Campo | `/inspections/reports` |
| Relatórios Diversos | `/studies/relatorios-diversos` |
| Reserva Legal | `/studies/reserva-legal` |
| Rural (SIGEF/INCRA) | `/georeferenciamento/rural` |
| Segurança de Barragens | `/studies/seguranca-barragens` |
| SEI-IBAMA | `/external` |
| SEI-MG | `/external` |
| Síntese de texto | `/studies/assistant` |
| SLA-Ecossistemas/MG | `/external` |
| SNUC | `/studies/compensacao-ambiental/snuc` |
| Telemetria (Real-time) | `/monitoring/telemetric` |
| Urbano (cartório) | `/georeferenciamento/urbano` |
| Usos Insignificantes | `/usos-insignificantes` |
| Usuários | `/users` |
| Validações | `/georeferenciamento/validacoes` |
| Visão geral | `/studies/compensacao-ambiental` |
| Webmail | `/external` |

<details>
<summary>Checklist copiável</summary>

- [ ] /georeferenciamento/processos — `/georeferenciamento/processos`
- [ ] /multas-defesas — `/multas-defesas`
- [ ] /oficios — `/oficios`
- [ ] /requests — `/requests`
- [ ] /requests/new — `/requests/new`
- [ ] Agenda — `/calendar`
- [ ] Águas / MIRA-IGAM — `/studies/assistant`
- [ ] Análise Geoespacial (IA) — `/analise-ambiental`
- [ ] Análise socioambiental — `/studies/analise-socioambiental`
- [ ] Aparência — `/settings/appearance`
- [ ] Campo e levantamento — `/georeferenciamento/campo`
- [ ] CAR — `/car`
- [ ] CAR / SICAR — `/georeferenciamento/ambiental`
- [ ] Cartório e registro — `/georeferenciamento/registro`
- [ ] Condicionantes — `/compliance`
- [ ] Consulta Intervenção Ambiental — `/external`
- [ ] Consulta Licenciamento — `/external`
- [ ] Consulta Outorgas — `/external`
- [ ] Consultar vistorias — `/inspections`
- [ ] Cruzamento de dados — `/studies/assistant`
- [ ] CTF/IBAMA — `/external`
- [ ] Custos e contratos — `/studies/assistant`
- [ ] DAIA's — `/intervencoes`
- [ ] Documentação técnica — `/georeferenciamento/documentos`
- [ ] EIA/RIMA — `/studies/eia-rima`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Espécies protegidas — `/studies/compensacao-ambiental/especies`
- [ ] Estudo de Cavidades — `/studies/cavidades`
- [ ] Estudos de Fauna — `/studies/fauna`
- [ ] Fauna — `/fauna`
- [ ] IDE-SisemaNet — `/studies/ide-sisemanet`
- [ ] IDE-SisemaNet-MG — `/external`
- [ ] Intervenção em APP — `/studies/compensacao-ambiental/app`
- [ ] Inventário Florestal — `/studies/inventario`
- [ ] Lançamento Manual — `/monitoring/manual`
- [ ] LAS-RAS — `/studies/las-ras`
- [ ] Legislação e estudos — `/studies/assistant`
- [ ] Licenças — `/licenses`
- [ ] Mapas — `/studies/mapas`
- [ ] Mata Atlântica — `/studies/compensacao-ambiental/mata-atlantica`
- [ ] Minerária — `/studies/compensacao-ambiental/mineraria`
- [ ] Nova outorga — `/studies/outorgas/new`
- [ ] Nova vistoria — `/inspections/new`
- [ ] Outorgas — `/outorgas`
- [ ] Painel — `/`
- [ ] Painel — `/georeferenciamento`
- [ ] PCA — `/studies/pca`
- [ ] PIA — `/studies/pia`
- [ ] PRADA — `/studies/prada`
- [ ] Processos — `/studies/outorgas`
- [ ] Programa de Educação Ambiental — `/studies/educacao-ambiental`
- [ ] Projeto Técnico de Barragem — `/studies/barragem`
- [ ] PTRF — `/studies/ptrf`
- [ ] RCA — `/studies/rca`
- [ ] Reanálise — `/studies/reanalise`
- [ ] Referências normativas — `/georeferenciamento/referencias`
- [ ] Relatórios de Campo — `/inspections/reports`
- [ ] Relatórios Diversos — `/studies/relatorios-diversos`
- [ ] Reserva Legal — `/studies/reserva-legal`
- [ ] Rural (SIGEF/INCRA) — `/georeferenciamento/rural`
- [ ] Segurança de Barragens — `/studies/seguranca-barragens`
- [ ] SEI-IBAMA — `/external`
- [ ] SEI-MG — `/external`
- [ ] Síntese de texto — `/studies/assistant`
- [ ] SLA-Ecossistemas/MG — `/external`
- [ ] SNUC — `/studies/compensacao-ambiental/snuc`
- [ ] Telemetria (Real-time) — `/monitoring/telemetric`
- [ ] Urbano (cartório) — `/georeferenciamento/urbano`
- [ ] Usos Insignificantes — `/usos-insignificantes`
- [ ] Usuários — `/users`
- [ ] Validações — `/georeferenciamento/validacoes`
- [ ] Visão geral — `/studies/compensacao-ambiental`
- [ ] Webmail — `/external`

</details>

## Rotas legadas (redirect)

| Rota | Destino |
|------|---------|
| `/autos-infracao-defesa` | `/multas-defesas` |
| `/environmental-company` | `/responsible-company` |
| `/monitoring` | `/monitoring/manual` |
| `/studies` | `/studies/educacao-ambiental` |
| `/studies/intervencao-ambiental` | `/studies/pia` |
| `/webmail` | `/external?…` |

## APIs a observar na Rede

| API | Quando |
|-----|--------|
| `/api/branding/image` | PDFs, laudos, vistorias (Bearer) |
| `/api/geospatial/analyze` | Licenciamento locacional |
| `/api/package/check` | Criar empreendimento / módulos portal |
| `/api/study-maps/*` | Mapas (Bearer) |
| `/api/laudos/gerar-docx` | Laudos |

## Comandos úteis

```bash
npm run audit:routes
npm run audit:menus-by-role
```
