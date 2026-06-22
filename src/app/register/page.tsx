"use client";

import * as React from "react";
import { Suspense } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFirebase } from "@/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  setDoc,
  updateDoc,
  getDoc,
  serverTimestamp,
  collection,
  addDoc,
} from "firebase/firestore";
import {
  isBootstrapAdminEmail,
  resolveRegisterRole,
  shouldBlockPublicRegistration,
} from "@/lib/admin-bootstrap";
import type { AppUser } from "@/lib/types";
import {
  lookupClientAndEmpreendedorByDocument,
  normalizeDocumentDigits,
} from "@/lib/document-lookup";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { MaskedInput } from "@/components/ui/masked-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Check,
  Crown,
  Star,
  Zap,
  Rocket,
  Gift,
  MessageSquareMore,
  X,
  Smartphone,
  CreditCard,
  Building2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  ClientPackage,
  PlatformPaymentMethod,
} from "@/lib/types";
import { createNotificationForUser } from "@/lib/notifications";
import { detectCpfCnpjKind, isValidCpfCnpj } from "@/lib/cpf-cnpj";
import { buildTitularProfileDocumentFields } from "@/lib/titular-profile-document";
import { lookupCnpjPublicData } from "@/lib/cnpj-lookup";
import {
  buildPlatformSubscriptionFieldsForNewTitular,
  clientPackageRequiresAnnualPaymentStep,
  isPlatformPaymentAutoApproveEnabled,
  PACKAGE_ANNUAL_AMOUNT_LABEL,
} from "@/lib/platform-access";
import {
  resolvePlatformPixCopyPaste,
  hasPlatformBankDetails,
  formatBankAccountLabel,
} from "@/lib/platform-company";
import { usePlatformContractPublic } from "@/hooks/use-platform-contract-public";
import {
  RegisterContractContent,
  packageRequiresMarketingOptIn,
} from "@/app/register/contract-content";
import { CLIENT_PACKAGE_CATALOG } from "@/lib/package-catalog";
import { getAmbbotUsagePeriodKey } from "@/lib/package-limits";
import { PublicAuthLayout } from "@/components/auth/public-auth-layout";

const PACKAGES = CLIENT_PACKAGE_CATALOG;

const PACKAGE_ICONS: Record<ClientPackage, React.ReactNode> = {
  gratuito: <Gift className="h-6 w-6" />,
  basico: <Star className="h-6 w-6" />,
  intermediario: <Zap className="h-6 w-6" />,
  avancado: <Rocket className="h-6 w-6" />,
  completo: <Crown className="h-6 w-6" />,
  sob_consulta: <MessageSquareMore className="h-6 w-6" />,
};

const formSchema = z
  .object({
    name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres."),
    email: z.string().email("Por favor, insira um e-mail válido."),
    phone: z.string().min(10, "Insira um telefone válido com DDD."),
    /** CPF do usuário/responsável pelo login (opcional no cadastro inicial). */
    cpf: z.string().optional(),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres."),
    confirmPassword: z.string().min(6, "Confirme sua senha."),
    /** CPF/CNPJ vinculado ao titular/empreendedor ou ao titular ao qual o representante solicita acesso. */
    cpfCnpjTitular: z.string().optional(),
    selectedPackage: z.enum(
      [
        "gratuito",
        "basico",
        "intermediario",
        "avancado",
        "completo",
        "sob_consulta",
      ],
      {
        required_error: "Selecione um pacote.",
      },
    ),
    contractAccepted: z.literal(true, {
      errorMap: () => ({ message: "Você deve aceitar os termos do contrato." }),
    }),
    /** Obrigatório para planos acima de Básico: opt-in explícito para contato comercial. */
    marketingContactConsent: z.boolean().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      const cpfDigits = normalizeDocument(data.cpf);
      return cpfDigits.length === 0 || cpfDigits.length === 11;
    },
    {
      message: "Informe um CPF válido ou deixe em branco.",
      path: ["cpf"],
    },
  )
  .refine(
    (data) => {
      const titularDigits = normalizeDocument(data.cpfCnpjTitular);
      return (
        titularDigits.length === 0 ||
        titularDigits.length === 11 ||
        titularDigits.length === 14
      );
    },
    {
      message: "Informe um CPF/CNPJ válido ou deixe em branco.",
      path: ["cpfCnpjTitular"],
    },
  )
  .refine(
    (data) => {
      if (!packageRequiresMarketingOptIn(data.selectedPackage)) return true;
      return data.marketingContactConsent === true;
    },
    {
      message:
        "Para este plano, é necessário autorizar o uso dos dados para contato comercial.",
      path: ["marketingContactConsent"],
    },
  );

type FormValues = z.infer<typeof formSchema>;

const normalizeDocument = normalizeDocumentDigits;

const PROFILE_CHOICE_TEXT = {
  intro:
    "Contas profissionais ou Cliente Autônomo (planos). Titulares Cliente Gestão recebem convite da consultoria.",
  client:
    "Sou titular e contrato o plano com assessoria e gestão da consultoria (acompanhamento sob medida, com supervisão mensal).",
  cliente_autonomo:
    "Sou titular e uso os planos de acompanhamento na plataforma para lançar e acompanhar meus dados e prazos por conta própria, sem supervisão mensal da consultoria.",
  representative:
    "Atuo em nome de um cliente titular e preciso de acesso à plataforma para gerenciar os dados dele.",
  consultor_representante:
    "Sou consultor externo/parceiro e preciso operar licenças, outorgas e cadastros dos clientes que me aprovarem.",
};

type RegisterProfileMode =
  | "client"
  | "cliente_autonomo"
  | "representative"
  | "consultor_representante";

function parseRegisterProfileFromTipo(tipo: string | null | undefined): RegisterProfileMode {
  if (tipo === "representante") return "representative";
  if (tipo === "consultor" || tipo === "consultor_representante") {
    return "consultor_representante";
  }
  if (tipo === "cliente_autonomo" || tipo === "autonomo") return "cliente_autonomo";
  /** Legado `?tipo=client`: auto-cadastro Gestão desativado — tratado à parte. */
  if (tipo === "client") return "cliente_autonomo";
  return "cliente_autonomo";
}

function RegisterPageContent() {
  const searchParams = useSearchParams();
  const initialTipo = searchParams?.get("tipo");
  const clientGestaoInviteOnly = initialTipo === "client";
  const [mode, setMode] = React.useState<RegisterProfileMode>(() =>
    parseRegisterProfileFromTipo(initialTipo),
  );
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const showProfileChoice = !initialTipo;
  const [hasChosenProfile, setHasChosenProfile] = React.useState(!!initialTipo);
  const { auth, firestore } = useFirebase();
  const { platformCompany } = usePlatformContractPublic();
  const { toast } = useToast();
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] =
    React.useState<PlatformPaymentMethod>("pix");
  const [billingMode, setBillingMode] = React.useState<
    "annual_upfront" | "monthly_12x"
  >("annual_upfront");
  const [cardHolder, setCardHolder] = React.useState("");
  const [cardLast4, setCardLast4] = React.useState("");
  const [cardExpiryMonth, setCardExpiryMonth] = React.useState("");
  const [cardExpiryYear, setCardExpiryYear] = React.useState("");
  const [cardBrand, setCardBrand] = React.useState("");
  const [paymentAcknowledged, setPaymentAcknowledged] = React.useState(false);
  const [linkedClientId, setLinkedClientId] = React.useState<string | null>(null);
  const [linkedEmpreendedorId, setLinkedEmpreendedorId] = React.useState<string | null>(null);
  const [cpfLinkHint, setCpfLinkHint] = React.useState<string | null>(null);
  const [cpfLookupLoading, setCpfLookupLoading] = React.useState(false);
  const [cnpjLookupStatus, setCnpjLookupStatus] = React.useState<
    "not_applicable" | "success" | "failed" | "not_found"
  >("not_applicable");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      cpf: "",
      password: "",
      confirmPassword: "",
      cpfCnpjTitular: "",
      selectedPackage: undefined,
      contractAccepted: undefined as any,
      marketingContactConsent: false,
    },
    mode: "onChange",
  });

  // Ao abrir o Cadastre-se, garantir que e-mail e senha comecem vazios (só placeholders).
  React.useEffect(() => {
    form.reset({
      name: "",
      email: "",
      phone: "",
      cpf: "",
      password: "",
      confirmPassword: "",
      cpfCnpjTitular: "",
      selectedPackage: undefined,
      contractAccepted: undefined as any,
      marketingContactConsent: false,
    });
  }, [form]);

  // Representantes e consultores: sem plano/contrato de titular.
  React.useEffect(() => {
    if (mode === "representative" || mode === "consultor_representante") {
      form.setValue("selectedPackage", "gratuito");
      form.setValue("contractAccepted", true as any);
      setStep(1);
    }
  }, [mode, form]);

  const selectedPackage = form.watch("selectedPackage");
  const isTitularPlanMode = mode === "cliente_autonomo";
  const isDelegatePortalMode =
    mode === "representative" || mode === "consultor_representante";

  React.useEffect(() => {
    setPaymentAcknowledged(false);
    setPaymentMethod("pix");
  }, [mode, selectedPackage]);

  React.useEffect(() => {
    form.setValue("marketingContactConsent", false);
  }, [selectedPackage, form]);

  React.useEffect(() => {
    setLinkedClientId(null);
    setLinkedEmpreendedorId(null);
    setCpfLinkHint(null);
  }, [mode]);

  const handleTitularDocumentBlur = React.useCallback(async () => {
    if (!firestore || mode !== "cliente_autonomo") return;
    const docDigits = normalizeDocument(form.getValues("cpfCnpjTitular"));
    if (!isValidCpfCnpj(docDigits)) {
      setCpfLinkHint(null);
      setCnpjLookupStatus("not_applicable");
      return;
    }

    setCpfLookupLoading(true);
    let cnpjLookupFailed = false;
    try {
      if (detectCpfCnpjKind(docDigits) === "cnpj") {
        const lookup = await lookupCnpjPublicData(docDigits);
        if (lookup.ok) {
          setCnpjLookupStatus("success");
          if (lookup.razaoSocial || lookup.nomeFantasia) {
            form.setValue(
              "name",
              lookup.nomeFantasia || lookup.razaoSocial || form.getValues("name"),
              { shouldValidate: true },
            );
          }
          if (lookup.email) {
            form.setValue("email", lookup.email, { shouldValidate: true });
          }
          if (lookup.phone) {
            form.setValue("phone", lookup.phone, { shouldValidate: true });
          }
        } else {
          cnpjLookupFailed = true;
          setCnpjLookupStatus("failed");
        }
      } else {
        setCnpjLookupStatus("not_applicable");
      }

      const { client, empreendedor } = await lookupClientAndEmpreendedorByDocument(
        firestore,
        docDigits,
      );
      if (!client && !empreendedor) {
        setLinkedClientId(null);
        setLinkedEmpreendedorId(null);
        if (!cnpjLookupFailed) {
          setCpfLinkHint(null);
        }
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
  }, [firestore, form, mode]);

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
      (digitsCpf.length === 0 || digitsCpf.length === 11) &&
      (password ?? "").length >= 6 &&
      (confirmPassword ?? "").length >= 6 &&
      password === confirmPassword;
    const requiresBaseDocument = mode === "cliente_autonomo";
    const baseDocumentOk =
      !requiresBaseDocument || isValidCpfCnpj(cpfCnpjTitular);
    return base && baseDocumentOk;
  }, [watchedStep1, mode]);

  const canAdvanceStep2 = () => {
    return !!selectedPackage;
  };

  const handleCancelRegistration = () => {
    if (
      window.confirm(
        "Deseja cancelar o cadastro? Os dados preenchidos serão descartados.",
      )
    ) {
      form.reset();
      router.push("/login");
    }
  };

  async function onSubmit(values: FormValues) {
    if (!auth || !firestore) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Serviços não disponíveis. Tente novamente.",
      });
      return;
    }

    if (mode === "client") {
      toast({
        variant: "destructive",
        title: "Cadastro indisponível",
        description:
          "Cliente Gestão só recebe acesso por convite da consultoria. Use o link do e-mail ou fale com a Pimenta.",
      });
      return;
    }

    // Representante/consultor não precisa informar titular no cadastro inicial.

    if (isTitularPlanMode) {
      if (!paymentAcknowledged) {
        toast({
          variant: "destructive",
          title: "Confirmação necessária",
          description:
            "Marque a confirmação na etapa de pagamento para concluir o cadastro.",
        });
        return;
      }
      if (
        clientPackageRequiresAnnualPaymentStep(values.selectedPackage) &&
        !paymentMethod
      ) {
        toast({
          variant: "destructive",
          title: "Forma de pagamento",
          description: "Selecione PIX, cartão de crédito ou cartão de débito.",
        });
        return;
      }
    }

    const normalizedEmail = values.email.trim().toLowerCase();
    if (isBootstrapAdminEmail(normalizedEmail)) {
      toast({
        variant: "destructive",
        title: "Use o login",
        description:
          "O administrador do sistema entra em /login com este e-mail, não pelo cadastro público.",
      });
      return;
    }

    if (mode === "cliente_autonomo") {
      const baseDocument = normalizeDocument(values.cpfCnpjTitular);
      if (!isValidCpfCnpj(baseDocument)) {
        toast({
          variant: "destructive",
          title: "CPF/CNPJ obrigatório",
          description:
            "Informe um CPF ou CNPJ válido para criar seu empreendedor base.",
        });
        return;
      }
    }

    setLoading(true);
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
        toast({
          variant: "destructive",
          title: "Cadastro não permitido",
          description:
            "Esta conta é de administrador. Faça login em /login ou peça suporte à consultoria.",
        });
        return;
      }
      const userCpfNormalized = normalizeDocument(values.cpf);
      const titularProfileFields = buildTitularProfileDocumentFields(values.cpfCnpjTitular);
      const titularDocument = titularProfileFields?.titularDocument ?? "";
      const hasExistingLink = Boolean(linkedClientId || linkedEmpreendedorId);
      const hasTitularDoc = Boolean(titularProfileFields);
      const shouldCreateInitialTitularRecords =
        isTitularPlanMode && (hasExistingLink || hasTitularDoc);

      const subscriptionFields =
        isTitularPlanMode && values.selectedPackage
          ? buildPlatformSubscriptionFieldsForNewTitular(
              values.selectedPackage,
              clientPackageRequiresAnnualPaymentStep(values.selectedPackage)
                ? paymentMethod
                : null,
            )
          : {};

      const extraVerified: Record<string, unknown> = {};
      if (
        isTitularPlanMode &&
        isPlatformPaymentAutoApproveEnabled() &&
        clientPackageRequiresAnnualPaymentStep(values.selectedPackage)
      ) {
        extraVerified.platformPaymentVerifiedAt = serverTimestamp();
      }

      const registerRole = resolveRegisterRole(
        normalizedEmail,
        mode,
        existingProfile,
      );

      await setDoc(
        doc(firestore, "users", uid),
        {
        uid: uid,
        name: values.name,
        email: normalizedEmail,
        phone: values.phone,
        cpf:
          isDelegatePortalMode
            ? ""
            : titularDocument.length === 11
              ? titularDocument
              : userCpfNormalized.length === 11
                ? userCpfNormalized
                : "",
        userCpf: isDelegatePortalMode ? "" : userCpfNormalized,
        cnpjs:
          isDelegatePortalMode
            ? []
            : titularDocument.length === 14
              ? [titularDocument]
              : [],
        role: registerRole,
        status: "active",
        package: isDelegatePortalMode ? null : values.selectedPackage,
        contractAcceptedAt:
          isDelegatePortalMode ? null : serverTimestamp(),
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        isOnline: false,
        cadastroIncompleto: isDelegatePortalMode
          ? false
          : isTitularPlanMode,
        ...(isDelegatePortalMode
          ? {
              pendingAccess: true,
              onboardingStep: "solicitar_acesso",
            }
          : {}),
        ...(isTitularPlanMode && titularProfileFields
          ? {
              titularDocument: titularProfileFields.titularDocument,
              titularType: titularProfileFields.titularType ?? undefined,
              onboardingStep: "completar_empreendedor",
            }
          : {}),
        ...(linkedClientId ? { linkedClientId } : {}),
        ...(linkedEmpreendedorId ? { linkedEmpreendedorId } : {}),
        ...(isTitularPlanMode
          ? {
              allowsCommercialContact:
                values.selectedPackage === "basico" ||
                values.selectedPackage === "gratuito"
                  ? true
                  : Boolean(values.marketingContactConsent),
            }
          : {}),
        ...subscriptionFields,
        ...extraVerified,
        ...(isTitularPlanMode
          ? {
              ambbotUsagePeriod: getAmbbotUsagePeriodKey(),
              ambbotIncludedUsed: 0,
              ambbotPrepaidCredits: 0,
            }
          : {}),
        },
        { merge: true },
      );

      if (mode !== "representative" && mode !== "consultor_representante" && isTitularPlanMode && values.selectedPackage) {
        try {
          const token = await cred.user.getIdToken();
          const titularRole =
            mode === "cliente_autonomo" ? "cliente_autonomo" : "client";
          const payConfirmed =
            values.selectedPackage === "gratuito" ||
            values.selectedPackage === "sob_consulta" ||
            (clientPackageRequiresAnnualPaymentStep(values.selectedPackage) &&
              isPlatformPaymentAutoApproveEnabled()) ||
            paymentAcknowledged;
          await fetch("/api/platform-subscription-contract/record", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: uid,
              name: values.name,
              phone: values.phone,
              cpf:
                titularDocument.length === 11
                  ? titularDocument
                  : userCpfNormalized,
              cnpjs:
                titularDocument.length === 14 ? [titularDocument] : undefined,
              role: titularRole,
              packageId: values.selectedPackage,
              paymentMethod: clientPackageRequiresAnnualPaymentStep(
                values.selectedPackage,
              )
                ? paymentMethod
                : null,
              billingMode,
              paymentConfirmed: payConfirmed,
              cardDisplay:
                paymentMethod === "credit_card" ||
                paymentMethod === "debit_card"
                  ? {
                      holderName: cardHolder.trim() || values.name,
                      last4: cardLast4.replace(/\D/g, "").slice(-4),
                      expiryMonth: cardExpiryMonth,
                      expiryYear: cardExpiryYear,
                      brand: cardBrand.trim() || undefined,
                    }
                  : undefined,
              clientUserAgent:
                typeof navigator !== "undefined"
                  ? navigator.userAgent
                  : undefined,
              platformCompanyName: platformCompany?.name,
              platformCompanyCnpj: platformCompany?.cnpj,
            }),
          });
        } catch (contractErr) {
          console.warn(
            "[platform-subscription-contract] registro de aceite:",
            contractErr,
          );
        }
      }

      if (
        isTitularPlanMode &&
        clientPackageRequiresAnnualPaymentStep(values.selectedPackage) &&
        !isPlatformPaymentAutoApproveEnabled()
      ) {
        try {
          await addDoc(collection(firestore, "platform_payment_requests"), {
            userId: uid,
            email: values.email,
            name: values.name,
            packageId: values.selectedPackage,
            method: paymentMethod,
            amountLabel:
              PACKAGE_ANNUAL_AMOUNT_LABEL[values.selectedPackage] ?? "",
            status: "pending_verification",
            createdAt: serverTimestamp(),
          });
        } catch (e) {
          console.warn("platform_payment_requests não gravado:", e);
        }
      }

      // Cliente Autônomo: vincular a registros existentes ou criar empreendedor base incompleto.
      if (shouldCreateInitialTitularRecords && titularProfileFields) {
        try {
          const docForRecords = titularProfileFields.titularDocument;
          const entityForRecords = titularProfileFields.entityType;

          const empreendedorData = {
            name: values.name,
            phone: values.phone,
            address: "",
            numero: "",
            bairro: "",
            complemento: "",
            municipio: "",
            uf: "",
            cep: "",
            email: values.email,
            userId: uid,
            ownerUserId: uid,
            cadastroIncompleto: true,
            onboardingStep: "completar_empreendedor",
            cnpjLookupStatus,
            cpfCnpj: docForRecords,
            entityType: [entityForRecords],
            titularDocument: docForRecords,
            titularType: titularProfileFields.titularType,
          };
          const clientData = {
            name: values.name,
            phone: values.phone,
            address: "",
            numero: "",
            bairro: "",
            municipio: "",
            uf: "",
            cep: "",
            email: values.email,
            dataNascimento: "",
            ctfIbama: "",
            userId: uid,
            ownerUserId: uid,
            cpfCnpj: docForRecords,
            entityType: entityForRecords,
            titularDocument: docForRecords,
            titularType: titularProfileFields.titularType,
          };

          if (hasExistingLink) {
            if (linkedEmpreendedorId) {
              await updateDoc(
                doc(firestore, "empreendedores", linkedEmpreendedorId),
                empreendedorData,
              );
            }
            if (linkedClientId) {
              await updateDoc(
                doc(firestore, "clients", linkedClientId),
                clientData,
              );
            }
          } else if (docForRecords) {
            const empreendedorRef = doc(firestore, "empreendedores", uid);
            const clientRef = doc(firestore, "clients", uid);
            await setDoc(empreendedorRef, empreendedorData, { merge: true });
            await setDoc(clientRef, clientData, { merge: true });

            await createNotificationForUser(firestore, uid, {
              title: "Concluir cadastro",
              description:
                "Complete os dados do seu Cliente e Empreendedor no menu Cadastro.",
              link: `/empreendedores/${uid}/edit`,
              sourceType: "onboarding",
              sourceId: uid,
              actorRole: "admin",
            });
          }
        } catch (e) {
          console.warn(
            "Cadastro inicial de Cliente/Empreendedor não foi concluído integralmente.",
            e,
          );
        }
      }

      const pendingPay =
        isTitularPlanMode &&
        clientPackageRequiresAnnualPaymentStep(values.selectedPackage) &&
        !isPlatformPaymentAutoApproveEnabled();

      toast({
        title: "Cadastro realizado com sucesso!",
        description:
          mode === "representative"
            ? "Sua conta de representante foi criada. Solicite acesso a um titular em Usuários, quando estiver pronto."
            : mode === "consultor_representante"
              ? "Sua conta de consultor foi criada. Solicite acesso a um titular em Usuários, quando estiver pronto."
            : pendingPay
              ? "Sua conta foi criada. O acesso à plataforma será liberado após a confirmação do pagamento anual."
              : mode === "cliente_autonomo"
                ? "Bem-vindo ao AmbientaR como Cliente Autônomo. Você será redirecionado."
                : "Bem-vindo ao AmbientaR. Você será redirecionado.",
      });

      router.push("/");
    } catch (error: any) {
      let description = "Ocorreu um erro ao criar sua conta. Tente novamente.";
      if (error.code === "auth/email-already-in-use") {
        description = "Este e-mail já está cadastrado. Tente fazer login.";
      } else if (error.code === "auth/weak-password") {
        description = "A senha deve ter no mínimo 6 caracteres.";
      }
      toast({ variant: "destructive", title: "Erro no Cadastro", description });
    } finally {
      setLoading(false);
    }
  }

  const titularStepCount = 4;

  const renderStepIndicator = () => (
    <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2 mb-6">
      {Array.from({ length: titularStepCount }, (_, i) => i + 1).map((s) => (
        <React.Fragment key={s}>
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all shrink-0",
              step === s
                ? "bg-primary text-primary-foreground scale-110"
                : step > s
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {step > s ? <Check className="h-4 w-4" /> : s}
          </div>
          {s < titularStepCount && (
            <div
              className={cn(
                "h-0.5 w-4 sm:w-8 transition-all shrink",
                step > s ? "bg-primary" : "bg-muted",
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <Card className="shadow-lg bg-card/80 backdrop-blur-sm border">
      <CardHeader>
        <CardTitle className="text-xl">Dados Pessoais</CardTitle>
        <CardDescription>
          {mode === "representative"
            ? "Preencha suas informações para criar sua conta de representante."
            : mode === "cliente_autonomo"
              ? "Preencha suas informações para criar sua conta de Cliente Autônomo."
              : "Preencha suas informações para criar sua conta de Cliente Gestão."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {mode === "cliente_autonomo" ? (
              <>
                Informe nome, e-mail, telefone, senha e o CPF ou CNPJ do
                titular/empreendedor base. Você poderá complementar os dados
                depois do login.
              </>
            ) : (
              <>
                Crie sua conta com dados mínimos. A solicitação de acesso ao
                titular CPF/CNPJ será feita depois do login, em Usuários.
              </>
            )}
          </p>
        </div>
        {mode === "cliente_autonomo" && (
          <FormField
            control={form.control}
            name="cpfCnpjTitular"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  CPF ou CNPJ do titular/empreendedor base
                </FormLabel>
                <FormControl>
                  <MaskedInput
                    mask="cpfCnpj"
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    {...field}
                    onBlur={() => {
                      field.onBlur();
                      void handleTitularDocumentBlur();
                    }}
                  />
                </FormControl>
                <FormMessage />
                {cpfLookupLoading && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Verificando documento…
                  </p>
                )}
                {cpfLinkHint && !cpfLookupLoading && (
                  <p className="text-xs text-emerald-700 dark:text-emerald-400">
                    {cpfLinkHint}
                  </p>
                )}
                {cnpjLookupStatus === "failed" && !cpfLookupLoading && (
                  <p className="text-xs text-muted-foreground">
                    Não foi possível buscar dados públicos do CNPJ. Você pode
                    continuar e preencher manualmente depois.
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Informe o documento que identificará seu empreendedor base.
                  O sistema detecta automaticamente CPF (11 dígitos) ou CNPJ (14
                  dígitos).
                </p>
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="cpf"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                CPF pessoal {mode === "cliente_autonomo" ? "(opcional)" : ""}
              </FormLabel>
              <FormControl>
                <MaskedInput
                  mask="cpf"
                  placeholder="000.000.000-00"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome completo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mail</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="seu-email@exemplo.com"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <MaskedInput
                    mask="phone"
                    placeholder="(31) 99999-9999"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirmar Senha</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Repita sua senha"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isTitularPlanMode ? (
          <div className="flex gap-3 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleCancelRegistration}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar cadastro
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={() => setStep(2)}
              disabled={!canAdvanceStep1}
            >
              Próximo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex gap-3 flex-col sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleCancelRegistration}
            >
              <X className="mr-2 h-4 w-4" />
              Cancelar cadastro
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!canAdvanceStep1 || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Concluir Cadastro
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="shadow-lg bg-card/80 backdrop-blur-sm border">
      <CardHeader>
        <CardTitle className="text-xl">Escolha seu Pacote</CardTitle>
        <CardDescription>
          Selecione o plano que melhor atende às suas necessidades.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FormField
          control={form.control}
          name="selectedPackage"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PACKAGES.map((pkg) => (
                    <div
                      key={pkg.id}
                      onClick={() => field.onChange(pkg.id)}
                      className={cn(
                        "relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md",
                        field.value === pkg.id
                          ? "border-primary bg-primary/5 shadow-md"
                          : "border-border hover:border-primary/50",
                        pkg.highlighted &&
                          field.value !== pkg.id &&
                          "border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20",
                      )}
                    >
                      {pkg.highlighted && (
                        <span className="absolute -top-2.5 left-4 rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-semibold text-white">
                          Mais Popular
                        </span>
                      )}
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                            field.value === pkg.id
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {PACKAGE_ICONS[pkg.id]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="font-semibold">{pkg.name}</h3>
                            <span className="text-sm font-bold text-primary whitespace-nowrap">
                              {pkg.price}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {pkg.description}
                          </p>
                          <ul className="mt-2 space-y-1">
                            {pkg.features.map((f, i) => (
                              <li
                                key={i}
                                className="flex items-center gap-1.5 text-xs text-muted-foreground"
                              >
                                <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      {field.value === pkg.id && (
                        <div className="absolute top-3 right-3">
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            <Check className="h-3 w-3" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-3 mt-6 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelRegistration}
          >
            <X className="mr-2 h-4 w-4" /> Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setStep(1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={() => setStep(3)}
            disabled={!canAdvanceStep2()}
          >
            Próximo <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="shadow-lg bg-card/80 backdrop-blur-sm border">
        <CardHeader>
        <CardTitle className="text-xl">Contrato e Assinatura</CardTitle>
        <CardDescription>
          Leia os termos e assine para seguir para o pagamento anual da
          plataforma.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-white dark:bg-muted/30 max-h-[min(28rem,70vh)] overflow-y-auto shadow-inner">
          <RegisterContractContent
            packageId={selectedPackage}
            platformCompany={platformCompany}
          />
        </div>

        {packageRequiresMarketingOptIn(selectedPackage) && (
          <FormField
            control={form.control}
            name="marketingContactConsent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-lg border border-primary/25 bg-primary/5 p-3">
                <FormControl>
                  <Checkbox
                    checked={field.value === true}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm cursor-pointer font-medium">
                    Autorizo o uso dos meus dados de contato (e-mail, telefone e
                    demais informações fornecidas) para receber comunicações
                    comerciais, ofertas e novidades da CONTRATADA, nos termos da
                    cláusula de privacidade e marketing deste contrato.
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="contractAccepted"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value === true}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true ? true : undefined)
                  }
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className="text-sm cursor-pointer">
                  Li e aceito os termos do contrato de prestação de serviços.
                </FormLabel>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <div className="flex gap-3 flex-wrap">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelRegistration}
          >
            <X className="mr-2 h-4 w-4" /> Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => setStep(2)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <Button
            type="button"
            className="flex-1"
            onClick={() => setStep(4)}
            disabled={
              !form.watch("contractAccepted") ||
              (packageRequiresMarketingOptIn(selectedPackage) &&
                !form.watch("marketingContactConsent"))
            }
          >
            Próximo <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const copyPix = async () => {
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

  const renderStep4 = () => {
    const pkg = selectedPackage;
    const isFreePlan = pkg === "gratuito";
    const annual = clientPackageRequiresAnnualPaymentStep(pkg);
    const amount =
      (pkg && PACKAGE_ANNUAL_AMOUNT_LABEL[pkg]) ?? "Consulte a equipe";
    const pixCode = resolvePlatformPixCopyPaste(platformCompany);

    return (
      <Card className="shadow-lg bg-card/80 backdrop-blur-sm border">
        <CardHeader>
          <CardTitle className="text-xl">
            {isFreePlan ? "Confirmação — plano gratuito" : "Pagamento anual"}
          </CardTitle>
          <CardDescription>
            {isFreePlan ? (
              <>
                Plano <strong>Gratuito</strong>: sem cobrança neste cadastro. Leia
                abaixo as condições de publicidade, contato comercial e uso de
                dados antes de concluir.
              </>
            ) : (
              <>
                Acesso à plataforma AmbientaR mediante{" "}
                <strong>pagamento único anual</strong> por usuário titular. Após
                a confirmação, o acesso fica liberado por 12 meses; ao vencer,
                será necessário renovar.
              </>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">
              {isFreePlan ? "Custo neste cadastro" : "Valor de referência"}
            </p>
            <p className="text-2xl font-bold text-primary">
              {isFreePlan ? "Sem custo" : amount}
            </p>
            {(annual || isFreePlan) && (
              <p className="text-xs text-muted-foreground mt-1">
                Plano selecionado:{" "}
                {PACKAGES.find((p) => p.id === pkg)?.name ?? pkg}
              </p>
            )}
          </div>

          {annual && (
            <>
              <div className="space-y-3">
                <Label className="text-base">Quitação do valor anual</Label>
                <RadioGroup
                  value={billingMode}
                  onValueChange={(v) =>
                    setBillingMode(v as "annual_upfront" | "monthly_12x")
                  }
                  className="grid gap-2 sm:grid-cols-2"
                >
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <RadioGroupItem value="annual_upfront" id="bill-upfront" />
                    <Label htmlFor="bill-upfront" className="cursor-pointer text-sm">
                      À vista (anual)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border p-3">
                    <RadioGroupItem value="monthly_12x" id="bill-12x" />
                    <Label htmlFor="bill-12x" className="cursor-pointer text-sm">
                      12 parcelas mensais (sem juros)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-base">Forma de pagamento</Label>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={(v) =>
                    setPaymentMethod(v as PlatformPaymentMethod)
                  }
                  className="grid gap-3 sm:grid-cols-3"
                >
                  <div
                    className={cn(
                      "flex gap-3 rounded-lg border-2 p-4 transition-colors",
                      paymentMethod === "pix"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <RadioGroupItem value="pix" id="pay-pix" className="mt-0.5" />
                    <Label
                      htmlFor="pay-pix"
                      className="flex flex-1 cursor-pointer flex-col gap-1 font-normal"
                    >
                      <span className="flex items-center gap-2 font-semibold text-foreground">
                        <Smartphone className="h-5 w-5 text-primary shrink-0" />
                        PIX
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Confirmação em até 1 dia útil
                      </span>
                    </Label>
                  </div>
                  <div
                    className={cn(
                      "flex gap-3 rounded-lg border-2 p-4 transition-colors",
                      paymentMethod === "credit_card"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <RadioGroupItem
                      value="credit_card"
                      id="pay-credit"
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="pay-credit"
                      className="flex flex-1 cursor-pointer flex-col gap-1 font-normal"
                    >
                      <span className="flex items-center gap-2 font-semibold text-foreground">
                        <CreditCard className="h-5 w-5 text-primary shrink-0" />
                        Cartão de crédito
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Gateway em integração
                      </span>
                    </Label>
                  </div>
                  <div
                    className={cn(
                      "flex gap-3 rounded-lg border-2 p-4 transition-colors",
                      paymentMethod === "debit_card"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50",
                    )}
                  >
                    <RadioGroupItem
                      value="debit_card"
                      id="pay-debit"
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="pay-debit"
                      className="flex flex-1 cursor-pointer flex-col gap-1 font-normal"
                    >
                      <span className="flex items-center gap-2 font-semibold text-foreground">
                        <Building2 className="h-5 w-5 text-primary shrink-0" />
                        Cartão de débito
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Gateway em integração
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {paymentMethod === "pix" && (
                <div className="space-y-2 rounded-lg border p-4">
                  <p className="text-sm font-medium">Pagamento via PIX</p>
                  <p className="text-xs text-muted-foreground">
                    Transfira o valor indicado para{" "}
                    <strong>{platformCompany?.name ?? "a CONTRATADA"}</strong>{" "}
                    usando os dados abaixo. Envie o comprovante se solicitado pela
                    equipe.
                  </p>
                  {hasPlatformBankDetails(platformCompany) && (
                    <ul className="text-sm space-y-1 text-muted-foreground list-disc pl-5">
                      {platformCompany?.bankName ? (
                        <li>Banco: {platformCompany.bankName}</li>
                      ) : null}
                      {platformCompany?.bankAgency ? (
                        <li>Agência: {platformCompany.bankAgency}</li>
                      ) : null}
                      {platformCompany?.bankAccount ? (
                        <li>
                          Conta{" "}
                          {formatBankAccountLabel(platformCompany.bankAccountType)}:{" "}
                          {platformCompany.bankAccount}
                        </li>
                      ) : null}
                      {platformCompany?.pixKey ? (
                        <li>Chave PIX: {platformCompany.pixKey}</li>
                      ) : null}
                    </ul>
                  )}
                  {pixCode ? (
                    <>
                      <div className="max-h-24 overflow-y-auto rounded bg-muted p-2 font-mono text-[11px] break-all">
                        {pixCode}
                      </div>
                      <Button type="button" variant="secondary" onClick={copyPix}>
                        Copiar código PIX
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      O administrador deve cadastrar o PIX copia e cola em{" "}
                      <strong>Cadastro → Empresas</strong> (empresa da plataforma)
                      ou configurar{" "}
                      <code className="rounded bg-muted px-1">
                        NEXT_PUBLIC_AMBIENTAR_PIX_COPIA_E_COLA
                      </code>
                      .
                    </p>
                  )}
                </div>
              )}

              {(paymentMethod === "credit_card" ||
                paymentMethod === "debit_card") &&
                hasPlatformBankDetails(platformCompany) && (
                  <div className="rounded-lg border p-4 text-sm space-y-1">
                    <p className="font-medium">Titular do recebimento</p>
                    <p className="text-muted-foreground">
                      {platformCompany?.name} — CNPJ {platformCompany?.cnpj}
                    </p>
                  </div>
                )}

              {(paymentMethod === "credit_card" ||
                paymentMethod === "debit_card") && (
                <div className="rounded-lg border p-4 space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Dados para o contrato assinado (a cópia registra titular e
                    final do cartão — <strong>não</strong> armazenamos o código de
                    segurança). Processamento via gateway em integração.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label className="text-xs">Titular do cartão</Label>
                      <Input
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder={form.watch("name") || "Nome no cartão"}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Bandeira</Label>
                      <Input
                        value={cardBrand}
                        onChange={(e) => setCardBrand(e.target.value)}
                        placeholder="Visa, Master…"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Final do cartão (4 dígitos)</Label>
                      <Input
                        value={cardLast4}
                        onChange={(e) =>
                          setCardLast4(e.target.value.replace(/\D/g, "").slice(0, 4))
                        }
                        placeholder="0000"
                        maxLength={4}
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Label className="text-xs">Validade (mês)</Label>
                        <Input
                          value={cardExpiryMonth}
                          onChange={(e) =>
                            setCardExpiryMonth(
                              e.target.value.replace(/\D/g, "").slice(0, 2),
                            )
                          }
                          placeholder="MM"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs">Ano</Label>
                        <Input
                          value={cardExpiryYear}
                          onChange={(e) =>
                            setCardExpiryYear(
                              e.target.value.replace(/\D/g, "").slice(0, 4),
                            )
                          }
                          placeholder="AAAA"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {pkg === "gratuito" && (
            <div className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-muted-foreground">
              <p>
                <strong>Plano gratuito (versão com publicidade):</strong> sem
                cobrança neste cadastro. Ao concluir, você declara ciência e
                aceite de que:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  o aplicativo e o site poderão exibir{" "}
                  <strong>publicidade de terceiros</strong>, além de
                  comunicações e ofertas da CONTRATADA;
                </li>
                <li>
                  a CONTRATADA poderá entrar em contato por{" "}
                  <strong>
                    ligações, e-mails, WhatsApp, SMS, notificações push,
                    atualizações do aplicativo
                  </strong>{" "}
                  e outros canais para ofertas, novidades e venda de serviços;
                </li>
                <li>
                  seus dados cadastrais poderão ser utilizados para{" "}
                  <strong>oferecimento de serviços</strong> e comunicações
                  comerciais;
                </li>
                <li>
                  o CONTRATANTE <strong>não poderá reclamar</strong> dessas
                  práticas de publicidade e contato, nos termos do contrato
                  aceito na etapa anterior.
                </li>
              </ul>
              <p>
                Seu acesso será registrado com vigência anual apenas para
                controle da plataforma, sem qualquer cobrança no plano
                Gratuito. Consulte também a{" "}
                <a
                  href="/politica-privacidade"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Política de Privacidade e Cookies
                </a>{" "}
                (Google AdSense e preferências de publicidade).
              </p>
            </div>
          )}

          {pkg === "sob_consulta" && (
            <p className="text-sm text-muted-foreground">
              Plano sob consulta: nossa equipe combinará valor e forma de
              pagamento (incluindo boleto, quando aplicável a prestação de serviço
              sob medida). Você já poderá acessar a plataforma enquanto o contrato
              comercial é alinhado. Pagamento online padrão: PIX, débito ou crédito.
            </p>
          )}

          <div className="flex flex-row items-start space-x-3 space-y-0">
            <Checkbox
              id="pay-ack"
              checked={paymentAcknowledged}
              onCheckedChange={(c) => setPaymentAcknowledged(c === true)}
            />
            <Label htmlFor="pay-ack" className="text-sm leading-snug cursor-pointer">
              {isFreePlan
                ? "Declaro ciência e aceito as condições do plano gratuito (publicidade de terceiros e Google AdSense no app e site, cookies de publicidade conforme Política de Privacidade, contato comercial da CONTRATADA por ligações, e-mails, notificações e demais canais, e uso dos meus dados para oferecimento de serviços), sem direito de reclamação quanto a essas práticas nos termos do contrato, e desejo concluir meu cadastro sem custo."
                : annual
                  ? isPlatformPaymentAutoApproveEnabled()
                    ? "Confirmo que realizei o pagamento conforme as instruções acima e desejo concluir meu cadastro."
                    : "Estou ciente de que o acesso à plataforma será liberado após a confirmação do pagamento pela equipe e desejo concluir meu cadastro."
                  : "Li as informações desta etapa e desejo concluir meu cadastro."}
            </Label>
          </div>

          <div className="flex gap-3 flex-wrap">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelRegistration}
            >
              <X className="mr-2 h-4 w-4" /> Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStep(3)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || !paymentAcknowledged}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Concluir cadastro
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const stepLabels = isTitularPlanMode
    ? [
        "Dados Pessoais",
        "Pacote",
        "Contrato",
        selectedPackage === "gratuito" ? "Confirmação" : "Pagamento anual",
      ]
    : ["Dados Pessoais"];

  const renderClientGestaoInviteOnly = () => (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg font-semibold">
          Cliente Gestão — acesso por convite
        </CardTitle>
        <CardDescription>
          Titulares com assessoria da consultoria não se cadastram aqui. A
          Pimenta cria seu acesso após o contrato e envia um e-mail para definir
          a senha.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Se você já recebeu o convite, use o link do e-mail ou faça login após
          definir sua senha.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="w-full sm:flex-1" asChild>
            <Link href="/login">Ir para login</Link>
          </Button>
          <Button variant="outline" className="w-full sm:flex-1" asChild>
            <Link href="/register?tipo=cliente_autonomo">
              Sou Cliente Autônomo (planos)
            </Link>
          </Button>
        </div>
        <Button variant="ghost" className="w-full" asChild>
          <Link href="/register">Ver outros perfis de cadastro</Link>
        </Button>
      </CardContent>
    </Card>
  );

  const renderProfileChoice = () => (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg font-semibold">Cadastre-se</CardTitle>
        <CardDescription>{PROFILE_CHOICE_TEXT.intro}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Selecione o perfil que corresponde à sua situação para preencher o
          formulário de cadastro.
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              setMode("cliente_autonomo");
              setHasChosenProfile(true);
            }}
            className={cn(
              "flex w-full flex-col items-start rounded-lg border-2 p-4 text-left transition-colors",
              "hover:border-primary hover:bg-primary/5",
              "border-border",
            )}
          >
            <span className="font-semibold text-foreground">
              Cliente Autônomo
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              {PROFILE_CHOICE_TEXT.cliente_autonomo}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("representative");
              setHasChosenProfile(true);
            }}
            className={cn(
              "flex w-full flex-col items-start rounded-lg border-2 p-4 text-left transition-colors",
              "hover:border-primary hover:bg-primary/5",
              "border-border",
            )}
          >
            <span className="font-semibold text-foreground">
              Sou Representante
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              {PROFILE_CHOICE_TEXT.representative}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("consultor_representante");
              setHasChosenProfile(true);
            }}
            className={cn(
              "flex w-full flex-col items-start rounded-lg border-2 p-4 text-left transition-colors",
              "hover:border-primary hover:bg-primary/5",
              "border-border",
            )}
          >
            <span className="font-semibold text-foreground">
              Consultor-Representante
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              {PROFILE_CHOICE_TEXT.consultor_representante}
            </span>
          </button>
        </div>
        <Button variant="outline" className="w-full" asChild>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Voltar ao início
          </Link>
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Não quer se cadastrar agora? Volte à página inicial ou faça login.
        </p>
        <div className="pt-1 text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline underline-offset-2 hover:no-underline"
          >
            Faça login
          </Link>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <PublicAuthLayout wide alignTop>
      <div className="w-full flex flex-col">
        <div className="mb-4 w-full">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-9 px-2 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link href="/" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4 shrink-0" />
              Voltar ao início
            </Link>
          </Button>
        </div>
        <div className="mb-6 flex flex-col items-center">
          <p className="text-center text-muted-foreground text-sm">
            {hasChosenProfile
              ? mode === "representative"
                ? "Cadastro de Representante"
                : mode === "consultor_representante"
                  ? "Cadastro de Consultor-Representante"
                : "Cadastro de Cliente Autônomo"
              : "Criar conta profissional ou autônoma"}
          </p>
          {hasChosenProfile && (
            <button
              type="button"
              onClick={() => {
                setHasChosenProfile(false);
                setStep(1);
              }}
              className="mt-2 text-xs text-primary underline underline-offset-2 hover:no-underline"
            >
              Trocar perfil
            </button>
          )}
          {hasChosenProfile && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-1 rounded-full border bg-muted px-1 py-1 text-xs max-w-full">
              <button
                type="button"
                onClick={() => setMode("cliente_autonomo")}
                className={cn(
                  "px-2.5 py-1 rounded-full transition-colors whitespace-nowrap",
                  mode === "cliente_autonomo"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground",
                )}
              >
                Cliente Autônomo
              </button>
              <button
                type="button"
                onClick={() => setMode("representative")}
                className={cn(
                  "px-2.5 py-1 rounded-full transition-colors whitespace-nowrap",
                  mode === "representative"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground",
                )}
              >
                Representante
              </button>
              <button
                type="button"
                onClick={() => setMode("consultor_representante")}
                className={cn(
                  "px-2.5 py-1 rounded-full transition-colors whitespace-nowrap",
                  mode === "consultor_representante"
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground",
                )}
              >
                Consultor
              </button>
            </div>
          )}
        </div>

        {clientGestaoInviteOnly && renderClientGestaoInviteOnly()}

        {!clientGestaoInviteOnly && !hasChosenProfile && showProfileChoice && renderProfileChoice()}

        {!clientGestaoInviteOnly && hasChosenProfile && (
          <>
            {isTitularPlanMode && renderStepIndicator()}

            <p className="text-center text-sm font-medium text-muted-foreground mb-4">
              {isTitularPlanMode ? (
                <>
                  Etapa {step} de {titularStepCount} —{" "}
                  {stepLabels[step - 1] ?? ""}
                </>
              ) : (
                "Etapa única — Dados Pessoais"
              )}
            </p>

            <Form {...form}>
              <form
                onSubmit={(e) => {
                  if (isTitularPlanMode && step < titularStepCount) {
                    e.preventDefault();
                    return;
                  }
                  void form.handleSubmit(onSubmit)(e);
                }}
              >
                {isTitularPlanMode && step === 1 && renderStep1()}
                {isTitularPlanMode && step === 2 && renderStep2()}
                {isTitularPlanMode && step === 3 && renderStep3()}
                {isTitularPlanMode && step === 4 && renderStep4()}
                {mode === "representative" && renderStep1()}
                {mode === "consultor_representante" && renderStep1()}
              </form>
            </Form>

            <div className="mt-6 flex flex-col items-center gap-3">
              <Button variant="outline" className="w-full max-w-sm" asChild>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4 shrink-0" />
                  Voltar ao início
                </Link>
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Já tem uma conta?{" "}
                <Link
                  href="/login"
                  className="underline hover:text-primary transition-colors font-medium"
                >
                  Faça login
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </PublicAuthLayout>
  );
}

function RegisterPageFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Carregando cadastro…</p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<RegisterPageFallback />}>
      <RegisterPageContent />
    </Suspense>
  );
}
