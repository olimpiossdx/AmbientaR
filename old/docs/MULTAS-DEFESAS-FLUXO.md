# Multas e Defesas — fluxo do trâmite (MG)

Módulo separado do **Licenciamento** (`/requests`). Rotas:

| Rota | Função |
|------|--------|
| `/multas-defesas` | Lista e resumo de prazos |
| `/multas-defesas/nova` | Registrar multa após cientificação |
| `/multas-defesas/[id]` | Trâmite completo (fases em accordion) |

Coleção Firestore: `autoInfracaoDefesas`.

## Fases

1. **Abertura** — auto, órgão (SEMAD, FEAM, IGAM, IEF), cientificação, opção do cliente.
2. **Instrução** — documentos a **apensar** (cópia do auto, ID, endereço, procuração, PJ, taxa ≥ 1.661 UFEMG, provas).
3. **Elaboração** — petição na plataforma (modelos baseados em peças reais + IA por seção).
4. **Protocolo** — SEI, Correios AR ou presencial; comprovante.
5. **CNR** — somente última instância administrativa (PA/CAP, link da pauta RO).

## Base legal e links

- Decreto Estadual nº 47.383/2018 (defesa 20 dias — art. 33; requisitos — arts. 59–60).
- [SEMAD — Defesas e recursos](https://semad.mg.gov.br/w/apresentacao-de-defesas-e-recursos)
- [FEAM — Fui fiscalizado](https://feam.br/w/fui-fiscalizado-e-agora-)
- Pautas CNR: `https://semad.mg.gov.br/w/*-ro-da-cnr`

## Modelos de petição

- **SUPRAM formal** — estilo Agropecuária Forquilha (defesa direta à autoridade).
- **Escritório** — carta + peça numerada (estilo Agroreservas / Ricardo Carneiro).
- **PMMG/SEMAD** — múltiplos destinatários em cadeia.

Referências PDF (uso interno, não versionadas): `docs/referencias/defesa-referencia-*.pdf`.

## API IA

`POST /api/multas-defesas/suggest-section` — corpo: `{ sectionId, autoResumo?, orgao?, pedidoUsuario? }`.

## Papéis

Leitura/escrita Firestore: `admin`, `advogado`, `technical`, `gestor`, `supervisor`.

## Migração

Processos antigos abrem em `/multas-defesas/[id]`; checklist legado é mapeado para a matriz de documentos.
