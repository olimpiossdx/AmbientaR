'use server';

import type { AssistantInput } from '@/lib/types';
import { classifyChatTask, type AiTaskKind } from '@/lib/ai-router';
import { routedChatCompletion } from '@/lib/ai-run-chat';

const STUDY_SYSTEM_PREFIX =
  'És o assistente AmbientaR (Pimenta Consultoria). O utilizador elabora estudos ambientais em MG/Brasil (documentos técnicos, licenciamento, relatórios). ';

const OUTORGA_SYSTEM_PREFIX =
  `${STUDY_SYSTEM_PREFIX}Foco: outorga de recursos hídricos em Minas Gerais (Decreto 47.705/2019, Portaria IGAM 48/2019, Tabela 01 de modos de uso, SOUT/EcoSistemas). Cite códigos de modo de uso e documentos do checklist quando relevante. `;

export type AssistantModo = 'rapido' | 'completo';

export async function handleAskAssistant(
  data: AssistantInput & { modo?: AssistantModo },
): Promise<{ success: boolean; response?: string; error?: string; provider?: string }> {
  const task: AiTaskKind =
    data.modo === 'completo'
      ? 'chat_heavy'
      : data.modo === 'rapido'
        ? 'chat_light'
        : classifyChatTask(data.tipo, data.prompt);
  const result = await routedChatCompletion({
    prompt: data.prompt,
    tipo: data.tipo ?? 'geral',
    systemPrefix:
      data.tipo === 'outorga' ? OUTORGA_SYSTEM_PREFIX : STUDY_SYSTEM_PREFIX,
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
