"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Upload } from "lucide-react";
import { BrDateFormControl } from "@/components/form/br-date-input";
import { useToast } from "@/hooks/use-toast";
import type { Empreendedor } from "@/lib/types";
import { useFirebase, errorEmitter } from "@/firebase";
import { FirestorePermissionError } from "@/firebase/errors";
import { doc, updateDoc } from "firebase/firestore";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { UploadPreparationDialog } from "@/components/shared/upload-preparation-dialog";
import { useStorageFileUpload } from "@/hooks/use-storage-file-upload";
import { AttachmentPreviewSection } from "@/components/shared/attachment-preview-section";
import { NOTIFICATION_LINKS, NOTIFICATION_SOURCE } from "@/lib/notification-events";
import { notifyEmpreendedorPortalUsers } from "@/lib/notifications";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { pickCtfIbamaSyncFields } from "@/lib/ctf-ibama-utils";
import { syncCtfIbamaToLinkedClients } from "@/lib/sync-ctf-ibama-to-client";

const formSchema = z.object({
  ctfIbama: z.string().optional(),
  certificadoValidade: z.date().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

type UploadKind = "cartao" | "certificado";

interface CtfIbamaFormProps {
  empreendedor: Empreendedor;
  canWrite: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

function parseIsoDate(value?: string): Date | undefined {
  if (!value?.trim()) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function isoFromDate(value?: Date | null): string {
  if (!value) return "";
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function CtfIbamaForm({
  empreendedor,
  canWrite,
  onSuccess,
  onCancel,
}: CtfIbamaFormProps) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const uploadKindRef = React.useRef<UploadKind>("cartao");
  const { uploadFile, dialogProps } = useStorageFileUpload({
    storageFolder: "ctf-ibama",
    storagePathPrefix: "ctf-ibama/",
    buildStoragePath: (_file, safe) =>
      `${uploadKindRef.current}/${empreendedor.id}/${Date.now()}-${safe}`,
  });

  const [cartaoUrl, setCartaoUrl] = React.useState(empreendedor.ctfIbamaCartaoUrl || "");
  const [certificadoUrl, setCertificadoUrl] = React.useState(
    empreendedor.ctfIbamaCertificadoUrl || "",
  );
  const [uploadingCartao, setUploadingCartao] = React.useState(false);
  const [uploadingCertificado, setUploadingCertificado] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ctfIbama: empreendedor.ctfIbama || "",
      certificadoValidade: parseIsoDate(empreendedor.ctfIbamaCertificadoValidade),
    },
  });

  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    kind: UploadKind,
  ) => {
    if (!canWrite) return;
    const inputEl = event.currentTarget;
    const file = inputEl.files?.[0];
    if (!file) return;
    inputEl.value = "";

    const setUploading = kind === "cartao" ? setUploadingCartao : setUploadingCertificado;
    const setUrl = kind === "cartao" ? setCartaoUrl : setCertificadoUrl;

    try {
      setUploading(true);
      uploadKindRef.current = kind;
      const url = await uploadFile(file);
      if (!url) return;
      setUrl(url);
      toast({
        title: kind === "cartao" ? "Cartão enviado" : "Certificado enviado",
        description: "Arquivo carregado. Salve para vincular ao cadastro.",
      });
    } catch (error) {
      console.error("Erro no upload CTF/IBAMA:", error);
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: "Não foi possível enviar o arquivo.",
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    if (!canWrite) {
      toast({
        variant: "destructive",
        title: "Sem permissão",
        description: "Você não pode alterar os documentos CTF/IBAMA.",
      });
      return;
    }
    if (!firestore || !user) {
      toast({ variant: "destructive", title: "Erro de autenticação." });
      return;
    }

    if (certificadoUrl.trim() && !values.certificadoValidade) {
      toast({
        variant: "destructive",
        title: "Informe a validade",
        description: "Ao carregar o certificado, informe a data de vencimento.",
      });
      return;
    }

    setSaving(true);
    const now = new Date().toISOString();
    const empreendedorRef = doc(firestore, "empreendedores", empreendedor.id);

    const payload: Record<string, string> = {
      ctfIbama: values.ctfIbama?.trim() || "",
      ctfIbamaCartaoUrl: cartaoUrl.trim(),
      ctfIbamaCertificadoUrl: certificadoUrl.trim(),
      ctfIbamaCertificadoValidade: isoFromDate(values.certificadoValidade),
    };

    if (cartaoUrl.trim() && cartaoUrl !== (empreendedor.ctfIbamaCartaoUrl || "")) {
      payload.ctfIbamaCartaoUpdatedAt = now;
    } else if (empreendedor.ctfIbamaCartaoUpdatedAt) {
      payload.ctfIbamaCartaoUpdatedAt = empreendedor.ctfIbamaCartaoUpdatedAt;
    }

    if (
      certificadoUrl.trim() &&
      certificadoUrl !== (empreendedor.ctfIbamaCertificadoUrl || "")
    ) {
      payload.ctfIbamaCertificadoUpdatedAt = now;
    } else if (empreendedor.ctfIbamaCertificadoUpdatedAt) {
      payload.ctfIbamaCertificadoUpdatedAt = empreendedor.ctfIbamaCertificadoUpdatedAt;
    }

    try {
      await updateDoc(empreendedorRef, payload);
      await syncCtfIbamaToLinkedClients(
        firestore,
        empreendedor,
        pickCtfIbamaSyncFields(payload),
      );
      try {
        await notifyEmpreendedorPortalUsers(
          firestore,
          empreendedor.id,
          {
            title: "Documentos CTF/IBAMA atualizados",
            description: `Cadastro de ${empreendedor.name} em Documentos Ambientais.`,
            link: NOTIFICATION_LINKS.ctfIbama,
            sourceType: NOTIFICATION_SOURCE.ctf_ibama,
            sourceId: `${empreendedor.id}_${Date.now()}`,
            actorRole: user.role,
          },
          { excludeUserId: user.uid },
        );
      } catch (notifyErr) {
        console.warn("[CTF/IBAMA] notificação:", notifyErr);
      }
      toast({
        title: "CTF/IBAMA salvo",
        description: "Cartão e certificado vinculados ao empreendedor.",
      });
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar CTF/IBAMA:", error);
      const permissionError = new FirestorePermissionError({
        path: empreendedorRef.path,
        operation: "update",
        requestResourceData: payload,
      });
      errorEmitter.emit("permission-error", permissionError);
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: "Verifique suas permissões de escrita.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>CTF/IBAMA — {empreendedor.name}</DialogTitle>
        <DialogDescription>
          Carregue o Cartão de Cadastro e o Certificado de Regularidade do IBAMA.
          O certificado pode ser atualizado quando houver renovação.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="ctfIbama"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número do CTF/IBAMA</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Ex.: 7358652"
                    disabled={!canWrite}
                  />
                </FormControl>
                <FormDescription>
                  Cadastro Técnico Federal exibido no cartão e no certificado.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-base">1. Cartão de Cadastro</Label>
              {canWrite && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={uploadingCartao}
                  asChild
                >
                  <label className="cursor-pointer">
                    {uploadingCartao ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {cartaoUrl ? "Substituir cartão" : "Carregar cartão"}
                    <input
                      type="file"
                      className="sr-only"
                      accept=".pdf,image/*"
                      onChange={(e) => handleUpload(e, "cartao")}
                    />
                  </label>
                </Button>
              )}
            </div>
            <AttachmentPreviewSection
              fileUrl={cartaoUrl}
              emptyLabel="Nenhum cartão de cadastro enviado."
              sectionLabel="Arquivo do cartão (PDF ou imagem)"
              zoomTitle="Cartão de Cadastro CTF/IBAMA"
            />
          </div>

          <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-base">2. Certificado de Regularidade</Label>
              {canWrite && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  disabled={uploadingCertificado}
                  asChild
                >
                  <label className="cursor-pointer">
                    {uploadingCertificado ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {certificadoUrl ? "Atualizar certificado" : "Carregar certificado"}
                    <input
                      type="file"
                      className="sr-only"
                      accept=".pdf,image/*"
                      onChange={(e) => handleUpload(e, "certificado")}
                    />
                  </label>
                </Button>
              )}
            </div>
            <AttachmentPreviewSection
              fileUrl={certificadoUrl}
              emptyLabel="Nenhum certificado de regularidade enviado."
              sectionLabel="Arquivo do certificado (PDF ou imagem)"
              zoomTitle="Certificado de Regularidade CTF/IBAMA"
            />
            <FormField
              control={form.control}
              name="certificadoValidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Validade do certificado</FormLabel>
                  <BrDateFormControl
                    value={field.value}
                    onChange={field.onChange}
                    asDate
                    disabled={!canWrite}
                  />
                  <FormDescription>
                    Obrigatória quando houver certificado carregado.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onCancel}>
              {canWrite ? "Cancelar" : "Fechar"}
            </Button>
            {canWrite && (
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            )}
          </DialogFooter>
        </form>
      </Form>

      <UploadPreparationDialog {...dialogProps} />
    </>
  );
}
