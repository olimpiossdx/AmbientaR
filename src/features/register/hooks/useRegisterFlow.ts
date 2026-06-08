import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { usePlatformContractPublic } from "@/hooks/use-platform-contract-public";
import {
  lookupClientAndEmpreendedorByDocument,
} from "@/lib/document-lookup";
import {
  resolvePlatformPixCopyPaste,
} from "@/lib/platform-company";
import type { PlatformContractPublic } from "@/lib/types";
import {
  registerFormSchema,
  normalizeDocument,
  isValidCpfOrCnpj,
  type RegisterFormValues,
} from "../schemas/register.schema";
import { submitRegisterForm } from "../services/register-submit.service";
import {
  parseRegisterProfileFromTipo,
  isTitularPlanMode,
  isDelegatePortalMode,
  buildSubmitSuccessToast,
  TITULAR_STEP_COUNT,
  type RegisterProfileMode,
  type RegisterStep,
  type RegisterPaymentState,
} from "../types/register.types";
import { TITULAR_STEP_LABELS } from "../constants/profile-choice-text";

const defaultFormValues: RegisterFormValues = {
  name: "",
  email: "",
  phone: "",
  cpf: "",
  password: "",
  confirmPassword: "",
  cpfCnpjTitular: "",
  selectedPackage: undefined as unknown as RegisterFormValues["selectedPackage"],
  contractAccepted: undefined as unknown as true,
  marketingContactConsent: false,
};

const defaultPaymentState: RegisterPaymentState = {
  paymentMethod: "pix",
  billingMode: "annual_upfront",
  cardHolder: "",
  cardLast4: "",
  cardExpiryMonth: "",
  cardExpiryYear: "",
  cardBrand: "",
  paymentAcknowledged: false,
};

export function useRegisterFlow() {
  const searchParams = useSearchParams();
  const initialTipo = searchParams?.get("tipo");
  const clientGestaoInviteOnly = initialTipo === "client";
  const [mode, setMode] = React.useState<RegisterProfileMode>(() =>
    parseRegisterProfileFromTipo(initialTipo),
  );
  const [step, setStep] = React.useState<RegisterStep>(1);
  const [loading, setLoading] = React.useState(false);
  const showProfileChoice = !initialTipo;
  const [hasChosenProfile, setHasChosenProfile] = React.useState(!!initialTipo);
  const { auth, firestore } = useFirebase();
  const { platformCompany } = usePlatformContractPublic();
  const { toast } = useToast();
  const router = useRouter();

  const [payment, setPayment] = React.useState<RegisterPaymentState>(defaultPaymentState);
  const [linkedClientId, setLinkedClientId] = React.useState<string | null>(null);
  const [linkedEmpreendedorId, setLinkedEmpreendedorId] = React.useState<string | null>(null);
  const [cpfLinkHint, setCpfLinkHint] = React.useState<string | null>(null);
  const [cpfLookupLoading, setCpfLookupLoading] = React.useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const titularPlanMode = isTitularPlanMode(mode);
  const selectedPackage = form.watch("selectedPackage");

  React.useEffect(() => {
    form.reset(defaultFormValues);
  }, [form]);

  React.useEffect(() => {
    if (isDelegatePortalMode(mode)) {
      form.setValue("selectedPackage", "gratuito");
      form.setValue("contractAccepted", true as unknown as true);
      setStep(1);
    }
  }, [mode, form]);

  React.useEffect(() => {
    setPayment((prev) => ({
      ...prev,
      paymentAcknowledged: false,
      paymentMethod: "pix",
    }));
  }, [mode, selectedPackage]);

  React.useEffect(() => {
    form.setValue("marketingContactConsent", false);
  }, [selectedPackage, form]);

  React.useEffect(() => {
    setLinkedClientId(null);
    setLinkedEmpreendedorId(null);
    setCpfLinkHint(null);
  }, [mode]);

  const resolveTitularDocumentForLookup = React.useCallback(() => {
    const titularField = normalizeDocument(form.getValues("cpfCnpjTitular"));
    const userCpf = normalizeDocument(form.getValues("cpf"));
    if (mode === "cliente_autonomo") {
      return titularField.length >= 11 ? titularField : userCpf;
    }
    return titularField;
  }, [form, mode]);

  const handleTitularDocumentBlur = React.useCallback(async () => {
    if (!firestore || mode === "representative") return;
    const docDigits = resolveTitularDocumentForLookup();
    if (docDigits.length !== 11 && docDigits.length !== 14) {
      setCpfLinkHint(null);
      return;
    }

    setCpfLookupLoading(true);
    try {
      const { client, empreendedor } = await lookupClientAndEmpreendedorByDocument(
        firestore,
        docDigits,
      );
      if (!client && !empreendedor) {
        setLinkedClientId(null);
        setLinkedEmpreendedorId(null);
        setCpfLinkHint(null);
        return;
      }

      if (client?.id) setLinkedClientId(client.id);
      if (empreendedor?.id) setLinkedEmpreendedorId(empreendedor.id);

      if (client?.name) form.setValue("name", client.name, { shouldValidate: true });
      if (client?.email) form.setValue("email", client.email, { shouldValidate: true });
      if (client?.phone || empreendedor?.phone) {
        form.setValue("phone", client?.phone || empreendedor?.phone || "", {
          shouldValidate: true,
        });
      }

      setCpfLinkHint(
        "Encontramos Cliente/Empreendedor com este documento. Sua conta será vinculada sem criar duplicatas.",
      );
    } catch (e) {
      console.warn("Busca por CPF/CNPJ no cadastro:", e);
    } finally {
      setCpfLookupLoading(false);
    }
  }, [firestore, form, mode, resolveTitularDocumentForLookup]);

  const watchedStep1 = form.watch([
    "name",
    "email",
    "phone",
    "cpf",
    "password",
    "confirmPassword",
    "cpfCnpjTitular",
  ]);

  const canAdvanceStep1 = React.useMemo(() => {
    const [
      name = "",
      email = "",
      phone = "",
      cpf = "",
      password = "",
      confirmPassword = "",
      cpfCnpjTitular = "",
    ] = watchedStep1;
    const digitsCpf = (cpf ?? "").replace(/\D/g, "");
    const digitsPhone = (phone ?? "").replace(/\D/g, "");
    const base =
      (name ?? "").trim().length >= 3 &&
      (email ?? "").includes("@") &&
      digitsPhone.length >= 10 &&
      digitsCpf.length === 11 &&
      (password ?? "").length >= 6 &&
      (confirmPassword ?? "").length >= 6 &&
      password === confirmPassword;
    const titDigits = normalizeDocument(cpfCnpjTitular);
    const titularDocOk =
      mode === "cliente_autonomo"
        ? titDigits.length === 0 || isValidCpfOrCnpj(cpfCnpjTitular)
        : isValidCpfOrCnpj(cpfCnpjTitular);
    return base && titularDocOk;
  }, [watchedStep1, mode]);

  const handleCancelRegistration = () => {
    if (
      window.confirm(
        "Deseja cancelar o cadastro? Os dados preenchidos serão descartados.",
      )
    ) {
      form.reset(defaultFormValues);
      router.push("/login");
    }
  };

  const handleSelectProfile = (nextMode: RegisterProfileMode) => {
    setMode(nextMode);
    setHasChosenProfile(true);
  };

  const handleCopyPix = async () => {
    const t = resolvePlatformPixCopyPaste(platformCompany);
    if (!t) {
      toast({
        variant: "destructive",
        title: "PIX não configurado",
        description:
          "Peça à equipe o código PIX ou cadastre o PIX copia e cola em Cadastro → Empresas (empresa da plataforma).",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(t);
      toast({ title: "Copiado", description: "Código PIX copiado." });
    } catch {
      toast({
        variant: "destructive",
        title: "Não foi possível copiar",
        description: "Copie manualmente o código exibido.",
      });
    }
  };

  const onSubmit = async (values: RegisterFormValues) => {
    if (!auth || !firestore) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Serviços não disponíveis. Tente novamente.",
      });
      return;
    }

    setLoading(true);
    try {
      const result = await submitRegisterForm({
        values,
        mode,
        auth,
        firestore,
        linked: { linkedClientId, linkedEmpreendedorId },
        payment,
        platformCompany,
        getIdToken: async () => {
          const user = auth.currentUser;
          if (!user) throw new Error("Usuário não autenticado");
          return user.getIdToken();
        },
      });

      if (!result.ok) {
        toast({
          variant: "destructive",
          title:
            result.reason === "auth"
              ? "Erro no Cadastro"
              : result.reason === "blocked"
                ? "Cadastro não permitido"
                : result.reason === "validation"
                  ? "Confirmação necessária"
                  : "Erro",
          description: result.message,
        });
        return;
      }

      const successToast = buildSubmitSuccessToast(mode, result.pendingPayment);
      toast(successToast);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const updatePayment = (patch: Partial<RegisterPaymentState>) => {
    setPayment((prev) => ({ ...prev, ...patch }));
  };

  const pageSubtitle = hasChosenProfile
    ? mode === "representative"
      ? "Cadastro de Representante"
      : mode === "consultor_representante"
        ? "Cadastro de Consultor-Representante"
        : "Cadastro de Cliente Autônomo"
    : "Criar conta profissional ou autônoma";

  const stepLabel = titularPlanMode
    ? `Etapa ${step} de ${TITULAR_STEP_COUNT} — ${TITULAR_STEP_LABELS[step - 1] ?? ""}`
    : "Etapa única — Dados Pessoais";

  return {
    clientGestaoInviteOnly,
    showProfileChoice,
    hasChosenProfile,
    setHasChosenProfile,
    mode,
    setMode,
    step,
    setStep,
    loading,
    form,
    platformCompany,
    payment,
    updatePayment,
    cpfLinkHint,
    cpfLookupLoading,
    titularPlanMode,
    selectedPackage,
    canAdvanceStep1,
    handleCancelRegistration,
    handleSelectProfile,
    handleTitularDocumentBlur,
    handleCopyPix,
    onSubmit,
    pageSubtitle,
    stepLabel,
  };
}

export type RegisterFlow = ReturnType<typeof useRegisterFlow>;
