import React from "react";
import Alert from "../componentes/alert";
import Button from "../componentes/button";
import { FormAlertRegion } from "../componentes/form/form-alert-region";
import type { FormContext } from "../componentes/form/propTypes.form";
import { Form } from "../componentes/form/form";
import { Input } from '../componentes';

interface Fase3ValidationModel {
 cliente: {
  nome: string;
  email: string;
 };
 endereco: {
  cidade: string;
  uf: string;
 };
}

type StepId = "cliente" | "endereco" | "revisao";

type FieldName = "cliente.nome" | "cliente.email" | "endereco.cidade" | "endereco.uf";

type ScopeName = "cliente" | "endereco";

const initialModel: Fase3ValidationModel = {
 cliente: {
  nome: "Ana Maria",
  email: "ana@email.com",
 },
 endereco: {
  cidade: "São Paulo",
  uf: "SP",
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
  "endereco.cidade": {
   validate: (value: unknown) => ({
    valid: String(value ?? "").trim().length > 0,
    message: "Informe a cidade.",
   }),
  },
  "endereco.uf": {
   validate: (value: unknown) => ({
    valid: /^[A-Z]{2}$/.test(String(value ?? "")),
    message: "Informe a UF com 2 letras maiúsculas.",
   }),
  },
 },
 validateOnBlur: true,
 validateOnChange: false,
} as const;

const steps: Array<{ id: StepId; title: string; description: string }> = [
 {
  id: "cliente",
  title: "Cliente",
  description: "Dados principais do cliente.",
 },
 {
  id: "endereco",
  title: "Endereço",
  description: "Localização de entrega.",
 },
 {
  id: "revisao",
  title: "Revisão",
  description: "Confirme os dados antes de enviar.",
 },
];

function stepIndex(step: StepId) {
 return steps.findIndex((item) => item.id === step);
}

function getNextStep(step: StepId): StepId {
 if (step === "cliente") {
  return "endereco";
 }

 if (step === "endereco") {
  return "revisao";
 }

 return "revisao";
}

function getPreviousStep(step: StepId): StepId {
 if (step === "revisao") {
  return "endereco";
 }

 if (step === "endereco") {
  return "cliente";
 }

 return "cliente";
}

export function Fase3ValidacaoParcialExample() {
 const [currentStep, setCurrentStep] = React.useState<StepId>("cliente");
 const [lastAction, setLastAction] = React.useState("Nenhuma validação manual executada.");
 const [snapshot, setSnapshot] = React.useState(initialModel);

 const currentStepIndex = stepIndex(currentStep);

 const validateField = async (ctx: FormContext<Fase3ValidationModel>, fieldName: FieldName) => {
  const isValid = await ctx.validateField(fieldName);
  setLastAction(`${fieldName}: ${isValid ? "válido" : "inválido"}`);
 };

 const validateScope = async (ctx: FormContext<Fase3ValidationModel>, scope: ScopeName) => {
  const isValid = await ctx.validateScope(scope);
  setLastAction(`Step ${scope}: ${isValid ? "válido" : "inválido"}`);

  return isValid;
 };

 const goToNextStep = async (ctx: FormContext<Fase3ValidationModel>, scope: ScopeName) => {
  const isValid = await validateScope(ctx, scope);

  if (!isValid) {
   return;
  }

  setSnapshot(ctx.getModel() ?? initialModel);
  setCurrentStep(getNextStep(currentStep));
 };

 const goToPreviousStep = () => {
  setCurrentStep(getPreviousStep(currentStep));
 };

 return (
  <section className="mx-auto max-w-5xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
   <div className="space-y-2">
    <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
     Fase 3
    </p>
    <h2 className="text-2xl font-bold text-slate-900">
     Validação parcial em formulário por steps
    </h2>
    <p className="max-w-3xl text-sm text-slate-600">
     Este exemplo usa <strong>validateScope</strong> para liberar a navegação entre steps somente quando a seção atual estiver válida. O submit final continua validando o formulário inteiro.
    </p>
   </div>

   <Alert variant="info" title="Onde validateScope faz sentido">
    No botão Próximo, validamos apenas o escopo do step atual. Assim o usuário não recebe erros de campos que ainda nem chegou a preencher.
   </Alert>

   <Form<Fase3ValidationModel>
    id="fase-3-validacao-parcial-step"
    model={initialModel}
    validation={validation}
    defaultNotificationChannels={["alert"]}
    onSubmit={async (model) => {
     const submittedModel: Fase3ValidationModel = {
      cliente: model.cliente ?? snapshot.cliente ?? initialModel.cliente,
      endereco: model.endereco ?? snapshot.endereco ?? initialModel.endereco,
     };

     setSnapshot(submittedModel);

     return {
      ok: true,
      message: `Cadastro enviado para ${submittedModel.cliente.nome}.`,
     };
    }}
    className="space-y-6"
   >
    {(ctx) => (
     <>
      <FormAlertRegion />

      <ol className="grid gap-3 md:grid-cols-3">
       {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = index < currentStepIndex;

        return (
         <li
          key={step.id}
          className={[
           "rounded-xl border p-4 transition",
           isActive
            ? "border-sky-500 bg-sky-50"
            : "border-slate-200 bg-slate-50",
          ].join(" ")}
         >
          <div className="flex items-center gap-3">
           <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-700 shadow-sm">
            {isCompleted ? "✓" : index + 1}
           </span>
           <div>
            <p className="text-sm font-semibold text-slate-900">
             {step.title}
            </p>
            <p className="text-xs text-slate-500">
             {step.description}
            </p>
           </div>
          </div>
         </li>
        );
       })}
      </ol>

      <fieldset
       hidden={currentStep !== "cliente"}
       className="space-y-4 rounded-xl border border-slate-200 p-5"
      >
        <legend className="px-1 text-sm font-semibold text-slate-800">
         Step 1 — Cliente
        </legend>

        <div className="grid gap-4 md:grid-cols-2">
         <label className="block space-y-1 text-sm font-medium text-slate-700">
          <span>Nome</span>
          <Input
           name="cliente.nome"
           className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100/20"
          />
         </label>

         <label className="block space-y-1 text-sm font-medium text-slate-700">
          <span>E-mail</span>
          <Input
           name="cliente.email"
           className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100/20"
          />
         </label>
        </div>

        <div className="flex flex-wrap gap-2">
         <Button variant="outline" size="sm" onClick={() => validateField(ctx, "cliente.nome")}>Validar nome</Button>
         <Button variant="outline" size="sm" onClick={() => validateField(ctx, "cliente.email")}>Validar e-mail</Button>
         <Button variant="secondary" size="sm" onClick={() => validateScope(ctx, "cliente")}>Validar step cliente</Button>
        </div>
       </fieldset>

      <fieldset
       hidden={currentStep !== "endereco"}
       className="space-y-4 rounded-xl border border-slate-200 p-5"
      >
        <legend className="px-1 text-sm font-semibold text-slate-800">
         Step 2 — Endereço
        </legend>

        <div className="grid gap-4 md:grid-cols-[1fr_160px]">
         <label className="block space-y-1 text-sm font-medium text-slate-700">
          <span>Cidade</span>
          <Input
           name="endereco.cidade"
           className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100/20"
          />
         </label>

         <label className="block space-y-1 text-sm font-medium text-slate-700">
          <span>UF</span>
          <Input
           name="endereco.uf"
           maxLength={2}
           className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm uppercase outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100/20"
          />
         </label>
        </div>

        <div className="flex flex-wrap gap-2">
         <Button variant="outline" size="sm" onClick={() => validateField(ctx, "endereco.cidade")}>Validar cidade</Button>
         <Button variant="outline" size="sm" onClick={() => validateField(ctx, "endereco.uf")}>Validar UF</Button>
         <Button variant="secondary" size="sm" onClick={() => validateScope(ctx, "endereco")}>Validar step endereço</Button>
        </div>
       </fieldset>

      {currentStep === "revisao" && (
       <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-5">
         <h3 className="text-sm font-semibold text-slate-900">
          Step 3 — Revisão
         </h3>
         <p className="mt-1 text-sm text-slate-600">
          O submit final chama a validação completa do formulário. Se algo tiver mudado ou ficado inválido, o envio será bloqueado.
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
        <Button variant="secondary" onClick={() => ctx.clearErrors()}>Limpar erros</Button>
        <Button
         variant="outline"
         onClick={() => {
          ctx.reset();
          setSnapshot(initialModel);
          setCurrentStep("cliente");
          setLastAction("Formulário restaurado para o baseline atual.");
         }}
        >
         Reset
        </Button>

        {currentStep !== "cliente" && (
         <Button variant="outline" onClick={goToPreviousStep}>Voltar</Button>
        )}

        {currentStep === "cliente" && (
         <Button onClick={() => goToNextStep(ctx, "cliente")}>Próximo</Button>
        )}

        {currentStep === "endereco" && (
         <Button onClick={() => goToNextStep(ctx, "endereco")}>Próximo</Button>
        )}

        {currentStep === "revisao" && (
         <Button type="submit">Enviar cadastro</Button>
        )}
       </div>
      </div>
     </>
    )}
   </Form>
  </section>
 );
}
