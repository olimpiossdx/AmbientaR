// src/service/http/adapters.ts
import type {
  ApiAdapterContext,
  ApiEnvelope,
  ApiError,
  ApiNotification,
  ApiResponse,
  LegacyApiNotification,
  ResponseAdapter,
} from "./types";

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeError(value: unknown, fallback: ApiError): ApiError {
  if (typeof value === "string") {
    return { ...fallback, message: value };
  }

  if (isObject(value)) {
    return {
      code: typeof value.code === "string" ? value.code : fallback.code,
      message:
        typeof value.message === "string" ? value.message : fallback.message,
      details: value.details ?? value,
      cause: value.cause,
    };
  }

  return fallback;
}

function normalizeNotification(
  notification: ApiNotification | LegacyApiNotification,
): ApiNotification | null {
  const legacy = notification as LegacyApiNotification;
  const message = notification.message ?? legacy.mensagem;

  if (!notification.status || !message) {
    return null;
  }

  return {
    status: notification.status,
    title: notification.title ?? legacy.titulo,
    message,
    field: notification.field ?? legacy.campo,
    code: notification.code,
    duration: notification.duration,
  };
}

function normalizeNotifications(payload: ApiEnvelope): ApiNotification[] {
  const items = payload.notifications ?? payload.notificacoes ?? [];

  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => normalizeNotification(item))
    .filter((item): item is ApiNotification => item !== null);
}

function resolveSemanticStatus(
  payload: ApiEnvelope,
  ok: boolean,
): ApiResponse["status"] {
  if (
    payload.status === "success" ||
    payload.status === "error" ||
    payload.status === "warning" ||
    payload.status === "info"
  ) {
    return payload.status;
  }

  return ok ? "success" : "error";
}

function shouldHttpStatusBeOk(response: Response, context: ApiAdapterContext) {
  const successHttpStatus = context.config.response.successHttpStatus;
  const errorHttpStatus = context.config.response.errorHttpStatus;

  if (typeof errorHttpStatus === "function" && errorHttpStatus(response.status)) {
    return false;
  }

  if (Array.isArray(errorHttpStatus) && errorHttpStatus.includes(response.status)) {
    return false;
  }

  if (typeof successHttpStatus === "function") {
    return successHttpStatus(response.status);
  }

  if (Array.isArray(successHttpStatus)) {
    return successHttpStatus.includes(response.status);
  }

  return response.ok;
}

function fallbackError(response: Response, payload?: ApiEnvelope): ApiError {
  const message =
    payload?.message ??
    payload?.mensagem ??
    response.statusText ??
    "Erro na requisicao";

  return {
    code: String(response.status || "REQUEST_ERROR"),
    message,
    details: payload,
  };
}

/**
 * Adapter padrao da aplicacao.
 * Normaliza o contrato novo e o legado para ApiResponse<TData>.
 */
export const standardAdapter: ResponseAdapter = <TData = void>(
  response: Response,
  body: unknown,
  context: ApiAdapterContext,
): ApiResponse<TData> => {
  const payload: ApiEnvelope<TData> = isObject(body) ? body : {};
  const httpOk = shouldHttpStatusBeOk(response, context);
  const hasExplicitOk = typeof payload.ok === "boolean";
  const hasExplicitIsSuccess = typeof payload.isSuccess === "boolean";
  const hasError = payload.error !== undefined && payload.error !== null;

  const ok = hasError
    ? false
    : hasExplicitOk
      ? Boolean(payload.ok)
      : hasExplicitIsSuccess
        ? Boolean(payload.isSuccess)
        : httpOk;

  const error = ok ? null : normalizeError(payload.error, fallbackError(response, payload));
  const data = payload.data === undefined ? null : (payload.data as TData | null);

  return {
    ok,
    status: resolveSemanticStatus(payload, ok),
    httpStatus: response.status,
    data,
    error,
    notifications: normalizeNotifications(payload),
    headers: response.headers,
    total: typeof payload.total === "number" ? payload.total : undefined,
    metadata: isObject(payload.metadata) ? payload.metadata : undefined,
    request: {
      url: context.url,
      method: context.method,
      attempts: context.attempts,
      retried: context.retried,
    },
    raw: body,
  };
};

/**
 * Adapter cru para APIs externas. O body inteiro vira data quando HTTP ok.
 */
export const rawAdapter: ResponseAdapter = <TData = void>(
  response: Response,
  body: unknown,
  context: ApiAdapterContext,
): ApiResponse<TData> => {
  const ok = shouldHttpStatusBeOk(response, context);

  return {
    ok,
    status: ok ? "success" : "error",
    httpStatus: response.status,
    data: ok ? (body as TData) : null,
    error: ok
      ? null
      : {
          code: String(response.status || "REQUEST_ERROR"),
          message:
            (isObject(body) &&
              (typeof body.message === "string"
                ? body.message
                : typeof body.error === "string"
                  ? body.error
                  : undefined)) ||
            response.statusText ||
            "Erro externo",
          details: body,
        },
    notifications: [],
    headers: response.headers,
    request: {
      url: context.url,
      method: context.method,
      attempts: context.attempts,
      retried: context.retried,
    },
    raw: body,
  };
};

function hasEnvelopeShape(body: unknown): body is ApiEnvelope {
  if (!isObject(body)) {
    return false;
  }

  return (
    "ok" in body ||
    "isSuccess" in body ||
    "notifications" in body ||
    "notificacoes" in body ||
    "error" in body ||
    "data" in body
  );
}

/**
 * Adapter com auto-deteccao. Use como padrao se a aplicacao conversa com APIs mistas.
 */
export const smartAdapter: ResponseAdapter = <TData = void>(
  response: Response,
  body: unknown,
  context: ApiAdapterContext,
): ApiResponse<TData> => {
  if (hasEnvelopeShape(body)) {
    return standardAdapter<TData>(response, body, context);
  }

  return rawAdapter<TData>(response, body, context);
};
