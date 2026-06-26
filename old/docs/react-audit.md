# Auditoria React

Gerado em: 2026-05-20.

## Estado inicial

- O `next lint` apontou 4 warnings React/Next:
  - 2 em `src/components/shared/attachment-preview-section.tsx` por uso de `<img>`.
  - 1 em `src/components/shared/upload-preparation-dialog.tsx` por uso de `<img>`.
  - 1 em `src/hooks/use-local-branding.ts` por dependência faltante em `useEffect`.
- Os previews de anexos usam URLs dinâmicas (`blob:`, `data:` ou Firebase Storage) e não são imagens LCP; por isso foi aplicada supressão explícita e documentada da regra `@next/next/no-img-element` nesses dois componentes.
- `use-local-branding` agora depende do objeto memoizado `data`, mantendo a semântica e eliminando o warning de hook.

## Imports pesados identificados

Principais bibliotecas que merecem revisão por menu em lotes futuros:

- `jspdf`: usado em relatórios, propostas, contratos, faturas, financeiro e usuários.
- `recharts`: usado em dashboards, CRM, financeiro e monitoramento.
- `leaflet` / `react-leaflet`: usado em mapas ambientais e componentes geográficos.
- `@react-google-maps/api`: usado em telemetria.
- `genkit`: usado em fluxos de IA e rotas server/API.
- `browser-image-compression`, `pizzip`, `jspdf`: usados no pipeline de upload/preparação.

## Próximos lotes recomendados

1. Revisar páginas client com `jspdf` importado diretamente e mover geração pesada para helpers carregados sob demanda quando possível.
2. Revisar mapas (`leaflet`, `react-leaflet`) para garantir carregamento apenas client-side.
3. Revisar IA/Genkit para manter imports fora de client components.
4. Reduzir duplicação de charts criando componentes menores por domínio.

## Resultado do lote atual

- Warnings React/Next conhecidos foram tratados.
- Nenhuma mudança visual ou de fluxo foi feita.
- Próxima validação obrigatória: `npm run lint`, `npx tsc --noEmit --pretty false`, `npm run apphosting:check`.
