import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getBearerToken } from "@/lib/api-auth";
import { diagnoseSicoobConfig } from "@/lib/sicoob-pix/diagnostics";
import { testSicoobOAuth } from "@/lib/sicoob-pix/oauth";
import { buildPlatformPaymentTxid, isValidPlatformPaymentTxid } from "@/lib/billing/txid";
import { resolvePackageAnnualAmountBrl } from "@/lib/billing/pricing";
import { createSicoobImmediateCharge } from "@/lib/sicoob-pix/cob";
import { processSicoobPixWebhook } from "@/lib/billing/process-webhook";
import { markPlatformPaymentExpired } from "@/lib/billing/sync-platform-access";
import { adminDb } from "@/lib/firebase-admin";
import type { UserRole } from "@/lib/types";

const PHASES = [
  {
    id: 1,
    name: "sync-platform-access",
    description: "Liberação/revogação de acesso no Firestore",
  },
  {
    id: 2,
    name: "sicoob-config-oauth",
    description: "Configuração Sicoob + token OAuth mTLS",
  },
  {
    id: 3,
    name: "create-charge",
    description: "Cobrança Pix imediata (QR dinâmico por valor)",
  },
  {
    id: 4,
    name: "webhook",
    description: "Processamento de webhook / confirmação",
  },
  {
    id: 5,
    name: "ui-checkout",
    description: "Componente DynamicPixCheckout no cadastro",
  },
  {
    id: 6,
    name: "cron-lapse",
    description: "Expiração automática de assinaturas",
  },
] as const;

function allowDebug(req: NextRequest): boolean {
  const secret = process.env.BILLING_DEBUG_SECRET?.trim();
  const header = req.headers.get("x-billing-debug-secret");
  if (secret && header === secret) return true;
  return false;
}

async function requireDebugAuth(req: NextRequest) {
  if (allowDebug(req)) return { mode: "secret" as const };
  const token = getBearerToken(req);
  if (!token) throw new Error("Não autorizado.");
  const { adminAuth } = await import("@/lib/firebase-admin");
  const decoded = await adminAuth().verifyIdToken(token);
  const profile = await adminDb().collection("users").doc(decoded.uid).get();
  const role = profile.data()?.role as UserRole | undefined;
  if (!role || !["admin", "financial", "supervisor"].includes(role)) {
    throw new Error("Sem permissão para debug de billing.");
  }
  return { mode: "staff" as const, role };
}

export async function GET(req: NextRequest) {
  try {
    await requireDebugAuth(req);
    const sicoob = diagnoseSicoobConfig();
    return NextResponse.json({
      ok: true,
      phases: PHASES,
      sicoob,
      env: {
        hasBillingDebugSecret: Boolean(process.env.BILLING_DEBUG_SECRET?.trim()),
        hasSicoobWebhookToken: Boolean(process.env.SICOOB_WEBHOOK_ACCESS_TOKEN?.trim()),
        nodeEnv: process.env.NODE_ENV,
      },
      endpoints: {
        createCharge: "POST /api/billing/create-charge",
        chargeStatus: "GET /api/billing/charge-status?txid=",
        webhook: "POST /api/webhooks/sicoob",
        webhookPix: "POST /api/webhooks/sicoob/pix",
        debug: "GET|POST /api/billing/debug",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Não autorizado." },
      { status: 401 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireDebugAuth(req);
    const body = (await req.json()) as {
      phase?: number;
      userId?: string;
      packageId?: "basico" | "intermediario" | "avancado" | "completo";
      txid?: string;
      dryRun?: boolean;
    };

    const phase = body.phase ?? 0;
    switch (phase) {
      case 1: {
        const txid = buildPlatformPaymentTxid(body.userId ?? "debug-user");
        return NextResponse.json({
          ok: true,
          phase: 1,
          checks: {
            txidGenerated: txid,
            txidValid: isValidPlatformPaymentTxid(txid),
            pricingBasico: resolvePackageAnnualAmountBrl("basico"),
          },
          note: "Fase 1 OK se txidValid=true e pricing retorna valor. Confirmação real usa markPlatformPaymentConfirmed.",
        });
      }
      case 2: {
        const config = diagnoseSicoobConfig();
        const oauth = await testSicoobOAuth();
        return NextResponse.json({ ok: true, phase: 2, config, oauth });
      }
      case 3: {
        const txid = buildPlatformPaymentTxid(body.userId ?? "debug-user");
        const pkg = body.packageId ?? "basico";
        const amount = resolvePackageAnnualAmountBrl(pkg);
        if (!amount) {
          return NextResponse.json({ ok: false, error: "Plano sem valor." }, { status: 400 });
        }
        const charge = await createSicoobImmediateCharge({
          txid,
          amountBrl: amount,
          packageId: pkg,
          payerLabel: "Debug AmbientaR",
        });
        return NextResponse.json({ ok: true, phase: 3, charge });
      }
      case 4: {
        const txid = body.txid ?? buildPlatformPaymentTxid(body.userId ?? "debug-user");
        const mockPayload = {
          pix: [
            {
              txid,
              valor: String(resolvePackageAnnualAmountBrl(body.packageId ?? "basico") ?? 696),
              horario: new Date().toISOString(),
              endToEndId: `E2E_DEBUG_${Date.now()}`,
            },
          ],
        };
        if (body.dryRun) {
          return NextResponse.json({ ok: true, phase: 4, dryRun: true, payload: mockPayload });
        }
        const result = await processSicoobPixWebhook(mockPayload, `debug-${Date.now()}`);
        return NextResponse.json({ ok: true, phase: 4, ...result });
      }
      case 5: {
        return NextResponse.json({
          ok: true,
          phase: 5,
          component: "DynamicPixCheckout",
          path: "src/components/billing/dynamic-pix-checkout.tsx",
          integratedInRegister: true,
        });
      }
      case 6: {
        if (body.dryRun || !body.userId) {
          const snap = await adminDb()
            .collection("users")
            .where("platformPaymentStatus", "==", "paid")
            .limit(5)
            .get();
          const candidates = snap.docs.map((d) => ({
            userId: d.id,
            platformAccessValidUntil: d.data().platformAccessValidUntil,
          }));
          return NextResponse.json({
            ok: true,
            phase: 6,
            dryRun: true,
            samplePaidUsers: candidates,
            note: "POST com userId e dryRun:false para marcar expired (debug).",
          });
        }
        if (!body.dryRun) {
          await markPlatformPaymentExpired(body.userId, "admin");
        }
        return NextResponse.json({ ok: true, phase: 6, userId: body.userId, expired: !body.dryRun });
      }
      default:
        return NextResponse.json(
          { ok: false, error: "Informe phase 1–6 no body." },
          { status: 400 },
        );
    }
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Erro no debug." },
      { status: 500 },
    );
  }
}
