import type { ValidationConfig } from "../hook/use-validation.type";

import Button from "../componentes/button";
import type { FormContext } from "../componentes/form/propTypes.form";
import Input from "../componentes/input";
import { Form } from "../componentes/form/form";

type CadastroModel = {
  nome: string;
  email: string;
  senha: string;
};

const validation: ValidationConfig<CadastroModel> = {
  feedbackMode: "helper",
  validateOnChange: true,
  validateOnBlur: true,
  debounce: 250,
  schema: {
    nome: {
      validate: (value) => {
        const nome = String(value ?? "").trim();

        if (!nome) {
          return { valid: false, type: "error", message: "Informe o nome." };
        }

        if (nome.length < 3) {
          return { valid: false, type: "error", message: "O nome precisa ter pelo menos 3 caracteres." };
        }

        return { valid: true, type: "success", message: "Nome preenchido corretamente." };
      },
    },

    email: {
      validate: (value) => {
        const email = String(value ?? "").trim();

        if (!email) {
          return { valid: false, type: "error", message: "Informe o e-mail." };
        }

        if (!email.includes("@")) {
          return { valid: false, type: "error", message: "Digite um e-mail válido." };
        }

        if (!email.endsWith("@empresa.com")) {
          return { valid: true, type: "warning", message: "Você pode continuar, mas recomendamos usar o e-mail corporativo." };
        }

        return { valid: true, type: "success", message: "E-mail corporativo identificado." };
      },
    },

    senha: [
      {
        validate: (value) => {
          const senha = String(value ?? "");

          if (!senha) {
            return { valid: false, type: "error", message: "Informe uma senha." };
          }

          return { valid: true };
        },
      },
      {
        validate: (value) => {
          const senha = String(value ?? "");

          if (senha.length < 8) {
            return { valid: true, type: "info", message: "Use pelo menos 8 caracteres para uma senha mais segura." };
          }

          if (!/[A-Z]/.test(senha)) {
            return { valid: true, type: "warning", message: "Adicionar uma letra maiúscula melhora a segurança." };
          }

          return { valid: true, type: "success", message: "Senha atende aos critérios recomendados." };
        },
      },
    ],
  },
};

const inputClassName = [
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5",
  "text-slate-950 placeholder:text-slate-400 shadow-sm outline-none transition",
  "focus:border-sky-500 focus:ring-2 focus:ring-blue-100",
  "data-[invalid=true]:border-red-500 data-[invalid=true]:ring-2 data-[invalid=true]:ring-red-100",
  "data-[validation-status=error]:border-red-500 data-[validation-status=error]:ring-2 data-[validation-status=error]:ring-red-100",
  "data-[validation-status=warning]:border-yellow-500 data-[validation-status=warning]:ring-2 data-[validation-status=warning]:ring-yellow-100",
  "data-[validation-status=success]:border-green-500 data-[validation-status=success]:ring-2 data-[validation-status=success]:ring-green-100",
].join(" ");

type ExampleFormContext = FormContext<CadastroModel> & {
  validationState?: { known: boolean; valid: boolean; hasErrors: boolean; validating: boolean };
  getValidationState?: () => { known: boolean; valid: boolean; hasErrors: boolean; validating: boolean };
};

function FormActions({ ctx }: { ctx: ExampleFormContext }) {
  const validationState = ctx.getValidationState?.() ?? ctx.validationState ?? {
    known: false,
    valid: true,
    hasErrors: false,
    validating: false,
  };

  const isValidationKnown = validationState.known === true;
  const isValidating = validationState.validating === true || ctx.isValidating === true;
  const shouldDisableSubmit = Boolean(isValidationKnown && validationState.valid === false);

  const statusClassName = [
    "rounded-lg px-4 py-3 text-sm leading-6",
    !isValidationKnown
      ? "bg-slate-50 text-slate-700"
      : validationState.valid === false
        ? "bg-rose-50 text-rose-800"
        : "bg-emerald-50 text-emerald-800",
  ].join(" ");

  const statusText = !isValidationKnown
    ? "O formulário começa em estado desconhecido. O primeiro clique em cadastrar ou a primeira interação executa a validação."
    : validationState.valid === false
      ? "Existem campos inválidos ou ainda não validados. Corrija todos os campos para habilitar o envio."
      : "Todos os campos estão válidos. O envio está habilitado.";

  return (
    <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
      <div className={statusClassName}>{statusText}</div>

      <div className="flex justify-end gap-3">
        <Button type="reset" variant="secondary">
          Limpar
        </Button>

        <Button type="submit" disabled={shouldDisableSubmit || isValidating}>
          {isValidating ? "Validando..." : "Cadastrar"}
        </Button>
      </div>
    </div>
  );
}

export default function FormValidationHelperSubmitDisabled() {
  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 text-slate-900">
      <section className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Validação com HelperText</h1>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            Neste exemplo, o formulário está em{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-800">feedbackMode=&quot;helper&quot;</code>.
            O navegador não mostra balão nativo. Erros, avisos e sucessos aparecem apenas no HelperText.
          </p>
        </div>

        <Form<CadastroModel>
          id="form-validation-helper-submit-disabled"
          validation={validation}
          noValidate
          onSubmit={async (model) => {
            console.log("Cadastro enviado:", model);
          }}
          className="space-y-6"
          actions={(ctx) => <FormActions ctx={ctx as ExampleFormContext} />}
        >
          <div className="space-y-5">
            <Input name="nome" label="Nome" required placeholder="Maria Silva" containerClassName="space-y-1.5" className={inputClassName} />
            <Input name="email" label="E-mail" type="email" required placeholder="maria@empresa.com" containerClassName="space-y-1.5" className={inputClassName} />
            <Input name="senha" label="Senha" type="password" required placeholder="Digite sua senha" containerClassName="space-y-1.5" className={inputClassName} />
          </div>
        </Form>
      </section>
    </main>
  );
}
