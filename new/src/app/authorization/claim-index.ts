import type { AuthClaim, ClaimIndex, ClaimRequirement } from "./claim.types";

export const EMPTY_CLAIM_INDEX: ClaimIndex = new Map<string, ReadonlySet<string>>();

export function normalizeClaimPart(value: string): string {
 return value.trim().toLowerCase();
}

export function createClaimIndex(claims: readonly AuthClaim[]): ClaimIndex {
 const index = new Map<string, Set<string>>();

 for (const claim of claims) {
  const claimType = normalizeClaimPart(claim.claimType);
  const claimValue = normalizeClaimPart(claim.claimValue);
  let values = index.get(claimType);

  if (!values) {
   values = new Set<string>();
   index.set(claimType, values);
  }

  values.add(claimValue);
 }

 return index;
}

export function hasClaim(index: ClaimIndex, requirement: ClaimRequirement): boolean {
 return index
  .get(normalizeClaimPart(requirement.claimType))
  ?.has(normalizeClaimPart(requirement.claimValue)) ?? false;
}
