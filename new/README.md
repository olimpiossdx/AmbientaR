# AmbientaR — novo portal

React 19, TypeScript, Vite e TanStack Router. O backend é exclusivamente o projeto irmão `ambientaR-api` (NestJS/MongoDB/Redis). O `web` serve como referência funcional; não é dependência de execução.

## Desenvolvimento

```sh
npm run dev
npm test
npm run build
npm run migration:audit
```

Configure `VITE_API_URL` para o backend (padrão `http://localhost:3001`). A autenticação usa cookies; configure a origem do Vite entre as origens permitidas na API. Não colocar credenciais de banco, Firebase ou provedores no frontend.

## Migração e empresas

- [Plano mestre](docs/PLANO-MIGRACAO-WEB-PARA-NEW.md)
- [Execução e pendências](docs/EXECUCAO-MIGRACAO-2026-09-19.md)
- [Auditoria regenerável](docs/AUDITORIA-MIGRACAO-ATUAL.md)
- [188 funcionalidades por módulo](docs/planos-migracao/README.md)

A implantação atende empresas com dados isolados. O vínculo de empresa é resolvido pela API a partir da conta. Contas sem empresa não acessam dados empresariais; `/app/organization` permite consultar/criar o espaço da própria conta. As permissões são atribuídas explicitamente, e a criação de empresa não equivale a concessão de acesso a todos os módulos.

Agenda e Painel já consomem APIs próprias. A migração integral continua em execução: menus e telas provisórias não representam funcionalidades concluídas. A auditoria registra essa diferença e verifica que não há imports de Firebase/Next no novo frontend.
