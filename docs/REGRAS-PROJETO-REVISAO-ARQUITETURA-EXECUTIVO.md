# Revisao Arquitetural - Resumo Executivo (1 pagina)

## Contexto

AmbientaR e uma aplicacao Next.js (PWA) com backend Firebase (Auth, Firestore, Storage), operando com dados em nuvem no ambiente de desenvolvimento e producao.

## Decisoes Arquiteturais Atuais

- **Projeto Firebase canonico:** `studio-316805764-e4d13`.
- **Fonte de verdade de regras Firestore para deploy:** `src/firebase/rules/firestore.rules` (referenciada no `firebase.json`).
- **Execucao local cloud-first:** sem emuladores; autenticacao Firebase real e necessaria.
- **Build com acoplamento operacional:** `npm run build` aciona postbuild com `npm run deploy:rules`.
- **Hosting Firebase tradicional:** `firebase deploy --only hosting` publica apenas estaticos de `public/` (nao cobre SSR/API Routes do Next completo).

## Riscos Criticos

- **Deploy acidental de regras em build local:** pode publicar alteracoes de seguranca sem controle de janela de release.
- **Gap entre expectativa e capacidade de hosting:** risco de regressao funcional se app Next completa for tratada como site estatico.
- **Divergencia de regras Firestore:** coexistencia de arquivo espelho (`src/firestore.rules`) e arquivo de deploy pode causar inconsistencias.
- **Dependencia de cloud para desenvolvimento:** aumenta fragilidade em testes, custo operacional e risco de alteracoes em dados reais.
- **Governanca de autorizacao por roles:** falhas em `users/{uid}` impactam acesso e fluxos de aprovacao.

## Pendencias Estruturais (Decisao)

- Definir plataforma oficial de producao para Next completo:
  - Firebase App Hosting, ou
  - Vercel, ou
  - Cloud Run.
- Definir politica de deploy de regras:
  - manter ou remover acoplamento `build -> deploy:rules`.
- Definir politica unica para arquivos de regras:
  - espelho documental versus artefato unico de deploy.
- Formalizar estrategia de testes:
  - cloud-only (atual) versus adocao de emuladores para QA/controladoria.

## Recomendacoes Prioritarias (30 dias)

- **P0 - Governanca de deploy:** desacoplar deploy de regras do build local e exigir etapa explicita.
- **P0 - Producao Next:** registrar decisao de plataforma e fluxo de release fim-a-fim.
- **P1 - Seguranca Firestore:** auditar alinhamento entre regras, roles e colecoes sensiveis.
- **P1 - Operacao dev:** definir politica de dados de teste e procedimentos para minimizar impacto em nuvem.
- **P2 - Observabilidade:** criar checklist de verificacao pos-deploy (auth, regras, storage, fluxos criticos).

## KPIs Sugeridos

- Taxa de deploy de regras fora da janela planejada.
- Numero de incidentes de permissao (Firestore/Auth) por mes.
- Tempo medio para validar ambiente apos alteracao de regras.
- Taxa de sucesso de release sem rollback.

## Referencias

- `AGENTS.md`
- `.cursor/rules/ambientar-firebase-e-deploy.mdc`
- `docs/REGRAS-PROJETO-REVISAO-ARQUITETURA.md`
