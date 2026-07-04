import { useNavigate } from "@tanstack/react-router";
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
import { isValidLoginIdentifier } from "./auth-validation";
import { getApiResponseMessage } from "./auth-api-response";
import { useAuthActions } from "./auth-provider";

// const formSchema = z.object({
//   identifier: z
//     .string()
//     .min(1, 'Informe e-mail, CPF ou CNPJ.')
//     .transform((v) => v.trim())
//     .refine((v) => validateLoginIdentifier(v), {
//       message: 'Informe um e-mail, CPF ou CNPJ válido.',
//     }),
//   password: z
//     .string()
//     .min(6, 'A senha deve ter no mínimo 6 caracteres.')
//     .transform((v) => v.trim()),
// });

// type FormValues = z.infer<typeof formSchema>;
function getRedirect(): string {
 const params = new URLSearchParams(window.location.search);
 return params.get("redirect") || "/app";
}


interface LoginFormModel {
  username: string;
  password: string;
}

export function LoginForm() {
  const actions = useAuthActions();
  const navigate = useNavigate();
  async function onSubmit(model: LoginFormModel) {
    const result = await actions.login({
      username: model.username.trim(),
      password: model.password.trim(),
    });

    if (!result.session) {
      return {
        ok: false,
        status: "error" as const,
        message: getApiResponseMessage(
          result.response,
          "Não foi possível entrar. Confira usuário e senha.",
        ),
        notifications: result.response.notifications,
      };
    }

    await navigate({ to: getRedirect() as never, replace: true });

    return {
      ok: true,
      status: "success" as const,
      message: "Login realizado com sucesso.",
      data: result.session,
    };
  }
  const validation = {
    schema: {
      username: {
        validate: (value: unknown) => ({
          valid: isValidLoginIdentifier(value),
          message: "Informe um e-mail, CPF ou CNPJ válido.",
        }),
      },
      password: {
        validate: (value: unknown) => ({
          valid: String(value ?? "").trim().length >= 6,
          message: "A senha deve ter no mínimo 6 caracteres.",
        }),
      },
    },
  };

  return (
    <Card className="border border-border bg-card shadow-md">
      <CardHeader className="space-y-1.5 pb-4">
        <CardTitle className="text-xl font-semibold text-foreground">
          Acesse sua Conta
        </CardTitle>
        <CardDescription>
          Use seu e-mail, CPF ou CNPJ e a mesma senha cadastrada.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Form
          validation={validation}
          onSubmit={onSubmit}
          defaultNotificationChannels={["toast"]}
          className="flex flex-col gap-2"
        >
          <Input
            label="E-mail, CPF ou CNPJ"
            name="username"
            type="text"
            required
            autoComplete="username"
            placeholder="seu@email.com ou documento"
            helperStatus="neutral"
            helperText="A recuperação de senha continua disponível apenas pelo e-mail cadastrado."
            className="w-full"
          />
          <Input
            required
            label="Senha"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full"
          />
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
