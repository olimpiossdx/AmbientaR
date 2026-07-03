# Auditoria — IA + Estudos Técnicos

## IA

| Rota | Label |
|------|-------|
| `/analise-ambiental` | Análise Geoespacial (IA) |
| `/studies/analise-socioambiental` | Análise socioambiental |
| `/studies/assistant?tipo=*` | Assistente (vários perfis) |
| `/ai-lab/automations` | Relatórios de IA (hub automations) |

`/studies/assistant` sem query: página aceita `tipo` por URL; normalização do audit considera base `/studies/assistant`.

Hub admin: `/ai-lab`, `/ai-lab/rag`, `/ai-lab/mcp` no menu **Configurações**.

## Estudos Técnicos

Todos os `href` em `navigation-config` sob “Estudos Técnicos” estão cobertos (EIA/RIMA, fauna, inventário florestal, PTRF, RCA, etc.).

| Correção | Detalhe |
|----------|---------|
| 🔧 `/studies` | redirect → `/studies/educacao-ambiental` (removido placeholder) |
| 🔧 `/studies/intervencao-ambiental` | redirect → `/studies/pia` |

## PTRF/PRAD

Relatório pericial: `/studies/relatorios-diversos/ptrf-prad` — jsPDF dinâmico (commit `aeddc26`).

## Backlog

- Consolidar formulários PIA (`studies/intervencao-ambiental`) com listagem `/studies/pia` na fase React (navegação mental do utilizador).
