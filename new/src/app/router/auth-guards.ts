import { redirect } from "@tanstack/react-router";
import type { ClaimRequirement } from "../authorization/claim.types";
import type { AppRouterContext } from "./router-context";

type GuardOptions = {
 context: AppRouterContext;
 location: {
  href: string;
  pathname: string;
 };
};

export async function ensureAuthenticatedShell(options: GuardOptions) {
 const auth = await options.context.auth.ensureSession();

 if (auth.status === "anonymous") {
  throw redirect({
   to: "/login" as never,
   search: { redirect: options.location.href } as never,
  });
 }

 return auth;
}

export function createAuthGuard(requirement?: ClaimRequirement) {
 return async (options: GuardOptions) => {
  const auth = await ensureAuthenticatedShell(options);

  if (auth.status === "locked") {
   if (options.location.pathname !== "/app/sessao-bloqueada") {
    options.context.auth.setPendingLocation(options.location.href);
    throw redirect({ to: "/app/sessao-bloqueada" as never });
   }

   return;
  }

  if (auth.status !== "authenticated") {
   options.context.auth.setPendingLocation(options.location.href);
   throw redirect({ to: "/app/sessao-bloqueada" as never });
  }

  if (requirement && !options.context.authorization.satisfies(requirement)) {
   throw redirect({ to: "/app/acesso-negado" as never });
  }
 };
}
