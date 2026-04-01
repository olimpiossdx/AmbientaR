# Próximos passos — IA e relatórios

Resumo executivo do que implementar primeiro, com base em [ARQUITETURA-IA-E-RELATORIOS.md](./ARQUITETURA-IA-E-RELATORIOS.md).

---

## 1. Já criado neste projeto

- **docs/ARQUITETURA-IA-E-RELATORIOS.md** — Visão geral, estrutura de pastas, fluxos, templates, MCP e checklist.
- **src/lib/types/processo.ts** — Schemas Zod para Processo, Empreendimento, Local, Diagnóstico Técnico.
- **src/lib/types/relatorio.ts** — Schemas para DocumentoEstudo, RascunhoIA, PreencherRelatorio e GerarTor (input/output).
- **.cursor/mcp.json** — Configuração ativa de MCP no Cursor (Firebase MCP em `http://localhost:9000/mcp`).
- **.cursor/mcp.json.example** — Exemplo de configuração MCP.
- **docs/MCP-SETUP.md** — Passo a passo para subir Firebase MCP e conectar no Cursor.

---

## 2. Ordem sugerida de implementação

### Fase 1 — Base

1. **Conectar tipos ao Firestore**  
   Mapear `ProcessoContexto` e `DiagnosticoTecnico` para as collections existentes (requests, projects, empreendedores) ou criar subcoleção/documents conforme o doc de arquitetura.

2. **Metadados de templates**  
   Para cada slug em `template-config.ts`, adicionar arquivo `public/templates/<slug>/meta.json` com `instrucoesIA`, `secoesObrigatorias`, `placeholders` (ver doc).

3. **API de enriquecimento**
   - Criar `src/ai/flows/enriquecer-processo-flow.ts` (pode reusar tools de `analise-ambiental-flow`).
   - Criar `POST /api/ai/enriquecer-processo` que recebe `processoId`, chama o flow e grava o diagnóstico.

### Fase 2 — Preenchimento com IA

4. **Fluxo preencher relatório**
   - Criar `src/ai/flows/preencher-relatorio-flow.ts` (entrada: processoId + tipoDocumento; carrega dados + template; chama prompt com tools).
   - Criar `POST /api/ai/preencher-relatorio`.
   - Na tela do estudo (ex.: RCA), adicionar botão “Gerar rascunho com IA” que chama a API e exibe o resultado em editor editável.

5. **Exportação**
   - Revisar se o fluxo atual de exportação PDF/DOCX já usa o conteúdo do formulário; garantir que o rascunho gerado pela IA possa ser editado e então exportado.

### Fase 3 — ToR e MCP

6. **Fluxo gerar ToR**
   - Criar `src/ai/flows/gerar-tor-flow.ts` e `POST /api/ai/gerar-tor`.
   - Adicionar opção “Gerar ToR com IA” onde fizer sentido (abertura de EIA/RIMA, RAS, etc.).

7. **MCP**
   - Instalar e rodar [firebase-mcp](https://github.com/gannonh/firebase-mcp); configurar credenciais e projeto AmbientaR.
   - Copiar `.cursor/mcp.json.example` para `.cursor/mcp.json` e ajustar a URL.
   - (Opcional) Integrar Composio ou outro MCP para ferramentas governamentais.

---

## 3. Testes rápidos

- **Enriquecimento**: chamar `/api/ai/enriquecer-processo` com um processo que tenha CAR ou polígono e verificar se o diagnóstico é gravado.
- **Preencher**: chamar `/api/ai/preencher-relatorio` com processoId + `tipoDocumento: 'rca'` e verificar se retorna texto + fontes.
- **Assistente**: manter o Assistente IA atual; opcionalmente passar “contexto do processo X” no prompt.

---

## 4. Referências no código atual

- **Genkit**: `src/ai/genkit.ts`, `src/ai/flows/analise-ambiental-flow.ts`, `assistant-flow.ts`.
- **Templates**: `src/app/(app)/settings/templates/template-config.ts`, `src/app/api/templates/[type]/route.ts`.
- **Navegação/estudos**: `src/lib/navigation-config.ts` (Elaboração de Estudos).
