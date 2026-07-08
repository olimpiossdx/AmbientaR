# Checklist Fase 3 — Menus por perfil

Gerado em: 2026-07-08T01:20:04.509Z

Use com `npm run dev` (porta 9002), utilizador de teste por role, DevTools → Rede + Consola.

## Critérios por item

- [ ] Página abre sem erro vermelho no boundary
- [ ] Rede: sem 4xx/5xx em `/api/*` (exceto 401 antes do login)
- [ ] Consola: sem `permission-denied` repetido
- [ ] PDF/imagem: se usar Storage, proxy `/api/branding/image` com sessão ativa

## Perfis

### Administrador (`admin`)

Itens de menu visíveis: **101**

| Menu | Rota |
|------|------|
| /multas-defesas | `/multas-defesas` |
| /oficios | `/oficios` |
| Acesso Bancário | `/bank-access` |
| Agenda | `/calendar` |
| Aparência | `/settings/appearance` |
| Assistente Financeiro (IA) | `/studies/assistant` |
| Backup de Dados Apagados | `/settings/deleted-backups` |
| Bens e Patrimônio | `/financial/bens-patrimonio` |
| Biblioteca IA (OneDrive) | `/ai-lab/cloud-library` |
| Canais (WhatsApp/IG) | `/canais` |
| CAR | `/car` |
| Carvão vegetal | `/studies/relatorios-diversos/carvao-vegetal` |
| Clientes | `/clients` |
| Coleta de campo | `/coleta-campo` |
| Conciliação Bancária | `/financial/conciliacao` |
| Condicionantes | `/compliance` |
| Consultar vistorias | `/inspections` |
| Consultas Técnicas | `/consultas` |
| Contratos | `/contracts` |
| Contratos Plataforma | `/financial/platform-subscription-contracts` |
| Contratos-Fornecedores | `/contracts-suppliers` |
| CTF/IBAMA | `/ctf-ibama` |
| Curva ABC | `/financial/abc-curve` |
| Curva ABC Fornecedores | `/financial/abc-fornecedores` |
| Curva ABC Serviços | `/financial/abc-servicos` |
| DAIA's | `/intervencoes` |
| Debug PIX Assinatura | `/financial/billing-debug` |
| DRE Contábil | `/financial/dre-contabil` |
| EIA/RIMA | `/studies/eia-rima` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Espécies protegidas | `/studies/compensacao-ambiental/especies` |
| Estudo de Cavidades | `/studies/cavidades` |
| Estudos de Fauna | `/studies/fauna` |
| Explorador de Arquivos | `/settings/files` |
| Exportação Contábil | `/financial/export-contabil` |
| Faturas | `/invoices` |
| Fauna | `/fauna` |
| Ferramentas MCP (lab) | `/ai-lab/mcp` |
| Fluxo de Caixa Projetado | `/financial/fluxo-projetado` |
| Fontes de Conhecimento (RAG) | `/knowledge-sources` |
| Fornecedores | `/suppliers` |
| IDE-SisemaNet | `/studies/ide-sisemanet` |
| Identidade Visual | `/settings` |
| Importação IA (legado local) | `/settings/ai-local-source` |
| Informações da Empresa | `/settings/company` |
| Integração OneDrive | `/settings/onedrive-integration` |
| Intervenção em APP | `/studies/compensacao-ambiental/app` |
| Inventário Florestal | `/studies/inventario` |
| Laboratório RAG | `/ai-lab/rag` |
| Lançamento Manual | `/monitoring/manual` |
| Lançamentos de Caixa | `/cash-flow` |
| LAS-RAS | `/studies/las-ras` |
| Laudos | `/laudos` |
| Licenças | `/licenses` |
| Log de Auditoria | `/audit-log` |
| Mapas | `/studies/mapas` |
| Mata Atlântica | `/studies/compensacao-ambiental/mata-atlantica` |
| MCP + RAG / Inteligência do Sistema | `/configuracoes/mcp-rag` |
| Memorial Descritivo | `/studies/memorial-descritivo` |
| Minerária | `/studies/compensacao-ambiental/mineraria` |
| Minha Carteira | `/carteira` |
| MTR-Declaração | `/mtr-declaracao` |
| MTR-MG (resíduos) | `/studies/mtr` |
| Nova outorga | `/studies/outorgas/new` |
| Nova vistoria | `/inspections/new` |
| Orçamento Anual | `/financial/orcamento` |
| Orçamentos e Propostas | `/commercial-proposals` |
| Outorgas | `/outorgas` |
| Painel | `/` |
| Painel Financeiro | `/financial/painel` |
| Pasta do cliente | `/documentos-ambientais/pasta-cliente` |
| PIA | `/studies/pia` |
| Piscinão (off-stream) | `/studies/piscinao-off-stream` |
| PRADA | `/studies/prada` |
| Processos | `/studies/outorgas` |
| Procuração | `/studies/procuracao` |
| Programa de Ação Emergencial | `/studies/acao-emergencial` |
| Programa de Educação Ambiental | `/studies/educacao-ambiental` |
| Projeto técnico | `/studies/barragem` |
| Projetos & ROI | `/financial/projetos-roi` |
| PTRF | `/studies/ptrf` |
| PTRF / PRAD | `/studies/relatorios-diversos/ptrf-prad` |
| Reanálise | `/studies/reanalise` |
| Relatórios de Campo | `/inspections/reports` |
| Reserva Legal | `/studies/reserva-legal` |
| Responsáveis Técnicos | `/technical-responsible` |
| Segurança e emergência | `/studies/seguranca-barragens` |
| SNUC | `/studies/compensacao-ambiental/snuc` |
| Tabela de Serviços | `/services` |
| TAC — Termo de Ajust. de Conduta | `/tacs` |
| Telemetria (Real-time) | `/monitoring/telemetric` |
| Templates | `/settings/templates` |
| Transporte de resíduos | `/studies/relatorios-diversos/transporte-residuos` |
| Usos Insignificantes | `/usos-insignificantes` |
| Usuários | `/users` |
| Visão geral | `/studies/barragens` |
| Visão geral | `/studies/relatorios-diversos` |
| Visão geral | `/studies/compensacao-ambiental` |
| Webmail | `/external` |

<details>
<summary>Checklist copiável</summary>

- [ ] /multas-defesas — `/multas-defesas`
- [ ] /oficios — `/oficios`
- [ ] Acesso Bancário — `/bank-access`
- [ ] Agenda — `/calendar`
- [ ] Aparência — `/settings/appearance`
- [ ] Assistente Financeiro (IA) — `/studies/assistant`
- [ ] Backup de Dados Apagados — `/settings/deleted-backups`
- [ ] Bens e Patrimônio — `/financial/bens-patrimonio`
- [ ] Biblioteca IA (OneDrive) — `/ai-lab/cloud-library`
- [ ] Canais (WhatsApp/IG) — `/canais`
- [ ] CAR — `/car`
- [ ] Carvão vegetal — `/studies/relatorios-diversos/carvao-vegetal`
- [ ] Clientes — `/clients`
- [ ] Coleta de campo — `/coleta-campo`
- [ ] Conciliação Bancária — `/financial/conciliacao`
- [ ] Condicionantes — `/compliance`
- [ ] Consultar vistorias — `/inspections`
- [ ] Consultas Técnicas — `/consultas`
- [ ] Contratos — `/contracts`
- [ ] Contratos Plataforma — `/financial/platform-subscription-contracts`
- [ ] Contratos-Fornecedores — `/contracts-suppliers`
- [ ] CTF/IBAMA — `/ctf-ibama`
- [ ] Curva ABC — `/financial/abc-curve`
- [ ] Curva ABC Fornecedores — `/financial/abc-fornecedores`
- [ ] Curva ABC Serviços — `/financial/abc-servicos`
- [ ] DAIA's — `/intervencoes`
- [ ] Debug PIX Assinatura — `/financial/billing-debug`
- [ ] DRE Contábil — `/financial/dre-contabil`
- [ ] EIA/RIMA — `/studies/eia-rima`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Espécies protegidas — `/studies/compensacao-ambiental/especies`
- [ ] Estudo de Cavidades — `/studies/cavidades`
- [ ] Estudos de Fauna — `/studies/fauna`
- [ ] Explorador de Arquivos — `/settings/files`
- [ ] Exportação Contábil — `/financial/export-contabil`
- [ ] Faturas — `/invoices`
- [ ] Fauna — `/fauna`
- [ ] Ferramentas MCP (lab) — `/ai-lab/mcp`
- [ ] Fluxo de Caixa Projetado — `/financial/fluxo-projetado`
- [ ] Fontes de Conhecimento (RAG) — `/knowledge-sources`
- [ ] Fornecedores — `/suppliers`
- [ ] IDE-SisemaNet — `/studies/ide-sisemanet`
- [ ] Identidade Visual — `/settings`
- [ ] Importação IA (legado local) — `/settings/ai-local-source`
- [ ] Informações da Empresa — `/settings/company`
- [ ] Integração OneDrive — `/settings/onedrive-integration`
- [ ] Intervenção em APP — `/studies/compensacao-ambiental/app`
- [ ] Inventário Florestal — `/studies/inventario`
- [ ] Laboratório RAG — `/ai-lab/rag`
- [ ] Lançamento Manual — `/monitoring/manual`
- [ ] Lançamentos de Caixa — `/cash-flow`
- [ ] LAS-RAS — `/studies/las-ras`
- [ ] Laudos — `/laudos`
- [ ] Licenças — `/licenses`
- [ ] Log de Auditoria — `/audit-log`
- [ ] Mapas — `/studies/mapas`
- [ ] Mata Atlântica — `/studies/compensacao-ambiental/mata-atlantica`
- [ ] MCP + RAG / Inteligência do Sistema — `/configuracoes/mcp-rag`
- [ ] Memorial Descritivo — `/studies/memorial-descritivo`
- [ ] Minerária — `/studies/compensacao-ambiental/mineraria`
- [ ] Minha Carteira — `/carteira`
- [ ] MTR-Declaração — `/mtr-declaracao`
- [ ] MTR-MG (resíduos) — `/studies/mtr`
- [ ] Nova outorga — `/studies/outorgas/new`
- [ ] Nova vistoria — `/inspections/new`
- [ ] Orçamento Anual — `/financial/orcamento`
- [ ] Orçamentos e Propostas — `/commercial-proposals`
- [ ] Outorgas — `/outorgas`
- [ ] Painel — `/`
- [ ] Painel Financeiro — `/financial/painel`
- [ ] Pasta do cliente — `/documentos-ambientais/pasta-cliente`
- [ ] PIA — `/studies/pia`
- [ ] Piscinão (off-stream) — `/studies/piscinao-off-stream`
- [ ] PRADA — `/studies/prada`
- [ ] Processos — `/studies/outorgas`
- [ ] Procuração — `/studies/procuracao`
- [ ] Programa de Ação Emergencial — `/studies/acao-emergencial`
- [ ] Programa de Educação Ambiental — `/studies/educacao-ambiental`
- [ ] Projeto técnico — `/studies/barragem`
- [ ] Projetos & ROI — `/financial/projetos-roi`
- [ ] PTRF — `/studies/ptrf`
- [ ] PTRF / PRAD — `/studies/relatorios-diversos/ptrf-prad`
- [ ] Reanálise — `/studies/reanalise`
- [ ] Relatórios de Campo — `/inspections/reports`
- [ ] Reserva Legal — `/studies/reserva-legal`
- [ ] Responsáveis Técnicos — `/technical-responsible`
- [ ] Segurança e emergência — `/studies/seguranca-barragens`
- [ ] SNUC — `/studies/compensacao-ambiental/snuc`
- [ ] Tabela de Serviços — `/services`
- [ ] TAC — Termo de Ajust. de Conduta — `/tacs`
- [ ] Telemetria (Real-time) — `/monitoring/telemetric`
- [ ] Templates — `/settings/templates`
- [ ] Transporte de resíduos — `/studies/relatorios-diversos/transporte-residuos`
- [ ] Usos Insignificantes — `/usos-insignificantes`
- [ ] Usuários — `/users`
- [ ] Visão geral — `/studies/barragens`
- [ ] Visão geral — `/studies/relatorios-diversos`
- [ ] Visão geral — `/studies/compensacao-ambiental`
- [ ] Webmail — `/external`

</details>

### Gestor (`gestor`)

Itens de menu visíveis: **63**

| Menu | Rota |
|------|------|
| /multas-defesas | `/multas-defesas` |
| /oficios | `/oficios` |
| Agenda | `/calendar` |
| Aparência | `/settings/appearance` |
| CAR | `/car` |
| Carvão vegetal | `/studies/relatorios-diversos/carvao-vegetal` |
| Coleta de campo | `/coleta-campo` |
| Condicionantes | `/compliance` |
| Consultar vistorias | `/inspections` |
| Consultas Técnicas | `/consultas` |
| CTF/IBAMA | `/ctf-ibama` |
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
| Intervenção em APP | `/studies/compensacao-ambiental/app` |
| Inventário Florestal | `/studies/inventario` |
| Lançamento Manual | `/monitoring/manual` |
| LAS-RAS | `/studies/las-ras` |
| Laudos | `/laudos` |
| Licenças | `/licenses` |
| Mapas | `/studies/mapas` |
| Mata Atlântica | `/studies/compensacao-ambiental/mata-atlantica` |
| Memorial Descritivo | `/studies/memorial-descritivo` |
| Minerária | `/studies/compensacao-ambiental/mineraria` |
| MTR-Declaração | `/mtr-declaracao` |
| MTR-MG (resíduos) | `/studies/mtr` |
| Nova outorga | `/studies/outorgas/new` |
| Nova vistoria | `/inspections/new` |
| Outorgas | `/outorgas` |
| Painel | `/` |
| Pasta do cliente | `/documentos-ambientais/pasta-cliente` |
| PIA | `/studies/pia` |
| Piscinão (off-stream) | `/studies/piscinao-off-stream` |
| PRADA | `/studies/prada` |
| Processos | `/studies/outorgas` |
| Procuração | `/studies/procuracao` |
| Programa de Ação Emergencial | `/studies/acao-emergencial` |
| Programa de Educação Ambiental | `/studies/educacao-ambiental` |
| Projeto técnico | `/studies/barragem` |
| PTRF | `/studies/ptrf` |
| PTRF / PRAD | `/studies/relatorios-diversos/ptrf-prad` |
| Reanálise | `/studies/reanalise` |
| Relatórios de Campo | `/inspections/reports` |
| Reserva Legal | `/studies/reserva-legal` |
| Responsáveis Técnicos | `/technical-responsible` |
| Segurança e emergência | `/studies/seguranca-barragens` |
| SNUC | `/studies/compensacao-ambiental/snuc` |
| TAC — Termo de Ajust. de Conduta | `/tacs` |
| Telemetria (Real-time) | `/monitoring/telemetric` |
| Transporte de resíduos | `/studies/relatorios-diversos/transporte-residuos` |
| Usos Insignificantes | `/usos-insignificantes` |
| Usuários | `/users` |
| Visão geral | `/studies/barragens` |
| Visão geral | `/studies/relatorios-diversos` |
| Visão geral | `/studies/compensacao-ambiental` |
| Webmail | `/external` |

<details>
<summary>Checklist copiável</summary>

- [ ] /multas-defesas — `/multas-defesas`
- [ ] /oficios — `/oficios`
- [ ] Agenda — `/calendar`
- [ ] Aparência — `/settings/appearance`
- [ ] CAR — `/car`
- [ ] Carvão vegetal — `/studies/relatorios-diversos/carvao-vegetal`
- [ ] Coleta de campo — `/coleta-campo`
- [ ] Condicionantes — `/compliance`
- [ ] Consultar vistorias — `/inspections`
- [ ] Consultas Técnicas — `/consultas`
- [ ] CTF/IBAMA — `/ctf-ibama`
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
- [ ] Intervenção em APP — `/studies/compensacao-ambiental/app`
- [ ] Inventário Florestal — `/studies/inventario`
- [ ] Lançamento Manual — `/monitoring/manual`
- [ ] LAS-RAS — `/studies/las-ras`
- [ ] Laudos — `/laudos`
- [ ] Licenças — `/licenses`
- [ ] Mapas — `/studies/mapas`
- [ ] Mata Atlântica — `/studies/compensacao-ambiental/mata-atlantica`
- [ ] Memorial Descritivo — `/studies/memorial-descritivo`
- [ ] Minerária — `/studies/compensacao-ambiental/mineraria`
- [ ] MTR-Declaração — `/mtr-declaracao`
- [ ] MTR-MG (resíduos) — `/studies/mtr`
- [ ] Nova outorga — `/studies/outorgas/new`
- [ ] Nova vistoria — `/inspections/new`
- [ ] Outorgas — `/outorgas`
- [ ] Painel — `/`
- [ ] Pasta do cliente — `/documentos-ambientais/pasta-cliente`
- [ ] PIA — `/studies/pia`
- [ ] Piscinão (off-stream) — `/studies/piscinao-off-stream`
- [ ] PRADA — `/studies/prada`
- [ ] Processos — `/studies/outorgas`
- [ ] Procuração — `/studies/procuracao`
- [ ] Programa de Ação Emergencial — `/studies/acao-emergencial`
- [ ] Programa de Educação Ambiental — `/studies/educacao-ambiental`
- [ ] Projeto técnico — `/studies/barragem`
- [ ] PTRF — `/studies/ptrf`
- [ ] PTRF / PRAD — `/studies/relatorios-diversos/ptrf-prad`
- [ ] Reanálise — `/studies/reanalise`
- [ ] Relatórios de Campo — `/inspections/reports`
- [ ] Reserva Legal — `/studies/reserva-legal`
- [ ] Responsáveis Técnicos — `/technical-responsible`
- [ ] Segurança e emergência — `/studies/seguranca-barragens`
- [ ] SNUC — `/studies/compensacao-ambiental/snuc`
- [ ] TAC — Termo de Ajust. de Conduta — `/tacs`
- [ ] Telemetria (Real-time) — `/monitoring/telemetric`
- [ ] Transporte de resíduos — `/studies/relatorios-diversos/transporte-residuos`
- [ ] Usos Insignificantes — `/usos-insignificantes`
- [ ] Usuários — `/users`
- [ ] Visão geral — `/studies/barragens`
- [ ] Visão geral — `/studies/relatorios-diversos`
- [ ] Visão geral — `/studies/compensacao-ambiental`
- [ ] Webmail — `/external`

</details>

### Supervisor (`supervisor`)

Itens de menu visíveis: **66**

| Menu | Rota |
|------|------|
| /multas-defesas | `/multas-defesas` |
| /oficios | `/oficios` |
| Agenda | `/calendar` |
| Aparência | `/settings/appearance` |
| Backup de Dados Apagados | `/settings/deleted-backups` |
| CAR | `/car` |
| Carvão vegetal | `/studies/relatorios-diversos/carvao-vegetal` |
| Coleta de campo | `/coleta-campo` |
| Condicionantes | `/compliance` |
| Consultar vistorias | `/inspections` |
| Consultas Técnicas | `/consultas` |
| CTF/IBAMA | `/ctf-ibama` |
| DAIA's | `/intervencoes` |
| Debug PIX Assinatura | `/financial/billing-debug` |
| EIA/RIMA | `/studies/eia-rima` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Espécies protegidas | `/studies/compensacao-ambiental/especies` |
| Estudo de Cavidades | `/studies/cavidades` |
| Estudos de Fauna | `/studies/fauna` |
| Fauna | `/fauna` |
| IDE-SisemaNet | `/studies/ide-sisemanet` |
| Intervenção em APP | `/studies/compensacao-ambiental/app` |
| Inventário Florestal | `/studies/inventario` |
| Lançamento Manual | `/monitoring/manual` |
| LAS-RAS | `/studies/las-ras` |
| Laudos | `/laudos` |
| Licenças | `/licenses` |
| Log de Auditoria | `/audit-log` |
| Mapas | `/studies/mapas` |
| Mata Atlântica | `/studies/compensacao-ambiental/mata-atlantica` |
| Memorial Descritivo | `/studies/memorial-descritivo` |
| Minerária | `/studies/compensacao-ambiental/mineraria` |
| MTR-Declaração | `/mtr-declaracao` |
| MTR-MG (resíduos) | `/studies/mtr` |
| Nova outorga | `/studies/outorgas/new` |
| Nova vistoria | `/inspections/new` |
| Outorgas | `/outorgas` |
| Painel | `/` |
| Pasta do cliente | `/documentos-ambientais/pasta-cliente` |
| PIA | `/studies/pia` |
| Piscinão (off-stream) | `/studies/piscinao-off-stream` |
| PRADA | `/studies/prada` |
| Processos | `/studies/outorgas` |
| Procuração | `/studies/procuracao` |
| Programa de Ação Emergencial | `/studies/acao-emergencial` |
| Programa de Educação Ambiental | `/studies/educacao-ambiental` |
| Projeto técnico | `/studies/barragem` |
| PTRF | `/studies/ptrf` |
| PTRF / PRAD | `/studies/relatorios-diversos/ptrf-prad` |
| Reanálise | `/studies/reanalise` |
| Relatórios de Campo | `/inspections/reports` |
| Reserva Legal | `/studies/reserva-legal` |
| Responsáveis Técnicos | `/technical-responsible` |
| Segurança e emergência | `/studies/seguranca-barragens` |
| SNUC | `/studies/compensacao-ambiental/snuc` |
| TAC — Termo de Ajust. de Conduta | `/tacs` |
| Telemetria (Real-time) | `/monitoring/telemetric` |
| Transporte de resíduos | `/studies/relatorios-diversos/transporte-residuos` |
| Usos Insignificantes | `/usos-insignificantes` |
| Usuários | `/users` |
| Visão geral | `/studies/barragens` |
| Visão geral | `/studies/relatorios-diversos` |
| Visão geral | `/studies/compensacao-ambiental` |
| Webmail | `/external` |

<details>
<summary>Checklist copiável</summary>

- [ ] /multas-defesas — `/multas-defesas`
- [ ] /oficios — `/oficios`
- [ ] Agenda — `/calendar`
- [ ] Aparência — `/settings/appearance`
- [ ] Backup de Dados Apagados — `/settings/deleted-backups`
- [ ] CAR — `/car`
- [ ] Carvão vegetal — `/studies/relatorios-diversos/carvao-vegetal`
- [ ] Coleta de campo — `/coleta-campo`
- [ ] Condicionantes — `/compliance`
- [ ] Consultar vistorias — `/inspections`
- [ ] Consultas Técnicas — `/consultas`
- [ ] CTF/IBAMA — `/ctf-ibama`
- [ ] DAIA's — `/intervencoes`
- [ ] Debug PIX Assinatura — `/financial/billing-debug`
- [ ] EIA/RIMA — `/studies/eia-rima`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Espécies protegidas — `/studies/compensacao-ambiental/especies`
- [ ] Estudo de Cavidades — `/studies/cavidades`
- [ ] Estudos de Fauna — `/studies/fauna`
- [ ] Fauna — `/fauna`
- [ ] IDE-SisemaNet — `/studies/ide-sisemanet`
- [ ] Intervenção em APP — `/studies/compensacao-ambiental/app`
- [ ] Inventário Florestal — `/studies/inventario`
- [ ] Lançamento Manual — `/monitoring/manual`
- [ ] LAS-RAS — `/studies/las-ras`
- [ ] Laudos — `/laudos`
- [ ] Licenças — `/licenses`
- [ ] Log de Auditoria — `/audit-log`
- [ ] Mapas — `/studies/mapas`
- [ ] Mata Atlântica — `/studies/compensacao-ambiental/mata-atlantica`
- [ ] Memorial Descritivo — `/studies/memorial-descritivo`
- [ ] Minerária — `/studies/compensacao-ambiental/mineraria`
- [ ] MTR-Declaração — `/mtr-declaracao`
- [ ] MTR-MG (resíduos) — `/studies/mtr`
- [ ] Nova outorga — `/studies/outorgas/new`
- [ ] Nova vistoria — `/inspections/new`
- [ ] Outorgas — `/outorgas`
- [ ] Painel — `/`
- [ ] Pasta do cliente — `/documentos-ambientais/pasta-cliente`
- [ ] PIA — `/studies/pia`
- [ ] Piscinão (off-stream) — `/studies/piscinao-off-stream`
- [ ] PRADA — `/studies/prada`
- [ ] Processos — `/studies/outorgas`
- [ ] Procuração — `/studies/procuracao`
- [ ] Programa de Ação Emergencial — `/studies/acao-emergencial`
- [ ] Programa de Educação Ambiental — `/studies/educacao-ambiental`
- [ ] Projeto técnico — `/studies/barragem`
- [ ] PTRF — `/studies/ptrf`
- [ ] PTRF / PRAD — `/studies/relatorios-diversos/ptrf-prad`
- [ ] Reanálise — `/studies/reanalise`
- [ ] Relatórios de Campo — `/inspections/reports`
- [ ] Reserva Legal — `/studies/reserva-legal`
- [ ] Responsáveis Técnicos — `/technical-responsible`
- [ ] Segurança e emergência — `/studies/seguranca-barragens`
- [ ] SNUC — `/studies/compensacao-ambiental/snuc`
- [ ] TAC — Termo de Ajust. de Conduta — `/tacs`
- [ ] Telemetria (Real-time) — `/monitoring/telemetric`
- [ ] Transporte de resíduos — `/studies/relatorios-diversos/transporte-residuos`
- [ ] Usos Insignificantes — `/usos-insignificantes`
- [ ] Usuários — `/users`
- [ ] Visão geral — `/studies/barragens`
- [ ] Visão geral — `/studies/relatorios-diversos`
- [ ] Visão geral — `/studies/compensacao-ambiental`
- [ ] Webmail — `/external`

</details>

### Técnico (`technical`)

Itens de menu visíveis: **62**

| Menu | Rota |
|------|------|
| /multas-defesas | `/multas-defesas` |
| /oficios | `/oficios` |
| Agenda | `/calendar` |
| Aparência | `/settings/appearance` |
| CAR | `/car` |
| Carvão vegetal | `/studies/relatorios-diversos/carvao-vegetal` |
| Coleta de campo | `/coleta-campo` |
| Condicionantes | `/compliance` |
| Consultar vistorias | `/inspections` |
| Consultas Técnicas | `/consultas` |
| CTF/IBAMA | `/ctf-ibama` |
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
| Intervenção em APP | `/studies/compensacao-ambiental/app` |
| Inventário Florestal | `/studies/inventario` |
| Lançamento Manual | `/monitoring/manual` |
| LAS-RAS | `/studies/las-ras` |
| Laudos | `/laudos` |
| Licenças | `/licenses` |
| Mapas | `/studies/mapas` |
| Mata Atlântica | `/studies/compensacao-ambiental/mata-atlantica` |
| Memorial Descritivo | `/studies/memorial-descritivo` |
| Minerária | `/studies/compensacao-ambiental/mineraria` |
| MTR-Declaração | `/mtr-declaracao` |
| MTR-MG (resíduos) | `/studies/mtr` |
| Nova outorga | `/studies/outorgas/new` |
| Nova vistoria | `/inspections/new` |
| Outorgas | `/outorgas` |
| Painel | `/` |
| Pasta do cliente | `/documentos-ambientais/pasta-cliente` |
| PIA | `/studies/pia` |
| Piscinão (off-stream) | `/studies/piscinao-off-stream` |
| PRADA | `/studies/prada` |
| Processos | `/studies/outorgas` |
| Procuração | `/studies/procuracao` |
| Programa de Ação Emergencial | `/studies/acao-emergencial` |
| Programa de Educação Ambiental | `/studies/educacao-ambiental` |
| Projeto técnico | `/studies/barragem` |
| PTRF | `/studies/ptrf` |
| PTRF / PRAD | `/studies/relatorios-diversos/ptrf-prad` |
| Reanálise | `/studies/reanalise` |
| Relatórios de Campo | `/inspections/reports` |
| Reserva Legal | `/studies/reserva-legal` |
| Segurança e emergência | `/studies/seguranca-barragens` |
| SNUC | `/studies/compensacao-ambiental/snuc` |
| TAC — Termo de Ajust. de Conduta | `/tacs` |
| Telemetria (Real-time) | `/monitoring/telemetric` |
| Transporte de resíduos | `/studies/relatorios-diversos/transporte-residuos` |
| Usos Insignificantes | `/usos-insignificantes` |
| Usuários | `/users` |
| Visão geral | `/studies/barragens` |
| Visão geral | `/studies/relatorios-diversos` |
| Visão geral | `/studies/compensacao-ambiental` |
| Webmail | `/external` |

<details>
<summary>Checklist copiável</summary>

- [ ] /multas-defesas — `/multas-defesas`
- [ ] /oficios — `/oficios`
- [ ] Agenda — `/calendar`
- [ ] Aparência — `/settings/appearance`
- [ ] CAR — `/car`
- [ ] Carvão vegetal — `/studies/relatorios-diversos/carvao-vegetal`
- [ ] Coleta de campo — `/coleta-campo`
- [ ] Condicionantes — `/compliance`
- [ ] Consultar vistorias — `/inspections`
- [ ] Consultas Técnicas — `/consultas`
- [ ] CTF/IBAMA — `/ctf-ibama`
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
- [ ] Intervenção em APP — `/studies/compensacao-ambiental/app`
- [ ] Inventário Florestal — `/studies/inventario`
- [ ] Lançamento Manual — `/monitoring/manual`
- [ ] LAS-RAS — `/studies/las-ras`
- [ ] Laudos — `/laudos`
- [ ] Licenças — `/licenses`
- [ ] Mapas — `/studies/mapas`
- [ ] Mata Atlântica — `/studies/compensacao-ambiental/mata-atlantica`
- [ ] Memorial Descritivo — `/studies/memorial-descritivo`
- [ ] Minerária — `/studies/compensacao-ambiental/mineraria`
- [ ] MTR-Declaração — `/mtr-declaracao`
- [ ] MTR-MG (resíduos) — `/studies/mtr`
- [ ] Nova outorga — `/studies/outorgas/new`
- [ ] Nova vistoria — `/inspections/new`
- [ ] Outorgas — `/outorgas`
- [ ] Painel — `/`
- [ ] Pasta do cliente — `/documentos-ambientais/pasta-cliente`
- [ ] PIA — `/studies/pia`
- [ ] Piscinão (off-stream) — `/studies/piscinao-off-stream`
- [ ] PRADA — `/studies/prada`
- [ ] Processos — `/studies/outorgas`
- [ ] Procuração — `/studies/procuracao`
- [ ] Programa de Ação Emergencial — `/studies/acao-emergencial`
- [ ] Programa de Educação Ambiental — `/studies/educacao-ambiental`
- [ ] Projeto técnico — `/studies/barragem`
- [ ] PTRF — `/studies/ptrf`
- [ ] PTRF / PRAD — `/studies/relatorios-diversos/ptrf-prad`
- [ ] Reanálise — `/studies/reanalise`
- [ ] Relatórios de Campo — `/inspections/reports`
- [ ] Reserva Legal — `/studies/reserva-legal`
- [ ] Segurança e emergência — `/studies/seguranca-barragens`
- [ ] SNUC — `/studies/compensacao-ambiental/snuc`
- [ ] TAC — Termo de Ajust. de Conduta — `/tacs`
- [ ] Telemetria (Real-time) — `/monitoring/telemetric`
- [ ] Transporte de resíduos — `/studies/relatorios-diversos/transporte-residuos`
- [ ] Usos Insignificantes — `/usos-insignificantes`
- [ ] Usuários — `/users`
- [ ] Visão geral — `/studies/barragens`
- [ ] Visão geral — `/studies/relatorios-diversos`
- [ ] Visão geral — `/studies/compensacao-ambiental`
- [ ] Webmail — `/external`

</details>

### Vendas (`sales`)

Itens de menu visíveis: **14**

| Menu | Rota |
|------|------|
| /oficios | `/oficios` |
| Agenda | `/calendar` |
| Aparência | `/settings/appearance` |
| Clientes | `/clients` |
| Contratos | `/contracts` |
| Contratos-Fornecedores | `/contracts-suppliers` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Orçamentos e Propostas | `/commercial-proposals` |
| Painel | `/` |
| Projetos & ROI | `/financial/projetos-roi` |
| Usuários | `/users` |
| Webmail | `/external` |

<details>
<summary>Checklist copiável</summary>

- [ ] /oficios — `/oficios`
- [ ] Agenda — `/calendar`
- [ ] Aparência — `/settings/appearance`
- [ ] Clientes — `/clients`
- [ ] Contratos — `/contracts`
- [ ] Contratos-Fornecedores — `/contracts-suppliers`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Orçamentos e Propostas — `/commercial-proposals`
- [ ] Painel — `/`
- [ ] Projetos & ROI — `/financial/projetos-roi`
- [ ] Usuários — `/users`
- [ ] Webmail — `/external`

</details>

### Financeiro (`financial`)

Itens de menu visíveis: **34**

| Menu | Rota |
|------|------|
| /oficios | `/oficios` |
| Acesso Bancário | `/bank-access` |
| Agenda | `/calendar` |
| Aparência | `/settings/appearance` |
| Assistente Financeiro (IA) | `/studies/assistant` |
| Bens e Patrimônio | `/financial/bens-patrimonio` |
| Clientes | `/clients` |
| Conciliação Bancária | `/financial/conciliacao` |
| Consultas Técnicas | `/consultas` |
| Contratos | `/contracts` |
| Contratos Plataforma | `/financial/platform-subscription-contracts` |
| Contratos-Fornecedores | `/contracts-suppliers` |
| Curva ABC | `/financial/abc-curve` |
| Curva ABC Fornecedores | `/financial/abc-fornecedores` |
| Curva ABC Serviços | `/financial/abc-servicos` |
| Debug PIX Assinatura | `/financial/billing-debug` |
| DRE Contábil | `/financial/dre-contabil` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Exportação Contábil | `/financial/export-contabil` |
| Faturas | `/invoices` |
| Fluxo de Caixa Projetado | `/financial/fluxo-projetado` |
| Fornecedores | `/suppliers` |
| Lançamentos de Caixa | `/cash-flow` |
| Orçamento Anual | `/financial/orcamento` |
| Orçamentos e Propostas | `/commercial-proposals` |
| Painel | `/` |
| Painel Financeiro | `/financial/painel` |
| Pasta do cliente | `/documentos-ambientais/pasta-cliente` |
| Projetos & ROI | `/financial/projetos-roi` |
| Tabela de Serviços | `/services` |
| Usuários | `/users` |
| Webmail | `/external` |

<details>
<summary>Checklist copiável</summary>

- [ ] /oficios — `/oficios`
- [ ] Acesso Bancário — `/bank-access`
- [ ] Agenda — `/calendar`
- [ ] Aparência — `/settings/appearance`
- [ ] Assistente Financeiro (IA) — `/studies/assistant`
- [ ] Bens e Patrimônio — `/financial/bens-patrimonio`
- [ ] Clientes — `/clients`
- [ ] Conciliação Bancária — `/financial/conciliacao`
- [ ] Consultas Técnicas — `/consultas`
- [ ] Contratos — `/contracts`
- [ ] Contratos Plataforma — `/financial/platform-subscription-contracts`
- [ ] Contratos-Fornecedores — `/contracts-suppliers`
- [ ] Curva ABC — `/financial/abc-curve`
- [ ] Curva ABC Fornecedores — `/financial/abc-fornecedores`
- [ ] Curva ABC Serviços — `/financial/abc-servicos`
- [ ] Debug PIX Assinatura — `/financial/billing-debug`
- [ ] DRE Contábil — `/financial/dre-contabil`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Exportação Contábil — `/financial/export-contabil`
- [ ] Faturas — `/invoices`
- [ ] Fluxo de Caixa Projetado — `/financial/fluxo-projetado`
- [ ] Fornecedores — `/suppliers`
- [ ] Lançamentos de Caixa — `/cash-flow`
- [ ] Orçamento Anual — `/financial/orcamento`
- [ ] Orçamentos e Propostas — `/commercial-proposals`
- [ ] Painel — `/`
- [ ] Painel Financeiro — `/financial/painel`
- [ ] Pasta do cliente — `/documentos-ambientais/pasta-cliente`
- [ ] Projetos & ROI — `/financial/projetos-roi`
- [ ] Tabela de Serviços — `/services`
- [ ] Usuários — `/users`
- [ ] Webmail — `/external`

</details>

### Cliente Gestão (`client`)

Itens de menu visíveis: **24**

| Menu | Rota |
|------|------|
| /oficios | `/oficios` |
| Agenda | `/calendar` |
| Aparência | `/settings/appearance` |
| CAR | `/car` |
| Condicionantes | `/compliance` |
| Contratos | `/contracts` |
| CTF/IBAMA | `/ctf-ibama` |
| DAIA's | `/intervencoes` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Faturas | `/invoices` |
| Fauna | `/fauna` |
| Lançamento Manual | `/monitoring/manual` |
| Licenças | `/licenses` |
| Minha Carteira | `/carteira` |
| MTR-Declaração | `/mtr-declaracao` |
| Orçamentos e Propostas | `/commercial-proposals` |
| Outorgas | `/outorgas` |
| Painel | `/` |
| TAC — Termo de Ajust. de Conduta | `/tacs` |
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
- [ ] Contratos — `/contracts`
- [ ] CTF/IBAMA — `/ctf-ibama`
- [ ] DAIA's — `/intervencoes`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Faturas — `/invoices`
- [ ] Fauna — `/fauna`
- [ ] Lançamento Manual — `/monitoring/manual`
- [ ] Licenças — `/licenses`
- [ ] Minha Carteira — `/carteira`
- [ ] MTR-Declaração — `/mtr-declaracao`
- [ ] Orçamentos e Propostas — `/commercial-proposals`
- [ ] Outorgas — `/outorgas`
- [ ] Painel — `/`
- [ ] TAC — Termo de Ajust. de Conduta — `/tacs`
- [ ] Telemetria (Real-time) — `/monitoring/telemetric`
- [ ] Usos Insignificantes — `/usos-insignificantes`
- [ ] Usuários — `/users`

</details>

### Cliente Autônomo (`cliente_autonomo`)

Itens de menu visíveis: **22**

| Menu | Rota |
|------|------|
| /oficios | `/oficios` |
| Agenda | `/calendar` |
| Aparência | `/settings/appearance` |
| CAR | `/car` |
| Condicionantes | `/compliance` |
| CTF/IBAMA | `/ctf-ibama` |
| DAIA's | `/intervencoes` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Fauna | `/fauna` |
| Lançamento Manual | `/monitoring/manual` |
| Licenças | `/licenses` |
| Minha Carteira | `/carteira` |
| MTR-Declaração | `/mtr-declaracao` |
| Orçamentos e Propostas | `/commercial-proposals` |
| Outorgas | `/outorgas` |
| Painel | `/` |
| TAC — Termo de Ajust. de Conduta | `/tacs` |
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
- [ ] CTF/IBAMA — `/ctf-ibama`
- [ ] DAIA's — `/intervencoes`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Fauna — `/fauna`
- [ ] Lançamento Manual — `/monitoring/manual`
- [ ] Licenças — `/licenses`
- [ ] Minha Carteira — `/carteira`
- [ ] MTR-Declaração — `/mtr-declaracao`
- [ ] Orçamentos e Propostas — `/commercial-proposals`
- [ ] Outorgas — `/outorgas`
- [ ] Painel — `/`
- [ ] TAC — Termo de Ajust. de Conduta — `/tacs`
- [ ] Telemetria (Real-time) — `/monitoring/telemetric`
- [ ] Usos Insignificantes — `/usos-insignificantes`
- [ ] Usuários — `/users`

</details>

### Representante (`representative`)

Itens de menu visíveis: **22**

| Menu | Rota |
|------|------|
| Agenda | `/calendar` |
| Aparência | `/settings/appearance` |
| CAR | `/car` |
| Condicionantes | `/compliance` |
| Contratos | `/contracts` |
| CTF/IBAMA | `/ctf-ibama` |
| DAIA's | `/intervencoes` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Faturas | `/invoices` |
| Fauna | `/fauna` |
| Lançamento Manual | `/monitoring/manual` |
| Licenças | `/licenses` |
| MTR-Declaração | `/mtr-declaracao` |
| Orçamentos e Propostas | `/commercial-proposals` |
| Outorgas | `/outorgas` |
| Painel | `/` |
| TAC — Termo de Ajust. de Conduta | `/tacs` |
| Telemetria (Real-time) | `/monitoring/telemetric` |
| Usos Insignificantes | `/usos-insignificantes` |
| Usuários | `/users` |

<details>
<summary>Checklist copiável</summary>

- [ ] Agenda — `/calendar`
- [ ] Aparência — `/settings/appearance`
- [ ] CAR — `/car`
- [ ] Condicionantes — `/compliance`
- [ ] Contratos — `/contracts`
- [ ] CTF/IBAMA — `/ctf-ibama`
- [ ] DAIA's — `/intervencoes`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Faturas — `/invoices`
- [ ] Fauna — `/fauna`
- [ ] Lançamento Manual — `/monitoring/manual`
- [ ] Licenças — `/licenses`
- [ ] MTR-Declaração — `/mtr-declaracao`
- [ ] Orçamentos e Propostas — `/commercial-proposals`
- [ ] Outorgas — `/outorgas`
- [ ] Painel — `/`
- [ ] TAC — Termo de Ajust. de Conduta — `/tacs`
- [ ] Telemetria (Real-time) — `/monitoring/telemetric`
- [ ] Usos Insignificantes — `/usos-insignificantes`
- [ ] Usuários — `/users`

</details>

### Diretor Fauna (`diretor_fauna`)

Itens de menu visíveis: **20**

| Menu | Rota |
|------|------|
| /oficios | `/oficios` |
| Agenda | `/calendar` |
| Aparência | `/settings/appearance` |
| Carvão vegetal | `/studies/relatorios-diversos/carvao-vegetal` |
| Coleta de campo | `/coleta-campo` |
| Empreendedores | `/empreendedores` |
| Empreendimentos | `/projects` |
| Empresas | `/responsible-company` |
| Estudo de Cavidades | `/studies/cavidades` |
| Estudos de Fauna | `/studies/fauna` |
| Fauna | `/fauna` |
| Memorial Descritivo | `/studies/memorial-descritivo` |
| Painel | `/` |
| Programa de Ação Emergencial | `/studies/acao-emergencial` |
| Programa de Educação Ambiental | `/studies/educacao-ambiental` |
| PTRF / PRAD | `/studies/relatorios-diversos/ptrf-prad` |
| Transporte de resíduos | `/studies/relatorios-diversos/transporte-residuos` |
| Usuários | `/users` |
| Visão geral | `/studies/relatorios-diversos` |
| Webmail | `/external` |

<details>
<summary>Checklist copiável</summary>

- [ ] /oficios — `/oficios`
- [ ] Agenda — `/calendar`
- [ ] Aparência — `/settings/appearance`
- [ ] Carvão vegetal — `/studies/relatorios-diversos/carvao-vegetal`
- [ ] Coleta de campo — `/coleta-campo`
- [ ] Empreendedores — `/empreendedores`
- [ ] Empreendimentos — `/projects`
- [ ] Empresas — `/responsible-company`
- [ ] Estudo de Cavidades — `/studies/cavidades`
- [ ] Estudos de Fauna — `/studies/fauna`
- [ ] Fauna — `/fauna`
- [ ] Memorial Descritivo — `/studies/memorial-descritivo`
- [ ] Painel — `/`
- [ ] Programa de Ação Emergencial — `/studies/acao-emergencial`
- [ ] Programa de Educação Ambiental — `/studies/educacao-ambiental`
- [ ] PTRF / PRAD — `/studies/relatorios-diversos/ptrf-prad`
- [ ] Transporte de resíduos — `/studies/relatorios-diversos/transporte-residuos`
- [ ] Usuários — `/users`
- [ ] Visão geral — `/studies/relatorios-diversos`
- [ ] Webmail — `/external`

</details>

### Advogado (`advogado`)

Itens de menu visíveis: **58**

| Menu | Rota |
|------|------|
| /multas-defesas | `/multas-defesas` |
| /oficios | `/oficios` |
| Agenda | `/calendar` |
| Aparência | `/settings/appearance` |
| CAR | `/car` |
| Carvão vegetal | `/studies/relatorios-diversos/carvao-vegetal` |
| Condicionantes | `/compliance` |
| Consultar vistorias | `/inspections` |
| CTF/IBAMA | `/ctf-ibama` |
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
| Intervenção em APP | `/studies/compensacao-ambiental/app` |
| Inventário Florestal | `/studies/inventario` |
| Lançamento Manual | `/monitoring/manual` |
| LAS-RAS | `/studies/las-ras` |
| Licenças | `/licenses` |
| Mapas | `/studies/mapas` |
| Mata Atlântica | `/studies/compensacao-ambiental/mata-atlantica` |
| Memorial Descritivo | `/studies/memorial-descritivo` |
| Minerária | `/studies/compensacao-ambiental/mineraria` |
| MTR-Declaração | `/mtr-declaracao` |
| MTR-MG (resíduos) | `/studies/mtr` |
| Nova outorga | `/studies/outorgas/new` |
| Nova vistoria | `/inspections/new` |
| Outorgas | `/outorgas` |
| Painel | `/` |
| PIA | `/studies/pia` |
| Piscinão (off-stream) | `/studies/piscinao-off-stream` |
| PRADA | `/studies/prada` |
| Processos | `/studies/outorgas` |
| Procuração | `/studies/procuracao` |
| Programa de Ação Emergencial | `/studies/acao-emergencial` |
| Programa de Educação Ambiental | `/studies/educacao-ambiental` |
| Projeto técnico | `/studies/barragem` |
| PTRF | `/studies/ptrf` |
| PTRF / PRAD | `/studies/relatorios-diversos/ptrf-prad` |
| Reanálise | `/studies/reanalise` |
| Relatórios de Campo | `/inspections/reports` |
| Reserva Legal | `/studies/reserva-legal` |
| Segurança e emergência | `/studies/seguranca-barragens` |
| SNUC | `/studies/compensacao-ambiental/snuc` |
| TAC — Termo de Ajust. de Conduta | `/tacs` |
| Telemetria (Real-time) | `/monitoring/telemetric` |
| Transporte de resíduos | `/studies/relatorios-diversos/transporte-residuos` |
| Usos Insignificantes | `/usos-insignificantes` |
| Usuários | `/users` |
| Visão geral | `/studies/barragens` |
| Visão geral | `/studies/relatorios-diversos` |
| Visão geral | `/studies/compensacao-ambiental` |
| Webmail | `/external` |

<details>
<summary>Checklist copiável</summary>

- [ ] /multas-defesas — `/multas-defesas`
- [ ] /oficios — `/oficios`
- [ ] Agenda — `/calendar`
- [ ] Aparência — `/settings/appearance`
- [ ] CAR — `/car`
- [ ] Carvão vegetal — `/studies/relatorios-diversos/carvao-vegetal`
- [ ] Condicionantes — `/compliance`
- [ ] Consultar vistorias — `/inspections`
- [ ] CTF/IBAMA — `/ctf-ibama`
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
- [ ] Intervenção em APP — `/studies/compensacao-ambiental/app`
- [ ] Inventário Florestal — `/studies/inventario`
- [ ] Lançamento Manual — `/monitoring/manual`
- [ ] LAS-RAS — `/studies/las-ras`
- [ ] Licenças — `/licenses`
- [ ] Mapas — `/studies/mapas`
- [ ] Mata Atlântica — `/studies/compensacao-ambiental/mata-atlantica`
- [ ] Memorial Descritivo — `/studies/memorial-descritivo`
- [ ] Minerária — `/studies/compensacao-ambiental/mineraria`
- [ ] MTR-Declaração — `/mtr-declaracao`
- [ ] MTR-MG (resíduos) — `/studies/mtr`
- [ ] Nova outorga — `/studies/outorgas/new`
- [ ] Nova vistoria — `/inspections/new`
- [ ] Outorgas — `/outorgas`
- [ ] Painel — `/`
- [ ] PIA — `/studies/pia`
- [ ] Piscinão (off-stream) — `/studies/piscinao-off-stream`
- [ ] PRADA — `/studies/prada`
- [ ] Processos — `/studies/outorgas`
- [ ] Procuração — `/studies/procuracao`
- [ ] Programa de Ação Emergencial — `/studies/acao-emergencial`
- [ ] Programa de Educação Ambiental — `/studies/educacao-ambiental`
- [ ] Projeto técnico — `/studies/barragem`
- [ ] PTRF — `/studies/ptrf`
- [ ] PTRF / PRAD — `/studies/relatorios-diversos/ptrf-prad`
- [ ] Reanálise — `/studies/reanalise`
- [ ] Relatórios de Campo — `/inspections/reports`
- [ ] Reserva Legal — `/studies/reserva-legal`
- [ ] Segurança e emergência — `/studies/seguranca-barragens`
- [ ] SNUC — `/studies/compensacao-ambiental/snuc`
- [ ] TAC — Termo de Ajust. de Conduta — `/tacs`
- [ ] Telemetria (Real-time) — `/monitoring/telemetric`
- [ ] Transporte de resíduos — `/studies/relatorios-diversos/transporte-residuos`
- [ ] Usos Insignificantes — `/usos-insignificantes`
- [ ] Usuários — `/users`
- [ ] Visão geral — `/studies/barragens`
- [ ] Visão geral — `/studies/relatorios-diversos`
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
