"use client";

import * as React from "react";
import { useFirebase } from "@/firebase";
import { getBearerApiHeaders } from "@/lib/api-client-auth";
import {
  getPackageLimits,
  isPackageLimitsExempt,
  isSubjectToPackageLimits,
  resolveEffectivePackage,
  type PackageLimits,
} from "@/lib/package-limits";
import type { AppUser } from "@/lib/types";

export type PackageUsageState = {
  loading: boolean;
  enforced: boolean;
  empreendimentos: number;
  limits: PackageLimits;
  packageId: ReturnType<typeof resolveEffectivePackage>;
  ambbotIncludedRemaining: number;
  ambbotPrepaidCredits: number;
  refresh: () => void;
};

export function usePackageUsage(
  user: AppUser | null | undefined,
): PackageUsageState {
  const { auth } = useFirebase();
  const [loading, setLoading] = React.useState(false);
  const [empreendimentos, setEmpreendimentos] = React.useState(0);
  const [ambbotIncludedRemaining, setAmbbotIncludedRemaining] = React.useState(0);
  const [ambbotPrepaidCredits, setAmbbotPrepaidCredits] = React.useState(0);

  const enforced = Boolean(
    user && isSubjectToPackageLimits(user) && !isPackageLimitsExempt(user),
  );
  const limits = user ? getPackageLimits(user) : getPackageLimits({ role: "admin" });
  const packageId = user
    ? resolveEffectivePackage(user)
    : ("gratuito" as const);

  const fetchUsage = React.useCallback(async () => {
    if (!enforced || !auth?.currentUser) {
      setEmpreendimentos(0);
      setAmbbotIncludedRemaining(limits.ambbotIncludedPerMonth);
      setAmbbotPrepaidCredits(0);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/package/usage", {
        headers: await getBearerApiHeaders(auth),
      });
      const data = await res.json();
      if (data?.usage) {
        setEmpreendimentos(data.usage.empreendimentos ?? 0);
        setAmbbotIncludedRemaining(data.usage.ambbotIncludedRemaining ?? 0);
        setAmbbotPrepaidCredits(data.usage.ambbotPrepaidCredits ?? 0);
      }
    } catch {
      // mantém último valor
    } finally {
      setLoading(false);
    }
  }, [auth, enforced, limits.ambbotIncludedPerMonth]);

  React.useEffect(() => {
    void fetchUsage();
  }, [fetchUsage, user?.package, user?.role]);

  return {
    loading,
    enforced,
    empreendimentos,
    limits,
    packageId,
    ambbotIncludedRemaining,
    ambbotPrepaidCredits,
    refresh: fetchUsage,
  };
}
