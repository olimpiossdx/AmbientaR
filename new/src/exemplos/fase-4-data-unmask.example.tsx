import React from "react";
import Alert from "../componentes/alert";
import Button from "../componentes/button";
import Input from "../componentes/input";
import { FormAlertRegion } from "../componentes/form/form-alert-region";
import { Form } from "../componentes/form/form";

type Fase4DataUnmaskModel = {
 cliente: {
  nome: string;
  cpf: string;
  telefone: string;
 };
 financeiro: {
  limite: number | string;
 };
};

const initialModel: Fase4DataUnmaskModel = {
 cliente: {
  nome: "Ana Maria",
  cpf: "12345678900",
  telefone: "11999998888",
 },
 financeiro: {
  limite: "1234.56",
 },
};

export function Fase4DataUnmaskExample() {
 const [submittedModel, setSubmittedModel] = React.useState<Fase4DataUnmaskModel | null>(null);

 return (
  <section className="mx-auto max-w-4xl space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
   <div className="space-y-2">
    <p className="text-sm font-semibold uppercase tracking-wide text-sky-600">
     Fase 4
    </p>
    <h2 className="text-2xl font-bold text-slate-900">
     Envio com Input mask
    </h2>
    <p className="max-w-3xl text-sm text-slate-600">
     Os campos continuam exibindo valores formatados para o usuário, mas o modelo enviado remove a máscara quando o Input possui a prop <strong>mask</strong>.
    </p>
   </div>

   <Alert variant="info" title="Como testar">
    Altere CPF, telefone ou limite e envie o cadastro. O painel final mostra o modelo limpo recebido no submit.
   </Alert>

   <Form<Fase4DataUnmaskModel>
    id="fase-4-input-mask"
    model={initialModel}
    onSubmit={async (model) => {
     setSubmittedModel(model);
     return {
      ok: true,
      message: "Cadastro enviado com valores sem máscara.",
     };
    }}
   >
    {() => (
     <div className="space-y-6">
      <FormAlertRegion />

      <div className="grid gap-4 md:grid-cols-2">
       <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Nome</span>
        <Input name="cliente.nome" />
       </label>

       <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>CPF</span>
        <Input name="cliente.cpf" mask="cpf" placeholder="000.000.000-00" />
       </label>

       <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Telefone</span>
        <Input name="cliente.telefone" mask="phone" placeholder="(00) 00000-0000" />
       </label>

       <label className="space-y-1 text-sm font-medium text-slate-700">
        <span>Limite</span>
        <Input name="financeiro.limite" mask="currency" placeholder="R$ 0,00" />
       </label>
      </div>

      <div className="flex flex-wrap gap-3">
       <Button type="submit">Enviar cadastro</Button>
       <Button type="reset" variant="secondary">Resetar</Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
       <h3 className="mb-2 text-sm font-semibold text-slate-900">
        Modelo recebido no submit
       </h3>
       <pre className="max-h-72 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-50" tabIndex={0} aria-label="Dados sem máscara">
        {JSON.stringify(submittedModel, null, 2)}
       </pre>
      </div>
     </div>
    )}
   </Form>
  </section>
 );
}
