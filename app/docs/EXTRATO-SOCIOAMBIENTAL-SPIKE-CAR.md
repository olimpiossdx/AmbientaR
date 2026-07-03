# Spike Fase 0 — Histórico CAR (SICAR)

**Data:** 2026-06-11  
**CAR de teste:** `MG-3170404-EE13855CE8314C4AA894EC793186E1E0` (exemplo W Egido / Unaí-MG)  
**Script:** `npm run probe:sicar-historico`

## Resultado do WFS público

| Item | Resultado |
|------|-----------|
| GeoServer WFS | `https://geoserver.car.gov.br/geoserver/sicar/wfs` — **OK** |
| Camadas disponíveis | **27** (`sicar:sicar_imoveis_{uf}`) — apenas snapshot **atual** |
| Camadas `historico` / `retificacao` | **Nenhuma** no GetCapabilities |
| CAR de teste encontrado | **Sim** — área 1859,34 ha, status AT, condição "Aguardando análise" |
| `data_atualizacao` | `2025-09-18` (alinha com PDF Sicredi 19/09/2025) |
| `dat_criacao` | `2025-09-18` |

### Campos da feição atual (`sicar_imoveis_mg`)

`cod_imovel`, `status_imovel`, `condicao`, `area`, `municipio`, `uf`, `cod_municipio_ibge`, `m_fiscal`, `tipo_imovel`, `dat_criacao`, `data_atualizacao`

Não há geometria de versões anteriores nem ID de revisão no WFS.

## Outros endpoints testados

| Endpoint | HTTP | Nota |
|----------|------|------|
| `consultapublica.car.gov.br/.../imoveis/index?codigo=` | 200 | HTML (SPA), sem JSON de histórico |
| `consultapublica.../municipios/imovel?codigoImovel=` | 404 | Rota inexistente |
| GeoServer REST `/rest/layers.json` | 401 | Requer autenticação |

## APIs governamentais (não testadas — requerem credencial)

- **Conecta Gov — SICAR Imóvel / Demonstrativo** (Dataprev): órgão público; pode trazer RL/APP; histórico de versões **não documentado** publicamente.
- **SNCR API** (INCRA): cadastro rural por código; não substitui polígonos históricos do CAR.

## Conclusão

O **WFS público do SICAR não expõe histórico de geometrias** (versões 2023, 2024, 2025 como no PDF Sicredi). AgroTools/Sicredi usam base comercial ou integração privada.

### Estratégia AmbientaR (acordada)

1. **Fase 4 — Histórico CAR (essencial):**
   - **Snapshot próprio:** a cada execução de pacote com CAR, guardar em Firestore subcoleção `car_snapshots/{codImovel}`: geometria, `data_atualizacao`, hash, resultado dos cruzamentos de risco.
   - **Comparação:** se snapshot anterior tinha sobreposição (ex.: assentamento 0,77 ha) e o atual não tem → **Alerta** “possível omissão na retificação”.
   - **Opcional futuro:** credencial Conecta Gov se consultoria obtiver acesso de órgão.

2. **Fase 1–3:** usar WFS atual para metadados + perímetro (`fetchCarByCodImovel` já existente).

3. **UI:** secção “Histórico CAR” mostra snapshots armazenados pelo AmbientaR + datas; mensagem clara quando só há 1 versão.

## Referência cruzada PDF Sicredi

O relatório cita versões em 10/11/2023, 18/12/2024 e 19/09/2025 com assentamento em versões antigas — **não reproduzível** só com WFS público hoje.
