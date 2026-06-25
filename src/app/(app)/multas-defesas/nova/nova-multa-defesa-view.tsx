"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload } from "lucide-react";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import type { Empreendedor, Project } from "@/lib/types";
import { filterProjectsByEmpreendedorId } from "@/lib/processos-form-order";
import {
  MULTAS_DEFESAS_LIST_LABEL,
  MULTAS_DEFESAS_NOVA_LABEL,
  MULTAS_DEFESAS_PATH,
  multasDefesasTramitePath,
} from "@/lib/multas-defesas-menu";
import {
  ORGAOS_AMBIENTAIS_MG,
  PRAZO_DEFESA_1_INSTANCIA_DIAS,
} from "@/lib/multas-defesas";
import { getNextProcessNumber, STORAGE_PREFIX } from "@/lib/multas-defesas/utils";
import type { DefesaAnexo, OrgaoAmbientalMg } from "@/lib/multas-defesas/types";
import { MULTA_AUTO_ANEXO_DOC_ID } from "@/lib/multas-defesas/docs-template";
import { currencyNumberToStoredBRL, todayIsoDate } from "@/lib/br-format";
import { BrDateInput } from "@/components/form/br-date-input";
import { BrlCurrencyInput } from "@/components/form/brl-currency-input";
import { useToast } from "@/hooks/use-toast";
import { effectiveMimeType } from "@/lib/file-mime";
import {
  uploadFileToStorage,
  sanitizeStorageFileName,
} from "@/lib/storage-upload";
import { UploadPreparationDialog } from "@/components/shared/upload-preparation-dialog";
import { usePreparedUpload } from "@/hooks/use-prepared-upload";
import {
  formatUploadLimitMb,
  getUploadMaxBytes,
} from "@/lib/upload-limits";
import { NOTIFICATION_LINKS, NOTIFICATION_SOURCE } from "@/lib/notification-events";
import { notifyEmpreendedorPortalUsers } from "@/lib/notifications";
import { getExt, AUTO_MULTA_ACCEPTED_EXTENSIONS } from "@/lib/multas-defesas/utils";

const AUTO_MULTA_UPLOAD_CONTEXT = { storagePathPrefix: "autos-infracao-defesa/" as const };

function isAcceptedAutoMultaFile(file: File): boolean {
  const ext = getExt(file.name);
  if (AUTO_MULTA_ACCEPTED_EXTENSIONS.includes(ext)) return true;
  const mime = effectiveMimeType(file);
  return mime === "application/pdf" || mime.startsWith("image/");
}

export function NovaMultaDefesaView() {
  const router = useRouter();
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const { prepareFile, dialogProps } = usePreparedUpload({
    storagePathPrefix: STORAGE_PREFIX,
  });

  const [empreendedorId, setEmpreendedorId] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [orgao, setOrgao] = React.useState<OrgaoAmbientalMg | "">("");
  const [dataCientificacao, setDataCientificacao] = React.useState(() => todayIsoDate());
  const [autoNumero, setAutoNumero] = React.useState("");
  const [valorReais, setValorReais] = React.useState(0);
  const [relato, setRelato] = React.useState("");
  const [observacoes, setObservacoes] = React.useState("");
  const [informacoesInternas, setInformacoesInternas] = React.useState("");
  const [autoArquivos, setAutoArquivos] = React.useState<File[]>([]);
  const [saving, setSaving] = React.useState(false);

  const defesasQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "autoInfracaoDefesas") : null),
    [firestore],
  );
  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "empreendedores") : null),
    [firestore],
  );
  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "projects") : null),
    [firestore],
  );

  const { data: defesas } = useCollection<{ processYear: number; processSequence?: number }>(
    defesasQuery,
  );
  const { data: empreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const { data: projects } = useCollection<Project>(projectsQuery);

  const filteredProjects = React.useMemo(
    () => filterProjectsByEmpreendedorId(projects, empreendedorId),
    [projects, empreendedorId],
  );

  const multaUploadMaxBytes = React.useMemo(
    () => getUploadMaxBytes(AUTO_MULTA_UPLOAD_CONTEXT),
    [],
  );
  const multaUploadLimitMb = React.useMemo(
    () => formatUploadLimitMb(AUTO_MULTA_UPLOAD_CONTEXT),
    [],
  );

  const handleAutoFiles = (files: FileList | null) => {
    if (!files) return;
    const valid: File[] = [];
    for (const f of Array.from(files)) {
      if (!isAcceptedAutoMultaFile(f)) {
        toast({
          variant: "destructive",
          title: "Formato não permitido",
          description: `${f.name}: use PDF ou imagem.`,
        });
        continue;
      }
      if (f.size > multaUploadMaxBytes) {
        toast({
          variant: "destructive",
          title: "Arquivo muito grande",
          description: `Limite ${multaUploadLimitMb}.`,
        });
        continue;
      }
      valid.push(f);
    }
    setAutoArquivos(valid);
  };

  const save = async () => {
    if (!firestore || !user) return;
    if (!empreendedorId || !projectId || !dataCientificacao) {
      toast({
        variant: "destructive",
        title: "Preencha empreendedor, empreendimento e data de cientificação.",
      });
      return;
    }
    setSaving(true);
    try {
      const year = new Date().getFullYear();
      const { sequence, processNumber } = getNextProcessNumber(defesas || [], year);
      const anexos: DefesaAnexo[] = [];
      let idx = 0;
      for (const file of autoArquivos) {
        const prepared = await prepareFile(file);
        if (!prepared) throw new Error("Upload cancelado.");
        const path = `${STORAGE_PREFIX}${year}/auto-${Date.now()}-${idx++}-${sanitizeStorageFileName(file.name)}`;
        const url = await uploadFileToStorage(prepared, path);
        anexos.push({
          name: file.name,
          url,
          contentType: effectiveMimeType(file) || "application/octet-stream",
          documentId: MULTA_AUTO_ANEXO_DOC_ID,
          checklistItemId: "auto_infracao",
        });
      }

      const ref = await addDoc(collection(firestore, "autoInfracaoDefesas"), {
        empreendedorId,
        projectId,
        processNumber,
        processYear: year,
        processSequence: sequence,
        status: "aguardando_opcao",
        faseAtual: "abertura",
        orgaoAmbiental: orgao || undefined,
        dataCientificacao,
        prazoDefesaDias: PRAZO_DEFESA_1_INSTANCIA_DIAS,
        observacoes: observacoes.trim(),
        informacoesInternas: informacoesInternas.trim(),
        defesaConteudo: {
          autoNumero: autoNumero.trim(),
          autoValorMulta: currencyNumberToStoredBRL(valorReais),
          autoRelatoFiscal: relato.trim(),
        },
        checklist: [],
        anexos,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });

      try {
        await notifyEmpreendedorPortalUsers(
          firestore,
          empreendedorId,
          {
            title: "Nova multa registrada",
            description: `Processo ${processNumber}. Consulte Multas e Defesas.`,
            link: NOTIFICATION_LINKS.multasDefesas,
            sourceType: NOTIFICATION_SOURCE.multa_defesa,
            sourceId: ref.id,
            actorRole: user.role,
          },
          { excludeUserId: user.uid },
        );
      } catch {
        /* notificação opcional */
      }

      toast({ title: "Multa registrada", description: processNumber });
      router.push(multasDefesasTramitePath(ref.id));
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erro ao registrar multa" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={MULTAS_DEFESAS_NOVA_LABEL}>
        <Button variant="outline" size="sm" asChild>
          <Link href={MULTAS_DEFESAS_PATH}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {MULTAS_DEFESAS_LIST_LABEL}
          </Link>
        </Button>
      </PageHeader>
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Registrar multa após cientificação</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Empreendedor</Label>
                <Select
                  value={empreendedorId}
                  onValueChange={(v) => {
                    setEmpreendedorId(v);
                    setProjectId("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {(empreendedores || []).map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Empreendimento</Label>
                <Select value={projectId} onValueChange={setProjectId} disabled={!empreendedorId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.propertyName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Órgão autuador</Label>
                <Select value={orgao} onValueChange={(v) => setOrgao(v as OrgaoAmbientalMg)}>
                  <SelectTrigger>
                    <SelectValue placeholder="SEMAD, FEAM…" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORGAOS_AMBIENTAIS_MG.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Data de cientificação</Label>
                <BrDateInput value={dataCientificacao} onChange={setDataCientificacao} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Nº do auto</Label>
              <Input value={autoNumero} onChange={(e) => setAutoNumero(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Valor da multa (R$)</Label>
              <BrlCurrencyInput value={valorReais} onChange={setValorReais} />
            </div>
            <div className="space-y-1">
              <Label>Relato fiscal (resumo)</Label>
              <Textarea value={relato} onChange={(e) => setRelato(e.target.value)} rows={3} />
            </div>
            <div className="space-y-1">
              <Label>Cópia do auto (PDF ou foto)</Label>
              <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple onChange={(e) => handleAutoFiles(e.target.files)} />
            </div>
            <div className="space-y-1">
              <Label>Informações internas</Label>
              <Textarea value={informacoesInternas} onChange={(e) => setInformacoesInternas(e.target.value)} />
            </div>
            <Button className="gap-2" disabled={saving} onClick={() => void save()}>
              <Upload className="h-4 w-4" />
              {saving ? "Salvando…" : "Registrar e abrir trâmite"}
            </Button>
          </CardContent>
        </Card>
      </main>
      <UploadPreparationDialog {...dialogProps} />
    </div>
  );
}
