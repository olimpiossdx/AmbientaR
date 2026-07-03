import {
  markPlatformPaymentConfirmed,
  recordBillingWebhookEvent,
  wasBillingEventProcessed,
} from "@/lib/billing/sync-platform-access";
import { findPaymentRequestByTxid } from "@/lib/billing/create-charge";
import { parseSicoobWebhookBody } from "@/lib/sicoob-pix/webhook";
import { isSicoobChargePaidStatus } from "@/lib/sicoob-pix/cob";

export async function processSicoobPixWebhook(
  rawBody: unknown,
  eventId?: string,
): Promise<{
  processed: number;
  results: Array<{ txid: string; ok: boolean; message: string }>;
}> {
  const items = parseSicoobWebhookBody(rawBody);
  const results: Array<{ txid: string; ok: boolean; message: string }> = [];

  for (const item of items) {
    const txid = item.txid?.trim();
    if (!txid) {
      results.push({ txid: "?", ok: false, message: "Item sem txid." });
      continue;
    }

    const dedupeKey = eventId ?? `webhook-${txid}-${item.endToEndId ?? item.horario ?? "x"}`;
    if (await wasBillingEventProcessed(dedupeKey)) {
      results.push({ txid, ok: true, message: "Evento já processado (idempotente)." });
      continue;
    }

    const request = await findPaymentRequestByTxid(txid);
    if (!request) {
      await recordBillingWebhookEvent(dedupeKey, {
        txid,
        warning: "Pedido não encontrado",
        item,
      });
      results.push({ txid, ok: false, message: "Pedido não encontrado para txid." });
      continue;
    }

    if (request.data.status === "confirmed") {
      results.push({ txid, ok: true, message: "Já confirmado." });
      continue;
    }

    await markPlatformPaymentConfirmed({
      userId: request.data.userId,
      packageId: request.data.packageId,
      txid,
      requestId: request.id,
      method: "pix",
      resolvedBy: "webhook",
    });

    await recordBillingWebhookEvent(dedupeKey, {
      txid,
      userId: request.data.userId,
      item,
    });

    results.push({ txid, ok: true, message: "Pagamento confirmado e acesso liberado." });
  }

  if (items.length === 0 && typeof rawBody === "object" && rawBody !== null) {
    const body = rawBody as Record<string, unknown>;
    const txid = typeof body.txid === "string" ? body.txid : null;
    const status = typeof body.status === "string" ? body.status : "";
    if (txid && isSicoobChargePaidStatus(status)) {
      const dedupeKey = eventId ?? `webhook-status-${txid}-${status}`;
      if (!(await wasBillingEventProcessed(dedupeKey))) {
        const request = await findPaymentRequestByTxid(txid);
        if (request && request.data.status !== "confirmed") {
          await markPlatformPaymentConfirmed({
            userId: request.data.userId,
            packageId: request.data.packageId,
            txid,
            requestId: request.id,
            method: "pix",
            resolvedBy: "webhook",
          });
          await recordBillingWebhookEvent(dedupeKey, { txid, status });
          results.push({ txid, ok: true, message: "Confirmado via status de cobrança." });
        }
      }
    }
  }

  return { processed: results.filter((r) => r.ok).length, results };
}
