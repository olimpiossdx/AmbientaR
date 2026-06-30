import type { HttpClient } from "../service/http/client";
import type { ApiResponse, ResponseInterceptorContext } from "../service/http/types";
import { authService, isAuthEndpoint } from "./auth-service";
import { authStore, type AuthStore } from "./auth-store";
import { extractAuthSessionData, type AuthSessionData } from "./auth.types";

type AuthRefreshService = {
 refresh: () => Promise<ApiResponse<AuthSessionData>>;
};

type InstallAuthInterceptorsOptions = {
 store?: AuthStore;
 service?: AuthRefreshService;
};

let refreshPromise: Promise<boolean> | null = null;

function shouldHandleUnauthorized(
 response: ApiResponse<unknown>,
 context: ResponseInterceptorContext,
): boolean {
 if (response.httpStatus !== 401) {
  return false;
 }

 if (context.config.skipAuthRefresh || context.config.authRetry) {
  return false;
 }

 if (isAuthEndpoint(context.url)) {
  return false;
 }

 return true;
}

function createRefreshOnce(store: AuthStore, service: AuthRefreshService) {
 return async function refreshOnce(): Promise<boolean> {
  if (!refreshPromise) {
   store.setRefreshing();

   refreshPromise = service.refresh()
    .then((response) => {
     const session = response.ok ? extractAuthSessionData(response) : null;

     if (!session) {
      store.lock("request-unauthorized");
      return false;
     }

     store.setAuthenticated(session);
     return true;
    })
    .catch(() => {
     store.lock("request-unauthorized");
     return false;
    })
    .finally(() => {
     refreshPromise = null;
    });
  }

  return refreshPromise;
 };
}

export function installAuthInterceptors(
 client: HttpClient,
 options: InstallAuthInterceptorsOptions = {},
): () => void {
 const store = options.store ?? authStore;
 const service = options.service ?? authService;
 const refreshOnce = createRefreshOnce(store, service);

 const removeRequestInterceptor = client.useRequestInterceptor((config) => {
  config.credentials = "include";
  return config;
 });

 const removeResponseInterceptor = client.useResponseInterceptor(async (response, context) => {
  const session = extractAuthSessionData(response as Parameters<typeof extractAuthSessionData>[0]);

  if (response.ok && session) {
   store.setAuthenticated(session);
   return response;
  }

  if (!shouldHandleUnauthorized(response, context)) {
   return response;
  }

  const refreshed = await refreshOnce();

  if (!refreshed) {
   store.lock("request-unauthorized");
   return response;
  }

  return context.retryOriginal();
 });

 return () => {
  removeResponseInterceptor();
  removeRequestInterceptor();
 };
}
