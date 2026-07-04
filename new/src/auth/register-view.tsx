import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, FileText, UserRound } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  Input,
  RadioGroup,
  RadioGroupItem,
  toast,
} from "../componentes";
import type { ApiServiceResponse } from "../componentes";
import { authService } from "./auth-service";
import { getApiResponseMessage } from "./auth-api-response";
import { authStore } from "./auth-store";
import {
  isValidCpf,
  isValidCpfCnpj,
  isValidEmail,
  normalizeCpfCnpj,
} from "./auth-validation";
import type { AuthSessionData, RegisterMode, RegisterModel, RegisterResult } from "./auth.types";
import { isAuthSessionData } from "./auth.types";
import { PublicAuthLayout } from "./public-auth-layout";

type RegisterFormModel = {
  mode: RegisterMode;
  cpfCnpjTitular?: string;
  cpf?: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  contractAccepted?: string;
};

const PROFILE_DESCRIPTIONS: Record<RegisterMode, string> = {
  cliente_autonomo:
    "Sou titular e quero acompanhar meus dados, documentos e prazos pela plataforma.",
  representative:
    "Atuo em nome de um titular e vou solicitar acesso depois de criar minha conta.",
  consultor_representante:
    "Sou consultor externo ou parceiro e preciso operar dados de clientes aprovados.",
};

function extractSession(result: RegisterResult | null): AuthSessionData | null {
  if (isAuthSessionData(result?.session)) {
    return result.session;
  }

  return null;
}

export function RegisterView() {
  const navigate = useNavigate();
  const [mode, setMode] = React.useState<RegisterMode>("cliente_autonomo");
  const [documentPreview, setDocumentPreview] = React.useState<string | null>(null);
  const [documentPreviewStatus, setDocumentPreviewStatus] = React.useState<
    "neutral" | "info" | "success" | "error"
  >("neutral");
  const [documentPreviewLoading, setDocumentPreviewLoading] = React.useState(false);

  const isTitularMode = mode === "cliente_autonomo";

  const validation = React.useMemo(
    () => ({
      schema: {
        name: {
          validate: (value: unknown) => ({
            valid: String(value ?? "").trim().length >= 3,
            message: "Informe o nome com pelo menos 3 caracteres.",
          }),
        },
        email: {
          validate: (value: unknown) => ({
            valid: isValidEmail(value),
            message: "Informe um e-mail válido.",
          }),
        },
        phone: {
          validate: (value: unknown) => ({
            valid: normalizeCpfCnpj(value).length >= 10,
            message: "Informe um telefone com DDD.",
          }),
        },
        password: {
          validate: (value: unknown) => ({
            valid: String(value ?? "").trim().length >= 6,
            message: "A senha deve ter no mínimo 6 caracteres.",
          }),
        },
      },
    }),
    [],
  );

  async function handleDocumentBlur(event: React.FocusEvent<HTMLInputElement>) {
    const document = event.currentTarget.value;

    if (!isTitularMode || !isValidCpfCnpj(document)) {
      setDocumentPreview(null);
      setDocumentPreviewStatus("neutral");
      return;
    }

    setDocumentPreviewLoading(true);
    setDocumentPreviewStatus("info");
    try {
      const response = await authService.registerDocumentPreview({
        mode: "cliente_autonomo",
        document,
      });

      if (!response.ok) {
        const message = getApiResponseMessage(
          response,
          "Não foi possível verificar este documento agora.",
        );
        setDocumentPreview(message);
        setDocumentPreviewStatus("error");
        toast.error(message);
        return;
      }

      const message =
        response.data?.message ||
        "Documento verificado. A API fará o vínculo com registros existentes quando houver correspondência.";
      const isAlreadyRegistered = message.toLowerCase().includes("já cadastrado");

      setDocumentPreview(message);
      setDocumentPreviewStatus(isAlreadyRegistered ? "error" : "success");

      if (isAlreadyRegistered) {
        toast.error(message);
      }
    } finally {
      setDocumentPreviewLoading(false);
    }
  }

  async function onSubmit(model: RegisterFormModel): Promise<ApiServiceResponse<RegisterResult>> {
    const selectedMode = model.mode || mode;
    const isDelegateMode =
      selectedMode === "representative" || selectedMode === "consultor_representante";

    if (model.password.trim() !== model.confirmPassword.trim()) {
      return {
        ok: false,
        status: "error",
        message: "As senhas não coincidem.",
      };
    }

    if (selectedMode === "cliente_autonomo" && !isValidCpfCnpj(model.cpfCnpjTitular)) {
      return {
        ok: false,
        status: "error",
        message: "Informe um CPF ou CNPJ válido para o titular/empreendedor base.",
      };
    }

    if (isDelegateMode && !isValidCpf(model.cpf)) {
      return {
        ok: false,
        status: "error",
        message: "Informe seu CPF pessoal para criar a conta de acesso.",
      };
    }

    if (selectedMode === "cliente_autonomo" && model.contractAccepted !== "on") {
      return {
        ok: false,
        status: "error",
        message: "Você deve aceitar os termos para concluir o cadastro.",
      };
    }

    const payload: RegisterModel = {
      mode: selectedMode,
      name: model.name.trim(),
      email: model.email.trim().toLowerCase(),
      phone: model.phone.trim(),
      cpf: normalizeCpfCnpj(model.cpf),
      cpfCnpjTitular: normalizeCpfCnpj(model.cpfCnpjTitular),
      password: model.password.trim(),
      selectedPackage: selectedMode === "cliente_autonomo" ? "gratuito" : undefined,
      contractAccepted: selectedMode === "cliente_autonomo" ? true : true,
      marketingContactConsent: selectedMode === "cliente_autonomo",
    };

    const response = await authService.register(payload);

    if (!response.ok) {
      return {
        ok: false,
        status: "error",
        message: getApiResponseMessage(
          response,
          "Não foi possível concluir o cadastro agora.",
        ),
        notifications: response.notifications,
      };
    }

    const session = extractSession(response.data);

    if (session) {
      authStore.setAuthenticated(session);
      await navigate({ to: "/app", replace: true });
    } else {
      await navigate({ to: "/login", replace: true });
    }

    return {
      ok: true,
      status: "success",
      data: response.data ?? undefined,
      message:
        response.data?.status === "access_pending"
          ? "Conta criada. Entre para solicitar acesso ao titular."
          : "Cadastro realizado com sucesso.",
    };
  }

  return (
    <PublicAuthLayout wide alignTop>
      <div className="space-y-6">
        <Card className="border border-border bg-card shadow-md">
          <CardHeader className="space-y-1.5 pb-4">
            <CardTitle className="text-xl font-semibold text-foreground">
              Cadastre-se
            </CardTitle>
            <CardDescription>
              Crie sua conta inicial para acessar o AmbientaR pela nova arquitetura.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Form<RegisterFormModel, RegisterResult>
              validation={validation}
              onSubmit={onSubmit}
              defaultNotificationChannels={["toast"]}
              className="flex flex-col gap-5"
            >
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <UserRound className="h-4 w-4 text-primary" />
                  Perfil
                </div>
                <RadioGroup
                  name="mode"
                  value={mode}
                  onValueChange={(value) => setMode(value as RegisterMode)}
                  className="grid gap-2"
                >
                  <RadioGroupItem
                    value="cliente_autonomo"
                    label="Cliente Autônomo"
                    description={PROFILE_DESCRIPTIONS.cliente_autonomo}
                  />
                  <RadioGroupItem
                    value="representative"
                    label="Representante"
                    description={PROFILE_DESCRIPTIONS.representative}
                  />
                  <RadioGroupItem
                    value="consultor_representante"
                    label="Consultor Representante"
                    description={PROFILE_DESCRIPTIONS.consultor_representante}
                  />
                </RadioGroup>
              </section>

              <section className="grid gap-4 md:grid-cols-2">
                {isTitularMode ? (
                  <Input
                    label="CPF ou CNPJ do titular"
                    name="cpfCnpjTitular"
                    required
                    mask="digits"
                    placeholder="Digite CPF ou CNPJ"
                    helperStatus={documentPreviewLoading ? "info" : documentPreviewStatus}
                    helperText={
                      documentPreviewLoading
                        ? "Verificando documento..."
                        : documentPreview || "Documento que identificará o empreendedor base."
                    }
                    onBlur={handleDocumentBlur}
                  />
                ) : (
                  <Input
                    label="CPF pessoal"
                    name="cpf"
                    required
                    mask="cpf"
                    placeholder="000.000.000-00"
                    helperText="Usado para vincular seu login à sua identidade."
                  />
                )}

                <Input
                  label="Telefone"
                  name="phone"
                  required
                  mask="phone"
                  placeholder="(31) 99999-9999"
                />

                <Input
                  label="Nome completo"
                  name="name"
                  required
                  placeholder="Seu nome completo"
                  containerClassName="md:col-span-2"
                />

                <Input
                  label="E-mail"
                  name="email"
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="seu-email@exemplo.com"
                />

                <Input
                  label="Senha"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                />

                <Input
                  label="Confirmar senha"
                  name="confirmPassword"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Repita sua senha"
                />
              </section>

              {isTitularMode && (
                <label className="flex items-start gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                  <input
                    name="contractAccepted"
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 accent-emerald-600"
                  />
                  <span>
                    Aceito os termos de uso e contrato do plano gratuito inicial.
                  </span>
                </label>
              )}

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  fullWidth
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                  onClick={() => navigate({ to: "/login" })}
                >
                  Voltar
                </Button>
                <Button
                  type="submit"
                  fullWidth
                  leftIcon={isTitularMode ? <FileText className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                >
                  Concluir cadastro
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PublicAuthLayout>
  );
}
