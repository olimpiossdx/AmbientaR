import { PACKAGE_LIMITS, PACKAGE_ANNUAL_PRICE_BRL } from "@/lib/package-limits";
import type { ClientPackage } from "@/lib/types";
import {
  buildGratuitoLegacyNoticeHtml,
  buildPaidSubscriptionClausesHtml,
  getPlatformSubscriptionContractVersion,
} from "./clauses";
import { formatClientContextLine } from "./parse-client-context";
import type {
  PlatformSubscriptionBillingMode,
  PlatformSubscriptionCardDisplay,
  PlatformSubscriptionClientContext,
  RecordPlatformSubscriptionAcceptanceInput,
} from "./types";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cardBlock(card: PlatformSubscriptionCardDisplay | undefined): string {
  if (!card) return "<p style='font-size:11px;'>Cartão: dados não informados no ato do cadastro.</p>";
  const lines = [
    card.holderName ? `Titular: ${escapeHtml(card.holderName)}` : null,
    card.brand ? `Bandeira: ${escapeHtml(card.brand)}` : null,
    card.last4 ? `Final: **** ${escapeHtml(card.last4)}` : null,
    card.expiryMonth && card.expiryYear
      ? `Validade: ${escapeHtml(card.expiryMonth)}/${escapeHtml(card.expiryYear)}`
      : null,
  ].filter(Boolean);
  return `<p style="font-size:11px;">${lines.join(" · ") || "—"}</p>
    <p style="font-size:10px;color:#666;"><em>Código de segurança (CVV) não é armazenado.</em></p>`;
}

function methodLabel(method: string | undefined): string {
  switch (method) {
    case "pix":
      return "PIX";
    case "credit_card":
      return "Cartão de crédito";
    case "debit_card":
      return "Cartão de débito";
    default:
      return "—";
  }
}

function billingLabel(mode: PlatformSubscriptionBillingMode | undefined): string {
  return mode === "monthly_12x" ? "12 parcelas mensais (sem juros)" : "À vista (anual)";
}

export function buildPlatformSubscriptionContractHtml(
  input: RecordPlatformSubscriptionAcceptanceInput,
): { html: string; version: string; recordKind: "paid_subscription" | "gratuito_legacy" } {
  const signedAt = new Date();
  const signedIso = signedAt.toISOString();
  const pkg = input.packageId;
  const isPaid = pkg !== "gratuito" && pkg !== "sob_consulta";
  const recordKind = isPaid ? "paid_subscription" : "gratuito_legacy";
  const annual = isPaid ? PACKAGE_ANNUAL_PRICE_BRL[pkg] : undefined;
  const billingMode = input.billingMode ?? "annual_upfront";
  const packageLabel = PACKAGE_LIMITS[pkg]?.tierLabel ?? pkg;
  const company = escapeHtml(input.platformCompanyName ?? "CONTRATADA");

  const clauses = isPaid && annual
    ? buildPaidSubscriptionClausesHtml({
        packageId: pkg,
        packageLabel,
        annualAmountBrl: annual,
        billingMode,
        paymentMethod: input.paymentMethod ?? undefined,
        platformCompanyName: input.platformCompanyName ?? "CONTRATADA",
      })
    : buildGratuitoLegacyNoticeHtml();

  const cnpjLine =
    input.cnpjs?.length ? input.cnpjs.join(", ") : input.cpf ?? "—";

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"/><title>Contrato Plataforma — ${escapeHtml(input.name)}</title></head>
<body style="font-family:Georgia,serif;max-width:800px;margin:24px auto;color:#111;">
  ${clauses}

  <hr style="margin:20px 0;border:none;border-top:1px solid #ccc;"/>
  <h3 style="font-size:12px;">ANEXO A — Dados do cadastro (CONTRATANTE)</h3>
  <table style="font-size:11px;width:100%;border-collapse:collapse;">
    <tr><td style="padding:4px 8px 4px 0;"><strong>Nome</strong></td><td>${escapeHtml(input.name)}</td></tr>
    <tr><td style="padding:4px 8px 4px 0;"><strong>E-mail</strong></td><td>${escapeHtml(input.userEmail)}</td></tr>
    <tr><td style="padding:4px 8px 4px 0;"><strong>Telefone</strong></td><td>${escapeHtml(input.phone ?? "—")}</td></tr>
    <tr><td style="padding:4px 8px 4px 0;"><strong>CPF/CNPJ</strong></td><td>${escapeHtml(cnpjLine)}</td></tr>
    <tr><td style="padding:4px 8px 4px 0;"><strong>Perfil</strong></td><td>${escapeHtml(input.role)}</td></tr>
    <tr><td style="padding:4px 8px 4px 0;"><strong>Assinatura em</strong></td><td>${escapeHtml(signedAt.toLocaleString("pt-BR"))}</td></tr>
  </table>

  <h3 style="font-size:12px;margin-top:16px;">ANEXO B — Pagamento e vigência</h3>
  <table style="font-size:11px;width:100%;border-collapse:collapse;">
    <tr><td style="padding:4px 8px 4px 0;"><strong>Plano</strong></td><td>${escapeHtml(packageLabel)}</td></tr>
    ${
      isPaid && annual
        ? `<tr><td style="padding:4px 8px 4px 0;"><strong>Valor anual</strong></td><td>R$ ${annual.toFixed(2).replace(".", ",")}</td></tr>
    <tr><td style="padding:4px 8px 4px 0;"><strong>Forma</strong></td><td>${escapeHtml(billingLabel(billingMode))}</td></tr>
    <tr><td style="padding:4px 8px 4px 0;"><strong>Meio</strong></td><td>${escapeHtml(methodLabel(input.paymentMethod ?? undefined))}</td></tr>
    <tr><td style="padding:4px 8px 4px 0;"><strong>Pagamento confirmado</strong></td><td>${input.paymentConfirmed ? "Sim (registro no ato)" : "Pendente confirmação pela CONTRATADA"}</td></tr>`
        : `<tr><td colspan="2">Plano sem cobrança anual neste registro.</td></tr>`
    }
  </table>
  ${input.paymentMethod === "credit_card" || input.paymentMethod === "debit_card" ? cardBlock(input.cardDisplay) : ""}

  <h3 style="font-size:12px;margin-top:16px;">ANEXO C — Evidências do aceite eletrônico</h3>
  <p style="font-size:11px;">${escapeHtml(formatClientContextLine(input.clientContext))}</p>
  <p style="font-size:10px;color:#666;">Registro gerado automaticamente pela rotina de assinatura da plataforma (${getPlatformSubscriptionContractVersion()}).</p>
</body>
</html>`;

  return { html, version: getPlatformSubscriptionContractVersion(), recordKind };
}
