// src/exemplos/form-api-cliente.example.tsx
import React from "react";

import Button from "../componentes/button";
import { Form } from "../componentes/form/form";
import { FormAlertRegion } from "../componentes/form/form-alert-region";
import { Input } from '../componentes';
import {
  clienteService,
  type ClienteModel,
  type ClienteModelResponse,
} from "../service/cliente-service.example";

const initialModel: ClienteModel = {
  nome: "Ana Maria",
  email: "ana@email.com",
  telefone: "(11) 99999-8888",
};

const shellClassName = [
  "mx-auto w-full max-w-5xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm",
  "sm:p-8",
].join(" ");

const eyebrowClassName =
  "text-xs font-semibold uppercase tracking-[0.24em] text-sky-600";

const titleClassName =
  "text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl";

const descriptionClassName = "max-w-3xl text-sm leading-6 text-slate-600";

const cardClassName =
  "rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm";

const labelClassName =
  "flex flex-col gap-1.5 text-sm font-medium text-slate-700";

const inputClassName = [
  "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition",
  "placeholder:text-slate-400",
  "focus:border-sky-500 focus:ring-4 focus:ring-sky-100",
  "data-[invalid=true]:border-red-500 data-[invalid=true]:ring-4 data-[invalid=true]:ring-red-100",
].join(" ");

function ResponsePreview({ response }: { response: ClienteModelResponse | null }) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
            Última resposta
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Dados retornados pelo service após um submit com <strong>ok=true</strong>.
          </p>
        </div>

        <span
          className={[
            "shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold",
            response
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-slate-50 text-slate-500",
          ].join(" ")}
        >
          {response ? "Recebida" : "Vazia"}
        </span>
      </div>

      <pre className="max-h-80 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-6 text-slate-700">
        <code>{JSON.stringify(response, null, 2)}</code>
      </pre>
    </aside>
  );
}

export default function FormApiClienteExample() {
  const [lastResponse, setLastResponse] =
    React.useState<ClienteModelResponse | null>(null);

  return (
    <section className={shellClassName}>
      <header className="mb-8 flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <p className={eyebrowClassName}>API · Form</p>
          <div className="space-y-2">
            <h2 className={titleClassName}>Form integrado com API</h2>
            <p className={descriptionClassName}>
              O submit chama diretamente o service. O body é inferido pelo argumento,
              enquanto o tipo genérico do método representa apenas o <strong>data</strong>{" "}
              esperado na resposta.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
          {[
            "onSubmit={clienteService.salvar}",
            "body inferido",
            "ApiResponse<TData>",
          ].map((item) => (
            <span
              key={item}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5"
            >
              {item}
            </span>
          ))}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className={cardClassName}>
          <Form<ClienteModel>
            id="form-api-cliente"
            model={initialModel}
            defaultNotificationChannels={["alert"]}
            onSubmit={async (model) => {
              const response = await clienteService.salvar(model);

              if (response.ok) {
                setLastResponse(response.data);
              }

              return response;
            }}
          >
            {() => (
              <div className="space-y-5">
                <FormAlertRegion />

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelClassName}>
                    <span>Nome</span>
                    <Input
                      name="nome"
                      placeholder="Nome completo"
                      className={inputClassName}
                    />
                  </label>

                  <label className={labelClassName}>
                    <span>E-mail</span>
                    <Input
                      name="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      className={inputClassName}
                    />
                  </label>

                  <label className={`${labelClassName} sm:col-span-2`}>
                    <span>Telefone</span>
                    <Input
                      name="telefone"
                      placeholder="(00) 00000-0000"
                      className={inputClassName}
                    />
                  </label>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Fluxo homologado
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    O <strong>Form</strong> envia o model para o service, recebe um
                    <strong> ApiResponse&lt;ClienteModelResponse&gt;</strong> e só atualiza
                    o snapshot de sucesso quando <strong>response.ok</strong> for verdadeiro.
                  </p>
                </div>

                <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-5">
                  <Button type="reset" variant="secondary">
                    Reset
                  </Button>
                  <Button type="submit">Salvar cliente</Button>
                </div>
              </div>
            )}
          </Form>
        </div>

        <ResponsePreview response={lastResponse} />
      </div>
    </section>
  );
}
