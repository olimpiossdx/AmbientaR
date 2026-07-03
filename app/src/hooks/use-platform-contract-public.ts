"use client";

import { useMemoFirebase, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { useFirebase } from "@/firebase";
import type { PlatformContractPublic } from "@/lib/types";
import { PLATFORM_CONTRACT_PUBLIC_SETTING_ID } from "@/lib/platform-company";

/** Dados públicos da empresa ativa (contrato de cadastro e pagamento). */
export function usePlatformContractPublic() {
  const { firestore } = useFirebase();

  const docRef = useMemoFirebase(
    () =>
      firestore
        ? doc(firestore, "companySettings", PLATFORM_CONTRACT_PUBLIC_SETTING_ID)
        : null,
    [firestore],
  );

  const { data, isLoading, error } = useDoc<PlatformContractPublic>(docRef);

  return {
    platformCompany: data ?? null,
    isLoading,
    error,
  };
}
