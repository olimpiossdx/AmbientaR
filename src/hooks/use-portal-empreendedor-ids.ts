"use client";

import { useEffect, useState } from "react";
import { useAuth, useFirestore } from "@/firebase";
import { fetchEmpreendedorIdsForPortalScope } from "@/lib/portal-empreendedor-scope";
import { isClientePortalRole } from "@/lib/role-guards";
import type { AppUser } from "@/lib/types";

/**
 * IDs de empreendedores visíveis para Cliente Gestão, Cliente Autônomo ou Representante.
 * `undefined` = ainda a carregar; `[]` = perfil interno (sem filtro); array com ids = filtro ativo.
 */
export function usePortalEmpreendedorIds(): string[] | undefined {
  const { user } = useAuth();
  const firestore = useFirestore();
  const [ids, setIds] = useState<string[] | undefined>(undefined);

  useEffect(() => {
    if (!user || !firestore) {
      setIds(undefined);
      return;
    }

    if (
      user.role === "client" ||
      user.role === "cliente_autonomo" ||
      user.role === "representative" ||
      user.role === "consultor_representante"
    ) {
      setIds(undefined);
      fetchEmpreendedorIdsForPortalScope(firestore, user as AppUser)
        .then(setIds)
        .catch(() => setIds(["invalid-placeholder"]));
      return;
    }

    if (isClientePortalRole(user.role)) {
      setIds(["invalid-placeholder"]);
      return;
    }

    setIds([]);
  }, [user, firestore]);

  return ids;
}
