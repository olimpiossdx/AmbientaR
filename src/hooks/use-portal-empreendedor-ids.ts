"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth, useFirestore } from "@/firebase";
import { fetchEmpreendedorIdsForRepresentative } from "@/lib/representative-empreendedor-ids";
import { fetchEmpreendedorIdsForClientGestao } from "@/lib/requests-portal-empreendedor-ids";
import { resolvePortalAuthUid } from "@/lib/auth-user-id";
import { isClientePortalRole } from "@/lib/role-guards";

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

    if (user.role === "client") {
      setIds(undefined);
      fetchEmpreendedorIdsForClientGestao(firestore, user)
        .then(setIds)
        .catch(() => setIds(["invalid-placeholder"]));
      return;
    }

    if (user.role === "cliente_autonomo") {
      setIds(undefined);
      const uid = resolvePortalAuthUid(user);
      if (!uid) {
        setIds(["invalid-placeholder"]);
        return;
      }
      const empreendedoresRef = collection(firestore, "empreendedores");
      const byUserId = query(empreendedoresRef, where("userId", "==", uid));
      const variants = [user.cpf || user.userCpf, ...(user.cnpjs || [])].filter(
        Boolean,
      ) as string[];
      const normalized = new Set<string>();
      variants.forEach((v) => {
        normalized.add(v);
        const d = v.replace(/\D/g, "");
        if (d.length >= 11) normalized.add(d);
      });
      const variantList = Array.from(normalized).slice(0, 10);
      const byCpf =
        variantList.length > 0
          ? query(empreendedoresRef, where("cpfCnpj", "in", variantList))
          : null;
      Promise.all([
        getDocs(byUserId),
        byCpf ? getDocs(byCpf) : Promise.resolve({ docs: [] }),
      ])
        .then(([snapU, snapCpf]) => {
          const merged = new Set<string>([
            ...snapU.docs.map((d) => d.id),
            ...snapCpf.docs.map((d) => d.id),
          ]);
          setIds(
            merged.size > 0 ? Array.from(merged) : ["invalid-placeholder"],
          );
        })
        .catch(() => setIds(["invalid-placeholder"]));
      return;
    }

    if (user.role === "representative") {
      setIds(undefined);
      fetchEmpreendedorIdsForRepresentative(firestore, user)
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
