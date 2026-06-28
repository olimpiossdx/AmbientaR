// src/service/public-api-playground-service.example.ts
import { rawAdapter } from "./http/adapters";
import { createHttpClient } from "./http/client";

/**
 * Clientes publicos usados apenas no playground de homologacao.
 *
 * JSONPlaceholder: API REST fake com CORS liberado para desenvolvimento.
 * HTTPBingo: servico de inspecao HTTP/status/body para exercitar retry e serializacao.
 */
export const jsonPlaceholderApi = createHttpClient({
  baseURL: "https://jsonplaceholder.typicode.com",
  adapter: rawAdapter,
  retry: {
    attempts: 2,
    delay: 500,
    strategy: "exponential",
    maxDelay: 2500,
    retryOnNetworkError: true,
    retryOnHttpStatus: [408, 425, 429, 500, 502, 503, 504],
    retryUnsafeMethods: false,
  },
  serialization: {
    autoDetectBody: true,
    defaultContentType: "application/json",
  },
});

export const httpBingoApi = createHttpClient({
  baseURL: "https://httpbingo.org",
  adapter: rawAdapter,
  retry: {
    attempts: 2,
    delay: 500,
    strategy: "exponential",
    maxDelay: 2500,
    retryOnNetworkError: true,
    retryOnHttpStatus: [408, 425, 429, 500, 502, 503, 504],
    retryUnsafeMethods: true,
  },
  serialization: {
    autoDetectBody: true,
    defaultContentType: "application/json",
  },
});

export type PlaygroundPost = {
  userId: number;
  id: number;
  title: string;
  body: string;
};

export type PlaygroundPostInput = Pick<PlaygroundPost, "userId" | "title" | "body">;
export type PlaygroundPostPatch = Partial<Pick<PlaygroundPost, "title" | "body">>;

export type PlaygroundComment = {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
};

export type HttpEchoResponse = {
  args?: Record<string, string[]>;
  headers?: Record<string, string[]>;
  method?: string;
  origin?: string;
  url?: string;
  data?: string;
  json?: unknown;
  form?: Record<string, string[]>;
  files?: Record<string, string[]>;
};

export const publicApiPlaygroundService = {
  listarPosts: (params?: { userId?: number; limit?: number }) =>
    jsonPlaceholderApi.get<PlaygroundPost[]>("/posts", {
      params: {
        userId: params?.userId,
        _limit: params?.limit ?? 5,
      },
    }),

  buscarPost: (id: number) =>
    jsonPlaceholderApi.get<PlaygroundPost>(`/posts/${id}`),

  listarComentarios: (postId: number) =>
    jsonPlaceholderApi.get<PlaygroundComment[]>(`/posts/${postId}/comments`),

  criarPost: (model: PlaygroundPostInput) =>
    jsonPlaceholderApi.post<PlaygroundPost>("/posts", model, {
      retry: {
        attempts: 1,
        retryUnsafeMethods: true,
      },
    }),

  atualizarPost: (id: number, model: PlaygroundPostInput) =>
    jsonPlaceholderApi.put<PlaygroundPost>(`/posts/${id}`, model),

  atualizarPostParcial: (id: number, model: PlaygroundPostPatch) =>
    jsonPlaceholderApi.patch<PlaygroundPost>(`/posts/${id}`, model),

  removerPost: (id: number) =>
    jsonPlaceholderApi.delete(`/posts/${id}`),

  enviarJsonParaEcho: (model: PlaygroundPostInput) =>
    httpBingoApi.post<HttpEchoResponse>("/post", model),

  enviarFormDataParaEcho: (model: PlaygroundPostInput) => {
    const formData = new FormData();
    formData.append("userId", String(model.userId));
    formData.append("title", model.title);
    formData.append("body", model.body);

    return httpBingoApi.post<HttpEchoResponse>("/post", formData);
  },

  simularErroHttp: (status = 500) =>
    httpBingoApi.get(`/status/${status}`, {
      retry: {
        attempts: 2,
        delay: 600,
        strategy: "fixed",
        retryOnHttpStatus: [status],
      },
    }),
};
