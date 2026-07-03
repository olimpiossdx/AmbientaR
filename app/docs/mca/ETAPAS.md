# MCA — 15 etapas com debugger

**Plano executivo (auditoria + critérios PASS por fase):** [`PLANO-EXECUTIVO.md`](PLANO-EXECUTIVO.md)

Regra: **não avançar sem PASS** na etapa actual (`docs/mca/debug-reports/E0X-pass.md`).

| Etapa | Nome | Gate principal |
|-------|------|----------------|
| E01 | Especificação Pimenta | `REFERENCIA-PIMENTA.md` aprovado |
| E02 | Infra + health | `GET /api/mca/health` + worker opcional |
| E03 | Registry + DAG | `npm run mca:verify-etapa -- 03` |
| E04 | UI wizard + projetos | CRUD Firestore |
| E05 | Perímetro + CRS | Polígono válido + EPSG:31983 |
| E06 | DWG upload + catálogo | `dwgGcsPath` no projeto |
| E07 | Fundiário | Matrículas no projeto |
| E08 | Hidro + satélite | Agentes hidro PASS |
| E09 | Uso/ocupação | Tabela uso gerada |
| E10 | APP + RL | Tabelas APP/RL |
| E11 | Infra + rótulos | Agentes infra PASS |
| E12 | Layout (metadados) | `layoutMeta` preenchido |
| E13 | PDF técnico | Download `/api/mca/projects/{id}/pdf` |
| E14 | IA (rascunho) | Agentes SAM stub + revisão futura |
| E15 | CAD + release | Pipeline 15 + nota final |

Comandos:

```bash
npm run mca:verify-all-etapas   # E01–E15 + debugger + *-pass.md
npm run mca:verify-etapa -- 03
```

**Guia completo de testes (UI + CLI + erros):** [`TESTING.md`](TESTING.md)  
**Arquitetura v2–v5:** [`ARCHITECTURE.md`](ARCHITECTURE.md)

Mapas ouro: Palmeiras (E05–E06), Mangabeiras (E09–E10), Catingueiro (E14–E15) — ver [`gold/README.md`](gold/README.md).
