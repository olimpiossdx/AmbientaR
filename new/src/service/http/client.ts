// src/service/http/client.ts
import { smartAdapter } from "./adapters";
import type { ApiRequestConfig, ApiResponse, ApiRetryConfig, ApiSerializationConfig, 
  HttpClientConfig, HttpMethod, RequestInterceptor,  ResolvedApiRequestConfig, ResponseInterceptor } from "./types";

const DEFAULT_RETRY: Required<ApiRetryConfig> = {
  attempts: 0,
  delay: 1000,
  strategy: "exponential",
  maxDelay: 30000,
  retryOnNetworkError: true,
  retryOnHttpStatus: [408, 425, 429, 500, 502, 503, 504],
  retryUnsafeMethods: false,
};

const DEFAULT_SERIALIZATION: Required<ApiSerializationConfig> = {
  autoDetectBody: true,
  defaultContentType: "application/json",
};

function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function trimSlashes(baseURL: string, endpoint: string): string {
  if (!baseURL) {
    return endpoint;
  }

  if (!endpoint) {
    return baseURL;
  }

  return `${baseURL.replace(/\/+$/, "")}/${endpoint.replace(/^\/+/, "")}`;
}

function appendParams(url: string, params?: ApiRequestConfig["params"]): string {
  if (!params) {
    return url;
  }

  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query.append(key, String(value));
    }
  });

  const queryString = query.toString();

  if (!queryString) {
    return url;
  }

  return `${url}${url.includes("?") ? "&" : "?"}${queryString}`;
}

function mergeHeaders(defaultHeaders: Headers, requestHeaders?: HeadersInit): Headers {
  const headers = new Headers(defaultHeaders);

  if (requestHeaders) {
    new Headers(requestHeaders).forEach((value, key) => {
      headers.set(key, value);
    });
  }

  return headers;
}

function mergeRetry(globalRetry: ApiRetryConfig | false | undefined,requestRetry: ApiRetryConfig | false | undefined): ApiRetryConfig | false {
  if (requestRetry === false) {
    return false;
  }

  if (globalRetry === false) {
    return requestRetry ? { ...DEFAULT_RETRY, ...requestRetry } : false;
  }

  return {
    ...DEFAULT_RETRY,
    ...(globalRetry ?? {}),
    ...(requestRetry ?? {}),
  };
}

function mergeSerialization(globalSerialization: ApiSerializationConfig | undefined,requestSerialization: ApiSerializationConfig | undefined): Required<ApiSerializationConfig> {
  return {
    ...DEFAULT_SERIALIZATION,
    ...(globalSerialization ?? {}),
    ...(requestSerialization ?? {}),
  };
}

function isBodyInit(value: unknown): value is BodyInit {
  return (
    value instanceof FormData ||
    value instanceof URLSearchParams ||
    value instanceof Blob ||
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value)
  );
}

function hasHeader(headers: Headers, name: string): boolean {
  return headers.has(name);
}

function serializeBody(body: unknown,headers: Headers,serialization: Required<ApiSerializationConfig>): BodyInit | undefined {
  if (body === undefined || body === null) {
    return undefined;
  }

  if (!serialization.autoDetectBody) {
    return body as BodyInit;
  }

  if (body instanceof FormData) {
    headers.delete("Content-Type");
    return body;
  }

  if (body instanceof URLSearchParams) {
    if (!hasHeader(headers, "Content-Type")) {
      headers.set("Content-Type", "application/x-www-form-urlencoded;charset=UTF-8");
    }

    return body;
  }

  if (typeof body === "string") {
    if (!hasHeader(headers, "Content-Type")) {
      headers.set("Content-Type", serialization.defaultContentType === "text/plain" ? "text/plain" : "text/plain;charset=UTF-8");
    }

    return body;
  }

  if (isBodyInit(body)) {
    return body;
  }

  if (!hasHeader(headers, "Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return JSON.stringify(body);
}

function getRetryDelay(retry: ApiRetryConfig, nextAttempt: number): number {
  const delay = retry.delay ?? DEFAULT_RETRY.delay;
  const strategy = retry.strategy ?? DEFAULT_RETRY.strategy;
  const maxDelay = retry.maxDelay ?? DEFAULT_RETRY.maxDelay;

  const computed =
    strategy === "fixed"
      ? delay
      : strategy === "linear"
        ? delay * nextAttempt
        : delay * Math.pow(2, nextAttempt - 1);

  return Math.min(computed, maxDelay);
}

function isUnsafeMethod(method: HttpMethod): boolean {
  return method !== "GET" && method !== "HEAD";
}

function shouldRetryHttpStatus(retry: ApiRetryConfig, status: number): boolean {
  const rule = retry.retryOnHttpStatus ?? DEFAULT_RETRY.retryOnHttpStatus;

  if (typeof rule === "function") {
    return rule(status);
  }

  return rule.includes(status);
}

function shouldRetryNetworkError(retry: ApiRetryConfig, error: unknown): boolean {
  const isAbort = error instanceof Error && error.name === "AbortError";

  if (isAbort) {
    return false;
  }

  return retry.retryOnNetworkError ?? DEFAULT_RETRY.retryOnNetworkError;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  if (response.status === 204 || response.status === 205) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json().catch(() => null);
  }

  const text = await response.text().catch(() => "");

  if (!text) {
    return null;
  }

  return text;
}

function createNetworkErrorResponse<TData>(
  url: string,
  method: HttpMethod,
  error: unknown,
  attempts: number,
): ApiResponse<TData> {
  const isAbort = error instanceof Error && error.name === "AbortError";

  return {
    ok: false,
    status: "error",
    httpStatus: 0,
    data: null,
    error: {
      code: isAbort ? "REQUEST_ABORTED" : "NETWORK_ERROR",
      message: isAbort
        ? "Cancelado."
        : error instanceof Error
          ? error.message
          : "Falha de conexao.",
      cause: error,
    },
    notifications: [],
    headers: new Headers(),
    request: {
      url,
      method,
      attempts,
      retried: attempts > 1,
    },
  };
}

export class HttpClient {
  private readonly baseURL: string;
  private readonly defaultHeaders: Headers;
  private readonly credentials?: RequestCredentials;
  private readonly config: HttpClientConfig;

  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(config: HttpClientConfig = {}) {
    this.config = config;
    this.baseURL = config.baseURL ?? "";
    this.credentials = config.credentials;
    this.defaultHeaders = new Headers({
      Accept: "application/json",
      ...(config.headers ?? {}),
    });
  }

  useRequestInterceptor(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);

    return () => {
      this.requestInterceptors = this.requestInterceptors.filter(
        (item) => item !== interceptor,
      );
    };
  }

  useResponseInterceptor(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);

    return () => {
      this.responseInterceptors = this.responseInterceptors.filter(
        (item) => item !== interceptor,
      );
    };
  }

  private buildUrl(endpoint: string, config: ApiRequestConfig): string {
    const baseURL = config.baseURL ?? this.baseURL;
    const url = isAbsoluteUrl(endpoint) ? endpoint : trimSlashes(baseURL, endpoint);

    return appendParams(url, config.params);
  }

  private async sleep(ms: number, signal?: AbortSignal | null): Promise<void> {
    if (signal?.aborted) {
      throw new DOMException("Request aborted", "AbortError");
    }

    await new Promise<void>((resolve, reject) => {
      const timer = globalThis.setTimeout(resolve, ms);

      const abort = () => {
        globalThis.clearTimeout(timer);
        reject(new DOMException("Request aborted", "AbortError"));
      };

      signal?.addEventListener("abort", abort, { once: true });
    });
  }

  private resolveConfig<TBody>(endpoint: string, config: ApiRequestConfig<TBody>): { url: string; requestConfig: ResolvedApiRequestConfig<TBody> } {
    const method = config.method ?? "GET";
    const url = this.buildUrl(endpoint, config);
    const headers = mergeHeaders(this.defaultHeaders, config.headers);
    const retry = mergeRetry(this.config.retry, config.retry);
    const serialization = mergeSerialization(
      this.config.serialization,
      config.serialization,
    );

    const body = serializeBody(config.body, headers, serialization);

    const requestConfig: ResolvedApiRequestConfig<TBody> = {
      ...config,
      url,
      method,
      headers,
      body: body as TBody,
      adapter: config.adapter ?? this.config.adapter ?? smartAdapter,
      retry,
      serialization,
      response: {
        ...(this.config.response ?? {}),
        ...(config.response ?? {}),
      },
    };

    if (!requestConfig.credentials && this.credentials) {
      requestConfig.credentials = this.credentials;
    }

    return { url, requestConfig };
  }

  private cloneResolvedConfigForRetry<TBody>(
    config: ResolvedApiRequestConfig<TBody>,
  ): ResolvedApiRequestConfig<TBody> {
    return {
      ...config,
      headers: new Headers(config.headers),
      authRetry: true,
      serialization: {
        ...config.serialization,
        autoDetectBody: false,
      },
      retry: false,
    };
  }

  private async executeResolvedRequest<TResponse = void, TBody = unknown>(endpoint: string, url: string, finalConfig: ResolvedApiRequestConfig<TBody>): Promise<ApiResponse<TResponse>> {
    const retry = finalConfig.retry;
    const attempts = retry === false ? 1 : (retry.attempts ?? 0) + 1;
    const canRetryUnsafe = retry !== false && Boolean(retry.retryUnsafeMethods);

    let response: ApiResponse<TResponse> | null = null;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        const fetchResponse = await fetch(url, finalConfig as RequestInit);
        const shouldRetry =
          retry !== false &&
          attempt < attempts &&
          (!isUnsafeMethod(finalConfig.method) || canRetryUnsafe) &&
          shouldRetryHttpStatus(retry, fetchResponse.status);

        if (shouldRetry) {
          await this.sleep(getRetryDelay(retry, attempt), finalConfig.signal);
          continue;
        }

        const body = await parseResponseBody(fetchResponse);

        response = finalConfig.adapter<TResponse>(fetchResponse, body, {
          url,
          method: finalConfig.method,
          attempts: attempt,
          retried: attempt > 1,
          config: finalConfig,
        });

        break;
      } catch (error) {
        const shouldRetry =
          retry !== false &&
          attempt < attempts &&
          (!isUnsafeMethod(finalConfig.method) || canRetryUnsafe) &&
          shouldRetryNetworkError(retry, error);

        if (shouldRetry) {
          await this.sleep(getRetryDelay(retry, attempt), finalConfig.signal);
          continue;
        }

        response = createNetworkErrorResponse<TResponse>(
          url,
          finalConfig.method,
          error,
          attempt,
        );
        break;
      }
    }

    let finalResponse = response ?? createNetworkErrorResponse<TResponse>(url,finalConfig.method,
      new Error("Falha desconhecida."), attempts);

    for (const interceptor of this.responseInterceptors) {
      finalResponse = await interceptor(finalResponse, {
        client: this,
        endpoint,
        url,
        config: finalConfig,
        retryOriginal: <TRetryResponse = TResponse>() => {
          const retryConfig = this.cloneResolvedConfigForRetry(finalConfig);
          return this.executeResolvedRequest<TRetryResponse, TBody>(
            endpoint,
            url,
            retryConfig,
          );
        },
      });
    }

    return finalResponse;
  }

  async request<TResponse = void, TBody = unknown>(endpoint: string, config: ApiRequestConfig<TBody> = {}): Promise<ApiResponse<TResponse>> {
    const initial = this.resolveConfig(endpoint, config);
    let finalConfig: ResolvedApiRequestConfig = initial.requestConfig;
    let url = initial.url;

    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }

    url = finalConfig.url ?? url;

    return this.executeResolvedRequest<TResponse>(endpoint, url, finalConfig);
  }

  get<TResponse = void>( url: string, config?: Omit<ApiRequestConfig, "method" | "body">): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(url, { ...config, method: "GET" });
  }

  post<TResponse = void, TBody = unknown>(url: string, body?: TBody,config?: Omit<ApiRequestConfig<TBody>, "method" | "body">): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse, TBody>(url, { ...config, method: "POST", body });
  }

  put<TResponse = void, TBody = unknown>(url: string,body?: TBody,config?: Omit<ApiRequestConfig<TBody>, "method" | "body">): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse, TBody>(url, { ...config, method: "PUT", body });
  }

  patch<TResponse = void, TBody = unknown>(url: string,body?: TBody,config?: Omit<ApiRequestConfig<TBody>, "method" | "body">): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse, TBody>(url, { ...config, method: "PATCH", body });
  }

  delete<TResponse = void>(url: string,config?: Omit<ApiRequestConfig, "method" | "body">): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse>(url, { ...config, method: "DELETE" });
  }

  deleteWithBody<TResponse = void, TBody = unknown>(url: string,body: TBody,config?: Omit<ApiRequestConfig<TBody>, "method" | "body">): Promise<ApiResponse<TResponse>> {
    return this.request<TResponse, TBody>(url, { ...config, method: "DELETE", body });
  }
}

export function createHttpClient(config?: HttpClientConfig): HttpClient {
  return new HttpClient(config);
}
