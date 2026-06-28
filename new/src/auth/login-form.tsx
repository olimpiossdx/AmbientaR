import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Form,
  Input,
  toast,
} from "../componentes";

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

interface IFormLogin {}
export function LoginForm() {
  async function onSubmit(values: IFormLogin) {
    console.log("values", values);
    toast.success("Bem-vindo de volta!");

    // setLoading(true);`
    // const success = await login(values.identifier, values.password);
    // if (success) {
    //   toast({
    //     title: 'Login bem-sucedido!',
    //     description: 'Bem-vindo de volta!',
    //   });
    // }
    // setLoading(false);
  }
  const validation = {
    schema: {
      identifier: {
        validate: (value: unknown) => ({
          valid: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(value ?? "")),
          message: "Informe um e-mail válido.",
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
        <Form validation={validation} onSubmit={onSubmit}>
          <Input
            required
            name="identifier"
            type="email"
            autoComplete="username"
            placeholder="seu@email.com ou documento"
          />
          <Input
            required
            label="Senha"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
          />
          <Button type="submit" className="w-full">
            Entrar
          </Button>
        </Form>
      </CardContent>
    </Card>
  );
}
