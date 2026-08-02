import type { ApiResponse } from "../service/http/types";
import type { LoginModel } from "./auth.types";
import { isEmailIdentifier, normalizeCpfCnpj } from "./auth-validation";

export const DEFAULT_AUTHENTICATED_ROUTE = "/app";

export function normalizeLoginModel(model: LoginModel): LoginModel {
 const identifier = model.username.trim();

 return {
  username: isEmailIdentifier(identifier)
   ? identifier.toLowerCase()
   : normalizeCpfCnpj(identifier),
  password: model.password.trim(),
 };
}

export function resolveLoginRedirect(search: string): string {
 const redirect = new URLSearchParams(search).get("redirect")?.trim();

 if (
  !redirect ||
  !redirect.startsWith("/app") ||
  redirect.startsWith("//") ||
  redirect.includes("\\")
 ) {
  return DEFAULT_AUTHENTICATED_ROUTE;
 }

 return redirect;
}

export function getLoginErrorMessage(response: ApiResponse<unknown>): string {
 if (response.httpStatus === 401 || response.httpStatus === 403) {
  return "E-mail/documento ou senha incorretos.";
 }

 if (response.httpStatus === 0) {
  return "Não foi possível conectar ao AmbientaR. Verifique sua conexão e tente novamente.";
 }

 if (response.httpStatus >= 500) {
  return "O serviço de acesso está temporariamente indisponível. Tente novamente em instantes.";
 }

 const notification = response.notifications.find((item) => item.message);

 return (
  notification?.message ||
  response.error?.message ||
  "Não foi possível entrar. Confira os dados informados."
 );
}
