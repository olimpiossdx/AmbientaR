# Auditoria — Documentos Ambientais + Autos de Infração

## Documentos Ambientais (subitens)

| Rota | Label |
|------|-------|
| `/car` | CAR |
| `/compliance` | Condicionantes |
| `/intervencoes` | DAIA's (`intervencoes`) |
| `/fauna` | Fauna |
| `/licenses` | Licenças |
| `/monitoring/manual` | Lançamento Manual |
| `/monitoring/telemetric` | Telemetria |
| `/outorgas` | Outorgas |
| `/usos-insignificantes` | Usos Insignificantes |

Monitoramento: ver [auditoria-menu-monitoramento.md](./auditoria-menu-monitoramento.md).

## PIA vs DAIA

- **DAIA's** no menu → `/intervencoes` (coleção `intervencoes`).
- Formulários **PIA** em `/studies/intervencao-ambiental/*` (coleção `pias`) — listagem em `/studies/pia`.
- 🔧 Criado `/studies/intervencao-ambiental` → redirect `/studies/pia` (evita 404 após salvar PIA).

## Autos de Infração - Defesa

| Rota | Ficheiro |
|------|----------|
| `/autos-infracao-defesa` | `autos-infracao-defesa/page.tsx` |

Sem TODOs encontrados na pasta.

## Backlog

- Telemetria: relatórios PDF/XLSX pendentes (TODOs documentados no doc de monitoramento).
