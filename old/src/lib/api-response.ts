import { parseApiJsonResponse } from '@/lib/parse-api-json';

export type ParsedApiResult<T> =
  | { ok: true; data: T; status: number }
  | { ok: false; message: string; status: number; partial?: boolean; raw?: unknown };

function readMessage(body: Record<string, unknown>): string {
  if (typeof body.error === 'string') return body.error;
  if (
    body.error &&
    typeof body.error === 'object' &&
    'message' in (body.error as object)
  ) {
    return String((body.error as { message?: string }).message ?? 'Erro no servidor');
  }
  if (typeof body.message === 'string') return body.message;
  return 'Erro no servidor';
}

/** Normaliza respostas JSON de `/api/*` (FAD, MCA, package, auth genérico). */
export async function parseUnifiedApiResponse<T = Record<string, unknown>>(
  res: Response,
): Promise<ParsedApiResult<T>> {
  const status = res.status;
  let body: Record<string, unknown>;
  try {
    body = (await parseApiJsonResponse<Record<string, unknown>>(res)) ?? {};
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Resposta inválida do servidor',
      status,
    };
  }

  if (body.ok === true && body.data !== undefined) {
    return { ok: true, data: body.data as T, status };
  }

  if (body.success === true) {
    const { success: _s, error: _e, ...rest } = body;
    return { ok: true, data: rest as T, status };
  }

  if (body.ok === false || body.success === false) {
    return {
      ok: false,
      message: readMessage(body),
      status: status >= 400 ? status : 400,
      raw: body,
    };
  }

  if (!res.ok) {
    return { ok: false, message: readMessage(body), status, raw: body };
  }

  if (body.ok === false && typeof body.message === 'string') {
    return { ok: false, message: body.message, status: status || 400, raw: body };
  }

  return { ok: true, data: body as T, status };
}
