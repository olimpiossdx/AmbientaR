import { api } from "../service/api";
import type { ApiResponse } from "../service/http/types";
import type {
 AuthSessionData,
 LoginModel,
 PasswordResetModel,
 RegisterDocumentPreview,
 RegisterDocumentPreviewModel,
 RegisterModel,
 RegisterResult,
 ReloginModel,
} from "./auth.types";

const AUTH_ENDPOINTS = {
 login: "/auth/login",
 logout: "/auth/logout",
 refresh: "/auth/refresh",
 relogin: "/auth/relogin",
 session: "/auth/session",
 passwordReset: "/auth/password-reset",
 register: "/auth/register",
 registerDocumentPreview: "/auth/register/document-preview",
};

export function isAuthEndpoint(url: string): boolean {
 return Object.values(AUTH_ENDPOINTS).some((endpoint) => url.includes(endpoint));
}

export const authService = {
 login(model: LoginModel): Promise<ApiResponse<AuthSessionData>> {
  return api.post<AuthSessionData, LoginModel>(AUTH_ENDPOINTS.login, model, {
   skipAuthRefresh: true,
  });
 },

 logout(): Promise<ApiResponse<void>> {
  return api.post<void>(AUTH_ENDPOINTS.logout, undefined, {
   skipAuthRefresh: true,
  });
 },

 refresh(): Promise<ApiResponse<AuthSessionData>> {
  return api.post<AuthSessionData>(AUTH_ENDPOINTS.refresh, undefined, {
   skipAuthRefresh: true,
  });
 },

 relogin(model: ReloginModel & { username?: string }): Promise<ApiResponse<AuthSessionData>> {
  return api.post<AuthSessionData, ReloginModel & { username?: string }>(
   AUTH_ENDPOINTS.relogin,
   model,
   { skipAuthRefresh: true },
  );
 },

 session(): Promise<ApiResponse<AuthSessionData>> {
  return api.get<AuthSessionData>(AUTH_ENDPOINTS.session, {
   skipAuthRefresh: true,
  });
 },

 passwordReset(model: PasswordResetModel): Promise<ApiResponse<void>> {
  return api.post<void, PasswordResetModel>(AUTH_ENDPOINTS.passwordReset, model, {
   skipAuthRefresh: true,
  });
 },

 register(model: RegisterModel): Promise<ApiResponse<RegisterResult>> {
  return api.post<RegisterResult, RegisterModel>(AUTH_ENDPOINTS.register, model, {
   skipAuthRefresh: true,
  });
 },

 registerDocumentPreview(
  model: RegisterDocumentPreviewModel,
 ): Promise<ApiResponse<RegisterDocumentPreview>> {
  return api.post<RegisterDocumentPreview, RegisterDocumentPreviewModel>(
   AUTH_ENDPOINTS.registerDocumentPreview,
   model,
   { skipAuthRefresh: true },
  );
 },
};
