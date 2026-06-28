import React from "react";

import { DemoCard, ExampleShell, buttonClassName, primaryButtonClassName } from "./_example-shell";
import {
  publicApiPlaygroundService,
  type PlaygroundPostInput,
} from "../service/public-api-playground-service.example";
import type { ApiResponse } from "../service/http/types";
import { Button } from '../componentes';

type ScenarioId =
  | "get-list"
  | "get-detail"
  | "post-json"
  | "patch-json"
  | "delete"
  | "form-data"
  | "retry-error";

type ScenarioGroup = "Leitura" | "Escrita" | "Serialização" | "Resiliência";

type Scenario = {
  id: ScenarioId;
  group: ScenarioGroup;
  title: string;
  description: string;
  code: string;
  capability: string;
};

type HistoryItem = {
  title: string;
  ok: boolean;
  httpStatus: number;
  attempts: number;
};

const scenarios: Scenario[] = [
  {
    id: "get-list",
    group: "Leitura",
    title: "GET com query params",
    description: "Lista posts públicos usando params e a mesma instância configurada.",
    capability: "buildUrl + params + rawAdapter",
    code: `publicApiPlaygroundService.listarPosts({ userId: 1, limit: 5 })`,
  },
  {
    id: "get-detail",
    group: "Leitura",
    title: "GET detalhe + subrecurso",
    description: "Busca um post e seus comentários para validar composição de chamadas.",
    capability: "GET tipado + composição de responses",
    code: `await publicApiPlaygroundService.buscarPost(1)\nawait publicApiPlaygroundService.listarComentarios(1)`,
  },
  {
    id: "post-json",
    group: "Escrita",
    title: "POST JSON inferido",
    description: "O body é inferido pelo argumento; somente o tipo da resposta é declarado.",
    capability: "api.post<TResponse>(url, model)",
    code: `api.post<PlaygroundPost>("/posts", model)`,
  },
  {
    id: "patch-json",
    group: "Escrita",
    title: "PATCH parcial",
    description: "Demonstra body parcial com serialização JSON automática.",
    capability: "PATCH + Partial<T>",
    code: `api.patch<PlaygroundPost>("/posts/1", { title: "Novo título" })`,
  },
  {
    id: "delete",
    group: "Escrita",
    title: "DELETE sem data",
    description: "Quando não há data esperado, TResponse permanece void.",
    capability: "TResponse = void",
    code: `api.delete("/posts/1")`,
  },
  {
    id: "form-data",
    group: "Serialização",
    title: "FormData automático",
    description: "Envia FormData sem definir Content-Type manualmente, preservando o boundary.",
    capability: "serializeBody(FormData)",
    code: `const formData = new FormData()\napi.post<HttpEchoResponse>("/post", formData)`,
  },
  {
    id: "retry-error",
    group: "Resiliência",
    title: "Retry em HTTP 503",
    description: "Exercita retry/polly request com endpoint público de status HTTP.",
    capability: "retry global + override por request",
    code: `api.get("/status/503", { retry: { attempts: 2, retryOnHttpStatus: [503] } })`,
  },
];

const sampleModel: PlaygroundPostInput = {
  userId: 1,
  title: "Playground DOM first API",
  body: "Exemplo usando HttpClient puro, contrato padrão e serialização automática.",
};

const configCode = `export const api = createHttpClient({
  baseURL: import.meta.env.VITE_API_URL,
  credentials: "include",
  adapter: smartAdapter,
  retry: {
    attempts: 3,
    delay: 700,
    strategy: "exponential",
    retryOnNetworkError: true,
    retryOnHttpStatus: [408, 425, 429, 500, 502, 503, 504],
  },
  serialization: {
    autoDetectBody: true,
    defaultContentType: "application/json",
  },
});`;

const formCode = `<Form<ClienteModel, ClienteModelResponse>
  id="cliente-form"
  model={initialModel}
  onSubmit={clienteService.salvar}
/>`;

function stringifyResponse(value: unknown) {
  return JSON.stringify(
    value,
    (_key, item) => {
      if (item instanceof Headers) {
        return Object.fromEntries(item.entries());
      }

      return item;
    },
    2,
  );
}

function getResponseTone(response: ApiResponse<unknown> | null) {
  if (!response) {
    return "border-slate-200 bg-slate-50 text-slate-700";
  }

  if (response.ok) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  return "border-red-200 bg-red-50 text-red-800";
}

function getBadgeClassName(group: ScenarioGroup) {
  const tones: Record<ScenarioGroup, string> = {
    Leitura: "bg-sky-50 text-sky-700 ring-sky-200",
    Escrita: "bg-violet-50 text-violet-700 ring-violet-200",
    Serialização: "bg-amber-50 text-amber-800 ring-amber-200",
    Resiliência: "bg-rose-50 text-rose-700 ring-rose-200",
  };

  return tones[group];
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="min-w-0 max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white p-4 text-xs leading-6 text-slate-700 shadow-sm ring-1 ring-slate-100">
      <code className="block min-w-0 whitespace-pre-wrap wrap-break-word font-mono">{children}</code>
    </pre>
  );
}

function ResponseSummary({ response }: { response: ApiResponse<unknown> | null }) {
  return (
    <div className={`grid gap-3 rounded-2xl border p-4 text-sm ${getResponseTone(response)} sm:grid-cols-4`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Estado</p>
        <p className="mt-1 font-bold">{response ? (response.ok ? "OK" : "Falha") : "Aguardando"}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">HTTP</p>
        <p className="mt-1 font-bold">{response?.httpStatus ?? "-"}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Tentativas</p>
        <p className="mt-1 font-bold">{response?.request.attempts ?? "-"}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">Adapter</p>
        <p className="mt-1 font-bold">ApiResponse</p>
      </div>
    </div>
  );
}

export default function ApiPlaygroundPublicExample() {
  const [activeScenario, setActiveScenario] = React.useState<ScenarioId>("get-list");
  const [loading, setLoading] = React.useState(false);
  const [lastResponse, setLastResponse] = React.useState<ApiResponse<unknown> | null>(null);
  const [history, setHistory] = React.useState<HistoryItem[]>([]);

  const scenario = scenarios.find((item) => item.id === activeScenario) ?? scenarios[0];

  const runScenario = React.useCallback(async () => {
    setLoading(true);

    try {
      let response: ApiResponse<unknown>;

      switch (activeScenario) {
        case "get-list":
          response = await publicApiPlaygroundService.listarPosts({ userId: 1, limit: 5 });
          break;
        case "get-detail": {
          const post = await publicApiPlaygroundService.buscarPost(1);
          const comments = await publicApiPlaygroundService.listarComentarios(1);

          response = {
            ...post,
            data: {
              post: post.data,
              comments: comments.data,
            },
          };
          break;
        }
        case "post-json":
          response = await publicApiPlaygroundService.criarPost(sampleModel);
          break;
        case "patch-json":
          response = await publicApiPlaygroundService.atualizarPostParcial(1, {
            title: "Título atualizado pelo playground",
          });
          break;
        case "delete":
          response = await publicApiPlaygroundService.removerPost(1);
          break;
        case "form-data":
          response = await publicApiPlaygroundService.enviarFormDataParaEcho(sampleModel);
          break;
        case "retry-error":
          response = await publicApiPlaygroundService.simularErroHttp(503);
          break;
        default:
          response = await publicApiPlaygroundService.listarPosts({ userId: 1, limit: 5 });
      }

      setLastResponse(response);
      setHistory((current) => [
        {
          title: scenario.title,
          ok: response.ok,
          httpStatus: response.httpStatus,
          attempts: response.request.attempts,
        },
        ...current,
      ].slice(0, 6));
    } catch (error) {
      const fallback: ApiResponse<unknown> = {
        ok: false,
        status: "error",
        httpStatus: 0,
        data: null,
        error: {
          code: "PLAYGROUND_ERROR",
          message: error instanceof Error ? error.message : "Falha inesperada no playground.",
          cause: error,
        },
        notifications: [],
        headers: new Headers(),
        request: {
          url: "playground",
          method: "GET",
          attempts: 1,
          retried: false,
        },
      };

      setLastResponse(fallback);
    } finally {
      setLoading(false);
    }
  }, [activeScenario, scenario.title]);

  return (
    <ExampleShell
      title="API Playground"
      description="Homologa o HttpClient DOM first com configuração global, contrato ApiResponse, serialização automática e retry/polly request."
      checks={["Config global", "GET com params", "POST JSON", "FormData automático", "Retry", "Form onSubmit={service.salvar}"]}
    >
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="min-w-0 space-y-6">
          <DemoCard title="Configuração global da API">
            <div className="space-y-4">
              <p className="text-sm leading-6 text-slate-600">
                A instância concentra baseURL, adapter, retry e serialização. Os services chamam apenas
                <code className="mx-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-800">get/post/patch/delete</code>
                sem repetir configuração.
              </p>
              <CodeBlock>{configCode}</CodeBlock>
            </div>
          </DemoCard>

          <DemoCard title="Cenários de homologação" contentClassName="space-y-4">
            <div className="grid gap-2">
              {scenarios.map((item) => {
                const active = item.id === activeScenario;

                return (
                  <Button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveScenario(item.id)}
                    className={[
                      "rounded-xl border p-3 text-left text-sm transition",
                      active
                        ? "border-sky-300 bg-sky-50 text-sky-950 shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">{item.title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${getBadgeClassName(item.group)}`}>
                        {item.group}
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                  </Button>
                );
              })}
            </div>
          </DemoCard>
        </div>

        <div className="min-w-0 space-y-6">
          <DemoCard title={scenario.title} contentClassName="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <span className={`inline-flex max-w-full rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${getBadgeClassName(scenario.group)}`}>
                    <span className="min-w-0 wrap-break-word">{scenario.capability}</span>
                  </span>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{scenario.description}</p>
                </div>
                <Button type="button" onClick={runScenario} disabled={loading} className={primaryButtonClassName}>
                  {loading ? "Executando..." : "Executar"}
                </Button>
              </div>
            </div>

            <CodeBlock>{scenario.code}</CodeBlock>
            <ResponseSummary response={lastResponse} />
          </DemoCard>

          <DemoCard title="ApiResponse normalizado" scroll="x" contentClassName="space-y-4">
            {lastResponse ? (
              <CodeBlock>{stringifyResponse(lastResponse)}</CodeBlock>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                Execute um cenário para visualizar o envelope final com <strong>ok</strong>, <strong>httpStatus</strong>,
                <strong> data</strong>, <strong>error</strong>, <strong>notifications</strong> e metadados da request.
              </div>
            )}
          </DemoCard>
        </div>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <DemoCard title="Integração natural com Form">
          <div className="space-y-4">
            <p className="text-sm leading-6 text-slate-600">
              O service pode ser passado diretamente para o submit. O tipo do body é inferido pelo argumento,
              e o tipo informado no método representa apenas o <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">data</code> esperado.
            </p>
            <CodeBlock>{`export const clienteService = {
  salvar: (model: ClienteModel) =>
    api.post<ClienteModelResponse>("/clientes", model),
};\n\n${formCode}`}</CodeBlock>
          </div>
        </DemoCard>

        <DemoCard title="Histórico de execuções">
          {history.length > 0 ? (
            <div className="grid gap-2">
              {history.map((item, index) => (
                <div key={`${item.title}-${index}`} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="text-xs text-slate-500">HTTP {item.httpStatus} · {item.attempts} tentativa(s)</p>
                  </div>
                  <span className={item.ok ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200" : "rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700 ring-1 ring-red-200"}>
                    {item.ok ? "OK" : "Falha"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              Nenhuma execução ainda. Selecione um cenário e clique em executar.
            </div>
          )}

          {history.length > 0 && (
            <Button type="button" onClick={() => setHistory([])} className={`${buttonClassName} mt-4`}>
              Limpar histórico
            </Button>
          )}
        </DemoCard>
      </div>
    </ExampleShell>
  );
}
