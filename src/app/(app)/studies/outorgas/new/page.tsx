"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OutorgaModoUsoPicker } from "@/components/outorgas/outorga-modo-uso-picker";
import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirebase, errorEmitter } from "@/firebase";
import { FirestorePermissionError } from "@/firebase/errors";
import { collection, addDoc } from "firebase/firestore";
import { buildInitialOutorgaProcesso } from "@/lib/outorga-processo";
import { stripUndefinedDeep } from "@/lib/firestore-payload";
import type { OutorgaModoUsoDef } from "@/lib/outorga-mg-catalog";

function NewOutorgaPageContent() {
  const router = useRouter();
  const { toast } = useToast();
  const { firestore, user } = useFirebase();
  const [selected, setSelected] = React.useState<OutorgaModoUsoDef | null>(
    null,
  );
  const [creating, setCreating] = React.useState(false);

  const handleConfirm = async () => {
    if (!selected || !firestore || !user) {
      toast({
        variant: "destructive",
        title: "Sessão inválida",
        description: "Faça login novamente para iniciar o processo.",
      });
      return;
    }
    setCreating(true);
    const payload = buildInitialOutorgaProcesso(selected.codigo, {
      createdBy: user.uid,
    });
    try {
      const ref = await addDoc(
        collection(firestore, "outorga_processos"),
        stripUndefinedDeep(payload),
      );
      toast({
        title: "Processo iniciado",
        description: `Modo de uso ${selected.codigo} — ${selected.label}`,
      });
      router.push(`/studies/outorgas/processo/${ref.id}`);
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code?: string }).code)
          : "";
      if (code === "permission-denied") {
        errorEmitter.emit(
          "permission-error",
          new FirestorePermissionError({
            path: "outorga_processos",
            operation: "create",
            requestResourceData: payload,
          }),
        );
        toast({
          variant: "destructive",
          title: "Permissão negada",
          description:
            "Publique as regras Firestore (npm run deploy:rules) ou confira o perfil do usuário em users/{uid}.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao criar processo",
          description:
            err instanceof Error ? err.message : "Tente novamente.",
        });
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Nova outorga — escolha o modo de uso" />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-3xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tabela 01 — Códigos IGAM (MG)</CardTitle>
              <CardDescription>
                O primeiro passo é selecionar o código do serviço conforme a
                Portaria IGAM 48/2019. Em seguida você preenche o processo até
                o protocolo no SOUT.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OutorgaModoUsoPicker
                selectedCodigo={selected?.codigo}
                onSelect={setSelected}
              />
            </CardContent>
          </Card>

          {selected && (
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/studies/outorgas")}
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirm} disabled={creating}>
                {creating && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                Continuar com código {selected.codigo}
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function NewOutorgaPage() {
  return (
    <Suspense fallback={<div className="p-6">Carregando...</div>}>
      <NewOutorgaPageContent />
    </Suspense>
  );
}
