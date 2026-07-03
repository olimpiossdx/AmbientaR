import { NextRequest, NextResponse } from "next/server";
import { recordPlatformSubscriptionAcceptance } from "@/lib/platform-subscription-contract/record-acceptance";
import { verifyPlatformContractRequestUser } from "@/lib/platform-subscription-contract/verify-request-user";
import { parseClientContextFromUserAgent } from "@/lib/platform-subscription-contract/parse-client-context";
import type {
  PlatformSubscriptionBillingMode,
  PlatformSubscriptionCardDisplay,
} from "@/lib/platform-subscription-contract/types";
import type { ClientPackage, PlatformPaymentMethod } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const user = await verifyPlatformContractRequestUser(req.headers.get("authorization"));
    const body = (await req.json()) as {
      userId?: string;
      name?: string;
      phone?: string;
      cpf?: string;
      cnpjs?: string[];
      role?: string;
      packageId?: ClientPackage;
      paymentMethod?: PlatformPaymentMethod | null;
      billingMode?: PlatformSubscriptionBillingMode;
      paymentConfirmed?: boolean;
      cardDisplay?: PlatformSubscriptionCardDisplay;
      clientUserAgent?: string;
      platformCompanyName?: string;
      platformCompanyCnpj?: string;
    };

    if (body.userId && body.userId !== user.uid) {
      return NextResponse.json(
        { success: false, error: "userId não corresponde ao token." },
        { status: 403 },
      );
    }

    const packageId = body.packageId;
    if (!packageId) {
      return NextResponse.json(
        { success: false, error: "packageId obrigatório." },
        { status: 400 },
      );
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? undefined;
    const ua = body.clientUserAgent ?? req.headers.get("user-agent") ?? undefined;

    const result = await recordPlatformSubscriptionAcceptance({
      userId: user.uid,
      userEmail: user.email,
      name: body.name ?? user.name ?? "—",
      phone: body.phone,
      cpf: body.cpf,
      cnpjs: body.cnpjs,
      role: body.role ?? "client",
      packageId,
      paymentMethod: body.paymentMethod ?? undefined,
      billingMode: body.billingMode ?? "annual_upfront",
      paymentConfirmed: Boolean(body.paymentConfirmed),
      cardDisplay: body.cardDisplay,
      clientContext: parseClientContextFromUserAgent(ua, ip),
      platformCompanyName: body.platformCompanyName,
      platformCompanyCnpj: body.platformCompanyCnpj,
    });

    return NextResponse.json({
      success: true,
      acceptanceId: result.acceptance.id,
      ledgerId: result.ledger.id,
      signedAt: result.acceptance.signedAt,
    });
  } catch (e) {
    return NextResponse.json(
      {
        success: false,
        error: e instanceof Error ? e.message : "Erro ao registrar assinatura.",
      },
      { status: e instanceof Error && e.message.includes("Token") ? 401 : 500 },
    );
  }
}
