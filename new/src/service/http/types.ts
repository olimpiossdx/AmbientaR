// src/service/http/types.ts
// Contratos centrais do HttpClient puro.

export type HttpMethod = "GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiStatus = "success" | "error" | "warning" | "info";

export type RetryDelayStrategy = "fixed" | "linear" | "exponential";

export type ApiRequestParams = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  cause?: unknown;
}

export interface ApiNotification {
  status: ApiStatus;
  title?: string;
  message: string;
  field?: string;
  code?: string;
  duration?: number;
}

export interface LegacyApiNotification {
  status: ApiStatus;
  titulo?: string;
  title?: string;
  campo?: string;
  field?: string;
  mensagem?: string;
  message?: string;
  code?: string;
  duration?: number;
}

export interface ApiResponse<TData = void> {
  ok: boolean;
  status: ApiStatus;
  httpStatus: number;
  data: TData | null;
  error: ApiError | null;
  notifications: ApiNotification[];
  headers: Headers;
  total?: number;
  request: {
    url: string;
    method: HttpMethod;
    attempts: number;
    retried: boolean;
  };
  metadata?: Record<string, unknown>;
  raw?: unknown;
}

/**
 * Envelope aceito pelo adapter padrao. Mantem suporte ao contrato novo e ao legado.
 */
export interface ApiEnvelope<TData = unknown> {
  ok?: boolean;
  isSuccess?: boolean;
  status?: ApiStatus;
  data?: TData | null;
  error?: ApiError | null | string;
  message?: string;
  mensagem?: string;
  notifications?: ApiNotification[];
  notificacoes?: LegacyApiNotification[];
  total?: number;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ApiRetryConfig {
  attempts?: number;
  delay?: number;
  strategy?: RetryDelayStrategy;
  maxDelay?: number;
  retryOnNetworkError?: boolean;
  retryOnHttpStatus?: number[] | ((status: number) => boolean);
  retryUnsafeMethods?: boolean;
}

export interface ApiSerializationConfig {
  autoDetectBody?: boolean;
  defaultContentType?: "application/json" | "text/plain";
}

export interface ApiResponseConfig {
  successHttpStatus?: number[] | ((status: number) => boolean);
  errorHttpStatus?: number[] | ((status: number) => boolean);
}

export interface ApiAdapterContext {
  url: string;
  method: HttpMethod;
  attempts: number;
  retried: boolean;
  config: ResolvedApiRequestConfig;
}

export type ResponseAdapter = <TData = void>(
  response: Response,
  body: unknown,
  context: ApiAdapterContext,
) => ApiResponse<TData>;

export interface HttpClientConfig {
  baseURL?: string;
  headers?: HeadersInit;
  credentials?: RequestCredentials;
  adapter?: ResponseAdapter;
  retry?: ApiRetryConfig | false;
  serialization?: ApiSerializationConfig;
  response?: ApiResponseConfig;
}

export interface ApiRequestConfig<TBody = unknown>
  extends Omit<RequestInit, "body" | "method" | "headers"> {
  baseURL?: string;
  url?: string;
  method?: HttpMethod;
  skipAuthRefresh?: boolean;
  authRetry?: boolean;
  headers?: HeadersInit;
  params?: ApiRequestParams;
  body?: TBody;
  adapter?: ResponseAdapter;
  retry?: ApiRetryConfig | false;
  serialization?: ApiSerializationConfig;
  response?: ApiResponseConfig;
}

export interface ResolvedApiRequestConfig<TBody = unknown>
  extends Omit<ApiRequestConfig<TBody>, "headers" | "retry" | "adapter" | "serialization" | "response"> {
  headers: Headers;
  method: HttpMethod;
  adapter: ResponseAdapter;
  retry: ApiRetryConfig | false;
  serialization: Required<ApiSerializationConfig>;
  response: ApiResponseConfig;
}

export type RequestInterceptor = (
  config: ResolvedApiRequestConfig,
) => Promise<ResolvedApiRequestConfig> | ResolvedApiRequestConfig;

export interface ResponseInterceptorContext<TData = void, TBody = unknown> {
  client: {
    request: <TResponse = void, TRequestBody = unknown>(
      endpoint: string,
      config?: ApiRequestConfig<TRequestBody>,
    ) => Promise<ApiResponse<TResponse>>;
  };
  endpoint: string;
  url: string;
  config: ResolvedApiRequestConfig<TBody>;
  retryOriginal: <TResponse = TData>() => Promise<ApiResponse<TResponse>>;
}

export type ResponseInterceptor = <TData = void>(
  response: ApiResponse<TData>,
  context: ResponseInterceptorContext<TData>,
) => Promise<ApiResponse<TData>> | ApiResponse<TData>;

// Aliases temporarios para facilitar migracao do contrato antigo.
export type IApiError = ApiError;
export type INotification = LegacyApiNotification;
export type IApiResponse<T = void> = ApiResponse<T>;
export type HttpClientOptions = HttpClientConfig;
export type HttpRequestConfig<TBody = unknown> = ApiRequestConfig<TBody>;
