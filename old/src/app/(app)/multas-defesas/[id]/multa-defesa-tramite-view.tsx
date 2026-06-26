"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  FileDown,
  Lock,
  LockOpen,
  Save,
  CheckCircle2,
} from "lucide-react";
import { useCollection, useDoc, useFirebase, useMemoFirebase } from "@/firebase";
import { collection, doc, updateDoc } from "firebase/firestore";
import type { Empreendedor, Project } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { canManageAutoInfracaoDefesa } from "@/lib/role-guards";
import {
  MULTA_STATUS_LABELS,
  ORGAOS_AMBIENTAIS_MG,
  PRAZO_DEFESA_1_INSTANCIA_DIAS,
  formatPrazoDefesaLabel,
  inferMultaStatus,
} from "@/lib/multas-defesas";
import {
  MULTAS_DEFESAS_LIST_LABEL,
  MULTAS_DEFESAS_PATH,
} from "@/lib/multas-defesas-menu";
import type {
  AutoInfracaoDefesaRecord,
  DefesaAnexo,
  DefesaConteudo,
  MultaDefesaDocumentState,
  OrgaoAmbientalMg,
  ProtocoloMeio,
  TipoDefesa,
} from "@/lib/multas-defesas/types";
import type { PetitionModelId } from "@/lib/multas-defesas/petition-templates";
import {
  mergeMultaDefesaDocumentsSaved,
  MULTA_AUTO_ANEXO_DOC_ID,
} from "@/lib/multas-defesas/docs-template";
import {
  buildDefesaConteudoFromAuto,
  formatDefesaDocContent,
} from "@/lib/multas-defesas/format-defesa-doc";
import { inferMultaDefesaFase, STORAGE_PREFIX, formatProjectCoordinates } from "@/lib/multas-defesas/utils";
import { MultaDefesaAberturaAcoes } from "@/components/multas-defesas/multa-defesa-abertura-acoes";
import { MultaDefesaDocsPanel } from "@/components/multas-defesas/multa-defesa-docs-panel";
import { MultaDefesaPetitionPanel } from "@/components/multas-defesas/multa-defesa-petition-panel";
import { UploadPreparationDialog } from "@/components/shared/upload-preparation-dialog";
import { usePreparedUpload } from "@/hooks/use-prepared-upload";
import {
  uploadFileToStorage,
  sanitizeStorageFileName,
} from "@/lib/storage-upload";
import { effectiveMimeType } from "@/lib/file-mime";
import { useLocalBranding } from "@/hooks/use-local-branding";
import { guardBrandingExportFromHook } from "@/lib/pdf-branding-layout";
import { generateDefesaExportPdfBlob } from "@/lib/defesa/defesa-export-pdf";
import { generateDefesaExportDocxBlob } from "@/lib/defesa/defesa-export-docx";
const TIPOS_DEFESA: TipoDefesa[] = [
  "Defesa em 1º Instância / Administrativa",
  "Defesa em 2º Instância / Administrativa",
];

export function MultaDefesaTramiteView() {
  const params = useParams();
  const id = String(params?.id || "");
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const canWrite = canManageAutoInfracaoDefesa(user?.role);

  const defesaRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, "autoInfracaoDefesas", id) : null),
    [firestore, id],
  );
  const { data: record, isLoading } = useDoc<AutoInfracaoDefesaRecord>(defesaRef);

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "empreendedores") : null),
    [firestore],
  );
  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, "projects") : null),
    [firestore],
  );
  const { data: empreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const { data: projects } = useCollection<Project>(projectsQuery);

  const empreendedor = (empreendedores || []).find((e) => e.id === record?.empreendedorId);
  const project = (projects || []).find((p) => p.id === record?.projectId);

  const [isLocked, setIsLocked] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [uploadingDocId, setUploadingDocId] = React.useState<string | null>(null);
  const [conteudo, setConteudo] = React.useState<DefesaConteudo>({});
  const [documentos, setDocumentos] = React.useState<MultaDefesaDocumentState[]>([]);
  const [orgao, setOrgao] = React.useState<OrgaoAmbientalMg | "">("");
  const [tipoDefesa, setTipoDefesa] = React.useState<TipoDefesa | "">("");
  const [informacoesInternas, setInformacoesInternas] = React.useState("");
  const [modeloPeticaoId, setModeloPeticaoId] = React.useState<PetitionModelId>("supram_formal");
  const [protocoloMeio, setProtocoloMeio] = React.useState<ProtocoloMeio | "">("");
  const [protocoloUnidade, setProtocoloUnidade] = React.useState("");
  const [protocoloSei, setProtocoloSei] = React.useState("");
  const [protocoloAr, setProtocoloAr] = React.useState("");
  const [protocoloData, setProtocoloData] = React.useState("");
  const [cnrPaCap, setCnrPaCap] = React.useState("");
  const [cnrLinkPauta, setCnrLinkPauta] = React.useState("");

  const { prepareFile, dialogProps } = usePreparedUpload({
    storagePathPrefix: STORAGE_PREFIX,
  });

  const {
    data: brandingData,
    pdfImages,
    isPdfImagesLoading,
    hasBrandingUrls,
  } = useLocalBranding();

  React.useEffect(() => {
    if (!record) return;
    setConteudo(record.defesaConteudo || {});
    setDocumentos(
      mergeMultaDefesaDocumentsSaved(
        record.documentos,
        record.anexos,
        record.checklist,
      ),
    );
    setOrgao(record.orgaoAmbiental || "");
    setTipoDefesa(record.tipoDefesa || "Defesa em 1º Instância / Administrativa");
    setInformacoesInternas(record.informacoesInternas || "");
    setModeloPeticaoId((record.modeloPeticaoId as PetitionModelId) || "supram_formal");
    setProtocoloMeio(record.protocolo?.meio || "");
    setProtocoloUnidade(record.protocolo?.unidadeIndicadaNoAuto || "");
    setProtocoloSei(record.protocolo?.seiNumeroProcesso || "");
    setProtocoloAr(record.protocolo?.correiosAr || "");
    setProtocoloData(record.protocolo?.dataProtocolo || "");
    setCnrPaCap(record.cnr?.paCap || "");
    setCnrLinkPauta(record.cnr?.linkPautaRo || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync inicial só ao trocar de processo (record?.id)
  }, [record?.id]);

  const uploadDoc = async (docId: string, file: File) => {
    if (!record || !firestore) return;
    setUploadingDocId(docId);
    try {
      const prepared = await prepareFile(file);
      if (!prepared) return;
      const path = `${STORAGE_PREFIX}${record.processYear}/${docId}-${Date.now()}-${sanitizeStorageFileName(file.name)}`;
      const url = await uploadFileToStorage(prepared, path);
      const anexo: DefesaAnexo = {
        name: file.name,
        url,
        contentType: effectiveMimeType(file) || "application/octet-stream",
        documentId: docId,
      };
      const newAnexos = [...(record.anexos || []).filter((a) => a.documentId !== docId), anexo];
      const newDocs = documentos.map((d) =>
        d.id === docId
          ? { ...d, checked: true, fileName: file.name, fileUrl: url, contentType: anexo.contentType }
          : d,
      );
      await updateDoc(doc(firestore, "autoInfracaoDefesas", record.id), {
        anexos: newAnexos,
        documentos: newDocs,
      });
      setDocumentos(newDocs);
      toast({ title: "Documento anexado", description: file.name });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erro no upload" });
    } finally {
      setUploadingDocId(null);
    }
  };

  const saveTramite = async (extra?: Record<string, unknown>) => {
    if (!firestore || !record || !canWrite) return;
    setSaving(true);
    try {
      const fase = inferMultaDefesaFase({ ...record, tipoDefesa: tipoDefesa || record.tipoDefesa });
      await updateDoc(doc(firestore, "autoInfracaoDefesas", record.id), {
        defesaConteudo: conteudo,
        documentos,
        orgaoAmbiental: orgao || undefined,
        tipoDefesa: tipoDefesa || record.tipoDefesa,
        informacoesInternas: informacoesInternas.trim(),
        modeloPeticaoId,
        faseAtual: fase,
        protocolo: {
          orgao: orgao || undefined,
          unidadeIndicadaNoAuto: protocoloUnidade.trim(),
          meio: protocoloMeio || undefined,
          seiNumeroProcesso: protocoloSei.trim(),
          correiosAr: protocoloAr.trim(),
          dataProtocolo: protocoloData.trim(),
        },
        cnr: {
          paCap: cnrPaCap.trim(),
          linkPautaRo: cnrLinkPauta.trim(),
        },
        ...extra,
      });
      toast({ title: "Trâmite salvo" });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Erro ao salvar" });
    } finally {
      setSaving(false);
    }
  };

  const marcarDefesaConcluida = async () => {
    const merged = buildDefesaConteudoFromAuto(
      conteudo,
      empreendedor?.name || "",
      project?.propertyName || "",
      project,
    );
    setConteudo(merged);
    await saveTramite({
      status: "defesa_concluida",
      faseAtual: "protocolo",
      defesaConteudo: merged,
      documentos: documentos.map((d) =>
        d.id === "elab_peticao" ? { ...d, checked: true } : d,
      ),
    });
  };

  const preencherDoAuto = () => {
    const merged = buildDefesaConteudoFromAuto(
      {
        ...conteudo,
        empreendimentoCoordenadas:
          conteudo.empreendimentoCoordenadas || formatProjectCoordinates(project),
        empreendimentoCidade:
          conteudo.empreendimentoCidade ||
          project?.municipio ||
          empreendedor?.municipio ||
          "",
        empreendimentoAtividadePrincipal:
          conteudo.empreendimentoAtividadePrincipal || project?.activity || "",
      },
      empreendedor?.name || "",
      project?.propertyName || "",
      project,
    );
    if (empreendedor) {
      merged.enderecamentoQualificacao = [
        `Autuado: ${empreendedor.name}`,
        `CPF/CNPJ: ${empreendedor.cpfCnpj || "[INSERIR]"}`,
        `Endereço: ${empreendedor.address || "[INSERIR]"}`,
        `Município/UF: ${empreendedor.municipio || ""}${empreendedor.uf ? `/${empreendedor.uf}` : ""}`,
      ].join("\n");
    }
    setConteudo(merged);
    toast({ title: "Campos preenchidos a partir do auto e do cadastro" });
  };

  const exportPdf = async () => {
    if (!record) return;
    if (
      !guardBrandingExportFromHook({
        brandingData,
        pdfImages,
        isPdfImagesLoading,
        hasBrandingUrls,
        toast,
        formatLabel: "PDF",
      })
    ) {
      return;
    }
    const content = formatDefesaDocContent(
      { ...record, defesaConteudo: conteudo, documentos },
      empreendedor?.name || "N/A",
      project?.propertyName || "N/A",
    );
    const result = await generateDefesaExportPdfBlob(
      content,
      record,
      brandingData,
      pdfImages,
    );
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportDocx = async () => {
    if (!record || !pdfImages) return;
    if (
      !guardBrandingExportFromHook({
        brandingData,
        pdfImages,
        isPdfImagesLoading,
        hasBrandingUrls,
        toast,
        formatLabel: "Word",
      })
    ) {
      return;
    }
    const content = formatDefesaDocContent(
      { ...record, defesaConteudo: conteudo, documentos },
      empreendedor?.name || "N/A",
      project?.propertyName || "N/A",
    );
    const result = await generateDefesaExportDocxBlob(content, record, pdfImages);
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading || !record) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const status = inferMultaStatus(record);
  const fase = inferMultaDefesaFase(record);
  const prazoLabel = formatPrazoDefesaLabel(
    record.dataCientificacao,
    record.prazoDefesaDias ?? PRAZO_DEFESA_1_INSTANCIA_DIAS,
  );
  const isPj = (empreendedor?.cpfCnpj || "").replace(/\D/g, "").length > 11;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={`${record.processNumber}${conteudo.autoNumero ? ` · Auto ${conteudo.autoNumero}` : ""}`}
      >
        <Button variant="outline" size="sm" asChild>
          <Link href={MULTAS_DEFESAS_PATH}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            {MULTAS_DEFESAS_LIST_LABEL}
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={() => setIsLocked((v) => !v)}>
          {isLocked ? <Lock className="h-4 w-4" /> : <LockOpen className="h-4 w-4" />}
        </Button>
        <Button size="sm" disabled={saving || !canWrite} onClick={() => void saveTramite()}>
          <Save className="h-4 w-4 mr-1" />
          Salvar
        </Button>
      </PageHeader>

      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap gap-2">
              <Badge>{MULTA_STATUS_LABELS[status]}</Badge>
              <Badge variant="outline">Fase: {fase}</Badge>
              {record.dataCientificacao ? (
                <Badge variant="secondary">{prazoLabel}</Badge>
              ) : null}
            </div>
            <CardTitle className="text-lg mt-2">
              {empreendedor?.name} · {project?.propertyName}
            </CardTitle>
            <CardDescription>
              Trâmite de defesa administrativa — documentos a apensar vs. petição elaborada na
              plataforma.
            </CardDescription>
          </CardHeader>
        </Card>

        <Accordion type="multiple" defaultValue={["abertura", "instrucao", "elaboracao", "protocolo"]}>
          <AccordionItem value="abertura">
            <AccordionTrigger>Fase 0 — Abertura (auto e órgão)</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Órgão ambiental</Label>
                  <Select
                    value={orgao}
                    onValueChange={(v) => setOrgao(v as OrgaoAmbientalMg)}
                    disabled={isLocked || !canWrite}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
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
                  <Label>Tipo de defesa</Label>
                  <Select
                    value={tipoDefesa}
                    onValueChange={(v) => setTipoDefesa(v as TipoDefesa)}
                    disabled={isLocked || !canWrite}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_DEFESA.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Informações internas</Label>
                <Textarea
                  value={informacoesInternas}
                  onChange={(e) => setInformacoesInternas(e.target.value)}
                  disabled={isLocked || !canWrite}
                />
              </div>
              <MultaDefesaAberturaAcoes record={record} canWrite={canWrite} />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="instrucao">
            <AccordionTrigger>Fase 1 — Documentos a apensar</AccordionTrigger>
            <AccordionContent>
              <MultaDefesaDocsPanel
                documents={documentos}
                phaseFilter="instrucao"
                disabled={isLocked || !canWrite}
                uploadingDocId={uploadingDocId}
                onToggle={(docId, checked) =>
                  setDocumentos((prev) =>
                    prev.map((d) => (d.id === docId ? { ...d, checked } : d)),
                  )
                }
                onFileUpload={(docId, file) => void uploadDoc(docId, file)}
                opts={{ isPj, hasProcurador: true, requiresTaxaExpediente: false }}
              />
              <p className="text-xs text-muted-foreground mt-2">
                Vista do processo: solicite cópias com até 5 dias úteis (MG.gov). Anexe em
                «Cópias da vista».
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="elaboracao">
            <AccordionTrigger>Fase 2 — Elaborar petição na plataforma</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLocked || !canWrite}
                  onClick={preencherDoAuto}
                >
                  Preencher a partir do auto
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLocked || !canWrite}
                  onClick={() => void exportPdf()}
                >
                  <FileDown className="h-4 w-4 mr-1" />
                  PDF
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isLocked || !canWrite}
                  onClick={() => void exportDocx()}
                >
                  <FileDown className="h-4 w-4 mr-1" />
                  Word
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!canWrite || saving}
                  onClick={() => void marcarDefesaConcluida()}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Marcar defesa concluída
                </Button>
              </div>
              <MultaDefesaPetitionPanel
                conteudo={conteudo}
                disabled={isLocked || !canWrite}
                orgao={orgao}
                onChange={setConteudo}
                modeloPeticaoId={modeloPeticaoId}
                onModeloChange={setModeloPeticaoId}
              />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="protocolo">
            <AccordionTrigger>Fase 3 — Protocolo (SEI ou Correios)</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Meio de protocolo</Label>
                  <Select
                    value={protocoloMeio}
                    onValueChange={(v) => setProtocoloMeio(v as ProtocoloMeio)}
                    disabled={isLocked || !canWrite}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sei">SEI (eletrônico)</SelectItem>
                      <SelectItem value="correios_ar">Correios com AR</SelectItem>
                      <SelectItem value="presencial">Presencial na unidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Data do protocolo</Label>
                  <Input
                    type="date"
                    value={protocoloData}
                    onChange={(e) => setProtocoloData(e.target.value)}
                    disabled={isLocked || !canWrite}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label>Unidade indicada no auto</Label>
                  <Input
                    value={protocoloUnidade}
                    onChange={(e) => setProtocoloUnidade(e.target.value)}
                    disabled={isLocked || !canWrite}
                  />
                </div>
                {protocoloMeio === "sei" && (
                  <div className="space-y-1 md:col-span-2">
                    <Label>Nº processo SEI</Label>
                    <Input
                      value={protocoloSei}
                      onChange={(e) => setProtocoloSei(e.target.value)}
                      disabled={isLocked || !canWrite}
                    />
                  </div>
                )}
                {protocoloMeio === "correios_ar" && (
                  <div className="space-y-1 md:col-span-2">
                    <Label>Código AR / rastreio</Label>
                    <Input
                      value={protocoloAr}
                      onChange={(e) => setProtocoloAr(e.target.value)}
                      disabled={isLocked || !canWrite}
                    />
                  </div>
                )}
              </div>
              <MultaDefesaDocsPanel
                documents={documentos}
                phaseFilter="protocolo"
                disabled={isLocked || !canWrite}
                uploadingDocId={uploadingDocId}
                onToggle={(docId, checked) =>
                  setDocumentos((prev) =>
                    prev.map((d) => (d.id === docId ? { ...d, checked } : d)),
                  )
                }
                onFileUpload={(docId, file) => void uploadDoc(docId, file)}
                opts={{}}
              />
              <p className="text-xs text-muted-foreground">
                A defesa não tem efeito suspensivo (Dec. 47.383/2018, art. 47), salvo termo de
                compromisso.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="cnr">
            <AccordionTrigger>Fase 4 — CNR (última instância administrativa)</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Use apenas após decisão da defesa e interposição de recurso. Pautas: reuniões
                ordinárias da CNR no site da SEMAD.
              </p>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>PA/CAP</Label>
                  <Input
                    value={cnrPaCap}
                    onChange={(e) => setCnrPaCap(e.target.value)}
                    disabled={isLocked || !canWrite}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Link da pauta (RO CNR)</Label>
                  <Input
                    value={cnrLinkPauta}
                    onChange={(e) => setCnrLinkPauta(e.target.value)}
                    placeholder="https://semad.mg.gov.br/w/..."
                    disabled={isLocked || !canWrite}
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </main>
      <UploadPreparationDialog {...dialogProps} />
    </div>
  );
}
