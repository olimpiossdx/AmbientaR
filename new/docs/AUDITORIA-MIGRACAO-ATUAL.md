# Auditoria executável da migração

Gerar com `npm run migration:audit` em `new`. API padrão: projeto irmão `ambientaR-api`; alternativa: `AMBIENTAR_API_PATH`.

301 páginas e 157 rotas de API no legado. 188 funcionalidades catalogadas; 1 com status concluído. 11/267 padrões de rota com implementação declarada. 67 endpoints declarados na API; 0 imports proibidos no frontend.

Contagem de rotas não é contagem de funcionalidades migradas. Dados e evidências por funcionalidade, contratos e endpoints: [migration-audit.json](migration-audit.json).

| Funcionalidade | Nome | Onda | Estado | Rotas concretas/esperadas |
| --- | --- | --- | --- | --- |
| FUN-AUTH-001 | Login | 1 | done | 1/1 |
| FUN-AUTH-002 | Cadastro | 1 | pending | 1/1 |
| FUN-AUTH-003 | Recuperar senha | 1 | pending | 1/1 |
| FUN-AUTH-004 | Política de privacidade | 1 | pending | 1/1 |
| FUN-AUTH-005 | Estado offline | 1 | pending | 1/1 |
| FUN-AUTH-006 | Sessão | 1 | pending | 1/1 |
| FUN-CORE-001 | Painel | 2 | in_progress | 1/1 |
| FUN-CORE-002 | Minha Carteira | 3 | pending | 0/2 |
| FUN-FIN-001 | Acesso Bancário | 6 | pending | 0/1 |
| FUN-FIN-002 | Clientes | 6 | pending | 0/3 |
| FUN-FIN-003 | Contratos | 6 | pending | 0/3 |
| FUN-FIN-004 | Contratos da Plataforma | 6 | pending | 0/1 |
| FUN-FIN-005 | Contratos de Fornecedores | 6 | pending | 0/1 |
| FUN-FIN-006 | Curva ABC de Clientes | 6 | pending | 0/1 |
| FUN-FIN-007 | Bens e Patrimônio | 6 | pending | 0/3 |
| FUN-FIN-008 | DRE Contábil | 6 | pending | 0/1 |
| FUN-FIN-009 | Faturas | 6 | pending | 0/3 |
| FUN-FIN-010 | Fornecedores | 6 | pending | 0/3 |
| FUN-FIN-011 | Lançamentos de Caixa | 6 | pending | 0/3 |
| FUN-FIN-012 | NFe Eletrônica | 6 | pending | 0/1 |
| FUN-FIN-013 | Orçamentos | 6 | pending | 0/3 |
| FUN-FIN-014 | Orçamentos e Propostas Comerciais | 6 | pending | 0/3 |
| FUN-FIN-015 | Painel Financeiro | 6 | pending | 0/1 |
| FUN-FIN-016 | Projetos e ROI | 6 | pending | 0/2 |
| FUN-FIN-017 | Fluxo de Caixa Projetado | 6 | pending | 0/1 |
| FUN-FIN-018 | Conciliação Bancária | 6 | pending | 0/1 |
| FUN-FIN-019 | Diagnóstico PIX | 6 | pending | 0/1 |
| FUN-FIN-020 | Curva ABC de Serviços | 6 | pending | 0/1 |
| FUN-FIN-021 | Curva ABC de Fornecedores | 6 | pending | 0/1 |
| FUN-FIN-022 | Orçamento Anual | 6 | pending | 0/1 |
| FUN-FIN-023 | Exportação Contábil | 6 | pending | 0/1 |
| FUN-FIN-024 | Assistente Financeiro | 6 | pending | 0/1 |
| FUN-FIN-025 | Tabela de Serviços | 6 | pending | 0/3 |
| FUN-CAD-001 | Usuários | 2 | in_progress | 1/1 |
| FUN-CAD-002 | Empreendedores | 3 | in_progress | 3/3 |
| FUN-CAD-003 | Empreendimentos | 3 | pending | 0/3 |
| FUN-CAD-004 | Empresas | 3 | pending | 0/3 |
| FUN-DOC-001 | CAR | 4 | pending | 0/1 |
| FUN-DOC-002 | Condicionantes | 4 | pending | 0/1 |
| FUN-DOC-003 | CTF/IBAMA | 4 | pending | 0/1 |
| FUN-DOC-004 | DAIA | 4 | pending | 0/1 |
| FUN-DOC-005 | Fauna documental | 4 | pending | 0/1 |
| FUN-DOC-006 | Licenças | 4 | pending | 0/3 |
| FUN-DOC-007 | TAC | 4 | pending | 0/3 |
| FUN-DOC-008 | MTR Declaração | 4 | pending | 0/1 |
| FUN-DOC-009 | Pasta do cliente | 4 | pending | 0/1 |
| FUN-DOC-010 | Monitoramento manual | 4 | pending | 0/1 |
| FUN-DOC-011 | Telemetria | 4 | pending | 0/1 |
| FUN-DOC-012 | Outorgas | 4 | pending | 0/3 |
| FUN-DOC-013 | Usos Insignificantes | 4 | pending | 0/1 |
| FUN-LEG-001 | Multas e Defesas / Consultar | 5 | pending | 0/2 |
| FUN-LEG-002 | Multas e Defesas / Nova | 5 | pending | 0/1 |
| FUN-VIS-001 | Vistoria / Consultar | 5 | pending | 0/2 |
| FUN-VIS-002 | Vistoria / Nova | 5 | pending | 0/1 |
| FUN-VIS-003 | Vistoria / Relatórios de Campo | 5 | pending | 0/1 |
| FUN-LIC-001 | Licenciamento / Trâmites | 5 | pending | 0/2 |
| FUN-LIC-002 | Licenciamento / Nova solicitação | 5 | pending | 0/1 |
| FUN-LIC-003 | Licenciamento / AIA | 5 | pending | 0/1 |
| FUN-PRO-001 | Processos / Projetos | 5 | pending | 0/2 |
| FUN-PRO-002 | Processos / Fluxo | 5 | pending | 0/1 |
| FUN-PRO-003 | Processos / Tarefas | 5 | pending | 0/1 |
| FUN-PRO-004 | Processos / Indicadores / Resumo | 5 | pending | 0/1 |
| FUN-PRO-005 | Processos / Indicadores / Análise | 5 | pending | 0/1 |
| FUN-PRO-006 | Processos / Planilha | 5 | pending | 0/1 |
| FUN-IA-001 | Águas / MIRA | 12 | pending | 0/1 |
| FUN-IA-002 | Análise Geoespacial | 12 | pending | 0/1 |
| FUN-IA-003 | Análise Socioambiental | 12 | pending | 0/1 |
| FUN-IA-004 | Cruzamento de dados | 12 | pending | 0/1 |
| FUN-IA-005 | Legislação e estudos | 12 | pending | 0/1 |
| FUN-IA-006 | Relatórios de IA | 12 | pending | 0/1 |
| FUN-IA-007 | Síntese de texto | 12 | pending | 0/1 |
| FUN-IA-008 | Automações IA | 12 | pending | 0/1 |
| FUN-IA-009 | Hub IA | 12 | pending | 0/1 |
| FUN-FAD-001 | FAD / Início | 12 | pending | 0/1 |
| FUN-FAD-002 | FAD / Montar acervo | 12 | pending | 0/1 |
| FUN-FAD-003 | FAD / Biblioteca | 12 | pending | 0/1 |
| FUN-FAD-004 | FAD / Linha do tempo | 12 | pending | 0/1 |
| FUN-FAD-005 | FAD / Comparar | 12 | pending | 0/1 |
| FUN-FAD-006 | FAD / Evidências | 12 | pending | 0/1 |
| FUN-FAD-007 | FAD / Inteligência | 12 | pending | 0/1 |
| FUN-FAD-008 | FAD / Fiscalização | 12 | pending | 0/1 |
| FUN-FAD-009 | FAD / Relatórios | 12 | pending | 0/1 |
| FUN-FAD-010 | FAD / Monitoramento | 12 | pending | 0/1 |
| FUN-FAD-011 | FAD / Auditoria ESG | 12 | pending | 0/1 |
| FUN-FAD-012 | FAD / Configurações | 12 | pending | 0/1 |
| FUN-FAD-013 | FAD / Novo workspace | 12 | pending | 0/1 |
| FUN-FAD-014 | FAD / Workspace | 12 | pending | 0/1 |
| FUN-EST-001 | Programa de Educação Ambiental | 8 | pending | 0/5 |
| FUN-EST-002 | Programa de Ação Emergencial | 8 | pending | 0/1 |
| FUN-EST-003 | EIA/RIMA | 8 | pending | 0/3 |
| FUN-EST-004 | Estudo de Cavidades | 8 | pending | 0/3 |
| FUN-EST-005 | Estudos de Fauna / Hub | 9 | pending | 0/1 |
| FUN-EST-006 | Fauna / Inventário | 9 | pending | 0/2 |
| FUN-EST-007 | Fauna / Relatório de Inventário | 9 | pending | 0/2 |
| FUN-EST-008 | Fauna / Monitoramento | 9 | pending | 0/2 |
| FUN-EST-009 | Fauna / Relatório de Monitoramento | 9 | pending | 0/2 |
| FUN-EST-010 | Fauna / Resgate | 9 | pending | 0/2 |
| FUN-EST-011 | Fauna / Relatório de Resgate | 9 | pending | 0/2 |
| FUN-EST-012 | IDE-SisemaNet | 9 | pending | 0/1 |
| FUN-EST-013 | Inventário Florestal / Lista | 9 | pending | 0/2 |
| FUN-EST-014 | Inventário / Árvores | 9 | pending | 0/1 |
| FUN-EST-015 | Inventário / Parcelas | 9 | pending | 0/1 |
| FUN-EST-016 | Inventário / Espécies | 9 | pending | 0/1 |
| FUN-EST-017 | Inventário / Fórmulas | 9 | pending | 0/1 |
| FUN-EST-018 | Inventário / Calculadora e Resultado | 9 | pending | 0/2 |
| FUN-EST-019 | Coleta de Campo | 9 | pending | 0/4 |
| FUN-EST-020 | LAS-RAS | 8 | pending | 0/3 |
| FUN-EST-021 | Reanálise | 8 | pending | 0/3 |
| FUN-EST-022 | Procuração | 8 | pending | 0/3 |
| FUN-EST-023 | Mapas | 8 | pending | 0/1 |
| FUN-EST-024 | Memorial Descritivo | 8 | pending | 0/1 |
| FUN-EST-025 | Outorgas / Processos | 8 | pending | 0/3 |
| FUN-EST-026 | Outorgas / Nova | 8 | pending | 0/1 |
| FUN-EST-027 | PCA / Lista | 8 | pending | 0/2 |
| FUN-EST-028 | PCA / Listagens A–H | 8 | pending | 0/1 |
| FUN-EST-029 | PIA | 8 | pending | 0/3 |
| FUN-EST-030 | PRADA | 8 | pending | 0/3 |
| FUN-EST-031 | Barragens / Visão geral | 10 | pending | 0/1 |
| FUN-EST-032 | Barragens / Projeto técnico | 10 | pending | 0/3 |
| FUN-EST-033 | Barragens / Segurança e emergência | 10 | pending | 0/3 |
| FUN-EST-034 | Barragens / Piscinão | 10 | pending | 0/3 |
| FUN-EST-035 | PTRF | 10 | pending | 0/3 |
| FUN-EST-036 | RCA / Lista | 10 | pending | 0/2 |
| FUN-EST-037 | RCA / Listagens A–H | 10 | pending | 0/1 |
| FUN-EST-038 | Relatórios Diversos / Visão geral | 10 | pending | 0/1 |
| FUN-EST-039 | Carvão vegetal | 10 | pending | 0/1 |
| FUN-EST-040 | PTRF/PRAD | 10 | pending | 0/1 |
| FUN-EST-041 | Transporte de resíduos | 10 | pending | 0/1 |
| FUN-EST-042 | MTR-MG | 10 | pending | 0/1 |
| FUN-EST-043 | Compensação / Visão geral | 10 | pending | 0/1 |
| FUN-EST-044 | Compensação / Espécies | 10 | pending | 0/1 |
| FUN-EST-045 | Compensação / SNUC | 10 | pending | 0/1 |
| FUN-EST-046 | Compensação / Mata Atlântica | 10 | pending | 0/1 |
| FUN-EST-047 | Compensação / Minerária | 10 | pending | 0/1 |
| FUN-EST-048 | Compensação / APP | 10 | pending | 0/1 |
| FUN-EST-049 | Reserva Legal | 10 | pending | 0/1 |
| FUN-GEO-001 | Painel | 11 | pending | 0/1 |
| FUN-GEO-002 | Trâmites fundiários | 11 | pending | 0/2 |
| FUN-GEO-003 | Rural SIGEF/INCRA | 11 | pending | 0/1 |
| FUN-GEO-004 | Urbano cartório | 11 | pending | 0/1 |
| FUN-GEO-005 | CAR/SICAR | 11 | pending | 0/1 |
| FUN-GEO-006 | Histórico CAR | 11 | pending | 0/1 |
| FUN-GEO-007 | Campo e levantamento | 11 | pending | 0/1 |
| FUN-GEO-008 | Documentação técnica | 11 | pending | 0/1 |
| FUN-GEO-009 | Memorial descritivo | 11 | pending | 0/1 |
| FUN-GEO-010 | Validações | 11 | pending | 0/1 |
| FUN-GEO-011 | Cartório e registro | 11 | pending | 0/1 |
| FUN-GEO-012 | Referências normativas | 11 | pending | 0/1 |
| FUN-CRM-001 | Alertas e notificações | 7 | pending | 0/1 |
| FUN-CRM-002 | Configurações CRM | 7 | pending | 0/1 |
| FUN-CRM-003 | Equipe e desempenho | 7 | pending | 0/1 |
| FUN-CRM-004 | Gestão de clientes | 7 | pending | 0/1 |
| FUN-CRM-005 | Mídias sociais | 7 | pending | 0/1 |
| FUN-CRM-006 | Oportunidades e pipeline | 7 | pending | 0/3 |
| FUN-CRM-007 | Painel de vendas | 7 | pending | 0/1 |
| FUN-CRM-008 | Relatórios e análises | 7 | pending | 0/1 |
| FUN-CRM-009 | Vendas e propostas | 7 | pending | 0/1 |
| FUN-OFI-001 | Ofícios | 5 | pending | 0/3 |
| FUN-EXT-001 | Webmail | 13 | pending | 0/1 |
| FUN-GOV-001 | Consulta Intervenção Ambiental | 13 | pending | 0/1 |
| FUN-GOV-002 | Consulta Licenciamento | 13 | pending | 0/1 |
| FUN-GOV-003 | Consulta Outorgas | 13 | pending | 0/1 |
| FUN-GOV-004 | CTF/IBAMA externo | 13 | pending | 0/1 |
| FUN-GOV-005 | IDE-SisemaNet externo | 13 | pending | 0/1 |
| FUN-GOV-006 | SEI-IBAMA | 13 | pending | 0/1 |
| FUN-GOV-007 | SEI-MG | 13 | pending | 0/1 |
| FUN-GOV-008 | SLA Ecossistemas | 13 | pending | 0/1 |
| FUN-SIS-001 | Informações da empresa | 13 | pending | 0/1 |
| FUN-SIS-002 | Responsáveis técnicos | 13 | pending | 0/3 |
| FUN-SIS-003 | Identidade visual | 13 | pending | 0/1 |
| FUN-SIS-004 | Aparência | 13 | pending | 0/1 |
| FUN-SIS-005 | Templates | 13 | pending | 0/2 |
| FUN-SIS-006 | Laudos | 13 | pending | 0/3 |
| FUN-SIS-007 | Consultas técnicas | 13 | pending | 0/4 |
| FUN-SIS-008 | MCP + RAG | 13 | pending | 0/1 |
| FUN-SIS-009 | Fontes de conhecimento | 13 | pending | 0/3 |
| FUN-SIS-010 | Biblioteca IA OneDrive | 13 | pending | 0/1 |
| FUN-SIS-011 | Integração OneDrive | 13 | pending | 0/1 |
| FUN-SIS-012 | Ferramentas MCP | 13 | pending | 0/1 |
| FUN-SIS-013 | Laboratório RAG | 13 | pending | 0/1 |
| FUN-SIS-014 | Importação de fonte local | 13 | pending | 0/1 |
| FUN-SIS-015 | Backup de excluídos | 13 | pending | 0/1 |
| FUN-SIS-016 | Explorador de arquivos | 13 | pending | 0/1 |
| FUN-SIS-017 | Log de auditoria | 13 | pending | 0/1 |
| FUN-SIS-018 | Canais WhatsApp/Instagram | 13 | pending | 0/1 |
| FUN-SIS-019 | App/Coleta de campo | 13 | pending | 0/1 |
| FUN-AGEN-001 | Agenda | 2 | in_progress | 1/1 |
| FUN-INV-001 | Inventários de campo | 9 | pending | 0/4 |
