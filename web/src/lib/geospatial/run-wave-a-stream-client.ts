import type { PerimeterParseInput } from "@/lib/geospatial/perimeter";
import type {
  GeoInfluenceAreaConfig,
  GeoLayerResult,
  WaveAAnalysisResult,
} from "@/lib/types/geo-wave-a";

export type WaveAStreamEvent =
  | { type: "layer"; layer: GeoLayerResult; index: number; total: number }
  | { type: "done"; result: WaveAAnalysisResult }
  | { type: "error"; error: string };

/** Executa análise Onda A com progresso por camada (SSE). */
export type WaveAStreamClientOptions = {
  layerIds?: string[];
};

export async function runWaveAAnalysisStreamClient(
  idToken: string,
  input: PerimeterParseInput,
  influenceConfig: GeoInfluenceAreaConfig,
  onEvent: (event: WaveAStreamEvent) => void,
  streamOptions?: WaveAStreamClientOptions,
): Promise<WaveAAnalysisResult> {
  const res = await fetch("/api/geospatial/wave-a/stream", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      dataType: input.dataType,
      data: input.data,
      influenceConfig,
      ...(streamOptions?.layerIds?.length
        ? { layerIds: streamOptions.layerIds }
        : {}),
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }

  if (!res.body) {
    throw new Error("Resposta sem stream.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalResult: WaveAAnalysisResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data:")) continue;
      const json = line.slice(5).trim();
      if (!json) continue;
      const event = JSON.parse(json) as WaveAStreamEvent;
      onEvent(event);
      if (event.type === "error") {
        throw new Error(event.error);
      }
      if (event.type === "done") {
        finalResult = event.result;
      }
    }
  }

  if (!finalResult) {
    throw new Error("Análise terminou sem resultado.");
  }
  return finalResult;
}
