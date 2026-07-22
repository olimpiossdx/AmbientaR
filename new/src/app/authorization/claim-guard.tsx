import type { ReactNode } from "react";
import type { ClaimRequirement } from "./claim.types";
import { useClaim } from "./use-claim";

export type ClaimGuardProps = {
 claim: ClaimRequirement;
 children: ReactNode;
 fallback?: ReactNode;
};

export function ClaimGuard({ claim, children, fallback = null }: ClaimGuardProps) {
 return useClaim(claim) ? children : fallback;
}
