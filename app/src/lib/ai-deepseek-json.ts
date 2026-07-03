import { extractJsonObject } from "@/lib/ai-json";
import {
  deepseekChatCompletion,
  DEEPSEEK_DEFAULT_MODEL,
} from "@/lib/deepseek-chat-server";
import type { z } from "zod";

export const DEEPSEEK_HEAVY_MODEL = DEEPSEEK_DEFAULT_MODEL;

export async function deepseekJsonCompletion<T extends z.ZodTypeAny>(
  apiKey: string,
  params: {
    system: string;
    user: string;
    schema: T;
    model?: string;
    max_tokens?: number;
    temperature?: number;
  },
): Promise<z.infer<T>> {
  const result = await deepseekChatCompletion(
    {
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
      model: params.model ?? DEEPSEEK_HEAVY_MODEL,
      temperature: params.temperature ?? 0.15,
      max_tokens: params.max_tokens ?? 4096,
    },
    apiKey,
  );

  if (!result.ok) {
    throw new Error(result.error);
  }

  const raw = extractJsonObject(result.reply);
  const parsed = params.schema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `A DeepSeek respondeu, mas o JSON não corresponde ao esperado: ${parsed.error.message}`,
    );
  }
  return parsed.data;
}

export async function deepseekTextCompletion(
  apiKey: string,
  params: {
    system: string;
    user: string;
    model?: string;
    max_tokens?: number;
    temperature?: number;
  },
): Promise<string> {
  const result = await deepseekChatCompletion(
    {
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
      model: params.model ?? DEEPSEEK_HEAVY_MODEL,
      temperature: params.temperature ?? 0.2,
      max_tokens: params.max_tokens ?? 4096,
    },
    apiKey,
  );

  if (!result.ok) {
    throw new Error(result.error);
  }
  return result.reply;
}
