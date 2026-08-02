import type React from "react";
import type { ClaimRequirement } from "../authorization/claim.types";

export type NavigationItem = {
 id?: string;
 to?: string;
 legacyHref?: string;
 label: React.ReactNode;
 order?: number;
 icon?: React.ComponentType<{ className?: string }>;
 disabled?: boolean;
 claim?: ClaimRequirement;
 children?: NavigationItem[];

};
