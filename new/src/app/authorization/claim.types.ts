export type AuthClaim = {
 claimType: string;
 claimValue: string;
};

export type ClaimRequirement = AuthClaim;

export type ClaimIndex = ReadonlyMap<string, ReadonlySet<string>>;

export type ClaimProtected = {
 claim?: ClaimRequirement;
};
