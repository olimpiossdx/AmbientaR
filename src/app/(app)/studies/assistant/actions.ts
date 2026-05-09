'use server';

import { askAssistant } from '@/ai/flows/assistant-flow';
import type { AssistantInput } from '@/lib/types';
import { getDeepseekApiKey } from '@/lib/deepseek-env';
import { deepseekChatCompletion } from '@/lib/deepseek-chat-server';

const STUDY_DEEPSEEK_PREFIX =
  'És o assistente AmbientaR (Pimenta Consultoria). O utilizador elabora estudos ambientais em MG/Brasil (documentos técnicos, licenciamento, relatórios). ';

export async function handleAskAssistant(
  data: AssistantInput,
): Promise<{ success: boolean; response?: string; error?: string }> {
  const apiKey = getDeepseekApiKey();
  if (apiKey) {
    const tipo = data.tipo ?? 'geral';
    const result = await deepseekChatCompletion(
      {
        prompt: data.prompt,
        tipo,
        systemPrefix: STUDY_DEEPSEEK_PREFIX,
        temperature: 0.2,
        max_tokens: 3072,
      },
      apiKey,
    );
    if (result.ok) {
      return { success: true, response: result.reply };
    }
    return {
      success: false,
      error: result.error || 'Falha na resposta DeepSeek.',
    };
  }

  try {
    const result = await askAssistant(data);
    if (result && result.response) {
      return { success: true, response: result.response };
    }
    return {
      success: false,
      error: 'Falha ao obter resposta. A resposta da IA estava vazia.',
    };
  } catch (e) {
    console.error(e);
    const errorMessage = e instanceof Error ? e.message : 'Ocorreu um erro desconhecido.';
    return { success: false, error: `Falha ao obter resposta: ${errorMessage}` };
  }
}
