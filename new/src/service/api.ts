// src/service/api.ts
import { smartAdapter } from "./http/adapters";
import { createHttpClient } from "./http/client";

export const API_BASE_URL =
  (import.meta as ImportMeta & { env?: { VITE_API_URL?: string } }).env
    ?.VITE_API_URL ?? "http://localhost:3001";

export const api = createHttpClient({
  baseURL: API_BASE_URL,
  credentials: "include",
  adapter: smartAdapter,
  retry: {
    attempts: 3,
    delay: 700,
    strategy: "exponential",
    maxDelay: 5000,
    retryOnNetworkError: true,
    retryOnHttpStatus: [408, 425, 429, 500, 502, 503, 504],
    retryUnsafeMethods: false,
  },
  serialization: {
    autoDetectBody: true,
    defaultContentType: "application/json",
  },
});
