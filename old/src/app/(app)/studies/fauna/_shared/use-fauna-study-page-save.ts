"use client";

import { useRouter } from "next/navigation";
import { useFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { saveFaunaStudy } from "@/lib/fauna-study-save";
import { handleFirestoreFormError } from "@/lib/firestore-form-errors";
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
        description: "Serviço de banco de dados indisponível."});
      return;
    }

    try {
      await saveFaunaStudy(firestore, data, studyType, status);
      toast({
        title: successTitle || (data.id ? "Atualizado" : "Criado"),
        description: `Salvo como ${status === "draft" ? "rascunho" : "concluído"}.`});
      router.push("/studies/fauna");
    } catch (error) {
      const path = data.id ? `faunaStudies/${data.id}` : "faunaStudies";
      handleFirestoreFormError(error, {
        toast,
        title: "Erro ao salvar",
        context: {
          path,
          operation: data.id ? "update" : "create",
          requestResourceData: { ...data, studyType, status }}});
    }
  };
}
