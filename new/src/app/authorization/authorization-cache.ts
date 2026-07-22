import { createClaimIndex, EMPTY_CLAIM_INDEX, hasClaim } from "./claim-index";
import type { AuthClaim, ClaimIndex, ClaimRequirement } from "./claim.types";

export class AuthorizationCache {
 private claimIndex: ClaimIndex = EMPTY_CLAIM_INDEX;

 replace(claims: readonly AuthClaim[]): void {
  this.claimIndex = createClaimIndex(claims);
 }

 clear(): void {
  this.claimIndex = EMPTY_CLAIM_INDEX;
 }

 has(requirement: ClaimRequirement): boolean {
  return hasClaim(this.claimIndex, requirement);
 }

 getIndexForTests(): ClaimIndex {
  return this.claimIndex;
 }
}

export const authorizationCache = new AuthorizationCache();
