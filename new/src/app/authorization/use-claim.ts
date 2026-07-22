import { useAuthSnapshot } from "../../auth/auth-hooks";
import { authorizationService } from "./authorization-service";
import type { ClaimRequirement } from "./claim.types";

export function useClaim(requirement: ClaimRequirement): boolean {
 const { canUseApp, revision } = useAuthSnapshot();
 void revision;
 return canUseApp && authorizationService.satisfies(requirement);
}
