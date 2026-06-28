// src/service/api.ts
import { smartAdapter } from "./http/adapters";
import { createHttpClient } from "./http/client";

export const api = createHttpClient({
  baseURL: (import.meta as ImportMeta & { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ?? "https://api.meusistema.com/v1",
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
