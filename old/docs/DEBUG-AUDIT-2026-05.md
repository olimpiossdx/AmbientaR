# Auditoria de debug — performance, rotas e build (mai/2026)

Gerado após `npm run typecheck`, `npm run lint`, `npm run audit:routes` e `npm run apphosting:check`.

## Resumo executivo

| Área | Estado | Ação |
|------|--------|------|
| TypeScript (`tsc`) | OK após correção em `empreendedor-project-select` | Manter `apphosting:check` antes de deploy |
| ESLint | Só avisos (hooks, `<img>`) | Corrigir gradualmente |
| Build App Hosting (strict) | Falhava em `outorga-form` / `uso-insignificante-form` | Corrigido: `selectedProjectId` opcional na API |
| Rotas vs menu | 204 ativas; 19 sem entrada direta no menu (esperado) | Ver `docs/menu-route-audit.md` |
| Erros de sintaxe (dev log antigo) | `inspection-form`, `inspection-attachment-media` | Já resolvidos no código atual |
| Performance produção | Layout + PWA + bundles pesados por página | Ver plano abaixo |

## Erros que bloqueavam deploy

O build em modo estrito (`APPHOSTING_STRICT_BUILD=1`) falhava porque `form.watch("projectId")` devolve `string | undefined` quando o schema Zod usa `.optional()`, mas `buildProjectSelectOptions` exigia `string`.

**Correção:** `selectedProjectId?: string | null` em `src/lib/empreendedor-project-select.ts`.

## Rotas

- **204 rotas** ligadas ao menu ou fluxo ativo.
- **5 dinâmicas** sem item de menu (ex.: `/inventarios/[id]`, edição de propostas).
- **14 estáticas** órfãs de menu (ex.: `/app-campo`, `/webmail`, `/studies`) — não remover sem validar uso.

Comando para repetir: `npm run audit:routes`

## Performance — causas prováveis em produção

### 1. Layout autenticado (`src/app/(app)/layout.tsx`)

Em **todas** as páginas autenticadas:

- Várias subscrições Firestore (notificações, branding, feature flags).
- Para papel `client`: até 5 queries/coleções extra (access_requests, clients, empreendedores, docs por id).
- `ChatWidget` com listeners de chat (agora carregado com `dynamic(..., { ssr: false })`).

**Recomendações:**

- Adiar queries só de cliente até `user.role === 'client'` e após hidratação.
- Considerar paginação/limit nas notificações.
- Avaliar se branding/feature flags podem vir de cache local (offline já existe).

### 2. PWA (`@ducanh2912/next-pwa`)

Em produção gera `public/sw.js` e precache de documentos. Primeira visita pode ser mais lenta; visitas seguintes mais rápidas offline.

- `navigateFallback: /offline` — páginas novas podem ir para offline se a rede falhar durante deploy.
- Após deploy: pedir aos utilizadores **hard refresh** ou limpar dados do site.

### 3. Bundles pesados (carregar só na rota)

Bibliotecas grandes usadas pontualmente:

- `leaflet` / mapas (`analise-ambiental`, georeferenciamento)
- `pdfjs-dist` (vistorias, laudos)
- `@turf/*` (análise geo)
- `@react-google-maps/api`
- Genkit (só servidor / AI Lab)

Poucas páginas usam `next/dynamic`. Prioridade: mapas, PDF e dashboards do painel `/`.

### 4. Build local vs nuvem

`next.config.mjs` ignora erros TS/ESLint no `npm run build` normal; **App Hosting não ignora**. Sempre correr:

```bash
npm run apphosting:check
```

antes de push para o rollout.

### 5. Firestore em nuvem (sem emulador)

Cada `useCollection` sem `limit` traz a coleção inteira. Revisar listagens (projetos, licenças, vistorias) nas páginas mais usadas.

## Plano de trabalho sugerido (prioridade)

1. **Deploy seguro** — `apphosting:check` verde (feito após correção TS).
2. **Painel `/`** — `dynamic()` nos dashboards por papel.
3. **Listagens** — `limit` + índices Firestore nas páginas lentas (licenças, projetos, vistorias).
4. **Mapas/PDF** — `dynamic()` com `ssr: false` em todos os entry points.
5. **PWA** — rever lista de precache; não precachear rotas raras.
6. **ESLint hooks** — corrigir avisos que podem causar bugs de estado.

## Comandos úteis

```bash
npm run typecheck
npm run lint
npm run apphosting:check
npm run audit:routes
npm run audit:menus-by-role
```

## Alterações já aplicadas nesta sessão

- `buildProjectSelectOptions`: aceita `selectedProjectId` opcional.
- `layout.tsx`: `ChatWidget` com import dinâmico (menos JS no primeiro paint).
