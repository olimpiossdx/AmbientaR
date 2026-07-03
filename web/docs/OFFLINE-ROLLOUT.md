# Roadmap por ecrã (portal cliente primeiro)

Implementações piloto já feitas: ver [OFFLINE-PILOTS.md](./OFFLINE-PILOTS.md).

## Ordem sugerida

1. **Autenticação / sessão** — garantir refresh token válido; mensagens claras quando offline sem sessão.
2. **Painel (`/`)** — leituras já em Firestore; validar cache após kill da app.
3. **Projetos / empreendimentos** — queries por CPF/CNPJ já existem; adicionar `useLocalFirst` ou toasts de pendência quando outbox > 0.
4. **Contratos / propostas / faturas** — mesma lógica de `clientIdsForUser`; definir quais campos **não** editar offline (ver [OFFLINE-FIRST-MVP.md](./OFFLINE-FIRST-MVP.md) SLA).
5. **Inventário / campo** (`/inventarios`, `/app-campo`) — priorizar fotos + GPS + fila Storage ([APP-OFFLINE-FASE5.md](./APP-OFFLINE-FASE5.md)).
6. **Módulos internos** (consultoria, IA, laudos) — **online-only** no MVP.

## Testes manuais (DevTools)

- **Offline:** Application → Offline; navegar entre páginas já visitadas; submeter formulário e verificar outbox (`IndexedDB` → `AmbientaROffline`).
- **Flaky:** throttling “Slow 3G” + alternar offline/online; confirmar que `OfflineProvider` corre `runSyncPass` ao voltar online.

## Testes automáticos (futuro)

- E2E com Playwright `context.setOffline(true)` em fluxos críticos do portal.
- Testes unitários do `sync-engine` com Firestore emulator (opcional).
