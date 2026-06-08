import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import {
  isBootstrapAdminEmail,
  resolveRegisterRole,
  shouldBlockPublicRegistration,
} from "@/lib/admin-bootstrap";
import type { AppUser } from "@/lib/types";
import {
  buildPlatformSubscriptionFieldsForNewTitular,
  clientPackageRequiresAnnualPaymentStep,
  isPlatformPaymentAutoApproveEnabled,
} from "@/lib/platform-access";
import { getAmbbotUsagePeriodKey } from "@/lib/package-limits";
import {
  normalizeDocument,
  isValidCpfOrCnpj,
} from "../schemas/register.schema";
import { createAccessRequest } from "./create-access-request.service";
import { createOrUpdateClientEmpreendedor } from "./create-client-empreendedor.service";
import { createPlatformPaymentRequest } from "./create-platform-payment-request.service";
import {
  recordPlatformContract,
  resolveTitularDocument,
} from "./record-platform-contract.service";
import type { SubmitRegisterInput, SubmitRegisterResult } from "../types/register.types";
import {
  isDelegatePortalMode,
  isTitularPlanMode,
} from "../types/register.types";

export async function submitRegisterForm(
  input: SubmitRegisterInput,
): Promise<SubmitRegisterResult> {
  const { values, mode, auth, firestore, linked, payment, platformCompany, getIdToken } =
    input;

  if (!auth || !firestore) {
    return {
      ok: false,
      reason: "services_unavailable",
      message: "Serviços não disponíveis. Tente novamente.",
    };
  }

  const hasLinkedTitularDoc = isValidCpfOrCnpj(values.cpfCnpjTitular);
  if (!hasLinkedTitularDoc && mode === "representative") {
    return {
      ok: false,
      reason: "validation",
      message: "Informe o CPF ou CNPJ do titular ao qual solicita acesso.",
    };
  }

  if (isTitularPlanMode(mode)) {
    if (!payment.paymentAcknowledged) {
      return {
        ok: false,
        reason: "validation",
        message:
          "Marque a confirmação na etapa de pagamento para concluir o cadastro.",
      };
    }
    if (
      clientPackageRequiresAnnualPaymentStep(values.selectedPackage) &&
      !payment.paymentMethod
    ) {
      return {
        ok: false,
        reason: "validation",
        message: "Selecione PIX, cartão de crédito ou cartão de débito.",
      };
    }
  }

  const normalizedEmail = values.email.trim().toLowerCase();
  if (isBootstrapAdminEmail(normalizedEmail)) {
    return {
      ok: false,
      reason: "blocked",
      message:
        "O administrador do sistema entra em /login com este e-mail, não pelo cadastro público.",
    };
  }

  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      values.email,
      values.password,
    );
    const uid = cred.user.uid;

    const existingProfileSnap = await getDoc(doc(firestore, "users", uid));
    const existingProfile = existingProfileSnap.exists()
      ? (existingProfileSnap.data() as Pick<AppUser, "role">)
      : null;

    if (shouldBlockPublicRegistration(normalizedEmail, existingProfile)) {
      return {
        ok: false,
        reason: "blocked",
        message:
          "Esta conta é de administrador. Faça login em /login ou peça suporte à consultoria.",
      };
    }

    const userCpfNormalized = normalizeDocument(values.cpf);
    const titularDocument = resolveTitularDocument(values, mode, userCpfNormalized);
    const hasExistingLink = Boolean(linked.linkedClientId || linked.linkedEmpreendedorId);

    const subscriptionFields =
      isTitularPlanMode(mode) && values.selectedPackage
        ? buildPlatformSubscriptionFieldsForNewTitular(
            values.selectedPackage,
            clientPackageRequiresAnnualPaymentStep(values.selectedPackage)
              ? payment.paymentMethod
              : null,
          )
        : {};

    const extraVerified: Record<string, unknown> = {};
    if (
      isTitularPlanMode(mode) &&
      isPlatformPaymentAutoApproveEnabled() &&
      clientPackageRequiresAnnualPaymentStep(values.selectedPackage)
    ) {
      extraVerified.platformPaymentVerifiedAt = serverTimestamp();
    }

    const registerRole = resolveRegisterRole(normalizedEmail, mode, existingProfile);

    await setDoc(
      doc(firestore, "users", uid),
      {
        uid,
        name: values.name,
        email: normalizedEmail,
        phone: values.phone,
        cpf:
          mode === "representative" && titularDocument.length === 14
            ? ""
            : titularDocument,
        userCpf: userCpfNormalized,
        cnpjs: titularDocument.length === 14 ? [titularDocument] : [],
        role: registerRole,
        status: "active",
        package: isDelegatePortalMode(mode) ? null : values.selectedPackage,
        contractAcceptedAt: isDelegatePortalMode(mode) ? null : serverTimestamp(),
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isOnline: false,
        cadastroIncompleto: isDelegatePortalMode(mode)
          ? false
          : isTitularPlanMode(mode)
            ? !hasExistingLink
            : true,
        ...(linked.linkedClientId ? { linkedClientId: linked.linkedClientId } : {}),
        ...(linked.linkedEmpreendedorId
          ? { linkedEmpreendedorId: linked.linkedEmpreendedorId }
          : {}),
        ...(isTitularPlanMode(mode)
          ? {
              allowsCommercialContact:
                values.selectedPackage === "basico"
                  ? true
                  : Boolean(values.marketingContactConsent),
            }
          : {}),
        ...subscriptionFields,
        ...extraVerified,
        ...(isTitularPlanMode(mode)
          ? {
              ambbotUsagePeriod: getAmbbotUsagePeriodKey(),
              ambbotIncludedUsed: 0,
              ambbotPrepaidCredits: 0,
            }
          : {}),
      },
      { merge: true },
    );

    await recordPlatformContract({
      uid,
      values,
      mode,
      payment,
      paymentAcknowledged: payment.paymentAcknowledged,
      userCpfNormalized,
      titularDocument,
      getIdToken,
      platformCompany,
    });

    await createPlatformPaymentRequest({
      firestore,
      uid,
      values,
      payment,
    });

    if (isDelegatePortalMode(mode)) {
      await createAccessRequest({ firestore, uid, values, mode });
    }

    if (isTitularPlanMode(mode)) {
      await createOrUpdateClientEmpreendedor({
        firestore,
        uid,
        values,
        linked,
      });
    }

    const pendingPay =
      isTitularPlanMode(mode) &&
      clientPackageRequiresAnnualPaymentStep(values.selectedPackage) &&
      !isPlatformPaymentAutoApproveEnabled();

    return { ok: true, pendingPayment: pendingPay };
  } catch (error: unknown) {
    const err = error as { code?: string; message?: string };
    return {
      ok: false,
      reason: "auth",
      message:
        err.code === "auth/email-already-in-use"
          ? "Este e-mail já está cadastrado. Tente fazer login."
          : err.code === "auth/weak-password"
            ? "A senha deve ter no mínimo 6 caracteres."
            : "Ocorreu um erro ao criar sua conta. Tente novamente.",
    };
  }
}
