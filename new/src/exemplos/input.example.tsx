import React from "react";
import {
  AtSign,
  BadgeCheck,
  Building2,
  CalendarDays,
  CreditCard,
  Hash,
  Lock,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  User,
} from "lucide-react";

import Button from "../componentes/button";
import { Form } from "../componentes/form/form";
import Input from "../componentes/input";
import type { ValidationConfig } from "../hook/use-validation.type";
import type { MaskResult } from "../utils/mask-builder";

type CadastroInputExampleModel = {
  nome: string;
  email: string;
  senha: string;
  cpf: string;
  telefone: string;
  limite: string;
};

type MaskSnapshot = {
  field: string;
  maskedValue: string;
  unmaskedValue: string;
  mask: string;
};

const pageClassName =
  "min-h-screen bg-gray-50 px-4 py-8 text-gray-900 dark:bg-gray-950 dark:text-gray-100";

const shellClassName = ["mx-auto grid w-full max-w-6xl gap-6"].join(" ");

const headerClassName = [
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm",
  "dark:border-gray-800 dark:bg-gray-900",
].join(" ");

const cardClassName = [
  "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm",
  "dark:border-gray-800 dark:bg-gray-900",
].join(" ");

const cardTitleClassName =
  "text-base font-semibold text-gray-950 dark:text-gray-50";
const cardDescriptionClassName =
  "mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400";
const gridTwoClassName = "grid gap-4 md:grid-cols-2";
const gridThreeClassName = "grid items-start gap-4 md:grid-cols-3";

const initialFormModel: CadastroInputExampleModel = {
  nome: "Ana Maria",
  email: "ana@empresa.com",
  senha: "Senha123",
  cpf: "12345678900",
  telefone: "11999998888",
  limite: "1500.00",
};

const validation: ValidationConfig<CadastroInputExampleModel> = {
  feedbackMode: "helper",
  validateOnChange: true,
  validateOnBlur: true,
  debounce: 300,
  schema: {
    nome: {
      validate: (value) => {
        const nome = String(value ?? "").trim();

        if (!nome) {
          return { valid: false, type: "error", message: "Informe o nome." };
        }

        if (nome.length < 3) {
          return {
            valid: false,
            type: "error",
            message: "O nome precisa ter pelo menos 3 caracteres.",
          };
        }

        return {
          valid: true,
          type: "success",
          message: "Nome preenchido corretamente.",
        };
      },
    },
    email: {
      validate: (value) => {
        const email = String(value ?? "").trim();

        if (!email) {
          return { valid: false, type: "error", message: "Informe o e-mail." };
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          return {
            valid: false,
            type: "error",
            message: "Digite um e-mail válido.",
          };
        }

        if (!email.endsWith("@empresa.com")) {
          return {
            valid: true,
            type: "warning",
            message:
              "Você pode continuar, mas recomendamos usar o e-mail corporativo.",
          };
        }

        return {
          valid: true,
          type: "success",
          message: "E-mail corporativo identificado.",
        };
      },
    },
    senha: [
      {
        validate: (value) => {
          const senha = String(value ?? "");

          if (!senha) {
            return {
              valid: false,
              type: "error",
              message: "Informe uma senha.",
            };
          }

          return { valid: true };
        },
      },
      {
        validate: (value) => {
          const senha = String(value ?? "");

          if (senha.length < 8) {
            return {
              valid: true,
              type: "info",
              message:
                "Use pelo menos 8 caracteres para uma senha mais segura.",
            };
          }

          if (!/[A-Z]/.test(senha)) {
            return {
              valid: true,
              type: "warning",
              message: "Adicionar uma letra maiúscula melhora a segurança.",
            };
          }

          return {
            valid: true,
            type: "success",
            message: "Senha atende aos critérios recomendados.",
          };
        },
      },
    ],
    cpf: {
      validate: (value) => {
        const cpf = String(value ?? "");

        if (cpf.length !== 11) {
          return {
            valid: false,
            type: "error",
            message: "CPF precisa ter 11 dígitos.",
          };
        }

        return {
          valid: true,
          type: "success",
          message: "CPF preenchido corretamente.",
        };
      },
    },
    telefone: {
      validate: (value) => {
        const telefone = String(value ?? "");

        if (telefone.length < 10) {
          return {
            valid: false,
            type: "error",
            message: "Informe um telefone com DDD.",
          };
        }

        return {
          valid: true,
          type: "success",
          message: "Telefone preenchido corretamente.",
        };
      },
    },
    limite: {
      validate: (value) => {
        const limite = Number(value);

        if (!Number.isFinite(limite) || limite <= 0) {
          return {
            valid: false,
            type: "error",
            message: "Informe um limite maior que zero.",
          };
        }

        return { valid: true, type: "success", message: "Valor aceito." };
      },
    },
  },
};

function DemoCard({
  title,
  description,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className={cardClassName}>
      <div className="mb-5">
        <h2 className={cardTitleClassName}>{title}</h2>
        {description ? (
          <p className={cardDescriptionClassName}>{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function StatusBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
      {children}
    </span>
  );
}

function InputExampleHeader() {
  return (
    <header className={headerClassName}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-600 dark:text-blue-400">
            Componentes / Input
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-gray-950 dark:text-gray-50">
            Input
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-400">
            Catálogo no padrão dos exemplos do sistema, com tema claro como
            base, suporte a dark mode, variantes, tamanhos, floating label,
            helper text, validação, máscaras, senha, ícones e campos nativos.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusBadge>claro primeiro</StatusBadge>
          <StatusBadge>dark via .dark</StatusBadge>
          <StatusBadge>DOM-first</StatusBadge>
        </div>
      </div>
    </header>
  );
}

const MemoInputExampleHeader = React.memo(InputExampleHeader);

function BasicExamples() {
  return (
    <DemoCard
      title="Uso básico"
      description="Campos comuns usando label estático, placeholder, ícones e helper manual."
    >
      <div className={gridTwoClassName}>
        <Input
          name="input-basico-nome"
          label="Nome"
          placeholder="Digite seu nome"
          leftIcon={<User size={16} />}
          helperText="Campo textual simples com ícone à esquerda."
          helperStatus="info"
        />

        <Input
          name="input-basico-email"
          type="email"
          label="E-mail"
          placeholder="email@empresa.com"
          leftIcon={<Mail size={16} />}
          rightIcon={<BadgeCheck size={16} />}
          helperText="Pode usar ícone à direita para indicar contexto visual."
          helperStatus="neutral"
        />
      </div>
    </DemoCard>
  );
}

const MemoBasicExamples = React.memo(BasicExamples);

function VariantExamples() {
  return (
    <DemoCard
      title="Variantes"
      description="Outlined é o padrão. Filled e ghost seguem o mesmo contrato de props, mudando apenas a apresentação."
    >
      <div className={gridThreeClassName}>
        <Input
          name="input-variante-outlined"
          label="Outlined"
          placeholder="Borda completa"
          variant="outlined"
          helperText="Variante padrão."
          helperStatus="neutral"
        />

        <Input
          name="input-variante-filled"
          label="Filled"
          placeholder="Fundo preenchido"
          variant="filled"
          helperText="Boa para telas densas."
          helperStatus="neutral"
        />

        <Input
          name="input-variante-ghost"
          label="Ghost"
          placeholder="Mais discreto"
          variant="ghost"
          helperText="Útil em tabelas e filtros compactos."
          helperStatus="neutral"
        />
      </div>
    </DemoCard>
  );
}

const MemoVariantExamples = React.memo(VariantExamples);

function SizeExamples() {
  return (
    <DemoCard
      title="Tamanhos"
      description="A prop sized controla altura, padding e tamanho de fonte sem mudar a API do campo."
    >
      <div className={gridThreeClassName}>
        <Input
          name="input-size-sm"
          label="Small"
          placeholder="sized=sm"
          sized="sm"
        />
        <Input
          name="input-size-md"
          label="Medium"
          placeholder="sized=md"
          sized="md"
        />
        <Input
          name="input-size-lg"
          label="Large"
          placeholder="sized=lg"
          sized="lg"
        />
      </div>
    </DemoCard>
  );
}

const MemoSizeExamples = React.memo(SizeExamples);

function FloatingLabelExamples() {
  return (
    <DemoCard
      title="Floating label"
      description="Funciona com as três variantes. O placeholder real fica transparente para preservar o estado :placeholder-shown."
    >
      <div className={gridThreeClassName}>
        <Input
          name="input-floating-outlined"
          label="Nome completo"
          floatingLabel
          leftIcon={<User size={16} />}
          variant="outlined"
        />

        <Input
          name="input-floating-filled"
          label="Empresa"
          floatingLabel
          leftIcon={<Building2 size={16} />}
          variant="filled"
        />

        <Input
          name="input-floating-ghost"
          label="Buscar"
          floatingLabel
          leftIcon={<Search size={16} />}
          variant="ghost"
        />
      </div>
    </DemoCard>
  );
}

const MemoFloatingLabelExamples = React.memo(FloatingLabelExamples);

function PasswordStateExamples() {
  return (
    <DemoCard
      title="Senha, estados e atributos nativos"
      description="O botão de senha é interno ao componente. Estados disabled, readOnly e required continuam sendo atributos nativos."
    >
      <div className={gridTwoClassName}>
        <Input
          name="input-senha"
          type="password"
          label="Senha"
          placeholder="Digite sua senha"
          leftIcon={<Lock size={16} />}
          rightIcon={<ShieldCheck size={16} />}
          showPasswordToggle
          helperText="Use showPasswordToggle para exibir/ocultar senha."
          helperStatus="info"
        />

        <Input
          name="input-required-native"
          label="Campo obrigatório nativo"
          placeholder="Clique em validar sem preencher"
          required
          minLength={3}
          helperText="O onInvalid marca data-invalid e aplica animate-shake."
          helperStatus="warning"
        />

        <Input
          name="input-disabled"
          label="Disabled"
          placeholder="Campo desabilitado"
          disabled
          defaultValue="Não editável"
        />

        <Input
          name="input-readonly"
          label="Read only"
          readOnly
          defaultValue="Somente leitura"
          helperText="readOnly mantém foco/leitura, mas bloqueia edição."
          helperStatus="neutral"
        />
      </div>
    </DemoCard>
  );
}

const MemoPasswordStateExamples = React.memo(PasswordStateExamples);

function HelperExamples() {
  return (
    <DemoCard
      title="HelperText manual e status visual"
      description="O helper pode ser usado diretamente por props ou atualizado pelo useValidation via feedbackMode=helper."
    >
      <div className={gridThreeClassName}>
        <Input
          name="helper-info"
          label="Info"
          helperText="Mensagem informativa."
          helperStatus="info"
          defaultValue="Informação"
        />

        <Input
          name="helper-warning"
          label="Warning"
          helperText="Atenção sem bloqueio."
          helperStatus="warning"
          defaultValue="Aviso"
          data-validation-status="warning"
        />

        <Input
          name="helper-success"
          label="Success"
          helperText="Campo preenchido corretamente."
          helperStatus="success"
          defaultValue="Sucesso"
          data-validation-status="success"
        />

        <Input
          name="helper-error"
          label="Error"
          helperText="Mensagem de erro visual."
          helperStatus="error"
          defaultValue="Erro"
          data-validation-status="error"
        />

        <Input
          name="helper-neutral"
          label="Neutral"
          helperText="Mensagem neutra."
          helperStatus="neutral"
          defaultValue="Neutro"
          data-validation-status="neutral"
        />
      </div>
    </DemoCard>
  );
}

const MemoHelperExamples = React.memo(HelperExamples);

function MaskExamples() {
  const [maskSnapshot, setMaskSnapshot] = React.useState<MaskSnapshot | null>(
    null,
  );

  const createMaskChangeHandler = React.useCallback(
    (field: string) =>
      (_event: React.ChangeEvent<HTMLInputElement>, result: MaskResult) => {
        setMaskSnapshot({
          field,
          maskedValue: result.maskedValue,
          unmaskedValue: result.unmaskedValue,
          mask: String(result.mask),
        });
      },
    [],
  );

  const maskHandlers = React.useMemo(
    () => ({
      cpf: createMaskChangeHandler("CPF"),
      cnpj: createMaskChangeHandler("CNPJ"),
      phone: createMaskChangeHandler("Telefone"),
      cep: createMaskChangeHandler("CEP"),
      currency: createMaskChangeHandler("Moeda"),
      custom: createMaskChangeHandler("Custom"),
    }),
    [createMaskChangeHandler],
  );

  return (
    <DemoCard
      title="Máscaras"
      description="As máscaras preservam o valor visual no input e expõem o valor limpo no payload do onChange."
    >
      <div className={gridThreeClassName}>
        <Input
          name="mask-cpf"
          label="CPF"
          placeholder="000.000.000-00"
          mask="cpf"
          leftIcon={<CreditCard size={16} />}
          onChange={maskHandlers.cpf}
          helperText="Preset cpf."
          helperStatus="neutral"
        />

        <Input
          name="mask-cnpj"
          label="CNPJ"
          placeholder="00.000.000/0000-00"
          mask="cnpj"
          leftIcon={<Building2 size={16} />}
          onChange={maskHandlers.cnpj}
          helperText="Preset cnpj."
          helperStatus="neutral"
        />

        <Input
          name="mask-phone"
          label="Telefone"
          placeholder="(00) 00000-0000"
          mask="phone"
          leftIcon={<Phone size={16} />}
          onChange={maskHandlers.phone}
          helperText="Alterna entre telefone fixo e celular."
          helperStatus="neutral"
        />

        <Input
          name="mask-cep"
          label="CEP"
          placeholder="00000-000"
          mask="cep"
          leftIcon={<Hash size={16} />}
          onChange={maskHandlers.cep}
          helperText="Preset cep."
          helperStatus="neutral"
        />

        <Input
          name="mask-currency"
          label="Moeda"
          placeholder="R$ 0,00"
          mask="currency"
          leftIcon={<CreditCard size={16} />}
          onChange={maskHandlers.currency}
          helperText="Preset currency com locale pt-BR."
          helperStatus="neutral"
        />

        <Input
          name="mask-custom"
          label="Máscara customizada"
          placeholder="AB-1234"
          mask="AA-9999"
          leftIcon={<AtSign size={16} />}
          onChange={maskHandlers.custom}
          helperText="Exemplo válido: AB-1234. Tokens: 9 número, A letra, * alfanumérico."
          helperStatus="neutral"
        />
      </div>

      <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-950">
        <p className="font-medium text-gray-900 dark:text-gray-100">
          Última máscara alterada
        </p>
        <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-white p-3 text-xs text-gray-700 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-800" tabIndex={0} aria-label="Estado do exemplo">
          {JSON.stringify(
            maskSnapshot ?? {
              field: null,
              maskedValue: null,
              unmaskedValue: null,
              mask: null,
            },
            null,
            2,
          )}
        </pre>
      </div>
    </DemoCard>
  );
}

const MemoMaskExamples = React.memo(MaskExamples);

function ControlledExamples() {
  const [controlledValue, setControlledValue] =
    React.useState("valor controlado");

  const handleControlledChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setControlledValue(event.currentTarget.value);
    },
    [],
  );

  return (
    <DemoCard
      title="Controlado e não controlado"
      description="O componente aceita value/defaultValue como input nativo. Com máscara, o value controlado é formatado para exibição."
    >
      <div className={gridTwoClassName}>
        <Input
          name="controlled-input"
          label="Controlado"
          value={controlledValue}
          onChange={handleControlledChange}
          helperText={`Valor atual: ${controlledValue}`}
          helperStatus="info"
        />

        <Input
          name="uncontrolled-input"
          label="Não controlado"
          defaultValue="valor inicial"
          helperText="Usa defaultValue e mantém o DOM como fonte de verdade."
          helperStatus="neutral"
        />
      </div>
    </DemoCard>
  );
}

const MemoControlledExamples = React.memo(ControlledExamples);

function CheckboxRadioExamples() {
  return (
    <DemoCard
      title="Checkbox e radio"
      description="Esses tipos continuam usando o input nativo direto. A estilização vem das regras globais do index.css, como na V1."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <fieldset className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <legend className="px-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Checkbox
          </legend>
          <div className="mt-3 grid gap-3">
            <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <Input name="checkbox-termos" type="checkbox" defaultChecked />
              Aceito os termos
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <Input name="checkbox-newsletter" type="checkbox" />
              Receber novidades
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-400">
              <Input name="checkbox-disabled" type="checkbox" disabled />
              Opção desabilitada
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <legend className="px-1 text-sm font-semibold text-gray-900 dark:text-gray-100">
            Radio
          </legend>
          <div className="mt-3 grid gap-3">
            <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <Input
                name="radio-plano"
                type="radio"
                value="starter"
                defaultChecked
              />
              Starter
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
              <Input name="radio-plano" type="radio" value="pro" />
              Pro
            </label>
            <label className="flex items-center gap-3 text-sm text-gray-400">
              <Input
                name="radio-plano"
                type="radio"
                value="enterprise"
                disabled
              />
              Enterprise indisponível
            </label>
          </div>
        </fieldset>
      </div>
    </DemoCard>
  );
}

const MemoCheckboxRadioExamples = React.memo(CheckboxRadioExamples);

function FormIntegrationExamples() {
  const [submittedModel, setSubmittedModel] =
    React.useState<CadastroInputExampleModel | null>(null);

  const handleSubmit = React.useCallback(
    async (model: CadastroInputExampleModel) => {
      setSubmittedModel(model);
      return {
        ok: true,
        status: "success" as const,
        message: "Exemplo enviado com sucesso.",
      };
    },
    [],
  );

  return (
    <DemoCard
      title="Integração com Form e useValidation"
      description="Demonstra feedbackMode=helper, validação com debounce, máscaras e submit com modelo limpo."
    >
      <Form<CadastroInputExampleModel>
        id="input-example-form"
        model={initialFormModel}
        validation={validation}
        onSubmit={handleSubmit}
        className="grid gap-5"
      >
        {(form) => (
          <>
            <div className={gridTwoClassName}>
              <Input
                name="nome"
                label="Nome"
                leftIcon={<User size={16} />}
                required
              />
              <Input
                name="email"
                type="email"
                label="E-mail"
                leftIcon={<Mail size={16} />}
                required
              />
              <Input
                name="senha"
                type="password"
                label="Senha"
                leftIcon={<Lock size={16} />}
                showPasswordToggle
                required
              />
              <Input
                name="cpf"
                label="CPF"
                mask="cpf"
                leftIcon={<CreditCard size={16} />}
                required
              />
              <Input
                name="telefone"
                label="Telefone"
                mask="phone"
                leftIcon={<Phone size={16} />}
                required
              />
              <Input
                name="limite"
                label="Limite"
                mask="currency"
                leftIcon={<CreditCard size={16} />}
                required
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-5 dark:border-gray-800">
              <Button
                type="button"
                variant="secondary"
                onClick={() => form.validate()}
              >
                Validar
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => form.clearErrors()}
              >
                Limpar erros
              </Button>
              <Button type="reset" variant="outline">
                Resetar
              </Button>
              <Button type="submit" disabled={form.isValidating}>
                {form.isValidating ? "Validando..." : "Enviar"}
              </Button>
            </div>
          </>
        )}
      </Form>

      <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm dark:border-gray-700 dark:bg-gray-950">
        <p className="font-medium text-gray-900 dark:text-gray-100">
          Último submit
        </p>
        <pre className="mt-3 max-h-72 overflow-auto rounded-lg bg-white p-3 text-xs text-gray-700 ring-1 ring-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:ring-gray-800" tabIndex={0} aria-label="Estado do exemplo">
          {JSON.stringify(submittedModel ?? null, null, 2)}
        </pre>
      </div>
    </DemoCard>
  );
}

const MemoFormIntegrationExamples = React.memo(FormIntegrationExamples);

function HtmlTypeExamples() {
  return (
    <DemoCard
      title="Tipos HTML comuns"
      description="Referência rápida de tipos nativos úteis, preservando o mesmo componente e a mesma base visual."
    >
      <div className={gridThreeClassName}>
        <Input
          name="html-date"
          type="date"
          label="Data"
          leftIcon={<CalendarDays size={16} />}
        />
        <Input name="html-time" type="time" label="Hora" />
        <Input
          name="html-number"
          type="number"
          label="Número"
          min={0}
          max={100}
        />
        <Input
          name="html-search"
          type="search"
          label="Busca"
          leftIcon={<Search size={16} />}
          placeholder="Buscar..."
        />
        <Input
          name="html-url"
          type="url"
          label="URL"
          placeholder="https://exemplo.com"
        />
        <Input
          name="html-color"
          type="color"
          label="Cor"
          defaultValue="#0891b2"
        />
      </div>
    </DemoCard>
  );
}

const MemoHtmlTypeExamples = React.memo(HtmlTypeExamples);

export default function InputExample() {
  return (
    <main className={pageClassName}>
      <div className={shellClassName}>
        <MemoInputExampleHeader />
        <MemoBasicExamples />
        <MemoVariantExamples />
        <MemoSizeExamples />
        <MemoFloatingLabelExamples />
        <MemoPasswordStateExamples />
        <MemoHelperExamples />
        <MemoMaskExamples />
        <MemoControlledExamples />
        <MemoCheckboxRadioExamples />
        <MemoFormIntegrationExamples />
        <MemoHtmlTypeExamples />
      </div>
    </main>
  );
}
