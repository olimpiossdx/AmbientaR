import { authStore } from "../../auth/auth-store";
import { authorizationCache } from "./authorization-cache";
import type { ClaimRequirement } from "./claim.types";

export type AuthorizationService = {
 hasClaim(claimType: string, claimValue: string): boolean;
 satisfies(requirement?: ClaimRequirement): boolean;
};

export const authorizationService: AuthorizationService = {
 hasClaim(claimType, claimValue) {
  if (!authStore.getSnapshot().canUseApp) {
   return false;
  }

  return authorizationCache.has({ claimType, claimValue });
 },

 satisfies(requirement) {
  if (!requirement) {
   return true;
  }

  if (!authStore.getSnapshot().canUseApp) {
   return false;
  }

  return authorizationCache.has(requirement);
 },
};
