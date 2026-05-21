"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { MULTAS_DEFESAS_PATH } from "@/lib/multas-defesas";

/** Redireciona URL legada para o módulo Multas e Defesas. */
export default function AutosInfracaoDefesaRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(MULTAS_DEFESAS_PATH);
  }, [router]);
  return (
    <div className="flex h-[40vh] items-center justify-center gap-2 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      Redirecionando para Multas e Defesas…
    </div>
  );
}
