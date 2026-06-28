import React from "react";
import Alert from "../componentes/alert";
import Button from "../componentes/button";
import Input from "../componentes/input";
import { FormAlertRegion } from "../componentes/form/form-alert-region";
import type { FormContext } from "../componentes/form/propTypes.form";
import { Form } from "../componentes/form/form";


type Fase5FluxoCompletoModel = {
 cliente: {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
 };
 financeiro: {
  limite: number | string;
 };
};

type StepId = "cliente" | "financeiro" | "revisao";
type ScopeName = "cliente" | "financeiro";

const initialModel: Fase5FluxoCompletoModel = {
 cliente: {
  nome: "Ana Maria",
  email: "ana@email.com",
  cpf: "12345678900",
  telefone: "11999998888",
 },
 financeiro: {
  limite: "1234.56",
 },
};

const validation = {
 schema: {
  "cliente.nome": {
   validate: (value: unknown) => ({
    valid: String(value ?? "").trim().length >= 3,
    message: "Informe pelo menos 3 caracteres para o nome.",
   }),
  },
  "cliente.email": {
   validate: (value: unknown) => ({
    valid: /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(value ?? "")),
    message: "Informe um e-mail válido.",
   }),
  },
  "cliente.cpf": {
   validate: (value: unknown) => ({
    valid: String(value ?? "").length === 11,
    message: "Informe um CPF com 11 dígitos.",
   }),
  },
  "cliente.telefone": {
   validate: (value: unknown) => ({
    valid: String(value ?? "").length >= 10,
    message: "Informe um telefone válido.",
   }),
  },
  "financeiro.limite": {
   validate: (value: unknown) => ({
    valid: Number(String(value ?? "")) > 0,
    message: "Informe o limite financeiro.",
   }),
  },
 },
 validateOnBlur: true,
 validateOnChange: false,
} as const;

function getPreviousStep(step: StepId): StepId {
 if (step === "revisao") return "financeiro";
 return "cliente";
}

function getNextStep(step: StepId): StepId {
 if (step === "cliente") return "financeiro";
 if (step === "financeiro") return "revisao";
 return "revisao";
}

export function Fase5FluxoCompletoExample() {
 const [currentStep, setCurrentStep] = React.useState<StepId>("cliente");
 const [lastAction, setLastAction] = React.useState("Nenhuma ação executada.");
 const [snapshot, setSnapshot] = React.useState(initialModel);
 const [submittedModel, setSubmittedModel] = React.useState<Fase5FluxoCompletoModel | null>(null);

 const goToNextStep = async (form: FormContext<Fase5FluxoCompletoModel>, scope: ScopeName) => {
  const isValid = await form.validateScope(scope);

  setLastAction(`${scope}: ${isValid ? "válido" : "inválido"}`);

  if (!isValid) {
   return;
  }

  setSnapshot(form.getModel() ?? initialModel);
  setCurrentStep(getNextStep(currentStep));
 };

 const resetCliente = (form: FormContext<Fase5FluxoCompletoModel>) => {
  form.resetSection("cliente");
  setSnapshot(form.getModel() ?? initialModel);
  setLastAction("Seção cliente restaurada para o baseline atual.");
 };

 const resetLimite = (form: FormContext<Fase5FluxoCompletoModel>) => {
  form.resetField("financeiro.limite");
  setSnapshot(form.getModel() ?? initialModel);
  setLastAction("Campo financeiro.limite restaurado para o baseline atual.");
 };

 return (
  <section className="mx-auto max-w-5xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
   <div className="space-y-2">
    <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
     Fase 5
    </p>
    <h2 className="text-2xl font-bold text-slate-900">
     Fluxo completo do Form
    </h2>
    <p className="max-w-3xl text-sm text-slate-600">
     Exemplo consolidado com baseline/commit, reset parcial, validação por escopo e Input mask preservando o valor visual dos inputs.
    </p>
   </div>

   <Alert variant="info" title="Como testar">
    Avance os steps com validação por escopo, envie o cadastro e depois altere algum campo. O reset deve voltar ao último envio bem-sucedido, preservando a formatação visual.
   </Alert>

   <Form<Fase5FluxoCompletoModel>
    id="fase-5-fluxo-completo"
    model={initialModel}
    validation={validation}
    defaultNotificationChannels={["alert"]}
    onSubmit={async (model) => {
     const safeModel: Fase5FluxoCompletoModel = {
      cliente: model.cliente ?? snapshot.cliente ?? initialModel.cliente,
      financeiro: model.financeiro ?? snapshot.financeiro ?? initialModel.financeiro,
     };

     setSubmittedModel(safeModel);
     setSnapshot(safeModel);

     return {
      ok: true,
      message: `Cadastro enviado para ${safeModel.cliente.nome}.`,
     };
    }}
    className="space-y-6"
   >
    {(form) => (
     <>
      <FormAlertRegion />

      <div className="grid gap-3 md:grid-cols-3">
       {["cliente", "financeiro", "revisao"].map((step, index) => {
        const active = currentStep === step;

        return (
         <div
          key={step}
          className={[
           "rounded-xl border p-4 text-sm",
           active
            ? "border-sky-500 bg-sky-50 text-blue-950"
            : "border-slate-200 bg-slate-50 text-slate-600",
          ].join(" ")}
         >
          <strong>{index + 1}. {step}</strong>
         </div>
        );
       })}
      </div>

      <fieldset hidden={currentStep !== "cliente"} className="space-y-4 rounded-xl border border-slate-200 p-5">
       <legend className="px-1 text-sm font-semibold text-slate-800">
        Step 1 — Cliente
       </legend>

       <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium text-slate-700">
         <span>Nome</span>
         <Input name="cliente.nome" />
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
         <span>E-mail</span>
         <Input name="cliente.email" />
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
         <span>CPF</span>
         <Input name="cliente.cpf" mask="cpf" placeholder="000.000.000-00" />
        </label>

        <label className="space-y-1 text-sm font-medium text-slate-700">
         <span>Telefone</span>
         <Input name="cliente.telefone" mask="phone" placeholder="(00) 00000-0000" />
        </label>
       </div>

       <div className="flex flex-wrap gap-2">
        <Button variant="secondary" type="button" onClick={() => form.validateField("cliente.email")}>
         Validar e-mail
        </Button>
        <Button variant="outline" type="button" onClick={() => resetCliente(form)}>
         Resetar cliente
        </Button>
       </div>
      </fieldset>

      <fieldset hidden={currentStep !== "financeiro"} className="space-y-4 rounded-xl border border-slate-200 p-5">
       <legend className="px-1 text-sm font-semibold text-slate-800">
        Step 2 — Financeiro
       </legend>

       <label className="block space-y-1 text-sm font-medium text-slate-700">
        <span>Limite</span>
        <Input name="financeiro.limite" mask="currency" placeholder="R$ 0,00" />
       </label>

       <Button variant="outline" type="button" onClick={() => resetLimite(form)}>
        Resetar limite
       </Button>
      </fieldset>

      {currentStep === "revisao" && (
       <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-5">
         <h3 className="text-sm font-semibold text-slate-900">
          Revisão
         </h3>
         <p className="mt-1 text-sm text-slate-600">
          No submit, CPF, telefone e limite são enviados sem máscara pela API imperativa do Input. Visualmente, os inputs continuam formatados.
         </p>
        </div>

        <pre className="max-h-72 overflow-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">
         {JSON.stringify(snapshot, null, 2)}
        </pre>
       </div>
      )}

      <div className="flex flex-col gap-3 rounded-xl bg-slate-50 p-4 md:flex-row md:items-center md:justify-between">
       <p className="text-sm text-slate-600">{lastAction}</p>

       <div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" onClick={() => form.clearErrors()}>
         Limpar erros
        </Button>
        <Button
         type="button"
         variant="outline"
         onClick={() => {
          form.reset();
          setSnapshot(form.getModel() ?? initialModel);
          setLastAction("Reset global executado.");
         }}
        >
         Reset global
        </Button>

        {currentStep !== "cliente" && (
         <Button type="button" variant="outline" onClick={() => setCurrentStep(getPreviousStep(currentStep))}>
          Voltar
         </Button>
        )}

        {currentStep === "cliente" && (
         <Button type="button" onClick={() => goToNextStep(form, "cliente")}>
          Próximo
         </Button>
        )}

        {currentStep === "financeiro" && (
         <Button type="button" onClick={() => goToNextStep(form, "financeiro")}>
          Próximo
         </Button>
        )}

        {currentStep === "revisao" && (
         <Button type="submit">
          Enviar cadastro
         </Button>
        )}
       </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
       <h3 className="mb-2 text-sm font-semibold text-slate-900">
        Último payload enviado
       </h3>
       <pre className="max-h-72 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-50" tabIndex={0} aria-label="Estado do fluxo completo">
        {JSON.stringify(submittedModel, null, 2)}
       </pre>
      </div>
     </>
    )}
   </Form>
  </section>
 );
}
