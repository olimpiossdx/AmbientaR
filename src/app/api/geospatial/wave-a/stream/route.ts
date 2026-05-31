import {
  apiAuthErrorResponse,
  requireAuthenticatedApi,
} from "@/lib/api-auth";
import { DEFAULT_INFLUENCE_CONFIG } from "@/lib/geospatial/influence-areas";
import { runWaveAAnalysis } from "@/lib/geospatial/run-wave-a-analysis";
import {
  queryCarsInPerimeter,
  SICAR_WFS_BASE_URL,
} from "@/lib/geospatial/sicar-car-service";
import type { PerimeterParseInput } from "@/lib/geospatial/perimeter";
import type { GeoInfluenceAreaConfig } from "@/lib/types/geo-wave-a";

type BodyShape = {
  dataType?: PerimeterParseInput["dataType"];
  data?: string;
  influenceConfig?: GeoInfluenceAreaConfig;
};

export async function POST(req: Request) {
  try {
    await requireAuthenticatedApi(req);
  } catch (e) {
    return apiAuthErrorResponse(e);
  }

  let body: BodyShape;
  try {
    body = (await req.json()) as BodyShape;
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body?.dataType || !body?.data) {
    return new Response(
      JSON.stringify({ error: "dataType e data são obrigatórios." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const input: PerimeterParseInput = {
    dataType: body.dataType,
    data: body.data,
  };
  const influenceConfig = body.influenceConfig ?? DEFAULT_INFLUENCE_CONFIG;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );
      };
      try {
        const result = await runWaveAAnalysis(
          input,
          influenceConfig,
          ({ layer, index, total }) => {
            send({ type: "layer", layer, index, total });
          },
        );

        if (input.dataType !== "car") {
          try {
            const carQuery = await queryCarsInPerimeter(input);
            if (carQuery.imoveis.length > 0) {
              result.factualSummary = `CAR/SICAR: ${carQuery.resumo}\n\n${result.factualSummary}`;
              result.fontesConsultadas = [
                {
                  nome: "SICAR GeoServer (consulta pública)",
                  url: SICAR_WFS_BASE_URL,
                  tipo: "ogc" as const,
                },
                ...result.fontesConsultadas,
              ];
            }
          } catch {
            /* complementar */
          }
        }

        send({ type: "done", result });
      } catch (error) {
        send({
          type: "error",
          error:
            error instanceof Error
              ? error.message
              : "Falha na análise geoespacial.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
