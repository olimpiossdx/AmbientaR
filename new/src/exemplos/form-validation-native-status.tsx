import Button from "../componentes/button";
import { Form } from "../componentes/form/form";
import Input from "../componentes/input";
import type { ValidationConfig } from "../hook/use-validation.type";

type LoginModel = {
  email: string;
};

const validation: ValidationConfig<LoginModel> = {
  feedbackMode: "native",
  validateOnChange: true,
  validateOnBlur: true,
  schema: {
    email: {
      validate: (value) => {
        const email = String(value ?? "").trim();

        if (!email.endsWith("@empresa.com")) {
          return {
            valid: true,
            type: "warning",
            message: "Recomendamos usar seu e-mail corporativo.",
          };
        }

        return {
          valid: true,
          type: "success",
          message: "E-mail corporativo identificado.",
        };
      },
    },
  },
};

const pageClassName = "min-h-screen bg-slate-50 px-4 py-8";

const panelClassName = [
  "mx-auto grid w-full max-w-3xl gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm",
  "",
].join(" ");

const titleClassName = "text-xl font-semibold tracking-tight text-gray-950";

const descriptionClassName = "mt-2 text-sm leading-6 text-slate-600";

const formClassName = "grid gap-5";

const helperCardClassName = [
  "rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700",
  "",
].join(" ");

const statusItemClassName = "flex items-center gap-2";

export default function FormValidationNativeStatus() {
  return (
    <section className={pageClassName}>
      <div className={panelClassName}>
        <header>
          <h1 className={titleClassName}>Validação nativa com status visual</h1>
          <p className={descriptionClassName}>
            Aqui o modo é nativo: erros bloqueantes podem usar o balão do navegador. Já os estados não bloqueantes
            continuam disponíveis no DOM por <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">data-validation-status</code>
            e são estilizados pelo próprio <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">Input</code>.
          </p>
        </header>

        <div className={helperCardClassName}>
          <p className="font-medium text-gray-900">Teste os estados:</p>

          <ul className="mt-3 grid gap-2">
            <li className={statusItemClassName}>
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" aria-hidden="true" />
              Campo vazio ou e-mail inválido: erro nativo bloqueante.
            </li>

            <li className={statusItemClassName}>
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" aria-hidden="true" />
              E-mail válido fora do domínio corporativo: warning visual, sem bloquear.
            </li>

            <li className={statusItemClassName}>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
              E-mail terminado em @empresa.com: success visual.
            </li>
          </ul>
        </div>

        <Form<LoginModel>
          id="login-native"
          validation={validation}
          className={formClassName}
          onSubmit={(model) => {
            console.log("Login", model);
          }}
        >
          <Input
            name="email"
            type="email"
            required
            label="E-mail"
            placeholder="voce@empresa.com"
            containerClassName="gap-1.5"
          />

          <div className="flex justify-end border-t border-slate-100 pt-5">
            <Button type="submit">Entrar</Button>
          </div>
        </Form>
      </div>
    </section>
  );
}
