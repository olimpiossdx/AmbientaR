# Checklist Fase 3 — Menus por perfil

Gerado em: 2026-05-22T13:03:44.325Z

Use com `npm run dev` (porta 9002), utilizador de teste por role, DevTools → Rede + Consola.

## Critérios por item

- [ ] Página abre sem erro vermelho no boundary
- [ ] Rede: sem 4xx/5xx em `/api/*` (exceto 401 antes do login)
- [ ] Consola: sem `permission-denied` repetido
- [ ] PDF/imagem: se usar Storage, proxy `/api/branding/image` com sessão ativa

## Perfis

### Administrador (`admin`)

Itens de menu visíveis: **116**

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
| App de Campo (planej.) | `/app-campo` |
| Assistente Financeiro (IA) | `/studies/assistant` |
| Automações IA | `/ai-lab/automations` |
| Backup de Dados Apagados | `/settings/deleted-backups` |
| Base de Conhecimento (RAG) | `/ai-lab/rag` |
| Bens e Patrimônio | `/financial/bens-patrimonio` |
| Campo e levantamento | `/georeferenciamento/campo` |
| Canais (WhatsApp/IG) | `/canais` |
| CAR | `/car` |
| CAR / SICAR | `/georeferenciamento/ambiental` |
| Cartório e registro | `/georeferenciamento/registro` |
| Clientes | `/clients` |
| Conciliação Bancária | `/financial/conciliacao` |
| Condicionantes | `/compliance` |
| Configurações CRM | `/crm/settings` |
| Consulta Intervenção Ambiental | `/external` |
| Consulta Licenciamento | `/external` |
| Consulta Outorgas | `/external` |
| Consultar vistorias | `/inspections` |
| Consultas Técnicas | `/consultas` |
| Contratos | `/contracts` |
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
| Educação Ambiental | `/studies/educacao-ambiental` |
| EIA/RIMA | `/studies/eia-rima` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Equipe & Desempenho | `/crm/team` |
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
| Inventário Florestal | `/studies/inventario` |
| Inventários de Campo | `/inventarios` |
| Lançamento Manual | `/monitoring/manual` |
| Lançamentos de Caixa | `/cash-flow` |
| LAS-RAS | `/studies/las-ras` |
| Laudos | `/laudos` |
| Legislação e estudos | `/studies/assistant` |
| Licenças | `/licenses` |
| Log de Auditoria | `/audit-log` |
| Mapas | `/studies/mapas` |
| MCP & Ferramentas IA | `/ai-lab/mcp` |
| Mídias Sociais | `/social-media` |
| NFe-Eletrônica | `/external` |
| Nova vistoria | `/inspections/new` |
| Oportunidades & Pipeline | `/crm/opportunities` |
| Orçamento Anual | `/financial/orcamento` |
| Orçamentos e Propostas | `/commercial-proposals` |
| Outorgas | `/outorgas` |
| Outorgas | `/studies/outorgas` |
| Painel | `/` |
| Painel | `/georeferenciamento` |
| Painel de Vendas | `/crm` |
| Painel Financeiro | `/financial/painel` |
| Pasta Base IA (Local) | `/settings/ai-local-source` |
| PCA | `/studies/pca` |
| PIA | `/studies/pia` |
| PRADA | `/studies/prada` |
| Projeto Técnico de Barragem | `/studies/barragem` |
| PTRF | `/studies/ptrf` |
| RCA | `/studies/rca` |
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
| Tabela de Serviços | `/services` |
| Telemetria (Real-time) | `/monitoring/telemetric` |
| Templates | `/settings/templates` |
| Urbano (cartório) | `/georeferenciamento/urbano` |
| Usos Insignificantes | `/usos-insignificantes` |
| Usuários | `/users` |
| Validações | `/georeferenciamento/validacoes` |
| Vendas & Propostas | `/crm/proposals` |
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
- [ ] App de Campo (planej.) — `/app-campo`
- [ ] Assistente Financeiro (IA) — `/studies/assistant`
- [ ] Automações IA — `/ai-lab/automations`
- [ ] Backup de Dados Apagados — `/settings/deleted-backups`
- [ ] Base de Conhecimento (RAG) — `/ai-lab/rag`
- [ ] Bens e Patrimônio — `/financial/bens-patrimonio`
- [ ] Campo e levantamento — `/georeferenciamento/campo`
- [ ] Canais (WhatsApp/IG) — `/canais`
- [ ] CAR — `/car`
- [ ] CAR / SICAR — `/georeferenciamento/ambiental`
- [ ] Cartório e registro — `/georeferenciamento/registro`
- [ ] Clientes — `/clients`
- [ ] Conciliação Bancária — `/financial/conciliacao`
- [ ] Condicionantes — `/compliance`
- [ ] Configurações CRM — `/crm/settings`
- [ ] Consulta Intervenção Ambiental — `/external`
- [ ] Consulta Licenciamento — `/external`
- [ ] Consulta Outorgas — `/external`
- [ ] Consultar vistorias — `/inspections`
- [ ] Consultas Técnicas — `/consultas`
- [ ] Contratos — `/contracts`
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
- [ ] Educação Ambiental — `/studies/educacao-ambiental`
- [ ] EIA/RIMA — `/studies/eia-rima`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Equipe & Desempenho — `/crm/team`
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
- [ ] Inventário Florestal — `/studies/inventario`
- [ ] Inventários de Campo — `/inventarios`
- [ ] Lançamento Manual — `/monitoring/manual`
- [ ] Lançamentos de Caixa — `/cash-flow`
- [ ] LAS-RAS — `/studies/las-ras`
- [ ] Laudos — `/laudos`
- [ ] Legislação e estudos — `/studies/assistant`
- [ ] Licenças — `/licenses`
- [ ] Log de Auditoria — `/audit-log`
- [ ] Mapas — `/studies/mapas`
- [ ] MCP & Ferramentas IA — `/ai-lab/mcp`
- [ ] Mídias Sociais — `/social-media`
- [ ] NFe-Eletrônica — `/external`
- [ ] Nova vistoria — `/inspections/new`
- [ ] Oportunidades & Pipeline — `/crm/opportunities`
- [ ] Orçamento Anual — `/financial/orcamento`
- [ ] Orçamentos e Propostas — `/commercial-proposals`
- [ ] Outorgas — `/outorgas`
- [ ] Outorgas — `/studies/outorgas`
- [ ] Painel — `/`
- [ ] Painel — `/georeferenciamento`
- [ ] Painel de Vendas — `/crm`
- [ ] Painel Financeiro — `/financial/painel`
- [ ] Pasta Base IA (Local) — `/settings/ai-local-source`
- [ ] PCA — `/studies/pca`
- [ ] PIA — `/studies/pia`
- [ ] PRADA — `/studies/prada`
- [ ] Projeto Técnico de Barragem — `/studies/barragem`
- [ ] PTRF — `/studies/ptrf`
- [ ] RCA — `/studies/rca`
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
- [ ] Tabela de Serviços — `/services`
- [ ] Telemetria (Real-time) — `/monitoring/telemetric`
- [ ] Templates — `/settings/templates`
- [ ] Urbano (cartório) — `/georeferenciamento/urbano`
- [ ] Usos Insignificantes — `/usos-insignificantes`
- [ ] Usuários — `/users`
- [ ] Validações — `/georeferenciamento/validacoes`
- [ ] Vendas & Propostas — `/crm/proposals`
- [ ] Webmail — `/external`

</details>

### Gestor (`gestor`)

Itens de menu visíveis: **70**

| Menu | Rota |
|------|------|
| /georeferenciamento/processos | `/georeferenciamento/processos` |
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
| Consultas Técnicas | `/consultas` |
| Cruzamento de dados | `/studies/assistant` |
| CTF/IBAMA | `/external` |
| Custos e contratos | `/studies/assistant` |
| DAIA's | `/intervencoes` |
| Documentação técnica | `/georeferenciamento/documentos` |
| Educação Ambiental | `/studies/educacao-ambiental` |
| EIA/RIMA | `/studies/eia-rima` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Estudo de Cavidades | `/studies/cavidades` |
| Estudos de Fauna | `/studies/fauna` |
| Fauna | `/fauna` |
| IDE-SisemaNet | `/studies/ide-sisemanet` |
| IDE-SisemaNet-MG | `/external` |
| Inventário Florestal | `/studies/inventario` |
| Inventários de Campo | `/inventarios` |
| Lançamento Manual | `/monitoring/manual` |
| LAS-RAS | `/studies/las-ras` |
| Laudos | `/laudos` |
| Legislação e estudos | `/studies/assistant` |
| Licenças | `/licenses` |
| Mapas | `/studies/mapas` |
| Nova vistoria | `/inspections/new` |
| Outorgas | `/outorgas` |
| Outorgas | `/studies/outorgas` |
| Painel | `/` |
| Painel | `/georeferenciamento` |
| PCA | `/studies/pca` |
| PIA | `/studies/pia` |
| PRADA | `/studies/prada` |
| Projeto Técnico de Barragem | `/studies/barragem` |
| PTRF | `/studies/ptrf` |
| RCA | `/studies/rca` |
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
| Telemetria (Real-time) | `/monitoring/telemetric` |
| Urbano (cartório) | `/georeferenciamento/urbano` |
| Usos Insignificantes | `/usos-insignificantes` |
| Usuários | `/users` |
| Validações | `/georeferenciamento/validacoes` |
| Webmail | `/external` |

<details>
<summary>Checklist copiável</summary>

- [ ] /georeferenciamento/processos — `/georeferenciamento/processos`
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
- [ ] Consultas Técnicas — `/consultas`
- [ ] Cruzamento de dados — `/studies/assistant`
- [ ] CTF/IBAMA — `/external`
- [ ] Custos e contratos — `/studies/assistant`
- [ ] DAIA's — `/intervencoes`
- [ ] Documentação técnica — `/georeferenciamento/documentos`
- [ ] Educação Ambiental — `/studies/educacao-ambiental`
- [ ] EIA/RIMA — `/studies/eia-rima`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Estudo de Cavidades — `/studies/cavidades`
- [ ] Estudos de Fauna — `/studies/fauna`
- [ ] Fauna — `/fauna`
- [ ] IDE-SisemaNet — `/studies/ide-sisemanet`
- [ ] IDE-SisemaNet-MG — `/external`
- [ ] Inventário Florestal — `/studies/inventario`
- [ ] Inventários de Campo — `/inventarios`
- [ ] Lançamento Manual — `/monitoring/manual`
- [ ] LAS-RAS — `/studies/las-ras`
- [ ] Laudos — `/laudos`
- [ ] Legislação e estudos — `/studies/assistant`
- [ ] Licenças — `/licenses`
- [ ] Mapas — `/studies/mapas`
- [ ] Nova vistoria — `/inspections/new`
- [ ] Outorgas — `/outorgas`
- [ ] Outorgas — `/studies/outorgas`
- [ ] Painel — `/`
- [ ] Painel — `/georeferenciamento`
- [ ] PCA — `/studies/pca`
- [ ] PIA — `/studies/pia`
- [ ] PRADA — `/studies/prada`
- [ ] Projeto Técnico de Barragem — `/studies/barragem`
- [ ] PTRF — `/studies/ptrf`
- [ ] RCA — `/studies/rca`
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
- [ ] Telemetria (Real-time) — `/monitoring/telemetric`
- [ ] Urbano (cartório) — `/georeferenciamento/urbano`
- [ ] Usos Insignificantes — `/usos-insignificantes`
- [ ] Usuários — `/users`
- [ ] Validações — `/georeferenciamento/validacoes`
- [ ] Webmail — `/external`

</details>

### Supervisor (`supervisor`)

Itens de menu visíveis: **81**

| Menu | Rota |
|------|------|
| /georeferenciamento/processos | `/georeferenciamento/processos` |
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
| Educação Ambiental | `/studies/educacao-ambiental` |
| EIA/RIMA | `/studies/eia-rima` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Equipe & Desempenho | `/crm/team` |
| Estudo de Cavidades | `/studies/cavidades` |
| Estudos de Fauna | `/studies/fauna` |
| Fauna | `/fauna` |
| Gestão de Clientes | `/crm/clients` |
| IDE-SisemaNet | `/studies/ide-sisemanet` |
| IDE-SisemaNet-MG | `/external` |
| Inventário Florestal | `/studies/inventario` |
| Inventários de Campo | `/inventarios` |
| Lançamento Manual | `/monitoring/manual` |
| LAS-RAS | `/studies/las-ras` |
| Laudos | `/laudos` |
| Legislação e estudos | `/studies/assistant` |
| Licenças | `/licenses` |
| Log de Auditoria | `/audit-log` |
| Mapas | `/studies/mapas` |
| Mídias Sociais | `/social-media` |
| Nova vistoria | `/inspections/new` |
| Oportunidades & Pipeline | `/crm/opportunities` |
| Outorgas | `/outorgas` |
| Outorgas | `/studies/outorgas` |
| Painel | `/` |
| Painel | `/georeferenciamento` |
| Painel de Vendas | `/crm` |
| PCA | `/studies/pca` |
| PIA | `/studies/pia` |
| PRADA | `/studies/prada` |
| Projeto Técnico de Barragem | `/studies/barragem` |
| PTRF | `/studies/ptrf` |
| RCA | `/studies/rca` |
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
| Telemetria (Real-time) | `/monitoring/telemetric` |
| Urbano (cartório) | `/georeferenciamento/urbano` |
| Usos Insignificantes | `/usos-insignificantes` |
| Usuários | `/users` |
| Validações | `/georeferenciamento/validacoes` |
| Vendas & Propostas | `/crm/proposals` |
| Webmail | `/external` |

<details>
<summary>Checklist copiável</summary>

- [ ] /georeferenciamento/processos — `/georeferenciamento/processos`
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
- [ ] Educação Ambiental — `/studies/educacao-ambiental`
- [ ] EIA/RIMA — `/studies/eia-rima`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Equipe & Desempenho — `/crm/team`
- [ ] Estudo de Cavidades — `/studies/cavidades`
- [ ] Estudos de Fauna — `/studies/fauna`
- [ ] Fauna — `/fauna`
- [ ] Gestão de Clientes — `/crm/clients`
- [ ] IDE-SisemaNet — `/studies/ide-sisemanet`
- [ ] IDE-SisemaNet-MG — `/external`
- [ ] Inventário Florestal — `/studies/inventario`
- [ ] Inventários de Campo — `/inventarios`
- [ ] Lançamento Manual — `/monitoring/manual`
- [ ] LAS-RAS — `/studies/las-ras`
- [ ] Laudos — `/laudos`
- [ ] Legislação e estudos — `/studies/assistant`
- [ ] Licenças — `/licenses`
- [ ] Log de Auditoria — `/audit-log`
- [ ] Mapas — `/studies/mapas`
- [ ] Mídias Sociais — `/social-media`
- [ ] Nova vistoria — `/inspections/new`
- [ ] Oportunidades & Pipeline — `/crm/opportunities`
- [ ] Outorgas — `/outorgas`
- [ ] Outorgas — `/studies/outorgas`
- [ ] Painel — `/`
- [ ] Painel — `/georeferenciamento`
- [ ] Painel de Vendas — `/crm`
- [ ] PCA — `/studies/pca`
- [ ] PIA — `/studies/pia`
- [ ] PRADA — `/studies/prada`
- [ ] Projeto Técnico de Barragem — `/studies/barragem`
- [ ] PTRF — `/studies/ptrf`
- [ ] RCA — `/studies/rca`
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
- [ ] Telemetria (Real-time) — `/monitoring/telemetric`
- [ ] Urbano (cartório) — `/georeferenciamento/urbano`
- [ ] Usos Insignificantes — `/usos-insignificantes`
- [ ] Usuários — `/users`
- [ ] Validações — `/georeferenciamento/validacoes`
- [ ] Vendas & Propostas — `/crm/proposals`
- [ ] Webmail — `/external`

</details>

### Técnico (`technical`)

Itens de menu visíveis: **59**

| Menu | Rota |
|------|------|
| /oficios | `/oficios` |
| /requests | `/requests` |
| /requests/new | `/requests/new` |
| Agenda | `/calendar` |
| Águas / MIRA-IGAM | `/studies/assistant` |
| Análise Geoespacial (IA) | `/analise-ambiental` |
| Análise socioambiental | `/studies/analise-socioambiental` |
| Aparência | `/settings/appearance` |
| CAR | `/car` |
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
| Educação Ambiental | `/studies/educacao-ambiental` |
| EIA/RIMA | `/studies/eia-rima` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Estudo de Cavidades | `/studies/cavidades` |
| Estudos de Fauna | `/studies/fauna` |
| Fauna | `/fauna` |
| IDE-SisemaNet | `/studies/ide-sisemanet` |
| IDE-SisemaNet-MG | `/external` |
| Inventário Florestal | `/studies/inventario` |
| Inventários de Campo | `/inventarios` |
| Lançamento Manual | `/monitoring/manual` |
| LAS-RAS | `/studies/las-ras` |
| Laudos | `/laudos` |
| Legislação e estudos | `/studies/assistant` |
| Licenças | `/licenses` |
| Mapas | `/studies/mapas` |
| Nova vistoria | `/inspections/new` |
| Outorgas | `/outorgas` |
| Outorgas | `/studies/outorgas` |
| Painel | `/` |
| PCA | `/studies/pca` |
| PIA | `/studies/pia` |
| PRADA | `/studies/prada` |
| Projeto Técnico de Barragem | `/studies/barragem` |
| PTRF | `/studies/ptrf` |
| RCA | `/studies/rca` |
| Relatórios de Campo | `/inspections/reports` |
| Relatórios Diversos | `/studies/relatorios-diversos` |
| Reserva Legal | `/studies/reserva-legal` |
| Segurança de Barragens | `/studies/seguranca-barragens` |
| SEI-IBAMA | `/external` |
| SEI-MG | `/external` |
| Síntese de texto | `/studies/assistant` |
| SLA-Ecossistemas/MG | `/external` |
| Telemetria (Real-time) | `/monitoring/telemetric` |
| Usos Insignificantes | `/usos-insignificantes` |
| Usuários | `/users` |
| Webmail | `/external` |

<details>
<summary>Checklist copiável</summary>

- [ ] /oficios — `/oficios`
- [ ] /requests — `/requests`
- [ ] /requests/new — `/requests/new`
- [ ] Agenda — `/calendar`
- [ ] Águas / MIRA-IGAM — `/studies/assistant`
- [ ] Análise Geoespacial (IA) — `/analise-ambiental`
- [ ] Análise socioambiental — `/studies/analise-socioambiental`
- [ ] Aparência — `/settings/appearance`
- [ ] CAR — `/car`
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
- [ ] Educação Ambiental — `/studies/educacao-ambiental`
- [ ] EIA/RIMA — `/studies/eia-rima`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Estudo de Cavidades — `/studies/cavidades`
- [ ] Estudos de Fauna — `/studies/fauna`
- [ ] Fauna — `/fauna`
- [ ] IDE-SisemaNet — `/studies/ide-sisemanet`
- [ ] IDE-SisemaNet-MG — `/external`
- [ ] Inventário Florestal — `/studies/inventario`
- [ ] Inventários de Campo — `/inventarios`
- [ ] Lançamento Manual — `/monitoring/manual`
- [ ] LAS-RAS — `/studies/las-ras`
- [ ] Laudos — `/laudos`
- [ ] Legislação e estudos — `/studies/assistant`
- [ ] Licenças — `/licenses`
- [ ] Mapas — `/studies/mapas`
- [ ] Nova vistoria — `/inspections/new`
- [ ] Outorgas — `/outorgas`
- [ ] Outorgas — `/studies/outorgas`
- [ ] Painel — `/`
- [ ] PCA — `/studies/pca`
- [ ] PIA — `/studies/pia`
- [ ] PRADA — `/studies/prada`
- [ ] Projeto Técnico de Barragem — `/studies/barragem`
- [ ] PTRF — `/studies/ptrf`
- [ ] RCA — `/studies/rca`
- [ ] Relatórios de Campo — `/inspections/reports`
- [ ] Relatórios Diversos — `/studies/relatorios-diversos`
- [ ] Reserva Legal — `/studies/reserva-legal`
- [ ] Segurança de Barragens — `/studies/seguranca-barragens`
- [ ] SEI-IBAMA — `/external`
- [ ] SEI-MG — `/external`
- [ ] Síntese de texto — `/studies/assistant`
- [ ] SLA-Ecossistemas/MG — `/external`
- [ ] Telemetria (Real-time) — `/monitoring/telemetric`
- [ ] Usos Insignificantes — `/usos-insignificantes`
- [ ] Usuários — `/users`
- [ ] Webmail — `/external`

</details>

### Vendas (`sales`)

Itens de menu visíveis: **29**

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
- [ ] Relatórios & Análises — `/crm/reports`
- [ ] SEI-IBAMA — `/external`
- [ ] SEI-MG — `/external`
- [ ] SLA-Ecossistemas/MG — `/external`
- [ ] Usuários — `/users`
- [ ] Vendas & Propostas — `/crm/proposals`
- [ ] Webmail — `/external`

</details>

### Financeiro (`financial`)

Itens de menu visíveis: **48**

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

Itens de menu visíveis: **22**

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
- [ ] Orçamentos e Propostas — `/commercial-proposals`
- [ ] Outorgas — `/outorgas`
- [ ] Painel — `/`
- [ ] Relatórios de Campo — `/inspections/reports`
- [ ] Telemetria (Real-time) — `/monitoring/telemetric`
- [ ] Usos Insignificantes — `/usos-insignificantes`
- [ ] Usuários — `/users`

</details>

### Cliente Autônomo (`cliente_autonomo`)

Itens de menu visíveis: **19**

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
| Consulta Intervenção Ambiental | `/external` |
| Consulta Licenciamento | `/external` |
| Consulta Outorgas | `/external` |
| Cruzamento de dados | `/studies/assistant` |
| CTF/IBAMA | `/external` |
| Custos e contratos | `/studies/assistant` |
| Documentação técnica | `/georeferenciamento/documentos` |
| Educação Ambiental | `/studies/educacao-ambiental` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Estudo de Cavidades | `/studies/cavidades` |
| Estudos de Fauna | `/studies/fauna` |
| Fauna | `/fauna` |
| IDE-SisemaNet-MG | `/external` |
| Inventários de Campo | `/inventarios` |
| Legislação e estudos | `/studies/assistant` |
| Painel | `/` |
| Painel | `/georeferenciamento` |
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
- [ ] Consulta Intervenção Ambiental — `/external`
- [ ] Consulta Licenciamento — `/external`
- [ ] Consulta Outorgas — `/external`
- [ ] Cruzamento de dados — `/studies/assistant`
- [ ] CTF/IBAMA — `/external`
- [ ] Custos e contratos — `/studies/assistant`
- [ ] Documentação técnica — `/georeferenciamento/documentos`
- [ ] Educação Ambiental — `/studies/educacao-ambiental`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Estudo de Cavidades — `/studies/cavidades`
- [ ] Estudos de Fauna — `/studies/fauna`
- [ ] Fauna — `/fauna`
- [ ] IDE-SisemaNet-MG — `/external`
- [ ] Inventários de Campo — `/inventarios`
- [ ] Legislação e estudos — `/studies/assistant`
- [ ] Painel — `/`
- [ ] Painel — `/georeferenciamento`
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

Itens de menu visíveis: **67**

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
| Educação Ambiental | `/studies/educacao-ambiental` |
| EIA/RIMA | `/studies/eia-rima` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Estudo de Cavidades | `/studies/cavidades` |
| Estudos de Fauna | `/studies/fauna` |
| Fauna | `/fauna` |
| IDE-SisemaNet | `/studies/ide-sisemanet` |
| IDE-SisemaNet-MG | `/external` |
| Inventário Florestal | `/studies/inventario` |
| Lançamento Manual | `/monitoring/manual` |
| LAS-RAS | `/studies/las-ras` |
| Legislação e estudos | `/studies/assistant` |
| Licenças | `/licenses` |
| Mapas | `/studies/mapas` |
| Nova vistoria | `/inspections/new` |
| Outorgas | `/outorgas` |
| Outorgas | `/studies/outorgas` |
| Painel | `/` |
| Painel | `/georeferenciamento` |
| PCA | `/studies/pca` |
| PIA | `/studies/pia` |
| PRADA | `/studies/prada` |
| Projeto Técnico de Barragem | `/studies/barragem` |
| PTRF | `/studies/ptrf` |
| RCA | `/studies/rca` |
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
| Telemetria (Real-time) | `/monitoring/telemetric` |
| Urbano (cartório) | `/georeferenciamento/urbano` |
| Usos Insignificantes | `/usos-insignificantes` |
| Usuários | `/users` |
| Validações | `/georeferenciamento/validacoes` |
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
- [ ] Educação Ambiental — `/studies/educacao-ambiental`
- [ ] EIA/RIMA — `/studies/eia-rima`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Estudo de Cavidades — `/studies/cavidades`
- [ ] Estudos de Fauna — `/studies/fauna`
- [ ] Fauna — `/fauna`
- [ ] IDE-SisemaNet — `/studies/ide-sisemanet`
- [ ] IDE-SisemaNet-MG — `/external`
- [ ] Inventário Florestal — `/studies/inventario`
- [ ] Lançamento Manual — `/monitoring/manual`
- [ ] LAS-RAS — `/studies/las-ras`
- [ ] Legislação e estudos — `/studies/assistant`
- [ ] Licenças — `/licenses`
- [ ] Mapas — `/studies/mapas`
- [ ] Nova vistoria — `/inspections/new`
- [ ] Outorgas — `/outorgas`
- [ ] Outorgas — `/studies/outorgas`
- [ ] Painel — `/`
- [ ] Painel — `/georeferenciamento`
- [ ] PCA — `/studies/pca`
- [ ] PIA — `/studies/pia`
- [ ] PRADA — `/studies/prada`
- [ ] Projeto Técnico de Barragem — `/studies/barragem`
- [ ] PTRF — `/studies/ptrf`
- [ ] RCA — `/studies/rca`
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
- [ ] Telemetria (Real-time) — `/monitoring/telemetric`
- [ ] Urbano (cartório) — `/georeferenciamento/urbano`
- [ ] Usos Insignificantes — `/usos-insignificantes`
- [ ] Usuários — `/users`
- [ ] Validações — `/georeferenciamento/validacoes`
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
