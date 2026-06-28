import React from "react";

import { ModalForm } from "../componentes/modal/index";
import Button from "../componentes/button";
import { cn } from "@sglara/cn";
import { Input, Select } from '../componentes';
import type {
  CustomValidationRule,
  ValidationConfig,
  ValidationResult,
} from "../hook/use-validation.type";

type ClienteModel = {
  nome: string;
  email: string;
  telefone: string;
  tipo: string;
  limiteCredito: number;
  ativo: boolean;
};

type ExampleMode = "create" | "edit" | "premium-invalid";

type ClienteModalProps = {
  open: boolean;
  cliente?: Partial<ClienteModel>;
  onClose: () => void;
};

const defaultClienteModel: ClienteModel = {
  nome: "",
  email: "",
  telefone: "",
  tipo: "",
  limiteCredito: 0,
  ativo: true,
};

const clienteEditModel: Partial<ClienteModel> = {
  nome: "Maria Souza",
  email: "maria@email.com",
  telefone: "(11) 99999-0000",
  tipo: "comum",
  limiteCredito: 250,
  ativo: true,
};

const clientePremiumInvalidModel: Partial<ClienteModel> = {
  nome: "Cliente Premium",
  email: "premium@email.com",
  telefone: "(11) 98888-7777",
  tipo: "premium",
  limiteCredito: 100,
  ativo: true,
};

const required = <T,>(
  message = "Campo obrigatório",
): CustomValidationRule<T> => ({
  validate: (value): ValidationResult => ({
    valid: value !== undefined && value !== null && String(value).trim() !== "",
    message,
    type: "error",
  }),
});

const email = <T,>(message = "E-mail inválido"): CustomValidationRule<T> => ({
  validate: (value): ValidationResult => ({
    valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)),
    message,
    type: "error",
  }),
});

const minNumber = <T,>(
  min: number,
  message = `Valor mínimo: ${min}`,
): CustomValidationRule<T> => ({
  validate: (value): ValidationResult => ({
    valid: Number(value) >= min,
    message,
    type: "error",
  }),
});

const limiteCreditoPorTipo: CustomValidationRule<ClienteModel> = {
  dependsOn: ["tipo"],
  validate: (value, model): ValidationResult => {
    const limite = Number(value);

    if (model.tipo === "premium" && limite < 1000) {
      return {
        valid: false,
        message: "Cliente premium precisa ter limite mínimo de R$ 1.000,00",
        type: "error",
      };
    }

    return { valid: true };
  },
};

const clienteValidation: ValidationConfig<ClienteModel> = {
  schema: {
    nome: required<ClienteModel>("Nome é obrigatório"),
    email: [
      required<ClienteModel>("E-mail é obrigatório"),
      email<ClienteModel>("Informe um e-mail válido"),
    ],
    tipo: required<ClienteModel>("Tipo de cliente é obrigatório"),
    limiteCredito: [
      minNumber<ClienteModel>(0, "Limite não pode ser negativo"),
      limiteCreditoPorTipo,
    ],
  },
  mode: "native",
  debounce: 300,
  validateOnChange: true,
  validateOnBlur: true,
};

type FieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "name"
> & {
  name: string;
  label: string;
};

function Field({
  className,
  label,
  ...props
}: FieldProps) {
  return (
    <label
      className={cn(
        "flex flex-col gap-1 text-sm font-medium text-slate-700",
        className,
      )}
    >
      <span>
        {label}
        {props.required ? " *" : ""}
      </span>

      <Input
        {...props}
        className="h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-blue-200"
      />
    </label>
  );
}

type SelectFieldProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "name"
> & {
  name: string;
  label: string;
};

function SelectField({
  className,
  label,
  children,
  ...props
}: SelectFieldProps) {
  return (
    <label
      className={cn(
        "flex flex-col gap-1 text-sm font-medium text-slate-700",
        className,
      )}
    >
      <span>
        {label}
        {props.required ? " *" : ""}
      </span>

      <Select
        {...props}
        className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-sky-500 focus:ring-2 focus:ring-blue-200"
      >
        {children}
      </Select>
    </label>
  );
}

type CheckboxFieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "name" | "type"
> & {
  name: string;
  label: string;
};

function CheckboxField({
  label,
  ...props
}: CheckboxFieldProps) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
      <Input {...props} type="checkbox" className="h-4 w-4" />
      <span>{label}</span>
    </label>
  );
}

async function salvarCliente(model: ClienteModel) {
  console.log("[ModalForm Cliente] Salvando cliente:", model);
}

export function ClienteModal({ open, cliente, onClose }: ClienteModalProps) {
  return (
    <ModalForm<ClienteModel>
      id="cliente-modal-form"
      open={open}
      title={cliente ? "Editar cliente" : "Novo cliente"}
      description="Preencha os dados do cliente. A validação é executada pelo useForm."
      size="2xl"
      model={{
        ...defaultClienteModel,
        ...cliente,
      }}
      validation={clienteValidation}
      submitLabel="Salvar cliente"
      cancelLabel="Cancelar"
      showReset
      resetLabel="Restaurar"
      onClose={onClose}
      onSubmit={async (model, { close }) => {
        await salvarCliente(model);
        close();
      }}
      actions={({ close, reset, validate, isValidating }) => (
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" onClick={close}>
            Cancelar
          </Button>

          <Button type="button" variant="secondary" onClick={reset}>
            Restaurar
          </Button>

          <Button
            type="button"
            variant="secondary"
            disabled={isValidating}
            onClick={async () => {
              const valid = await validate();
              console.log(
                "[ModalForm Cliente] Validação manual:",
                valid ? "válido" : "inválido",
              );
            }}
          >
            Validar
          </Button>

          <Button type="submit" disabled={isValidating}>
            {isValidating ? "Validando..." : "Salvar cliente"}
          </Button>
        </div>
      )}
    >
      {({ getFieldValue, setFieldValue }) => (
        <main className="flex flex-col gap-6">
          <section className="rounded-lg border border-slate-200 p-4">
            <h4 className="mb-4 text-base font-semibold text-slate-900">
              Dados principais
            </h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field name="nome" label="Nome" required />
              <Field name="email" label="E-mail" type="email" required />
              <Field name="telefone" label="Telefone" type="tel" />

              <SelectField
                name="tipo"
                label="Tipo"
                required
                onChange={() => {
                  requestAnimationFrame(() => {
                    const tipo = getFieldValue("tipo");
                    const limite = Number(getFieldValue("limiteCredito") ?? 0);

                    if (tipo === "premium" && limite < 1000) {
                      setFieldValue("limiteCredito", 1000);
                    }
                  });
                }}
              >
                <option value="">Selecione</option>
                <option value="comum">Comum</option>
                <option value="premium">Premium</option>
              </SelectField>

              <Field
                name="limiteCredito"
                label="Limite de crédito"
                type="number"
                min="0"
                step="0.01"
              />

              <div className="flex items-end pb-2">
                <CheckboxField name="ativo" label="Cliente ativo" />
              </div>
            </div>
          </section>

          <div className="rounded-md bg-sky-50 p-3 text-sm text-sky-800">
            Teste: selecione <strong>Premium</strong> e informe limite menor que
            1000. A regra
            <code className="mx-1 rounded bg-white px-1">
              dependsOn: ['tipo']
            </code>
            revalida o limite quando o tipo muda.
          </div>
        </main>
      )}
    </ModalForm>
  );
}

function getClienteByMode(
  mode: ExampleMode,
): Partial<ClienteModel> | undefined {
  if (mode === "edit") return clienteEditModel;
  if (mode === "premium-invalid") return clientePremiumInvalidModel;
  return undefined;
}

function getModeLabel(mode: ExampleMode): string {
  if (mode === "create") return "Novo cliente";
  if (mode === "edit") return "Editar cliente";
  return "Premium inválido";
}

export default function ModalFormClienteValidacaoExample() {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<ExampleMode>("create");

  const openExample = (nextMode: ExampleMode) => {
    setMode(nextMode);
    setOpen(true);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-gray-900">
          ModalForm com validação
        </h2>
        <p className="text-sm text-slate-600">
          Exemplo V1 do ModalForm como derivado composto: Modal + useForm +
          actions padrão, usando layout e campos normais do projeto.
        </p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-base font-semibold text-slate-900">
          Switch de exemplos
        </h3>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => openExample("create")}>
            Novo cliente
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => openExample("edit")}
          >
            Editar cliente
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={() => openExample("premium-invalid")}
          >
            Premium inválido
          </Button>
        </div>

        <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
          Cenário selecionado: <strong>{getModeLabel(mode)}</strong>
        </div>
      </section>

      <ClienteModal
        key={mode}
        open={open}
        cliente={getClienteByMode(mode)}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
