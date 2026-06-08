import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { PlatformPaymentMethod, PlatformContractPublic } from "@/lib/types";
import type { RegisterFormValues } from "../schemas/register.schema";

/** Perfis selecionáveis no cadastro público. */
export type RegisterProfileMode =
  | "cliente_autonomo"
  | "representative"
  | "consultor_representante";

export type RegisterStep = 1 | 2 | 3 | 4;

export const TITULAR_STEP_COUNT = 4;

export type RegisterLinkedEntities = {
  linkedClientId: string | null;
  linkedEmpreendedorId: string | null;
};

export type RegisterPaymentState = {
  paymentMethod: PlatformPaymentMethod;
  billingMode: "annual_upfront" | "monthly_12x";
  cardHolder: string;
  cardLast4: string;
  cardExpiryMonth: string;
  cardExpiryYear: string;
  cardBrand: string;
  paymentAcknowledged: boolean;
};

export type SubmitRegisterInput = {
  values: RegisterFormValues;
  mode: RegisterProfileMode;
  auth: Auth;
  firestore: Firestore;
  linked: RegisterLinkedEntities;
  payment: RegisterPaymentState;
  platformCompany?: PlatformContractPublic | null;
  getIdToken: () => Promise<string>;
};

export type SubmitRegisterResult =
  | { ok: true; pendingPayment: boolean }
  | { ok: false; reason: "services_unavailable" | "blocked" | "validation" | "auth"; message: string };

export type SubmitRegisterToast = {
  title: string;
  description: string;
  variant?: "destructive";
};

export function parseRegisterProfileFromTipo(
  tipo: string | null | undefined,
): RegisterProfileMode {
  if (tipo === "representante") return "representative";
  if (tipo === "consultor" || tipo === "consultor_representante") {
    return "consultor_representante";
  }
  if (tipo === "cliente_autonomo" || tipo === "autonomo") return "cliente_autonomo";
  /** Legado `?tipo=client`: auto-cadastro Gestão desativado — tratado à parte. */
  return "cliente_autonomo";
}

export function isTitularPlanMode(mode: RegisterProfileMode): boolean {
  return mode === "cliente_autonomo";
}

export function isDelegatePortalMode(mode: RegisterProfileMode): boolean {
  return mode === "representative" || mode === "consultor_representante";
}

export function buildSubmitSuccessToast(
  mode: RegisterProfileMode,
  pendingPay: boolean,
): SubmitRegisterToast {
  return {
    title: "Cadastro realizado com sucesso!",
    description:
      mode === "representative"
        ? "Sua conta de representante foi criada. Aguarde o titular conceder acesso aos dados."
        : mode === "consultor_representante"
          ? "Sua conta de consultor foi criada. Aguarde o titular aprovar sua carteira."
          : pendingPay
            ? "Sua conta foi criada. O acesso à plataforma será liberado após a confirmação do pagamento anual."
            : mode === "cliente_autonomo"
              ? "Bem-vindo ao AmbientaR como Cliente Autônomo. Você será redirecionado."
              : "Bem-vindo ao AmbientaR. Você será redirecionado.",
  };
}

export function mapAuthErrorToMessage(error: { code?: string }): string {
  if (error.code === "auth/email-already-in-use") {
    return "Este e-mail já está cadastrado. Tente fazer login.";
  }
  if (error.code === "auth/weak-password") {
    return "A senha deve ter no mínimo 6 caracteres.";
  }
  return "Ocorreu um erro ao criar sua conta. Tente novamente.";
}

export type { User as RegisterAuthUser } from "firebase/auth";
