# Roteamento de IA — Gemini (leve) + DeepSeek (pesado)

## Sem OpenAI / ChatGPT Business

A AmbientaR **não integra** a API OpenAI. Variáveis como `OPENAI_API_KEY` ou `GENKIT_PROVIDER=openai` **não são usadas** — pode removê-las do `.env.local` para evitar confusão.

A subscrição **ChatGPT Business** e o **Codex** no Cursor **não são debitados** pelos fluxos desta app. O assistente no browser do ChatGPT é independente do código em produção.

| O que usa | Chave / conta |
|-----------|----------------|
| Consultas curtas, autofill, Genkit, complemento geo (modo Gemini) | `GOOGLE_GENAI_API_KEY` (Google AI / Gemini API) |
| Relatórios longos, análise ambiental completa, chat pesado | `DEEPSEEK_API_KEY` (platform.deepseek.com) |

## Objetivo

- **Gemini** (`GOOGLE_GENAI_API_KEY`): chat, autofill, complemento geo, rascunhos curtos — custo na conta Google (Flash barato; Etapa 2 geo com Gemini é **gratuito na app**, sem teto por omissão).
- **DeepSeek** (`DEEPSEEK_API_KEY`): análise ambiental completa, relatório ABNT, financeiro, sustentabilidade, pedidos grandes (RAG/MCP/chat longo).

## Variáveis (`.env.local`)

| Variável | Padrão | Função |
|----------|--------|--------|
| `GOOGLE_GENAI_API_KEY` | — | Gemini (leve + Genkit) |
| `DEEPSEEK_API_KEY` | — | Tarefas pesadas |
| `GEMINI_LIGHT_MODEL` | `gemini-2.5-flash` | Chat REST leve |
| `GENKIT_GOOGLE_MODEL` | `gemini-2.5-flash` | Fluxos Genkit |
| `DEEPSEEK_HEAVY_MODEL` | `deepseek-v4-flash` | Relatórios pesados |
| `IA_LIGHT_MAX_CHARS` | `6000` | Acima disso, chat/RAG/geo → DeepSeek |
| `IA_ROUTER` | `on` | `off` = comportamento legado (DeepSeek primeiro se existir chave) |
| `GEO_IA_GEMINI_MONTHLY_LIMIT` | `0` (omitido) | `0` = complemento geo Gemini sem bloqueio na app |

**Não configure:** `OPENAI_API_KEY`, `OPENAI_KEY`, `GENKIT_PROVIDER=openai` (removidos do código).

## Mapa de telas

| Funcionalidade | Provedor |
|----------------|----------|
| Assistente de estudos (pergunta curta) | Gemini → fallback DeepSeek |
| Assistente (texto longo / “relatório completo”) | DeepSeek |
| `/api/ai/deepseek/chat` | Roteador (mesma regra) |
| Análise ambiental (mapa) | DeepSeek obrigatório se houver chave |
| AI Lab — relatório ABNT | DeepSeek |
| Reporting — financeiro / sustentabilidade | DeepSeek |
| Autofill empreendedor, preencher relatório, geo complemento (Etapa 2) | Gemini gratuito na app (sem quota; `GEO_IA_GEMINI_MONTHLY_LIMIT` omitido ou `0`) ou DeepSeek (saldo pago) |
| Genkit (dev UI) | Apenas Gemini |

## Blaze e Gemini

Com o projeto Firebase no **Blaze**, a API Gemini Developer ligada ao faturamento tende ao **tier pago** (tokens baratos no Flash, não “ilimitado grátis”). O free tier da API costuma exigir projeto **sem** Cloud Billing (Spark). Ver [Firebase AI Logic pricing](https://firebase.google.com/docs/ai-logic/pricing) e [Gemini API billing](https://ai.google.dev/gemini-api/docs/billing).

## Monitorização

- Google AI Studio → Usage / Billing
- DeepSeek → platform.deepseek.com → saldo e faturação
