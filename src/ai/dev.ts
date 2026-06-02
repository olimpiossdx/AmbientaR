/**
 * Entrada do Genkit Developer UI (`npm run genkit:dev` / `genkit:watch`).
 * Importa a instância `ai` e todos os fluxos para registro no catálogo local.
 *
 * Requer no ambiente: `GOOGLE_GENAI_API_KEY` ou `GEMINI_API_KEY` (Gemini apenas; sem OpenAI).
 */
import "@/ai/genkit";
import "@/ai/flows/analise-ambiental-flow";
import "@/ai/flows/assistant-flow";
import "@/ai/flows/generate-abnt-report";
import "@/ai/flows/generate-financial-report";
import "@/ai/flows/generate-sustainability-report";
import "@/ai/flows/preencher-relatorio-flow";
import "@/ai/flows/suggest-empreendedor-autofill";
