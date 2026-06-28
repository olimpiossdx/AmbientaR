import React from "react";

import { Button } from "../componentes/button/button";
import { Form } from "../componentes/form/form";
import { FormAlertRegion } from "../componentes/form/form-alert-region";
import { ModalForm } from "../componentes/modal/modal-form";
import type { ApiServiceNotification, ApiServiceNotificationChannel, ApiServiceResponse, FormNotificationMode } from "../componentes/form/propTypes.form";
import type { ValidationConfig } from "../hook/use-validation.type";
import { Input, Select, Textarea } from '../componentes';

/*
 * Exemplos de uso do novo Form.
 *
 * Ajuste os imports conforme a organização real do projeto.
 * A intenção deste arquivo é servir como catálogo de cenários:
 *
 * 1. Form silencioso: sem feedback automático.
 * 2. Form com toast via ApiServiceResponse.
 * 3. Form com Alert contextual via FormAlertRegion.
 * 4. Form com resposta de API mapeada/filtrada por resolveSubmitResponse e resolveNotifications.
 * 5. ModalForm usando o mesmo motor do Form.
 */

function wait(ms = 900) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

type UsuarioModel = {
  nome: string;
  email: string;
};

type PedidoModel = {
  cliente: {
    nome: string;
    email: string;
  };
  observacao?: string;
};

type ProdutoModel = {
  produto: string;
  quantidade: number;
};

type CadastroResult = {
  id: string;
  updatedAt: string;
};

const usuarioValidation: ValidationConfig<UsuarioModel> = {
  schema: {
    nome: {
      validate: (value) => ({
        valid: typeof value === "string" && value.trim().length >= 3,
        message: "Informe pelo menos 3 caracteres.",
        type: "error",
      }),
    },
    email: {
      validate: (value) => ({
        valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)),
        message: "E-mail inválido.",
        type: "error",
      }),
    },
  },
  mode: "native",
  validateOnChange: true,
  validateOnBlur: true,
};

async function salvarUsuarioComToast(model: UsuarioModel): Promise<ApiServiceResponse<CadastroResult>> {
  await wait();

  if (model.email.includes("erro")) {
    return {
      ok: false,
      status: "error",
      error: new Error("E-mail recusado pela API."),
      notifications: [
        {
          status: "error",
          title: "Não foi possível salvar",
          message: "A API recusou o e-mail informado.",
          channels: ["toast"],
          duration: 6000,
        },
      ],
    };
  }

  return {
    ok: true,
    status: "success",
    data: {
      id: crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    },
    notifications: [
      {
        status: "success",
        title: "Usuário salvo",
        message: `${model.nome} foi salvo com sucesso.`,
        channels: ["toast"],
        duration: 3500,
      },
    ],
  };
}

async function salvarPedidoComAlert(model: PedidoModel): Promise<ApiServiceResponse<CadastroResult>> {
  await wait();

  if (model.cliente.email.endsWith("@bloqueado.com")) {
    return {
      ok: false,
      status: "error",
      notifications: [
        {
          status: "error",
          title: "Cliente bloqueado",
          message: "Este domínio de e-mail não pode ser usado para pedidos.",
          channels: ["alert"],
          duration: Infinity,
        },
      ],
    };
  }

  return {
    ok: true,
    status: "success",
    data: {
      id: crypto.randomUUID(),
      updatedAt: new Date().toISOString(),
    },
    notifications: [
      {
        status: "success",
        title: "Pedido salvo",
        message: "O pedido foi registrado e ficará visível na lista.",
        channels: ["alert"],
        duration: 5000,
      },
    ],
  };
}

type ApiLegadaResponse = {
  sucesso: boolean;
  codigo: string;
  mensagem: string;
  avisos?: string[];
};

async function salvarProdutoApiLegada(model: ProdutoModel): Promise<ApiLegadaResponse> {
  await wait();

  if (Number(model.quantidade) <= 0) {
    return {
      sucesso: false,
      codigo: "QUANTIDADE_INVALIDA",
      mensagem: "A quantidade precisa ser maior que zero.",
      avisos: ["Revise o campo quantidade antes de tentar novamente."],
    };
  }

  return {
    sucesso: true,
    codigo: "OK",
    mensagem: `Produto ${model.produto} salvo com ${model.quantidade} unidade(s).`,
    avisos: Number(model.quantidade) > 100
      ? ["Quantidade alta: confirme se o estoque foi conferido."]
      : undefined,
  };
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

const inputClassName = "h-10 rounded-md border border-slate-300 px-3 text-sm outline-none focus:ring-2 focus:ring-sky-100";
const sectionClassName = "rounded-xl border border-slate-200 bg-white p-4 shadow-sm";
const actionsClassName = "mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-4";


/* -------------------------------------------------------------------------- */
/* Menu interativo: combine canais, modo de feedback e resposta da API     */
/* -------------------------------------------------------------------------- */

type PlaygroundScenario = "success" | "error" | "warning" | "throw" | "void";
type ChannelPreset = "none" | "toast" | "alert" | "both" | "manual";

const notificationModes: Array<{ value: FormNotificationMode; label: string; description: string }> = [
  {
    value: "auto",
    label: "Auto",
    description: "Form despacha toast/alert conforme os channels.",
  },
  {
    value: "hybrid",
    label: "Hybrid",
    description: "Form despacha e também chama onNotifications.",
  },
  {
    value: "manual",
    label: "Manual",
    description: "Form não exibe nada; entrega para onNotifications.",
  },
];

const channelPresets: Array<{ value: ChannelPreset; label: string; channels: ApiServiceNotificationChannel[] }> = [
  { value: "none", label: "Nenhum", channels: ["none"] },
  { value: "toast", label: "Toast", channels: ["toast"] },
  { value: "alert", label: "Alert", channels: ["alert"] },
  { value: "both", label: "Toast + Alert", channels: ["toast", "alert"] },
  { value: "manual", label: "Manual callback", channels: ["manual"] },
];

const scenarios: Array<{ value: PlaygroundScenario; label: string; description: string }> = [
  {
    value: "success",
    label: "Sucesso",
    description: "ApiServiceResponse ok=true com notification success.",
  },
  {
    value: "error",
    label: "Erro controlado",
    description: "ApiServiceResponse ok=false com notification error.",
  },
  {
    value: "warning",
    label: "Sucesso com aviso",
    description: "Retorna success + warning para testar múltiplas notificações.",
  },
  {
    value: "throw",
    label: "Exception",
    description: "Simula exception para testar unexpectedError.",
  },
  {
    value: "void",
    label: "Sem response",
    description: "Retorna void; útil para fluxos que navegam/fecham modal sem feedback.",
  },
];

function getChannels(preset: ChannelPreset): ApiServiceNotificationChannel[] {
  return channelPresets.find((item) => item.value === preset)?.channels ?? [];
}

function hasAlertChannel(preset: ChannelPreset) {
  return getChannels(preset).includes("alert");
}

function PlaygroundOptionCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: React.ReactNode;
  description: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-3 text-left text-sm transition ${active
        ? "border-sky-500 bg-sky-50 text-blue-900"
        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        }`}
    >
      <div className="font-semibold">{title}</div>
      <div className="mt-1 text-xs opacity-80">{description}</div>
    </Button>
  );
}

export function ExemploFormMenuInterativo() {
  const [notificationMode, setNotificationMode] = React.useState<FormNotificationMode>("auto");
  const [scenario, setScenario] = React.useState<PlaygroundScenario>("success");
  const [successChannelPreset, setSuccessChannelPreset] = React.useState<ChannelPreset>("toast");
  const [errorChannelPreset, setErrorChannelPreset] = React.useState<ChannelPreset>("alert");
  const [warningChannelPreset, setWarningChannelPreset] = React.useState<ChannelPreset>("both");
  const [showAlertRegion, setShowAlertRegion] = React.useState(true);
  const [manualLog, setManualLog] = React.useState<string[]>([]);

  const shouldRenderAlertRegion = showAlertRegion && (
    hasAlertChannel(successChannelPreset) ||
    hasAlertChannel(errorChannelPreset) ||
    hasAlertChannel(warningChannelPreset)
  );

  const appendManualLog = React.useCallback((message: string) => {
    setManualLog((current) => [message, ...current].slice(0, 5));
  }, []);

  return (
    <section className={sectionClassName}>
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Menu interativo: combine usos do Form</h2>
        <p className="text-sm text-slate-500">
          Use este playground para testar as combinações: modo de notificação, canais por status,
          resposta da API, AlertRegion contextual e callback manual.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4/40">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">1. Modo do pipeline</h3>
            <div className="grid gap-2">
              {notificationModes.map((item) => (
                <PlaygroundOptionCard
                  key={item.value}
                  active={notificationMode === item.value}
                  title={item.label}
                  description={item.description}
                  onClick={() => setNotificationMode(item.value)}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">2. Resposta simulada</h3>
            <div className="grid gap-2">
              {scenarios.map((item) => (
                <PlaygroundOptionCard
                  key={item.value}
                  active={scenario === item.value}
                  title={item.label}
                  description={item.description}
                  onClick={() => setScenario(item.value)}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">3. Canais por status</h3>
            <div className="grid gap-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Sucesso
                <Select
                  value={successChannelPreset}
                  onChange={(event) => setSuccessChannelPreset(event.target.value as ChannelPreset)}
                  className={inputClassName}
                >
                  {channelPresets.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </Select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Erro
                <Select
                  value={errorChannelPreset}
                  onChange={(event) => setErrorChannelPreset(event.target.value as ChannelPreset)}
                  className={inputClassName}
                >
                  {channelPresets.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </Select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Warning
                <Select
                  value={warningChannelPreset}
                  onChange={(event) => setWarningChannelPreset(event.target.value as ChannelPreset)}
                  className={inputClassName}
                >
                  {channelPresets.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </Select>
              </label>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <Input
              name=""
              type="checkbox"
              checked={showAlertRegion}
              onChange={(event) => setShowAlertRegion(event.target.checked)}
            />
            Renderizar FormAlertRegion contextual
          </label>

          <Button type="button" variant="ghost" onClick={() => setManualLog([])}>
            Limpar log manual
          </Button>
        </div>

        <div className="rounded-xl border border-slate-100 p-4">
          <Form<UsuarioModel, CadastroResult>
            key={`${notificationMode}-${scenario}-${successChannelPreset}-${errorChannelPreset}-${warningChannelPreset}-${showAlertRegion}`}
            id="exemplo-form-menu-interativo"
            model={{ nome: "Laura", email: "laura@email.com" }}
            validation={usuarioValidation}
            notificationMode={notificationMode}
            defaultNotificationChannels={[]}
            clearAlertsOnSubmit
            defaultNotifications={{
              unexpectedError: {
                status: "error",
                title: "Falha inesperada",
                message: "O serviço lançou uma exceção. Esta mensagem veio de defaultNotifications.unexpectedError.",
                channels: getChannels(errorChannelPreset),
                duration: Infinity,
              },
            }}
            onSubmit={async (model) => {
              await wait(1200);

              if (scenario === "void") {
                console.log("[menu-interativo] fluxo sem response", model);
                return;
              }

              if (scenario === "throw") {
                throw new Error("Erro simulado pelo menu interativo.");
              }

              if (scenario === "error") {
                return {
                  ok: false,
                  status: "error",
                  error: { code: "EMAIL_RECUSADO" },
                  notifications: [
                    {
                      status: "error",
                      title: "Erro controlado",
                      message: `A API recusou o cadastro de ${model.email}.`,
                      channels: getChannels(errorChannelPreset),
                      duration: Infinity,
                    },
                  ],
                } satisfies ApiServiceResponse<CadastroResult>;
              }

              if (scenario === "warning") {
                return {
                  ok: true,
                  status: "success",
                  data: { id: crypto.randomUUID(), updatedAt: new Date().toISOString() },
                  notifications: [
                    {
                      status: "success",
                      title: "Cadastro salvo",
                      message: `${model.nome} foi salvo com sucesso.`,
                      channels: getChannels(successChannelPreset),
                      duration: 3500,
                    },
                    {
                      status: "warning",
                      title: "Atenção",
                      message: "A API salvou, mas retornou um aviso de conferência manual.",
                      channels: getChannels(warningChannelPreset),
                      duration: 6000,
                    },
                  ],
                } satisfies ApiServiceResponse<CadastroResult>;
              }

              return {
                ok: true,
                status: "success",
                data: { id: crypto.randomUUID(), updatedAt: new Date().toISOString() },
                notifications: [
                  {
                    status: "success",
                    title: "Cadastro salvo",
                    message: `${model.nome} foi salvo com sucesso.`,
                    channels: getChannels(successChannelPreset),
                    duration: 3500,
                  },
                ],
              } satisfies ApiServiceResponse<CadastroResult>;
            }}
            resolveNotifications={(notifications) => {
              // Exemplo de customizacao da tela:
              // se FormAlertRegion estiver desligado, remove o canal alert para evitar notificacao perdida.
              if (showAlertRegion) {
                return notifications;
              }

              return notifications.map((notification) => ({
                ...notification,
                channels: notification.channels?.filter((channel) => channel !== "alert"),
              }));
            }}
            onNotifications={(notifications, response) => {
              appendManualLog(
                `${new Date().toLocaleTimeString()} | ${notificationMode} | ${response?.status ?? "sem-response"} | ${notifications.length} notification(s)`,
              );
            }}
            actionsClassName={actionsClassName}
            actions={(ctx) => (
              <>
                <Button type="button" variant="outline" onClick={() => {
                  ctx.dispatchNotifications({
                    status: "info",
                    title: "Notificação manual",
                    message: "Disparada por ctx.dispatchNotifications a partir do menu interativo.",
                    channels: showAlertRegion ? ["alert", "toast"] : ["toast"],
                    duration: 5000,
                  });
                }}>
                  Disparar manual
                </Button>

                <Button type="button" variant="secondary" onClick={ctx.clearNotifications}>
                  Limpar alerts
                </Button>

                <Button type="button" variant="ghost" onClick={ctx.reset}>
                  Restaurar
                </Button>

                <Button type="submit">
                  Executar cenário
                </Button>
              </>
            )}
          >
            <div className="flex flex-col gap-4">
              {shouldRenderAlertRegion && <FormAlertRegion maxItems={5} />}

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nome">
                  <Input name="nome" className={inputClassName} />
                </Field>
                <Field label="E-mail">
                  <Input name="email" type="email" className={inputClassName} />
                </Field>
              </div>

              <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                <div className="font-semibold text-slate-900">Combinação atual</div>
                <div>Modo: {notificationMode}</div>
                <div>Cenário: {scenario}</div>
                <div>Sucesso: {successChannelPreset}</div>
                <div>Erro: {errorChannelPreset}</div>
                <div>Warning: {warningChannelPreset}</div>
                <div>AlertRegion: {showAlertRegion ? "ativa" : "desativada"}</div>
              </div>

              {manualLog.length > 0 && (
                <div className="rounded-lg border border-dashed border-slate-300 p-3 text-xs">
                  <div className="mb-2 font-semibold">Log de onNotifications</div>
                  <ul className="space-y-1">
                    {manualLog.map((item, index) => (
                      <li key={`${item}-${index}`} className="text-slate-600">{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Form>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 1. Form silencioso: nenhum feedback automático               */
/* -------------------------------------------------------------------------- */

export function ExemploFormSilencioso() {
  return (
    <section className={sectionClassName}>
      <h2 className="mb-1 text-lg font-semibold">1. Form silencioso</h2>
      <p className="mb-4 text-sm text-slate-500">
        O submit aguarda a API, o botão clicado fica em loading e os demais ficam disabled.
        Nenhuma notificação é exibida porque o fluxo retorna void.
      </p>

      <Form<UsuarioModel>
        id="exemplo-form-silencioso"
        model={{ nome: "Maria", email: "maria@email.com" }}
        validation={usuarioValidation}
        notificationMode="manual"
        onSubmit={async (model) => {
          await wait(1200);
          console.log("[silencioso] salvo", model);
        }}
        actionsClassName={actionsClassName}
        actions={(ctx) => (
          <>
            <Button type="button" variant="secondary" onClick={ctx.reset}>
              Restaurar
            </Button>
            <Button type="submit">Salvar sem feedback</Button>
          </>
        )}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome">
            <Input name="nome" className={inputClassName} />
          </Field>
          <Field label="E-mail">
            <Input name="email" type="email" className={inputClassName} />
          </Field>
        </div>
      </Form>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. Form com Toast via ApiServiceResponse                  */
/* -------------------------------------------------------------------------- */

export function ExemploFormComToast() {
  return (
    <section className={sectionClassName}>
      <h2 className="mb-1 text-lg font-semibold">2. Form com toast</h2>
      <p className="mb-4 text-sm text-slate-500">
        A API retorna ApiServiceResponse com notifications usando channel toast.
        Teste um e-mail contendo "erro" para simular falha.
      </p>

      <Form<UsuarioModel, CadastroResult>
        id="exemplo-form-toast"
        model={{ nome: "João", email: "joao@email.com" }}
        validation={usuarioValidation}
        notificationMode="auto"
        onSubmit={(model) => salvarUsuarioComToast(model)}
        onSubmitSuccess={(response) => {
          console.log("[toast] sucesso", response?.data);
        }}
        onSubmitError={(error, response) => {
          console.warn("[toast] erro", error, response);
        }}
        actionsClassName={actionsClassName}
        actions={(ctx) => (
          <>
            <Button type="button" variant="ghost" onClick={ctx.clearNotifications}>
              Limpar alerts
            </Button>
            <Button type="submit">Salvar com toast</Button>
          </>
        )}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nome">
            <Input name="nome" className={inputClassName} />
          </Field>
          <Field label="E-mail">
            <Input name="email" type="email" className={inputClassName} />
          </Field>
        </div>
      </Form>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. Form com Alert contextual via FormAlertRegion              */
/* -------------------------------------------------------------------------- */

export function ExemploFormComAlertContextual() {
  return (
    <section className={sectionClassName}>
      <h2 className="mb-1 text-lg font-semibold">3. Form com alert contextual</h2>
      <p className="mb-4 text-sm text-slate-500">
        O Form não guarda estado de alert. Ele despacha para FormAlertRegion,
        que re-renderiza apenas a região de feedback.
      </p>

      <Form<PedidoModel, CadastroResult>
        id="exemplo-form-alert"
        model={{
          cliente: { nome: "Ana", email: "ana@email.com" },
          observacao: "",
        }}
        notificationMode="auto"
        defaultNotificationChannels={["alert"]}
        onSubmit={(model) => salvarPedidoComAlert(model)}
        actionsClassName={actionsClassName}
        actions={(ctx) => (
          <>
            <Button type="button" variant="secondary" onClick={ctx.reset}>
              Restaurar
            </Button>
            <Button type="submit">Salvar pedido</Button>
          </>
        )}
      >
        <div className="flex flex-col gap-4">
          <FormAlertRegion />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Cliente">
              <Input name="cliente.nome" className={inputClassName} />
            </Field>
            <Field label="E-mail do cliente">
              <Input name="cliente.email" type="email" className={inputClassName} />
            </Field>
          </div>

          <Field label="Observação">
            <Textarea name="observacao" rows={3} className={`${inputClassName} h-auto py-2`} />
          </Field>
        </div>
      </Form>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. Form adaptando uma API legada para ApiServiceResponse           */
/* -------------------------------------------------------------------------- */

export function ExemploFormComResolverDeApi() {
  return (
    <section className={sectionClassName}>
      <h2 className="mb-1 text-lg font-semibold">4. Form com resolver de API</h2>
      <p className="mb-4 text-sm text-slate-500">
        A API não retorna ApiServiceResponse. O Form usa resolveSubmitResponse
        para normalizar e resolveNotifications para decidir canais.
      </p>

      <Form<ProdutoModel, ApiLegadaResponse>
        id="exemplo-form-resolver-api"
        model={{ produto: "Notebook", quantidade: 1 }}
        notificationMode="hybrid"
        defaultNotificationChannels={["toast"]}
        onSubmit={(model) => salvarProdutoApiLegada(model)}
        resolveSubmitResponse={(result) => {
          const api = result as ApiLegadaResponse;

          return {
            ok: api.sucesso,
            status: api.sucesso ? "success" : "error",
            data: api,
            error: api.sucesso ? undefined : api,
            notifications: [
              {
                status: api.sucesso ? "success" : "error",
                title: api.sucesso ? "Produto salvo" : "Erro no produto",
                message: api.mensagem,
                channels: api.sucesso ? ["toast"] : ["alert"],
                duration: api.sucesso ? 3500 : Infinity,
              },
              ...(api.avisos ?? []).map<ApiServiceNotification>((aviso) => ({
                status: "warning",
                title: "Atenção",
                message: aviso,
                channels: ["alert", "toast"],
                duration: 6000,
              })),
            ],
          };
        }}
        resolveNotifications={(notifications) => {
          // Exemplo de política da tela:
          // - erros ficam apenas como alert contextual;
          // - sucesso fica apenas como toast;
          // - warnings aparecem nos dois canais.
          return notifications.map((notification) => {
            if (notification.status === "error") {
              return { ...notification, channels: ["alert"] };
            }

            if (notification.status === "success") {
              return { ...notification, channels: ["toast"] };
            }

            return notification;
          });
        }}
        onNotifications={(notifications, response) => {
          console.log("[resolver-api] notificações finais", notifications, response);
        }}
        actionsClassName={actionsClassName}
        actions={(ctx) => (
          <>
            <Button type="button" variant="outline" onClick={() => {
              ctx.dispatchNotifications({
                status: "info",
                title: "Dica manual",
                message: "Esta notificação foi disparada manualmente pelo ctx.dispatchNotifications.",
                channels: ["alert"],
                duration: 5000,
              });
            }}>
              Dica contextual
            </Button>
            <Button type="submit">Salvar produto</Button>
          </>
        )}
      >
        <div className="flex flex-col gap-4">
          <FormAlertRegion maxItems={4} />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Produto">
              <Input name="produto" className={inputClassName} />
            </Field>
            <Field label="Quantidade">
              <Input name="quantidade" type="number" className={inputClassName} />
            </Field>
          </div>
        </div>
      </Form>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* 5. ModalForm compondo Modal + Form                     */
/* -------------------------------------------------------------------------- */

export function ExemploModalFormComFeedback() {
  const [open, setOpen] = React.useState(false);
  const [feedback, setFeedback] = React.useState<ApiServiceResponse<CadastroResult> | null>(null);

  return (
    <section className={sectionClassName}>
      <h2 className="mb-1 text-lg font-semibold">5. ModalForm com feedback</h2>
      <p className="mb-4 text-sm text-slate-500">
        ModalForm usa o mesmo motor do Form. O submitter entra em loading,
        cancelar/restaurar ficam disabled e o modal pode fechar ao sucesso.
      </p>

      <Button
        type="button"
        onClick={() => {
          setFeedback(null);
          setOpen(true);
        }}
      >
        Abrir modal form
      </Button>

      <ModalForm<UsuarioModel>
        id="exemplo-modal-form-feedback"
        open={open}
        title="Editar usuário"
        description="Exemplo de ModalForm usando a arquitetura do Form."
        model={{ nome: "Carla", email: "carla@email.com" }}
        validation={usuarioValidation}
        onClose={() => setOpen(false)}
        showReset
        onSubmit={async (model) => {
          const response = await salvarUsuarioComToast(model);
          setFeedback(response);

          if (response.ok) {
            setOpen(false);
          }
        }}
      >
        <div className="space-y-4">
          {feedback && !feedback.ok && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <strong className="block font-semibold">
                {feedback.title ?? "Erro no modal"}
              </strong>
              <span>
                {feedback.message ?? "Corrija os dados antes de fechar o modal."}
              </span>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nome">
              <Input name="nome" className={inputClassName} />
            </Field>
            <Field label="E-mail">
              <Input name="email" type="email" className={inputClassName} />
            </Field>
          </div>
        </div>
      </ModalForm>
    </section>
  );
}

export default function FormExamplesPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-2xl font-bold">Exemplos do componente Form</h1>
        <p className="text-sm text-slate-500">
          Catálogo de cenários para validar a arquitetura: Form sem estado operacional,
          Button gerenciável, AlertRegion contextual e Toast global.
        </p>
      </div>

      <ExemploFormMenuInterativo />
      <ExemploFormSilencioso />
      <ExemploFormComToast />
      <ExemploFormComAlertContextual />
      <ExemploFormComResolverDeApi />
      <ExemploModalFormComFeedback />
    </div>
  );
}
