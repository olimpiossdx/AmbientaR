# Arquitetura Técnica - AmbientaR

## Visão Geral
O AmbientaR é uma plataforma de consultoria ambiental baseada em arquitetura modular, integrando funcionalidades de ERP com módulos especializados para estudos ambientais.

## Arquitetura do Sistema

### 1. Camada de Apresentação (Frontend)
- **Interface Web**: HTML5, CSS3, JavaScript
- **Framework**: React.js (planejado)
- **Responsividade**: Design mobile-first
- **Temas**: Suporte a temas personalizáveis

### 2. Camada de Aplicação (Backend)
- **Framework Principal**: Python com Frappe Framework
- **API**: RESTful API com FastAPI
- **Autenticação**: JWT tokens
- **Autorização**: Sistema de permissões baseado em roles

### 3. Camada de Dados
- **Banco Principal**: MariaDB/MySQL
- **Cache**: Redis
- **Armazenamento de Arquivos**: Sistema de arquivos local + cloud storage (planejado)

## Módulos do Sistema

### Módulo Core (ambientar_core)
- **Gestão de Projetos**: Criação, acompanhamento e controle de projetos ambientais
- **Gestão de Clientes**: Cadastro e histórico de clientes
- **Gestão de Equipe**: Alocação de recursos humanos
- **Controle Financeiro**: Orçamentos, custos e faturamento

### Módulo de Relatórios (ambientar_reports)
- **Gerador de Relatórios**: Templates personalizáveis
- **Formatos de Saída**: HTML, PDF, Word, Excel
- **Biblioteca de Templates**: Templates padrão para diferentes tipos de estudo
- **Versionamento**: Controle de versões dos relatórios

### Módulo ERP (erpnext)
- **Gestão Empresarial**: Integração com ERPNext para funcionalidades básicas
- **Contabilidade**: Contas a pagar/receber, balanços
- **Recursos Humanos**: Folha de pagamento, benefícios
- **Estoque**: Controle de materiais e equipamentos

## Fluxo de Dados

### 1. Criação de Projeto
```
Cliente → Projeto → Estudos → Relatórios → Aprovação
```

### 2. Processo de Estudo
```
Termos de Referência → Metodologia → Coleta de Dados → Análise → Relatório
```

### 3. Geração de Relatórios
```
Dados do Estudo → Template → Processamento → Formatação → Saída
```

## Tecnologias Utilizadas

### Backend
- **Python 3.8+**: Linguagem principal
- **Frappe Framework**: Framework web
- **FastAPI**: API REST
- **SQLAlchemy**: ORM para banco de dados
- **Celery**: Processamento assíncrono (planejado)

### Frontend
- **HTML5/CSS3**: Estrutura e estilo
- **JavaScript ES6+**: Lógica do cliente
- **Bootstrap**: Framework CSS (planejado)
- **Chart.js**: Gráficos e visualizações (planejado)

### Banco de Dados
- **MariaDB 10.6+**: Banco principal
- **Redis 7+**: Cache e sessões
- **MongoDB**: Documentos não estruturados (planejado)

### Infraestrutura
- **Docker**: Containerização
- **Nginx**: Servidor web e proxy reverso
- **Gunicorn**: Servidor WSGI Python
- **Supervisor**: Gerenciamento de processos

## Segurança

### Autenticação
- **JWT Tokens**: Autenticação stateless
- **Refresh Tokens**: Renovação automática
- **2FA**: Autenticação de dois fatores (planejado)

### Autorização
- **RBAC**: Controle de acesso baseado em roles
- **Permissões Granulares**: Controle fino de funcionalidades
- **Auditoria**: Log de todas as ações

### Proteção de Dados
- **Criptografia**: Dados sensíveis criptografados
- **Backup**: Backup automático e seguro
- **Compliance**: Conformidade com LGPD

## Performance

### Otimizações
- **Cache Redis**: Cache de consultas frequentes
- **CDN**: Distribuição de conteúdo estático
- **Compressão**: Gzip para transferência de dados
- **Lazy Loading**: Carregamento sob demanda

### Monitoramento
- **Logs**: Sistema de logging estruturado
- **Métricas**: Coleta de métricas de performance
- **Alertas**: Notificações automáticas
- **Dashboard**: Interface de monitoramento

## Escalabilidade

### Horizontal
- **Load Balancer**: Distribuição de carga
- **Microserviços**: Arquitetura modular
- **Auto-scaling**: Escalabilidade automática

### Vertical
- **Recursos Dinâmicos**: Ajuste automático de recursos
- **Otimização de Queries**: Índices e consultas otimizadas
- **Connection Pooling**: Pool de conexões de banco

## Integrações

### APIs Externas
- **Google Maps**: Georreferenciamento
- **Weather API**: Dados meteorológicos
- **Environmental APIs**: Dados ambientais públicos

### Sistemas
- **ERP**: Integração com sistemas empresariais
- **CRM**: Gestão de relacionamento com clientes
- **Accounting**: Sistemas contábeis

## Deployment

### Ambiente de Desenvolvimento
- **Local**: Docker Compose
- **Virtualenv**: Ambiente Python isolado
- **Hot Reload**: Recarregamento automático

### Ambiente de Produção
- **Cloud**: AWS/Azure/GCP
- **CI/CD**: Pipeline de deploy automatizado
- **Monitoring**: Monitoramento em tempo real
- **Backup**: Estratégia de backup robusta

## Roadmap Técnico

### Fase 1 (Atual)
- ✅ Estrutura base do projeto
- ✅ Módulos core e relatórios
- ✅ Configuração Docker
- ✅ Script de instalação

### Fase 2 (Próxima)
- 🔄 Integração com ERPNext
- 🔄 Interface web básica
- 🔄 Sistema de autenticação
- 🔄 API REST

### Fase 3 (Futuro)
- 📋 Interface web avançada
- 📋 Sistema de templates avançado
- 📋 Integrações externas
- 📋 Mobile app

## Considerações de Manutenção

### Código
- **Padrões**: PEP 8 para Python
- **Documentação**: Docstrings e comentários
- **Testes**: Cobertura de testes > 80%
- **Code Review**: Revisão obrigatória de código

### Infraestrutura
- **Updates**: Atualizações de segurança automáticas
- **Backup**: Backup diário com retenção de 30 dias
- **Monitoring**: Monitoramento 24/7
- **Disaster Recovery**: Plano de recuperação de desastres
