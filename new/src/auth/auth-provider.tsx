import React from "react";
import { api } from "../service/api";
import { authService } from "./auth-service";
import { ensureRouterSession } from "./auth-router-context";
import { installAuthInterceptors } from "./auth-interceptors";
import { authStore } from "./auth-store";
import { extractAuthSessionData, type AuthSessionData, type AuthSnapshot, type LoginModel, type ReloginModel } from "./auth.types";

export type AuthActions = {
 ensureSession: () => Promise<AuthSnapshot>;
 login: (model: LoginModel) => Promise<AuthSessionData | null>;
 relogin: (model: ReloginModel) => Promise<AuthSessionData | null>;
 logout: () => Promise<void>;
 switchUser: () => Promise<void>;
};

const AuthActionsContext = React.createContext<AuthActions | null>(null);

export function AuthProvider({ children }: React.PropsWithChildren) {
 const ensureSession = React.useCallback(() => ensureRouterSession(), []);

 const login = React.useCallback(async (model: LoginModel) => {
  const response = await authService.login(model);
  const session = response.ok ? extractAuthSessionData(response) : null;

  if (!session) {
   return null;
  }

  authStore.setAuthenticated(session);
  return session;
 }, []);

 const relogin = React.useCallback(async (model: ReloginModel) => {
  const current = authStore.getSnapshot();
  const response = await authService.relogin({
   ...model,
   username: current.user?.username,
  });
  const session = response.ok ? extractAuthSessionData(response) : null;

  if (!session) {
   authStore.lock("request-unauthorized");
   return null;
  }

  authStore.setAuthenticated(session);
  return session;
 }, []);

 const logout = React.useCallback(async () => {
  await authService.logout().catch(() => undefined);
  authStore.clearToAnonymous();
 }, []);

 const switchUser = React.useCallback(async () => {
  await logout();
 }, [logout]);

 React.useEffect(() => installAuthInterceptors(api), []);

 const actions = React.useMemo<AuthActions>(() => ({
  ensureSession,
  login,
  relogin,
  logout,
  switchUser,
 }), [ensureSession, login, logout, relogin, switchUser]);

 return (
  <AuthActionsContext.Provider value={actions}>
   {children}
  </AuthActionsContext.Provider>
 );
}

export function useAuthActions(): AuthActions {
 const actions = React.useContext(AuthActionsContext);

 if (!actions) {
  throw new Error("useAuthActions deve ser usado dentro de AuthProvider.");
 }

 return actions;
}
