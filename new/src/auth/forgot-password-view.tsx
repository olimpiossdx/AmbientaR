import { ArrowLeft, Mail } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  Input,
} from "../componentes";
import { authService } from "./auth-service";
import { getApiResponseMessage } from "./auth-api-response";
import { isValidEmail } from "./auth-validation";
import { PublicAuthLayout } from "./public-auth-layout";

type ForgotPasswordModel = {
  email: string;
};

export function ForgotPasswordView() {
  const validation = {
    schema: {
      email: {
        validate: (value: unknown) => ({
          valid: isValidEmail(value),
          message: "Informe um e-mail válido.",
        }),
      },
    },
  };

  async function onSubmit(model: ForgotPasswordModel) {
    const response = await authService.passwordReset({
      email: model.email.trim().toLowerCase(),
    });

    if (!response.ok) {
      return {
        ok: false,
        status: "error" as const,
        message: getApiResponseMessage(
          response,
          "Não foi possível enviar a recuperação de senha agora.",
        ),
        notifications: response.notifications,
      };
    }

    return {
      ok: true,
      status: "success" as const,
      message: "Se o e-mail existir no AmbientaR, enviaremos as instruções de redefinição.",
    };
  }

  return (
    <PublicAuthLayout>
      <div className="space-y-6">
        <Card className="border border-border bg-card shadow-md">
          <CardHeader className="space-y-1.5 pb-4">
            <CardTitle className="text-xl font-semibold text-foreground">
              Recuperar Senha
            </CardTitle>
            <CardDescription>
              Informe o e-mail cadastrado para receber as instruções de redefinição.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Form<ForgotPasswordModel>
              validation={validation}
              onSubmit={onSubmit}
              defaultNotificationChannels={["toast"]}
              className="flex flex-col gap-4"
            >
              <Input
                label="E-mail"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="seu@email.com"
                leftIcon={<Mail className="h-4 w-4" />}
              />

              <Button type="submit" fullWidth>
                Enviar e-mail de recuperação
              </Button>
            </Form>
          </CardContent>
        </Card>

        <div className="text-center text-sm">
          <a
            href="/login"
            className="inline-flex items-center justify-center gap-2 text-muted-foreground underline underline-offset-2 transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Voltar para o login
          </a>
        </div>
      </div>
    </PublicAuthLayout>
  );
}
