import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import {
  apiAuthErrorResponse,
  getBearerToken,
  requireAuthenticatedApi,
} from "@/lib/api-auth";
import { adminDb } from "@/lib/firebase-admin";
import { isClientePortalRole } from "@/lib/role-guards";
import {
  buildPlatformSubscriptionFieldsForNewTitular,
  clientPackageRequiresAnnualPaymentStep,
  isPlatformPaymentAutoApproveEnabled,
} from "@/lib/platform-access";
import type { ClientPackage } from "@/lib/types";

const ALLOWED_PACKAGES: ClientPackage[] = [
  "gratuito",
  "basico",
  "intermediario",
  "avancado",
  "completo",
  "sob_consulta",
];

export async function POST(req: Request) {
  try {
    const user = await requireAuthenticatedApi(req);
    if (!isClientePortalRole(user.role)) {
      return NextResponse.json(
        { error: "Alteração de plano disponível apenas para titulares do portal." },
        { status: 403 },
      );
    }

    const body = (await req.json()) as { packageId?: ClientPackage };
    const packageId = body.packageId;
    if (!packageId || !ALLOWED_PACKAGES.includes(packageId)) {
      return NextResponse.json({ error: "Plano inválido." }, { status: 400 });
    }

    const uid = user.uid || user.id;
    const subscriptionFields = buildPlatformSubscriptionFieldsForNewTitular(
      packageId,
      null,
    );

    const patch: Record<string, unknown> = {
      package: packageId,
      packageUpdatedAt: FieldValue.serverTimestamp(),
      ...subscriptionFields,
    };

    if (packageId === "gratuito") {
      patch.allowsCommercialContact = true;
    }

    await adminDb().collection("users").doc(uid).update(patch);

    const isPaidPlan = clientPackageRequiresAnnualPaymentStep(packageId);
    const autoPaid = isPaidPlan && isPlatformPaymentAutoApproveEnabled();

    return NextResponse.json({
      ok: true,
      packageId,
      platformPaymentStatus: subscriptionFields.platformPaymentStatus,
      removesAdvertising:
        packageId !== "gratuito" &&
        (autoPaid || subscriptionFields.platformPaymentStatus === "paid"),
      pendingPayment:
        isPaidPlan && subscriptionFields.platformPaymentStatus === "pending_verification",
    });
  } catch (error) {
    if (!getBearerToken(req)) {
      return apiAuthErrorResponse(error);
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao alterar o plano.",
      },
      { status: 500 },
    );
  }
}
