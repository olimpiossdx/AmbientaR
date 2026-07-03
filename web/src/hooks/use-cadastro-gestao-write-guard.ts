"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/firebase";
import { isCadastroReadOnlyClienteGestao } from "@/lib/role-guards";
import { useToast } from "@/hooks/use-toast";

/**
 * Cliente Gestão: cadastro só leitura na UI. Bloqueia rotas de novo/editar e redireciona à lista.
 */
export function useCadastroGestaoWriteGuard(listHref: string) {
  const router = useRouter();
  const { user, isInitialized } = useAuth();
  const { toast } = useToast();

  const blocked =
    Boolean(isInitialized && user && isCadastroReadOnlyClienteGestao(user.role));

  useEffect(() => {
    if (!blocked) return;
    toast({
      variant: "destructive",
      title: "Modo apenas leitura",
      description:
        "O perfil Cliente Gestão consulta cadastros na plataforma; alterações são feitas pela consultoria.",
    });
    router.replace(listHref);
  }, [blocked, listHref, router, toast]);

  return { blocked, isInitialized };
}
