'use server';

import type { AssistantInput } from '@/lib/types';
import { classifyChatTask, type AiTaskKind } from '@/lib/ai-router';
import { routedChatCompletion } from '@/lib/ai-run-chat';

const STUDY_SYSTEM_PREFIX =
  'És o assistente AmbientaR (Pimenta Consultoria). O utilizador elabora estudos ambientais em MG/Brasil (documentos técnicos, licenciamento, relatórios). ';

const OUTORGA_SYSTEM_PREFIX =
  `${STUDY_SYSTEM_PREFIX}Foco: outorga de recursos hídricos em Minas Gerais (Decreto 47.705/2019, Portaria IGAM 48/2019, Tabela 01 de modos de uso, SOUT/EcoSistemas). Cite códigos de modo de uso e documentos do checklist quando relevante. `;

const FINANCEIRO_SYSTEM_PREFIX =
  `${STUDY_SYSTEM_PREFIX}Foco: finanças de consultoria ambiental, fluxo de caixa, contratos, faturamento e rentabilidade **por projeto** (Projetos & ROI). Use os dados de contexto quando fornecidos; não invente valores. Diferencie DRE gerencial do projeto vs DRE Contábil global. `;

export type AssistantModo = 'rapido' | 'completo';

export async function handleAskAssistant(
  data: AssistantInput & { modo?: AssistantModo; roiContext?: string },
): Promise<{ success: boolean; response?: string; error?: string; provider?: string }> {
  const task: AiTaskKind =
    data.modo === 'completo'
      ? 'chat_heavy'
      : data.modo === 'rapido'
        ? 'chat_light'
        : classifyChatTask(data.tipo, data.prompt);

  let systemPrefix = STUDY_SYSTEM_PREFIX;
  if (data.tipo === 'outorga') systemPrefix = OUTORGA_SYSTEM_PREFIX;
  else if (data.tipo === 'financeiro') systemPrefix = FINANCEIRO_SYSTEM_PREFIX;

  const promptWithContext =
    data.tipo === 'financeiro' && data.roiContext?.trim()
      ? `${data.roiContext.trim()}\n\n---\n\nPergunta do utilizador:\n${data.prompt}`
      : data.prompt;

  const result = await routedChatCompletion({
    prompt: promptWithContext,
    tipo: data.tipo ?? 'geral',
    systemPrefix,
    task,
    temperature: 0.2,
    max_tokens: 3072,
  });

  if (result.ok) {
    return {
      success: true,
      response: result.reply,
      provider: result.provider,
    };
  }

  return {
    success: false,
    error: result.error || 'Falha na resposta da IA.',
  };
}
