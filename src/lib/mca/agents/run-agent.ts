import type { McaAgentContext, McaAgentResult } from "../types";
import { agentHandlers } from "./handlers";

export async function runMcaAgent(
  agentId: string,
  ctx: McaAgentContext,
): Promise<McaAgentResult> {
  const handler = agentHandlers[agentId];
  if (!handler) {
    return {
      agentId,
      status: "skipped",
      message: `Agente ${agentId} ainda não implementado (stub).`,
    };
  }
  try {
    return await handler(ctx);
  } catch (e) {
    return {
      agentId,
      status: "fail",
      message: e instanceof Error ? e.message : "Erro no agente",
    };
  }
}
