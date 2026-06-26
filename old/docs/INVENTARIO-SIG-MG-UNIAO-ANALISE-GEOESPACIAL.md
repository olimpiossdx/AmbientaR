# Inventário SIG para Análise Geoespacial (MG + União)

Este inventário é a base técnica/legal da Fase 0 para o módulo `Análise Geoespacial (IA)`.

## Escopo inicial

- Entrada por número do CAR, coordenadas e polígono.
- Cruzamentos mínimos de MVP: camada estadual, embargos federais e hidrografia.
- Consumo por serviços públicos (OGC/API/catálogo), sem replicar login do SISEMANET.

## Fontes priorizadas

| Fonte | Endpoint principal | Tipo | Uso previsto |
|---|---|---|---|
| IDE-Sisema Webservices | `https://geoportal.meioambiente.mg.gov.br/webservices` | OGC | Descoberta e consumo de camadas estaduais |
| GeoServer Sisema | `https://geoserver.meioambiente.mg.gov.br/` | OGC | Interseção geoespacial (WMS/WFS/WCS). **WFS:** `.../ows` (não `.../geoserver/ows`) |
| GeoNetwork IDE-Sisema | `https://idesisema.meioambiente.mg.gov.br/geonetwork` | Catálogo | Metadados (CRS, atualização, restrições) |
| SICAR Imóvel | `https://www.gov.br/conecta/catalogo/apis/sicar-imovel` | API | Consulta de informações de imóvel por CAR |
| SICAR Demonstrativo | `https://www.gov.br/conecta/catalogo/apis/api-sicar-demonstrativo` | API | APP, RL e dados demonstrativos por CAR |
| GeoServer SICAR | `https://geoserver.car.gov.br/geoserver/sicar/` | OGC | Geometrias para validação espacial (quando permitido) |
| IBAMA PAMGIA | `https://pamgia.ibama.gov.br/geoservicos/` | OGC/Features | Embargos e risco regulatório |
| IBAMA Dados Abertos | `https://dadosabertos.ibama.gov.br/` | Download | Auditoria e reconciliação de achados |

## Checklist de validação antes de produção

- Confirmar política de uso/licença de cada serviço.
- Confirmar limites de taxa e autenticação (quando houver OAuth/token).
- Confirmar CRS oficial por camada e estratégia de normalização.
- Definir fallback quando serviço externo estiver indisponível.
- Registrar data/hora UTC da consulta no relatório factual.

## Camadas mínimas para MVP

1. Camada estadual de referência (IDE-Sisema).
2. Embargos federais (IBAMA).
3. Hidrografia oficial para alertas de APP.

## Estratégia de robustez

- Timeout por integração externa.
- Resposta conservadora quando não houver confirmação factual.
- Armazenamento do pacote factual em `geo_analyses` para rastreabilidade.
