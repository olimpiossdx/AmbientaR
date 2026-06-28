import React from "react";
import type { FormContext } from "../componentes/form/propTypes.form";
import Button from "../componentes/button";
import { Form } from "../componentes/form/form";
import { Input } from '../componentes';

type ClienteForm = {
 cliente: {
  nome: string;
  idade: number;
 };
};

const initialModel: ClienteForm = {
 cliente: {
  nome: "Maria inicial",
  idade: 30,
 },
};

function Actions({ ctx }: { ctx: FormContext<ClienteForm> }) {
 return (
  <div className="flex gap-2">
   <Button
    type="button"
    onClick={() => ctx.setFieldValue("cliente.nome", "Nome alterado")}
   >
    Alterar nome
   </Button>
   <Button type="submit">Enviar</Button>
   <Button type="reset">
    Reset
   </Button>
  </div>
 );
}

export function Fase3BaselineCommitExample() {
 const [submittedModel, setSubmittedModel] =
  React.useState<ClienteForm | null>(null);
 const [snapshot, setSnapshot] = React.useState<ClienteForm | null>(
  initialModel,
 );

 return (
  <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
   <Form<ClienteForm>
    id="fase-3-baseline-commit"
    model={initialModel}
    onSubmit={(model) => {
     setSubmittedModel(model);
     setSnapshot(model);
    }}
    actions={(ctx) => <Actions ctx={ctx} />}
   >
    {(ctx) => (
     <div className="space-y-4">
      <p className="text-sm text-slate-600">
       Fluxo: altere o form, envie, altere novamente e clique em reset. O
       reset deve voltar para o ultimo envio.
      </p>

      <label className="block">
       Nome
       <Input
        name="cliente.nome"
        className="block w-full rounded border p-2"
       />
      </label>

      <label className="block">
       Idade
       <Input
        name="cliente.idade"
        type="number"
        className="block w-full rounded border p-2"
       />
      </label>

      <div className="grid gap-3 md:grid-cols-2">
       <pre className="rounded bg-slate-100 p-3 text-xs">
        Ultimo submit: {JSON.stringify(submittedModel, null, 2)}
       </pre>
       <pre className="rounded bg-slate-100 p-3 text-xs">
        Snapshot esperado: {JSON.stringify(snapshot, null, 2)}
       </pre>
      </div>

      <Button
       type="button"
       onClick={() => setSnapshot(ctx.getModel())}
      >
       Ler getModel()
      </Button>
     </div>
    )}
   </Form>
  </div>
 );
}
