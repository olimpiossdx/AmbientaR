import type { ClientPackage, PlatformPaymentMethod } from "@/lib/types";
import type { PlatformSubscriptionBillingMode } from "./types";

const CONTRACT_VERSION = "platform-subscription-v1-2026-05";

export function getPlatformSubscriptionContractVersion(): string {
  return CONTRACT_VERSION;
}

function methodLabel(method: PlatformPaymentMethod | undefined): string {
  switch (method) {
    case "pix":
      return "PIX";
    case "credit_card":
      return "Cartão de crédito";
    case "debit_card":
      return "Cartão de débito";
    default:
      return "Conforme instruções da plataforma";
  }
}

function billingLabel(mode: PlatformSubscriptionBillingMode | undefined): string {
  return mode === "monthly_12x"
    ? "12 (doze) parcelas mensais, sem juros, valor total igual ao anual"
    : "Pagamento à vista do valor anual";
}

export function buildPaidSubscriptionClausesHtml(opts: {
  packageId: ClientPackage;
  packageLabel: string;
  annualAmountBrl: number;
  billingMode: PlatformSubscriptionBillingMode;
  paymentMethod?: PlatformPaymentMethod;
  platformCompanyName: string;
}): string {
  const monthly = (opts.annualAmountBrl / 12).toFixed(2).replace(".", ",");
  const annual = opts.annualAmountBrl.toFixed(2).replace(".", ",");

  return `
    <h2 style="text-align:center;font-size:14px;margin:0 0 12px;">
      CONTRATO DE PRESTAÇÃO DE SERVIÇOS — PLATAFORMA AMBIENTAR (ASSINATURA ANUAL)
    </h2>
    <p style="font-size:11px;"><strong>CONTRATADA:</strong> ${escapeHtml(opts.platformCompanyName)}</p>
    <p style="font-size:11px;margin-bottom:12px;">
      <strong>CONTRATANTE:</strong> identificado no Anexo A (dados de cadastro no ato da assinatura).
    </p>

    <h3 style="font-size:12px;">CLÁUSULA 1ª — Vigência e acesso</h3>
    <p style="font-size:11px;">1.1. A vigência contratual de <strong>12 (doze) meses</strong> inicia-se na data e hora da
    <strong>assinatura eletrônica</strong> registrada neste instrumento.</p>
    <p style="font-size:11px;">1.2. O acesso pleno à plataforma AmbientaR fica condicionado à
    <strong>confirmação do pagamento</strong> pela CONTRATADA, conforme Anexo B, sem prejuízo do registro da assinatura.</p>
    <p style="font-size:11px;">1.3. Plano contratado: <strong>${escapeHtml(opts.packageLabel)}</strong> (${escapeHtml(opts.packageId)}).</p>

    <h3 style="font-size:12px;">CLÁUSULA 2ª — Preço e forma de pagamento (sem juros)</h3>
    <p style="font-size:11px;">2.1. Valor anual de referência: <strong>R$ ${annual}</strong> (doze meses de acompanhamento/licença de uso).</p>
    <p style="font-size:11px;">2.2. Forma escolhida: <strong>${escapeHtml(billingLabel(opts.billingMode))}</strong>.
    ${opts.billingMode === "monthly_12x" ? ` Parcela mensal: <strong>R$ ${monthly}</strong>, sem acréscimo de juros.` : ""}</p>
    <p style="font-size:11px;">2.3. Meio de pagamento indicado: <strong>${escapeHtml(methodLabel(opts.paymentMethod))}</strong>.</p>
    <p style="font-size:11px;">2.4. Após o fechamento do pacote, o pagamento <strong>não pode ser suspenso</strong> por mera desistência
    ou redução de uso; o compromisso financeiro permanece pelo período contratado.</p>

    <h3 style="font-size:12px;">CLÁUSULA 3ª — Rescisão antecipada e continuidade da cobrança</h3>
    <p style="font-size:11px;">3.1. O CONTRATANTE reconhece que, tendo contratado o período anual, o encerramento antecipado
    <strong>não extingue</strong> as parcelas ou o saldo do valor anual ainda devido.</p>
    <p style="font-size:11px;">3.2. Exemplo: se contratou 12 meses e utilizou 2 meses, ainda deverá quitar o restante do período
    (parcelado ou à vista, conforme opção no ato da assinatura), <strong>sem valores adicionais de multa</strong>, permanecendo
    a obrigação de pagamento até o final do contrato.</p>
    <p style="font-size:11px;">3.3. A inadimplência poderá ensejar suspensão de acesso, sem cancelar a dívida.</p>

    <h3 style="font-size:12px;">CLÁUSULA 4ª — Aceite eletrônico e prova</h3>
    <p style="font-size:11px;">4.1. O aceite com login/senha e confirmação na plataforma produz efeitos de assinatura (MP 2.200-2/2001 e legislação aplicável).</p>
    <p style="font-size:11px;">4.2. A CONTRATADA armazena cópia datada deste instrumento, com dados do cadastro, pagamento (exceto código de segurança de cartão),
    endereço IP e identificação do equipamento/navegador quando disponível (Anexo C).</p>
    <p style="font-size:11px;">4.3. Versão do instrumento: <strong>${CONTRACT_VERSION}</strong>.</p>
  `;
}

export function buildGratuitoLegacyNoticeHtml(): string {
  return `
    <h2 style="text-align:center;font-size:14px;">REGISTRO DE ACEITE — PLANO GRATUITO</h2>
    <p style="font-size:11px;">O CONTRATANTE aceitou, no cadastro, os Termos de Uso e Contrato de Licença exibidos na tela de registro
    (plano Gratuito), mantendo-se as regras atuais desse plano, inclusive limites técnicos, publicidade de terceiros no aplicativo e no site,
    autorização de contato comercial da CONTRATADA (ligações, e-mails, notificações push, atualizações do app e demais canais),
    uso de dados para oferecimento de serviços e renúncia a reclamações quanto a essas práticas, conforme cláusulas do plano Gratuito.</p>
    <p style="font-size:11px;">Este registro guarda cópia datada do aceite e dos dados de cadastro para fins de auditoria.</p>
    <p style="font-size:11px;">Versão: <strong>${CONTRACT_VERSION}</strong>.</p>
  `;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
