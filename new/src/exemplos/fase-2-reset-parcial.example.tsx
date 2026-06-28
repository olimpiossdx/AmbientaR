import React from "react";
import { Form } from "../componentes/form/form";
import Alert from "../componentes/alert";
import Button from "../componentes/button";
import { FormAlertRegion } from "../componentes/form/form-alert-region";
import { Input } from '../componentes';

type CadastroModel = {
 cliente: {
  nome: string;
  email: string;
 };
 endereco: {
  cidade: string;
  uf: string;
 };
};

const initialModel: CadastroModel = {
 cliente: {
  nome: "Ana",
  email: "ana@email.com",
 },
 endereco: {
  cidade: "Sao Paulo",
  uf: "SP",
 },
};

export function Fase2ResetParcialExample() {
 const [lastSubmit, setLastSubmit] = React.useState<CadastroModel | null>(null);

 return (
  <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
   <div className="flex flex-col gap-2 border-b border-slate-200 pb-5">
    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
     Fase 2
    </span>

    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
     <div>
      <h2 className="text-2xl font-semibold tracking-tight text-gray-950">
       Reset parcial por campo ou seção
      </h2>

      <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
       Edite os campos, salve para atualizar o baseline e depois use os resets
       parciais para voltar somente uma parte do formulário.
      </p>
     </div>

     <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700">
      Baseline ativo: {lastSubmit ? "último envio" : "modelo inicial"}
     </div>
    </div>
   </div>

   <Alert variant="info" title="Como testar">
    Primeiro altere alguns campos e use resetar nome, cliente ou endereço.
    Depois salve o formulário; o próximo reset passa a usar o último envio como novo baseline.
   </Alert>

   <Form<CadastroModel>
    id="fase-2-reset-parcial"
    model={initialModel}
    className="flex flex-col gap-6"
    defaultNotificationChannels={["alert"]}
    onSubmit={async (model) => {
     setLastSubmit(model);

     return {
      ok: true,
      status: "success",
      title: "Cadastro salvo",
      message: "O baseline foi atualizado com os dados enviados.",
     };
    }}
   >
    {(form) => (
     <>
      <FormAlertRegion />

      <div className="grid gap-5 lg:grid-cols-2">
       <fieldset className="rounded-xl border border-slate-200 bg-slate-50/70 p-5/60">
        <div className="mb-5 flex items-start justify-between gap-4">
         <div>
          <legend className="text-base font-semibold text-gray-950">
           Cliente
          </legend>

          <p className="mt-1 text-sm text-slate-500">
           Use resetField para um campo ou resetSection para a seção inteira.
          </p>
         </div>

         <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => form.resetSection("cliente")}
         >
          Resetar cliente
         </Button>
        </div>

        <div className="grid gap-4">
         <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Nome
          <Input
           name="cliente.nome"
           className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100/20"
          />
         </label>

         <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          E-mail
          <Input
           name="cliente.email"
           type="email"
           className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100/20"
          />
         </label>

         <div className="flex flex-wrap gap-2 pt-1">
          <Button
           type="button"
           variant="secondary"
           size="sm"
           onClick={() => form.resetField("cliente.nome")}
          >
           Resetar nome
          </Button>

          <Button
           type="button"
           variant="outline"
           size="sm"
           onClick={() => form.resetField("cliente.email")}
          >
           Resetar e-mail
          </Button>
         </div>
        </div>
       </fieldset>

       <fieldset className="rounded-xl border border-slate-200 bg-slate-50/70 p-5/60">
        <div className="mb-5 flex items-start justify-between gap-4">
         <div>
          <legend className="text-base font-semibold text-gray-950">
           Endereço
          </legend>

          <p className="mt-1 text-sm text-slate-500">
           Esta seção volta para o baseline sem afetar os dados do cliente.
          </p>
         </div>

         <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => form.resetSection("endereco")}
         >
          Resetar endereço
         </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_120px]">
         <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          Cidade
          <Input
           name="endereco.cidade"
           className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-gray-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100/20"
          />
         </label>

         <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          UF
          <Input
           name="endereco.uf"
           maxLength={2}
           className="h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm uppercase text-gray-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100/20"
          />
         </label>
        </div>
       </fieldset>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
       <div className="text-sm text-slate-600">
        <strong className="font-semibold text-gray-900">
         Reset geral
        </strong>{" "}
        volta todo o formulário para o baseline atual.
       </div>

       <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={form.reset}>
         Reset geral
        </Button>

        <Button type="submit">
         Salvar e atualizar baseline
        </Button>
       </div>
      </div>

      <div className="rounded-xl bg-gray-950 p-4 text-xs text-gray-100 shadow-inner">
       <div className="mb-2 font-semibold text-gray-300">
        Último envio confirmado
       </div>

       <pre className="max-h-72 overflow-auto whitespace-pre-wrap" tabIndex={0} aria-label="Estado atual do formulário">
        {JSON.stringify(lastSubmit ?? initialModel, null, 2)}
       </pre>
      </div>
     </>
    )}
   </Form>
  </section>
 );
}

