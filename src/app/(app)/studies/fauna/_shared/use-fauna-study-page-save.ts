"use client";

import { useRouter } from "next/navigation";
import { useFirebase, errorEmitter } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { FirestorePermissionError } from "@/firebase/errors";
import { saveFaunaStudy } from "@/lib/fauna-study-save";
import type { FaunaStudy } from "@/lib/types";

export function useFaunaStudyPageSave(studyType: FaunaStudy["studyType"]) {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  return async (
    data: Record<string, unknown> & { id?: string },
    status: "draft" | "completed",
    successTitle?: string,
  ) => {
    if (!firestore) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Serviço de banco de dados indisponível.",
      });
      return;
    }

    try {
      await saveFaunaStudy(firestore, data, studyType, status);
      toast({
        title: successTitle || (data.id ? "Atualizado" : "Criado"),
        description: `Salvo como ${status === "draft" ? "rascunho" : "concluído"}.`,
      });
      router.push("/studies/fauna");
    } catch (error) {
      console.error("Error saving fauna study:", error);
      const path = data.id ? `faunaStudies/${data.id}` : "faunaStudies";
      errorEmitter.emit(
        "permission-error",
        new FirestorePermissionError({
          path,
          operation: data.id ? "update" : "create",
          requestResourceData: { ...data, studyType, status },
        }),
      );
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Não foi possível salvar. Verifique suas permissões.",
      });
    }
  };
}
