"use client";

import * as React from "react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  PlusCircle,
  Upload,
  Eye,
  Lock,
  LockOpen,
  Save,
  FileDown,
  Pencil,
  Trash2,
  Clock,
  Gavel,
  Banknote,
  MessageSquare,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CardSearchInput } from "@/components/card-search-input";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { isAdminRole } from "@/lib/role-guards";
import { collection, addDoc, doc, serverTimestamp, updateDoc, deleteDoc } from "firebase/firestore";
import { effectiveMimeType } from "@/lib/file-mime";
import {
  uploadFileToStorage,
  sanitizeStorageFileName,
} from "@/lib/storage-upload";
import { UploadPreparationDialog } from "@/components/shared/upload-preparation-dialog";
import { usePreparedUpload } from "@/hooks/use-prepared-upload";
import type { Empreendedor, Project } from "@/lib/types";
import { filterProjectsByEmpreendedorId } from "@/lib/processos-form-order";
import {
  DECISAO_ENCERRAMENTO_LABELS,
  MULTAS_E_DEFESAS_MENU_LABEL,
  MULTA_STATUS_LABELS,
  PRAZO_DEFESA_1_INSTANCIA_DIAS,
  type DecisaoEncerramentoTipo,
  type MultaDefesaFluxo,
  type MultaDefesaStatus,
  diasCorridosRestantesDefesa,
  formatPrazoDefesaLabel,
  inferMultaStatus,
  isMultaComPrazoEmAberto,
} from "@/lib/multas-defesas";
import { currencyNumberToStoredBRL, todayIsoDate } from "@/lib/br-format";
import { BrDateInput } from "@/components/form/br-date-input";
import { BrlCurrencyInput } from "@/components/form/brl-currency-input";
import {
  formatBytesHuman,
  formatUploadLimitMb,
  getUploadMaxBytes,
} from "@/lib/upload-limits";
import { NOTIFICATION_LINKS, NOTIFICATION_SOURCE } from "@/lib/notification-events";
import { notifyEmpreendedorPortalUsers } from "@/lib/notifications";
import { useLocalBranding } from "@/hooks/use-local-branding";
import { guardBrandingExportFromHook } from "@/lib/pdf-branding-layout";
import { generateDefesaExportPdfBlob } from "@/lib/defesa/defesa-export-pdf";
import { generateDefesaExportDocxBlob } from "@/lib/defesa/defesa-export-docx";

type TipoDefesa = "Defesa em 1º Instância / Administrativa" | "Defesa em 2º Instância / Administrativa";

type ChecklistItem = {
  id: string;
  label: string;
};

type DefesaAnexo = {
  name: string;
  url: string;
  contentType: string;
  checklistItemId?: string;
};

type AutoInfracaoDefesa = MultaDefesaFluxo & {
  id: string;
  empreendedorId: string;
  projectId: string;
  processNumber: string;
  processYear: number;
  processSequence: number;
  tipoDefesa?: TipoDefesa;
  observacoes?: string;
  informacoesInternas?: string;
  defesaConteudo?: {
    autoNumero?: string;
    autoCodigo?: string;
    autoArtigoBase?: string;
    autoRelatoFiscal?: string;
    autoValorMulta?: string;
    autoMedidaCautelar?: string;
    autoDataFato?: string;
    empreendimentoCoordenadas?: string;
    empreendimentoCidade?: string;
    empreendimentoAtividadePrincipal?: string;
    empreendimentoNumeroLicenca?: string;
    laudoNumero?: string;
    laudoTrechoTecnico?: string;
    enderecamentoQualificacao?: string;
    referenciaAutoProcesso?: string;
    sinteseAuto?: string;
    preliminaresNulidades?: string;
    decadenciaPrescricao?: string;
    meritoInexistenciaFato?: string;
    meritoAtipicidade?: string;
    meritoAusenciaAutoria?: string;
    meritoRegularidadeAtividade?: string;
    atenuantes?: string;
    conversaoMulta?: string;
    pedidos?: string;
  };
  checklist?: Array<{ itemId: string; checked: boolean }>;
  anexos?: DefesaAnexo[];
  createdAt: any;
  createdBy?: string;
};

const TIPOS_DEFESA: TipoDefesa[] = [
  "Defesa em 1º Instância / Administrativa",
  "Defesa em 2º Instância / Administrativa",
];

const CHECKLIST_DECRETO_47383: ChecklistItem[] = [
  { id: "qualificacao", label: "Qualificação do autuado e identificação do Auto de Infração" },
  { id: "fatos", label: "Exposição dos fatos e fundamentos da defesa" },
  { id: "provas", label: "Documentos e provas que sustentam a defesa" },
  { id: "pedidos", label: "Pedidos objetivos (anulação, revisão, redução, etc.)" },
  { id: "procuracao", label: "Procuração ou documento de representação (quando aplicável)" },
  { id: "assinatura", label: "Assinatura e identificação do responsável pela peça" },
];

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".jpg", ".jpeg", ".png"];

/** Anexo do auto na etapa «Registrar multa» (PDF ou foto). */
const MULTA_AUTO_ANEXO_ID = "auto_infracao";

const AUTO_MULTA_ACCEPTED_EXTENSIONS = [
  ".pdf",
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".heic",
  ".heif",
];

const AUTO_MULTA_UPLOAD_CONTEXT = { storagePathPrefix: "autos-infracao-defesa/" as const };

function getExt(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

function isAcceptedFile(file: File): boolean {
  return ACCEPTED_EXTENSIONS.includes(getExt(file.name));
}

function isAcceptedAutoMultaFile(file: File): boolean {
  const ext = getExt(file.name);
  if (AUTO_MULTA_ACCEPTED_EXTENSIONS.includes(ext)) return true;
  const mime = effectiveMimeType(file);
  return mime === "application/pdf" || mime.startsWith("image/");
}

function getNextProcessNumber(existing: AutoInfracaoDefesa[], year: number): { sequence: number; processNumber: string } {
  const maxSeq = existing
    .filter((d) => d.processYear === year)
    .reduce((acc, item) => Math.max(acc, Number(item.processSequence || 0)), 0);
  const sequence = maxSeq + 1;
  return { sequence, processNumber: `${String(sequence).padStart(4, "0")}/${year}` };
}

function formatProjectCoordinates(project?: Project | null): string {
  if (!project?.geographicLocation) return "";
  const geo = project.geographicLocation;
  if (geo.format === "UTM" && geo.utm) {
    const x = geo.utm.x || "";
    const y = geo.utm.y || "";
    const fuso = geo.utm.fuso || "";
    const parts = [
      x ? `X: ${x}` : "",
      y ? `Y: ${y}` : "",
      fuso ? `Fuso: ${fuso}` : "",
    ].filter(Boolean);
    return parts.length > 0 ? `UTM ${parts.join(" | ")}` : "";
  }
  if (geo.format === "Lat/Long" && geo.latLong) {
    const lat = geo.latLong.lat || {};
    const lng = geo.latLong.long || {};
    const latTxt = [lat.grau, lat.min, lat.seg].filter(Boolean).join(" ");
    const lngTxt = [lng.grau, lng.min, lng.seg].filter(Boolean).join(" ");
    const parts = [
      latTxt ? `Lat: ${latTxt}` : "",
      lngTxt ? `Long: ${lngTxt}` : "",
    ].filter(Boolean);
    return parts.join(" | ");
  }
  return "";
}

function valueOrPlaceholder(value: string | undefined, placeholder: string): string {
  const normalized = (value || "").trim();
  return normalized.length > 0 ? normalized : placeholder;
}

function getDefesaResumoText(defesa: AutoInfracaoDefesa): string | null {
  const interno = (defesa.informacoesInternas || "").trim();
  if (interno) return interno;
  const sintese = (defesa.defesaConteudo?.sinteseAuto || "").trim();
  return sintese || null;
}

function getDefesaSinteseAuto(defesa: AutoInfracaoDefesa): string | null {
  const sintese = (defesa.defesaConteudo?.sinteseAuto || "").trim();
  const interno = (defesa.informacoesInternas || "").trim();
  if (!sintese || sintese === interno) return null;
  return sintese;
}

function getDefesaMotivosInfracao(defesa: AutoInfracaoDefesa): string | null {
  const c = defesa.defesaConteudo || {};
  const linhas: string[] = [];
  const numero = (c.autoNumero || "").trim();
  const codigo = (c.autoCodigo || "").trim();
  const artigo = (c.autoArtigoBase || "").trim();
  const relato = (c.autoRelatoFiscal || "").trim();
  if (numero) linhas.push(`Auto nº ${numero}`);
  if (codigo) linhas.push(`Código da infração: ${codigo}`);
  if (artigo) linhas.push(`Tipificação: ${artigo}`);
  if (relato) linhas.push(relato);
  return linhas.length > 0 ? linhas.join("\n") : null;
}

function getDefesaAutoMeta(defesa: AutoInfracaoDefesa): string[] {
  const c = defesa.defesaConteudo || {};
  const meta: string[] = [];
  const multa = (c.autoValorMulta || "").trim();
  const dataFato = (c.autoDataFato || "").trim();
  const medida = (c.autoMedidaCautelar || "").trim();
  if (multa) meta.push(`Multa: ${multa}`);
  if (dataFato) meta.push(`Fato: ${dataFato}`);
  if (medida) meta.push(`Medida cautelar: ${medida}`);
  return meta;
}

/** Uma linha para o card (padrão das outras listas). */
function getDefesaMotivosLinha(defesa: AutoInfracaoDefesa): string | null {
  const partes: string[] = [];
  const motivos = getDefesaMotivosInfracao(defesa);
  if (motivos) partes.push(motivos.replace(/\n/g, " · "));
  partes.push(...getDefesaAutoMeta(defesa));
  const linha = partes.join(" · ").trim();
  return linha || null;
}

function formatDefesaDocContent(defesa: AutoInfracaoDefesa, empreendedorNome: string, empreendimentoNome: string): string {
  const checklist = (defesa.checklist || [])
    .map((c) => {
      const item = CHECKLIST_DECRETO_47383.find((i) => i.id === c.itemId);
      return `${c.checked ? "[X]" : "[ ]"} ${item?.label || c.itemId}`;
    })
    .join("\n");
  const anexos = (defesa.anexos || []).map((a) => `- ${a.name}`).join("\n");
  const conteudo = defesa.defesaConteudo || {};
  const autoNumero = valueOrPlaceholder(conteudo.autoNumero, "[INSERIR NUMERO DO AUTO]");
  const autoCodigo = valueOrPlaceholder(conteudo.autoCodigo, "[INSERIR CODIGO DA INFRACAO]");
  const autoArtigo = valueOrPlaceholder(conteudo.autoArtigoBase, "[INSERIR ARTIGO DO AUTO DE INFRACAO]");
  const autoRelato = valueOrPlaceholder(conteudo.autoRelatoFiscal, "[INSERIR RELATO FISCAL]");
  const autoMulta = valueOrPlaceholder(conteudo.autoValorMulta, "[INSERIR VALOR DA MULTA]");
  const autoMedida = (conteudo.autoMedidaCautelar || "").trim();
  const autoDataFato = valueOrPlaceholder(conteudo.autoDataFato, "[INSERIR DATA/HORA DO FATO]");
  const empCoord = valueOrPlaceholder(conteudo.empreendimentoCoordenadas, "[INSERIR COORDENADAS]");
  const empCidade = valueOrPlaceholder(conteudo.empreendimentoCidade, "[INSERIR CIDADE/MG]");
  const empAtividade = valueOrPlaceholder(
    conteudo.empreendimentoAtividadePrincipal,
    "[INSERIR ATIVIDADE PRINCIPAL]",
  );
  const empLicenca = valueOrPlaceholder(conteudo.empreendimentoNumeroLicenca, "[INSERIR NUMERO DA LICENCA]");
  const laudoNumero = (conteudo.laudoNumero || "").trim();
  const laudoTrecho = (conteudo.laudoTrechoTecnico || "").trim();
  const topicoEmbargo = autoMedida
    ? [
        "",
        "DO LEVANTAMENTO DO EMBARGO / MEDIDA CAUTELAR",
        `Consta medida cautelar aplicada: ${autoMedida}.`,
        "Requer-se o levantamento imediato da medida, diante da desproporcionalidade e do perigo na demora,",
        "assegurando-se a continuidade da atividade regular e o pleno contraditorio.",
      ].join("\n")
    : "";
  const topicoLaudo = laudoNumero || laudoTrecho
    ? [
        "",
        "REFERENCIA TECNICA",
        `Conforme Relatorio Tecnico n ${valueOrPlaceholder(laudoNumero, "[INSERIR NUMERO DO LAUDO]")},`,
        valueOrPlaceholder(
          laudoTrecho,
          "as evidencias tecnicas apresentadas corroboram a desconformidade da autuacao com a realidade fatico-tecnica.",
        ),
      ].join("\n")
    : "";

  return [
    `Processo Interno: ${defesa.processNumber}`,
    `Tipo de Defesa: ${defesa.tipoDefesa}`,
    `Empreendedor: ${empreendedorNome}`,
    `Empreendimento: ${empreendimentoNome}`,
    `Data/Hora do fato: ${autoDataFato}`,
    "",
    "Informacoes internas:",
    defesa.informacoesInternas || "Nao informado",
    "",
    "A) CABECALHO E IDENTIFICACAO DO LOCAL",
    `O autuado mantem o empreendimento denominado ${empreendimentoNome}, devidamente cadastrado sob CPF/CNPJ,`,
    `localizado nas coordenadas ${empCoord}, no municipio de ${empCidade},`,
    `onde desenvolve a atividade de ${empAtividade}.`,
    "",
    "B) DA DESCRICAO DA INFRACAO",
    `Consta no Auto de Infracao n ${autoNumero} a suposta pratica da infracao codificada sob o n ${autoCodigo},`,
    `cuja descricao fática sustenta que: '${autoRelato}'.`,
    `A penalidade pecuniaria foi arbitrada em ${autoMulta}, fundamentada no Art. ${autoArtigo} do Decreto Estadual 47.383/2018.`,
    "",
    "C) TESE DE DEFESA - INCONSISTENCIA DO RELATO FISCAL",
    "Ao analisar o relato, verifica-se ausencia de detalhamento dos elementos subjetivos da conduta,",
    "com insuficiencia de nexo causal entre a atividade e o suposto dano ambiental,",
    "ensejando nulidade por vicio de motivacao (Art. 96, II, Decreto 47.383/2018).",
    "",
    "D) TESE SUBSIDIARIA - ATENUANTES E CONVERSAO",
    `Requer-se aplicacao das atenuantes legais e, subsidiariamente, conversao da multa em servicos ambientais.`,
    `Historico de regularidade vinculado a licenca ${empLicenca}.`,
    topicoEmbargo,
    topicoLaudo,
    "",
    "1. Enderecamento e qualificacao:",
    conteudo.enderecamentoQualificacao || "Nao informado",
    "",
    "Referencia (Auto de Infracao e Processo Administrativo):",
    conteudo.referenciaAutoProcesso || "Nao informado",
    "",
    "2. Sintese do Auto de Infracao:",
    conteudo.sinteseAuto || "Nao informado",
    "",
    "3. Preliminares (nulidades):",
    conteudo.preliminaresNulidades || "Nao informado",
    "",
    "Decadencia / Prescricao:",
    conteudo.decadenciaPrescricao || "Nao informado",
    "",
    "4. Merito - inexistencia do fato:",
    conteudo.meritoInexistenciaFato || "Nao informado",
    "",
    "4. Merito - atipicidade:",
    conteudo.meritoAtipicidade || "Nao informado",
    "",
    "4. Merito - ausencia de autoria/responsabilidade:",
    conteudo.meritoAusenciaAutoria || "Nao informado",
    "",
    "4. Merito - regularidade da atividade:",
    conteudo.meritoRegularidadeAtividade || "Nao informado",
    "",
    "5. Atenuantes:",
    conteudo.atenuantes || "Nao informado",
    "",
    "5. Conversao de multa:",
    conteudo.conversaoMulta || "Nao informado",
    "",
    "6. Pedidos:",
    conteudo.pedidos || "Nao informado",
    "",
    "Checklist Decreto MG 47.383:",
    checklist || "Nenhum item",
    "",
    "Anexos:",
    anexos || "Sem anexos",
  ].join("\n");
}

export default function MultasDefesasPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const {
    data: brandingData,
    pdfImages,
    isPdfImagesLoading,
    hasBrandingUrls,
  } = useLocalBranding();
  const [exportingDefesaKey, setExportingDefesaKey] = React.useState<string | null>(
    null,
  );
  const { prepareFile, dialogProps } = usePreparedUpload({
    storagePathPrefix: "autos-infracao-defesa/",
  });

  const uploadDefesaFile = React.useCallback(
    async (file: File, filePath: string) => {
      const prepared = await prepareFile(file);
      if (!prepared) throw new Error("Upload cancelado.");
      return uploadFileToStorage(prepared, filePath);
    },
    [prepareFile],
  );

  const [openNovaMulta, setOpenNovaMulta] = React.useState(false);
  const [openEncerrar, setOpenEncerrar] = React.useState(false);
  const [encerrarTarget, setEncerrarTarget] = React.useState<AutoInfracaoDefesa | null>(null);
  const [encerrarTipo, setEncerrarTipo] = React.useState<DecisaoEncerramentoTipo | "">("");
  const [encerrarDescricao, setEncerrarDescricao] = React.useState("");
  const [encerrarData, setEncerrarData] = React.useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [encerrarArquivo, setEncerrarArquivo] = React.useState<File | null>(null);
  const [openDemanda, setOpenDemanda] = React.useState(false);
  const [demandaTarget, setDemandaTarget] = React.useState<AutoInfracaoDefesa | null>(null);
  const [demandaTexto, setDemandaTexto] = React.useState("");
  const [multaDataCientificacao, setMultaDataCientificacao] = React.useState(() =>
    todayIsoDate(),
  );
  const [multaAutoNumero, setMultaAutoNumero] = React.useState("");
  const [multaValorReais, setMultaValorReais] = React.useState(0);
  const [multaRelato, setMultaRelato] = React.useState("");
  const [multaAutoArquivos, setMultaAutoArquivos] = React.useState<File[]>([]);
  const multaUploadLimitMb = React.useMemo(
    () => formatUploadLimitMb(AUTO_MULTA_UPLOAD_CONTEXT),
    [],
  );
  const multaUploadMaxBytes = React.useMemo(
    () => getUploadMaxBytes(AUTO_MULTA_UPLOAD_CONTEXT),
    [],
  );
  const [open, setOpen] = React.useState(false);
  const [openProcess, setOpenProcess] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<AutoInfracaoDefesa | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [savingProcess, setSavingProcess] = React.useState(false);
  const [isLocked, setIsLocked] = React.useState(true);
  const [empreendedorId, setEmpreendedorId] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [tipoDefesa, setTipoDefesa] = React.useState<TipoDefesa | "">("");
  const [informacoesInternas, setInformacoesInternas] = React.useState("");
  const [observacoes, setObservacoes] = React.useState("");
  const [checklistState, setChecklistState] = React.useState<Record<string, boolean>>({});
  const [checklistFiles, setChecklistFiles] = React.useState<Record<string, File | null>>({});
  const [generalFiles, setGeneralFiles] = React.useState<File[]>([]);
  const [selectedDefesa, setSelectedDefesa] = React.useState<AutoInfracaoDefesa | null>(null);
  const [autoNumero, setAutoNumero] = React.useState("");
  const [autoCodigo, setAutoCodigo] = React.useState("");
  const [autoArtigoBase, setAutoArtigoBase] = React.useState("");
  const [autoRelatoFiscal, setAutoRelatoFiscal] = React.useState("");
  const [autoValorMulta, setAutoValorMulta] = React.useState("");
  const [autoMedidaCautelar, setAutoMedidaCautelar] = React.useState("");
  const [autoDataFato, setAutoDataFato] = React.useState("");
  const [empreendimentoCoordenadas, setEmpreendimentoCoordenadas] = React.useState("");
  const [empreendimentoCidade, setEmpreendimentoCidade] = React.useState("");
  const [empreendimentoAtividadePrincipal, setEmpreendimentoAtividadePrincipal] = React.useState("");
  const [empreendimentoNumeroLicenca, setEmpreendimentoNumeroLicenca] = React.useState("");
  const [laudoNumero, setLaudoNumero] = React.useState("");
  const [laudoTrechoTecnico, setLaudoTrechoTecnico] = React.useState("");
  const [enderecamentoQualificacao, setEnderecamentoQualificacao] = React.useState("");
  const [referenciaAutoProcesso, setReferenciaAutoProcesso] = React.useState("");
  const [sinteseAuto, setSinteseAuto] = React.useState("");
  const [preliminaresNulidades, setPreliminaresNulidades] = React.useState("");
  const [decadenciaPrescricao, setDecadenciaPrescricao] = React.useState("");
  const [meritoInexistenciaFato, setMeritoInexistenciaFato] = React.useState("");
  const [meritoAtipicidade, setMeritoAtipicidade] = React.useState("");
  const [meritoAusenciaAutoria, setMeritoAusenciaAutoria] = React.useState("");
  const [meritoRegularidadeAtividade, setMeritoRegularidadeAtividade] = React.useState("");
  const [atenuantes, setAtenuantes] = React.useState("");
  const [conversaoMulta, setConversaoMulta] = React.useState("");
  const [pedidos, setPedidos] = React.useState("");
  const [processChecklist, setProcessChecklist] = React.useState<Record<string, boolean>>({});
  const [processGeneralFiles, setProcessGeneralFiles] = React.useState<File[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");

  const defesasQuery = useMemoFirebase(() => (firestore ? collection(firestore, "autoInfracaoDefesas") : null), [firestore]);
  const empreendedoresQuery = useMemoFirebase(() => (firestore ? collection(firestore, "empreendedores") : null), [firestore]);
  const projectsQuery = useMemoFirebase(() => (firestore ? collection(firestore, "projects") : null), [firestore]);

  const { data: defesas, isLoading: isLoadingDefesas } = useCollection<AutoInfracaoDefesa>(defesasQuery);
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);
  const { data: projects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);

  const empreendedorNameMap = React.useMemo(
    () => new Map((empreendedores || []).map((e) => [e.id, e.name])),
    [empreendedores],
  );
  const projectNameMap = React.useMemo(
    () => new Map((projects || []).map((p) => [p.id, p.propertyName])),
    [projects],
  );
  const filteredProjects = React.useMemo(
    () => filterProjectsByEmpreendedorId(projects, empreendedorId),
    [projects, empreendedorId],
  );
  const selectedEmpreendedor = React.useMemo(
    () => (empreendedores || []).find((e) => e.id === empreendedorId) || null,
    [empreendedores, empreendedorId],
  );
  const selectedProject = React.useMemo(
    () => (projects || []).find((p) => p.id === projectId) || null,
    [projects, projectId],
  );

  const resetForm = () => {
    setEmpreendedorId("");
    setProjectId("");
    setTipoDefesa("");
    setInformacoesInternas("");
    setObservacoes("");
    setChecklistState({});
    setChecklistFiles({});
    setGeneralFiles([]);
  };

  const resetFormMulta = () => {
    setEmpreendedorId("");
    setProjectId("");
    setMultaDataCientificacao(todayIsoDate());
    setMultaAutoNumero("");
    setMultaValorReais(0);
    setMultaRelato("");
    setMultaAutoArquivos([]);
    setObservacoes("");
    setInformacoesInternas("");
  };

  const handleMultaAutoFilesChange = (files: FileList | null) => {
    if (!files) return;
    const valid: File[] = [];
    for (const f of Array.from(files)) {
      if (!isAcceptedAutoMultaFile(f)) {
        toast({
          variant: "destructive",
          title: "Formato não permitido",
          description: `${f.name}: use PDF ou imagem (JPG, PNG, WEBP, HEIC).`,
        });
        continue;
      }
      if (f.size > multaUploadMaxBytes) {
        toast({
          variant: "destructive",
          title: "Arquivo muito grande",
          description: `${f.name} excede o limite de ${multaUploadLimitMb}.`,
        });
        continue;
      }
      valid.push(f);
    }
    setMultaAutoArquivos(valid);
  };

  const saveNovaMulta = async () => {
    if (!firestore || !user) return;
    if (!empreendedorId || !projectId || !multaDataCientificacao) {
      toast({
        variant: "destructive",
        title: "Preencha empreendedor, empreendimento e data de cientificação.",
      });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(multaDataCientificacao)) {
      toast({
        variant: "destructive",
        title: "Data de cientificação inválida",
        description: "Use o formato DD/MM/AAAA.",
      });
      return;
    }
    setSaving(true);
    try {
      const year = new Date().getFullYear();
      const { sequence, processNumber } = getNextProcessNumber(defesas || [], year);
      const anexos: DefesaAnexo[] = [];
      let uploadIdx = 0;
      for (const file of multaAutoArquivos) {
        const filePath = `autos-infracao-defesa/${year}/auto-${Date.now()}-${uploadIdx++}-${sanitizeStorageFileName(file.name)}`;
        const url = await uploadDefesaFile(file, filePath);
        anexos.push({
          name: file.name,
          url,
          contentType: effectiveMimeType(file) || "application/octet-stream",
          checklistItemId: MULTA_AUTO_ANEXO_ID,
        });
      }

      const multaRef = await addDoc(collection(firestore, "autoInfracaoDefesas"), {
        empreendedorId,
        projectId,
        processNumber,
        processYear: year,
        processSequence: sequence,
        status: "aguardando_opcao",
        dataCientificacao: multaDataCientificacao,
        prazoDefesaDias: PRAZO_DEFESA_1_INSTANCIA_DIAS,
        observacoes: observacoes.trim(),
        informacoesInternas: informacoesInternas.trim(),
        defesaConteudo: {
          autoNumero: multaAutoNumero.trim(),
          autoValorMulta: currencyNumberToStoredBRL(multaValorReais),
          autoRelatoFiscal: multaRelato.trim(),
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
            description: `Foi lançada uma multa (processo ${processNumber}). Acesse Multas e Defesas no aplicativo.`,
            link: NOTIFICATION_LINKS.multasDefesas,
            sourceType: NOTIFICATION_SOURCE.multa_defesa,
            sourceId: multaRef.id,
            actorRole: user.role,
          },
          { excludeUserId: user.uid },
        );
      } catch (notifyErr) {
        console.warn("[Multas] notificação ao cliente:", notifyErr);
      }

      toast({
        title: "Multa registrada",
        description:
          anexos.length > 0
            ? `Processo ${processNumber}. ${anexos.length} anexo(s) do auto enviado(s). Prazo de 20 dias corridos a partir da cientificação.`
            : `Processo ${processNumber}. Prazo de 20 dias corridos a partir da cientificação.`,
      });
      setOpenNovaMulta(false);
      resetFormMulta();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao registrar multa",
        description: "Não foi possível salvar.",
      });
    } finally {
      setSaving(false);
    }
  };

  const registrarDemandaCliente = async () => {
    if (!firestore || !demandaTarget) return;
    setSaving(true);
    try {
      await updateDoc(doc(firestore, "autoInfracaoDefesas", demandaTarget.id), {
        status: "demanda_defesa_pendente",
        solicitacaoDefesaCliente: {
          solicitadoEm: new Date().toISOString(),
          texto: demandaTexto.trim(),
          status: "pendente",
        },
      });
      toast({
        title: "Demanda registrada",
        description: "Pedido do cliente para elaboração de defesa.",
      });
      setOpenDemanda(false);
      setDemandaTarget(null);
      setDemandaTexto("");
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro ao registrar demanda" });
    } finally {
      setSaving(false);
    }
  };

  const encerrarMultaSemDefesa = async () => {
    if (!firestore || !user || !encerrarTarget || !encerrarTipo) return;
    if (!encerrarDescricao.trim()) {
      toast({
        variant: "destructive",
        title: "Descreva a decisão do cliente no histórico.",
      });
      return;
    }
    setSaving(true);
    try {
      let anexo:
        | { name: string; url: string; contentType: string }
        | undefined;
      if (encerrarArquivo) {
        const year = encerrarTarget.processYear || new Date().getFullYear();
        const path = `autos-infracao-defesa/${year}/decisao-${encerrarTarget.id}-${Date.now()}-${sanitizeStorageFileName(encerrarArquivo.name)}`;
        const url = await uploadDefesaFile(encerrarArquivo, path);
        anexo = {
          name: encerrarArquivo.name,
          url,
          contentType:
            effectiveMimeType(encerrarArquivo) || "application/octet-stream",
        };
      }
      const statusMap: Record<DecisaoEncerramentoTipo, MultaDefesaStatus> = {
        pagamento: "encerrada_pagamento",
        parcelamento: "encerrada_parcelamento",
        pecma: "encerrada_pecma",
      };
      await updateDoc(doc(firestore, "autoInfracaoDefesas", encerrarTarget.id), {
        status: statusMap[encerrarTipo],
        decisaoEncerramento: {
          tipo: encerrarTipo,
          descricao: encerrarDescricao.trim(),
          dataDecisao: encerrarData,
          anexo,
          registradoEm: new Date().toISOString(),
          registradoPor: user.uid,
        },
      });
      toast({ title: "Demanda encerrada", description: DECISAO_ENCERRAMENTO_LABELS[encerrarTipo] });
      setOpenEncerrar(false);
      setEncerrarTarget(null);
      setEncerrarTipo("");
      setEncerrarDescricao("");
      setEncerrarArquivo(null);
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro ao encerrar" });
    } finally {
      setSaving(false);
    }
  };

  const handleChecklistFileChange = (itemId: string, file: File | null) => {
    if (file && !isAcceptedFile(file)) {
      toast({
        variant: "destructive",
        title: "Formato não permitido",
        description: `Use apenas: ${ACCEPTED_EXTENSIONS.join(", ")}`,
      });
      return;
    }
    setChecklistFiles((prev) => ({ ...prev, [itemId]: file }));
  };

  const handleGeneralFilesChange = (files: FileList | null) => {
    if (!files) return;
    const valid: File[] = [];
    for (const f of Array.from(files)) {
      if (!isAcceptedFile(f)) {
        toast({
          variant: "destructive",
          title: "Arquivo ignorado",
          description: `${f.name} não é permitido.`,
        });
        continue;
      }
      valid.push(f);
    }
    setGeneralFiles(valid);
  };

  const saveDefesa = async () => {
    if (!firestore || !user) return;
    if (!empreendedorId || !projectId || !tipoDefesa) {
      toast({ variant: "destructive", title: "Preencha os campos obrigatórios." });
      return;
    }

    const checkedCount = CHECKLIST_DECRETO_47383.filter((item) => !!checklistState[item.id]).length;
    if (checkedCount === 0) {
      toast({
        variant: "destructive",
        title: "Checklist obrigatório",
        description: "Marque ao menos um item do checklist para criar a defesa.",
      });
      return;
    }

    setSaving(true);
    try {
      const year = new Date().getFullYear();
      const { sequence, processNumber } = getNextProcessNumber(defesas || [], year);
      const anexos: DefesaAnexo[] = [];
      for (const item of CHECKLIST_DECRETO_47383) {
        const file = checklistFiles[item.id];
        if (!file) continue;
        const filePath = `autos-infracao-defesa/${year}/checklist-${item.id}-${Date.now()}-${sanitizeStorageFileName(file.name)}`;
        const url = await uploadDefesaFile(file, filePath);
        anexos.push({
          name: file.name,
          url,
          contentType:
            effectiveMimeType(file) || "application/octet-stream",
          checklistItemId: item.id,
        });
      }

      let geralIdx = 0;
      for (const file of generalFiles) {
        const filePath = `autos-infracao-defesa/${year}/geral-${Date.now()}-${geralIdx++}-${sanitizeStorageFileName(file.name)}`;
        const url = await uploadDefesaFile(file, filePath);
        anexos.push({
          name: file.name,
          url,
          contentType:
            effectiveMimeType(file) || "application/octet-stream",
        });
      }

      const autoEnderecoQualificacao = selectedEmpreendedor
        ? [
            `Autuado: ${selectedEmpreendedor.name || "[INSERIR NOME DO AUTUADO]"}`,
            `CPF/CNPJ: ${selectedEmpreendedor.cpfCnpj || "[INSERIR CPF/CNPJ]"}`,
            `Endereco: ${selectedEmpreendedor.address || "[INSERIR ENDERECO]"}`,
            `Contato: ${selectedEmpreendedor.phone || "[INSERIR CONTATO]"}`,
            `Municipio/UF: ${selectedEmpreendedor.municipio || "[INSERIR MUNICIPIO]"}${selectedEmpreendedor.uf ? `/${selectedEmpreendedor.uf}` : ""}`,
          ].join("\n")
        : "";
      const autoReferenciaAutoProcesso = selectedProject?.processNumber || "";
      const autoEmpCidade = selectedProject?.municipio || selectedEmpreendedor?.municipio || "";
      const autoEmpAtividade = selectedProject?.activity || "";
      const autoEmpCoord = formatProjectCoordinates(selectedProject);
      const autoEmpLicenca =
        (selectedProject as unknown as { permitNumber?: string })?.permitNumber ||
        selectedProject?.processNumber ||
        "";

      await addDoc(collection(firestore, "autoInfracaoDefesas"), {
        empreendedorId,
        projectId,
        processNumber,
        processYear: year,
        processSequence: sequence,
        status: "defesa_em_elaboracao",
        dataCientificacao: multaDataCientificacao || undefined,
        prazoDefesaDias: PRAZO_DEFESA_1_INSTANCIA_DIAS,
        tipoDefesa,
        informacoesInternas: informacoesInternas.trim(),
        observacoes: observacoes.trim(),
        defesaConteudo: {
          empreendimentoCidade: autoEmpCidade,
          empreendimentoAtividadePrincipal: autoEmpAtividade,
          empreendimentoCoordenadas: autoEmpCoord,
          empreendimentoNumeroLicenca: autoEmpLicenca,
          enderecamentoQualificacao: autoEnderecoQualificacao,
          referenciaAutoProcesso: autoReferenciaAutoProcesso,
          sinteseAuto: "",
          preliminaresNulidades: "",
          decadenciaPrescricao: "",
          meritoInexistenciaFato: "",
          meritoAtipicidade: "",
          meritoAusenciaAutoria: "",
          meritoRegularidadeAtividade: "",
          atenuantes: "",
          conversaoMulta: "",
          pedidos: "",
        },
        checklist: CHECKLIST_DECRETO_47383.map((item) => ({
          itemId: item.id,
          checked: !!checklistState[item.id],
        })),
        anexos,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Defesa criada com sucesso",
        description: `Processo interno gerado: ${processNumber}`,
      });
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar defesa",
        description: "Não foi possível concluir a operação.",
      });
    } finally {
      setSaving(false);
    }
  };

  /** Página restrita a admin/advogado no menu; quem chega aqui pode gerir o processo. */
  const canWriteDefesa = isAdminRole(user?.role) || user?.role === "advogado";

  const openDefesaProcess = (
    defesa: AutoInfracaoDefesa,
    options?: { unlocked?: boolean },
  ) => {
    setSelectedDefesa(defesa);
    setIsLocked(!options?.unlocked);
    setAutoNumero(defesa.defesaConteudo?.autoNumero || "");
    setAutoCodigo(defesa.defesaConteudo?.autoCodigo || "");
    setAutoArtigoBase(defesa.defesaConteudo?.autoArtigoBase || "");
    setAutoRelatoFiscal(defesa.defesaConteudo?.autoRelatoFiscal || "");
    setAutoValorMulta(defesa.defesaConteudo?.autoValorMulta || "");
    setAutoMedidaCautelar(defesa.defesaConteudo?.autoMedidaCautelar || "");
    setAutoDataFato(defesa.defesaConteudo?.autoDataFato || "");
    setEmpreendimentoCoordenadas(defesa.defesaConteudo?.empreendimentoCoordenadas || "");
    setEmpreendimentoCidade(defesa.defesaConteudo?.empreendimentoCidade || "");
    setEmpreendimentoAtividadePrincipal(defesa.defesaConteudo?.empreendimentoAtividadePrincipal || "");
    setEmpreendimentoNumeroLicenca(defesa.defesaConteudo?.empreendimentoNumeroLicenca || "");
    setLaudoNumero(defesa.defesaConteudo?.laudoNumero || "");
    setLaudoTrechoTecnico(defesa.defesaConteudo?.laudoTrechoTecnico || "");
    setEnderecamentoQualificacao(defesa.defesaConteudo?.enderecamentoQualificacao || "");
    setReferenciaAutoProcesso(defesa.defesaConteudo?.referenciaAutoProcesso || "");
    setSinteseAuto(defesa.defesaConteudo?.sinteseAuto || "");
    setPreliminaresNulidades(defesa.defesaConteudo?.preliminaresNulidades || "");
    setDecadenciaPrescricao(defesa.defesaConteudo?.decadenciaPrescricao || "");
    setMeritoInexistenciaFato(defesa.defesaConteudo?.meritoInexistenciaFato || "");
    setMeritoAtipicidade(defesa.defesaConteudo?.meritoAtipicidade || "");
    setMeritoAusenciaAutoria(defesa.defesaConteudo?.meritoAusenciaAutoria || "");
    setMeritoRegularidadeAtividade(defesa.defesaConteudo?.meritoRegularidadeAtividade || "");
    setAtenuantes(defesa.defesaConteudo?.atenuantes || "");
    setConversaoMulta(defesa.defesaConteudo?.conversaoMulta || "");
    setPedidos(defesa.defesaConteudo?.pedidos || "");
    setProcessChecklist(
      CHECKLIST_DECRETO_47383.reduce<Record<string, boolean>>((acc, item) => {
        const found = (defesa.checklist || []).find((c) => c.itemId === item.id);
        acc[item.id] = !!found?.checked;
        return acc;
      }, {}),
    );
    setProcessGeneralFiles([]);
    setOpenProcess(true);
  };

  const iniciarDefesaFromMulta = async (item: AutoInfracaoDefesa) => {
    if (!firestore) return;
    const tipo: TipoDefesa =
      item.tipoDefesa || "Defesa em 1º Instância / Administrativa";
    try {
      await updateDoc(doc(firestore, "autoInfracaoDefesas", item.id), {
        status: "defesa_em_elaboracao",
        tipoDefesa: tipo,
        solicitacaoDefesaCliente: item.solicitacaoDefesaCliente
          ? { ...item.solicitacaoDefesaCliente, status: "em_atendimento" as const }
          : undefined,
      });
      openDefesaProcess(
        { ...item, status: "defesa_em_elaboracao", tipoDefesa: tipo },
        { unlocked: true },
      );
    } catch (error) {
      console.error(error);
      toast({ variant: "destructive", title: "Erro ao iniciar defesa" });
    }
  };

  const handleProcessGeneralFilesChange = (files: FileList | null) => {
    if (!files) return;
    const valid: File[] = [];
    for (const f of Array.from(files)) {
      if (!isAcceptedFile(f)) {
        toast({
          variant: "destructive",
          title: "Arquivo ignorado",
          description: `${f.name} nao e permitido.`,
        });
        continue;
      }
      valid.push(f);
    }
    setProcessGeneralFiles(valid);
  };

  const saveProcess = async () => {
    if (!firestore || !selectedDefesa) return;
    setSavingProcess(true);
    try {
      const newAnexos: DefesaAnexo[] = [];
      let procIdx = 0;
      for (const file of processGeneralFiles) {
        const filePath = `autos-infracao-defesa/${selectedDefesa.processYear}/processo-${Date.now()}-${procIdx++}-${sanitizeStorageFileName(file.name)}`;
        const url = await uploadDefesaFile(file, filePath);
        newAnexos.push({
          name: file.name,
          url,
          contentType:
            effectiveMimeType(file) || "application/octet-stream",
        });
      }

      const updatedChecklist = CHECKLIST_DECRETO_47383.map((item) => ({
        itemId: item.id,
        checked: !!processChecklist[item.id],
      }));

      const updatedAnexos = [...(selectedDefesa.anexos || []), ...newAnexos];
      const payload = {
        checklist: updatedChecklist,
        anexos: updatedAnexos,
        defesaConteudo: {
          autoNumero: autoNumero.trim(),
          autoCodigo: autoCodigo.trim(),
          autoArtigoBase: autoArtigoBase.trim(),
          autoRelatoFiscal: autoRelatoFiscal.trim(),
          autoValorMulta: autoValorMulta.trim(),
          autoMedidaCautelar: autoMedidaCautelar.trim(),
          autoDataFato: autoDataFato.trim(),
          empreendimentoCoordenadas: empreendimentoCoordenadas.trim(),
          empreendimentoCidade: empreendimentoCidade.trim(),
          empreendimentoAtividadePrincipal: empreendimentoAtividadePrincipal.trim(),
          empreendimentoNumeroLicenca: empreendimentoNumeroLicenca.trim(),
          laudoNumero: laudoNumero.trim(),
          laudoTrechoTecnico: laudoTrechoTecnico.trim(),
          enderecamentoQualificacao: enderecamentoQualificacao.trim(),
          referenciaAutoProcesso: referenciaAutoProcesso.trim(),
          sinteseAuto: sinteseAuto.trim(),
          preliminaresNulidades: preliminaresNulidades.trim(),
          decadenciaPrescricao: decadenciaPrescricao.trim(),
          meritoInexistenciaFato: meritoInexistenciaFato.trim(),
          meritoAtipicidade: meritoAtipicidade.trim(),
          meritoAusenciaAutoria: meritoAusenciaAutoria.trim(),
          meritoRegularidadeAtividade: meritoRegularidadeAtividade.trim(),
          atenuantes: atenuantes.trim(),
          conversaoMulta: conversaoMulta.trim(),
          pedidos: pedidos.trim(),
        },
      };

      await updateDoc(doc(firestore, "autoInfracaoDefesas", selectedDefesa.id), payload);
      setSelectedDefesa({ ...selectedDefesa, ...payload });
      setProcessGeneralFiles([]);
      toast({ title: "Processo atualizado com sucesso." });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao atualizar",
        description: "Nao foi possivel salvar as alteracoes do processo.",
      });
    } finally {
      setSavingProcess(false);
    }
  };

  const exportDocxFor = async (defesa: AutoInfracaoDefesa) => {
    const key = `docx-${defesa.id}`;
    if (exportingDefesaKey) return;
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
    setExportingDefesaKey(key);
    try {
      const empreendedorNome = empreendedorNameMap.get(defesa.empreendedorId) || "N/A";
      const empreendimentoNome = projectNameMap.get(defesa.projectId) || "N/A";
      const content = formatDefesaDocContent(defesa, empreendedorNome, empreendimentoNome);
      const result = await generateDefesaExportDocxBlob(
        content,
        defesa,
        pdfImages!,
      );
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.fileName;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      toast({ title: "Word gerado", description: result.fileName });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Erro ao gerar Word",
        description: e instanceof Error ? e.message : "Falha na exportação.",
      });
    } finally {
      setExportingDefesaKey(null);
    }
  };

  const exportPdfFor = async (defesa: AutoInfracaoDefesa) => {
    const key = `pdf-${defesa.id}`;
    if (exportingDefesaKey) return;
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
    setExportingDefesaKey(key);
    try {
      const empreendedorNome = empreendedorNameMap.get(defesa.empreendedorId) || "N/A";
      const empreendimentoNome = projectNameMap.get(defesa.projectId) || "N/A";
      const content = formatDefesaDocContent(defesa, empreendedorNome, empreendimentoNome);
      const result = await generateDefesaExportPdfBlob(
        content,
        defesa,
        brandingData,
        pdfImages,
      );
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.fileName;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      toast({ title: "PDF gerado", description: result.fileName });
    } catch (e) {
      console.error(e);
      toast({
        variant: "destructive",
        title: "Erro ao gerar PDF",
        description: e instanceof Error ? e.message : "Falha na exportação.",
      });
    } finally {
      setExportingDefesaKey(null);
    }
  };

  const exportDocx = () => {
    if (!selectedDefesa) return;
    exportDocxFor(selectedDefesa);
  };

  const exportPdf = () => {
    if (!selectedDefesa) return;
    exportPdfFor(selectedDefesa);
  };

  const handleDeleteDefesa = async () => {
    if (!firestore || !deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(firestore, "autoInfracaoDefesas", deleteTarget.id));
      if (selectedDefesa?.id === deleteTarget.id) {
        setOpenProcess(false);
        setSelectedDefesa(null);
      }
      toast({ title: "Processo de defesa excluído." });
      setDeleteTarget(null);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Erro ao excluir",
        description: "Não foi possível excluir o processo de defesa.",
      });
    } finally {
      setDeleting(false);
    }
  };

  const isLoading = isLoadingDefesas || isLoadingEmpreendedores || isLoadingProjects;
  const filteredDefesas = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const base = !term
      ? defesas || []
      : (defesas || []).filter((item) => {
      const empreendedor = (empreendedorNameMap.get(item.empreendedorId) || "").toLowerCase();
      const empreendimento = (projectNameMap.get(item.projectId) || "").toLowerCase();
      const c = item.defesaConteudo || {};
      const conteudoBusca = [
        c.autoNumero,
        c.autoCodigo,
        c.autoArtigoBase,
        c.autoRelatoFiscal,
        c.sinteseAuto,
        c.referenciaAutoProcesso,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        item.processNumber.toLowerCase().includes(term) ||
        (item.tipoDefesa || "").toLowerCase().includes(term) ||
        (item.informacoesInternas || "").toLowerCase().includes(term) ||
        conteudoBusca.includes(term) ||
        empreendedor.includes(term) ||
        empreendimento.includes(term)
      );
    });
    return [...base].sort((a, b) =>
      (a.processNumber || "").localeCompare(b.processNumber || "", "pt-BR", {
        sensitivity: "base",
      }),
    );
  }, [defesas, empreendedorNameMap, projectNameMap, searchTerm]);

  const resumoPrazos = React.useMemo(() => {
    const items = defesas || [];
    let prazoAberto = 0;
    let demandasPendentes = 0;
    let aguardandoOpcao = 0;
    for (const item of items) {
      const st = inferMultaStatus(item);
      if (st === "demanda_defesa_pendente") demandasPendentes += 1;
      if (st === "aguardando_opcao") aguardandoOpcao += 1;
      if (isMultaComPrazoEmAberto(item)) prazoAberto += 1;
    }
    return { prazoAberto, demandasPendentes, aguardandoOpcao, total: items.length };
  }, [defesas]);

  return (
    <div className="flex flex-col h-full">
      <PageHeader title={MULTAS_E_DEFESAS_MENU_LABEL}>
        <Button
          size="sm"
          className="gap-1"
          onClick={() => {
            resetFormMulta();
            setOpenNovaMulta(true);
          }}
        >
          <PlusCircle className="h-4 w-4" />
          Nova multa
        </Button>
        <Button size="sm" variant="outline" className="gap-1" onClick={() => setOpen(true)}>
          <Gavel className="h-4 w-4" />
          Nova defesa (direto)
        </Button>
      </PageHeader>

      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                Prazo em aberto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{resumoPrazos.prazoAberto}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Multas com até {PRAZO_DEFESA_1_INSTANCIA_DIAS} dias corridos após a cientificação
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                Demandas de defesa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{resumoPrazos.demandasPendentes}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Pedidos do cliente aguardando elaboração
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Aguardando opção</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{resumoPrazos.aguardandoOpcao}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Defesa, pagamento, parcelamento ou PECMA
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Multas e processos de defesa</CardTitle>
            <CardDescription>
              Registre a multa após a cientificação; em seguida escolha defesa, pagamento, parcelamento ou PECMA.
            </CardDescription>
            <CardSearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar processo, empreendedor, empreendimento..."
            />
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <div className="space-y-4">
                {isLoading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-28 w-full rounded-lg"
                    />
                  ))}
                {!isLoading && filteredDefesas.length === 0 && (
                  <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                    Nenhuma multa registrada. Use &quot;Nova multa&quot; para lançar após a cientificação.
                  </div>
                )}
                {!isLoading &&
                  filteredDefesas.map((item) => {
                    const checked = (item.checklist || []).filter(
                      (c) => c.checked,
                    ).length;
                    const total = (item.checklist || []).length;
                    const resumo = getDefesaResumoText(item);
                    const sintese = getDefesaSinteseAuto(item);
                    const motivosLinha = getDefesaMotivosLinha(item);
                    const autoNumero = (item.defesaConteudo?.autoNumero || "").trim();
                    const tituloCard = autoNumero
                      ? `${item.processNumber} · Auto ${autoNumero}`
                      : item.processNumber;
                    const status = inferMultaStatus(item);
                    const prazoLabel = formatPrazoDefesaLabel(
                      item.dataCientificacao,
                      item.prazoDefesaDias ?? PRAZO_DEFESA_1_INSTANCIA_DIAS,
                    );
                    const diasRestantes = diasCorridosRestantesDefesa(
                      item.dataCientificacao,
                      item.prazoDefesaDias ?? PRAZO_DEFESA_1_INSTANCIA_DIAS,
                    );
                    const podeEscolherOpcao =
                      status === "aguardando_opcao" ||
                      status === "demanda_defesa_pendente";
                    return (
                      <Card
                        key={item.id}
                        className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <CardContent className="p-4 sm:p-5">
                          <div className="flex flex-col gap-4">
                            <div className="min-w-0 space-y-2">
                              <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                                {tituloCard}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {(item.tipoDefesa || "Sem tipo de defesa")} ·{" "}
                                {empreendedorNameMap.get(item.empreendedorId) ||
                                  "Empreendedor N/A"}{" "}
                                ·{" "}
                                {projectNameMap.get(item.projectId) ||
                                  "Empreendimento N/A"}
                              </p>
                              {item.dataCientificacao ? (
                                <p className="text-sm text-muted-foreground">
                                  Cientificação:{" "}
                                  {new Date(
                                    item.dataCientificacao + "T12:00:00",
                                  ).toLocaleDateString("pt-BR")}
                                </p>
                              ) : null}
                              <p className="line-clamp-2 text-sm text-muted-foreground">
                                <span className="text-foreground/80">Resumo:</span>{" "}
                                {resumo || "Sem resumo cadastrado"}
                              </p>
                              {sintese ? (
                                <p className="line-clamp-2 text-sm text-muted-foreground">
                                  <span className="text-foreground/80">Síntese:</span>{" "}
                                  {sintese}
                                </p>
                              ) : null}
                              <p className="line-clamp-3 text-sm text-muted-foreground">
                                <span className="text-foreground/80">Infração:</span>{" "}
                                {motivosLinha ||
                                  "Sem dados do auto de infração preenchidos"}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="w-fit">
                                  {MULTA_STATUS_LABELS[status]}
                                </Badge>
                                {item.dataCientificacao &&
                                (podeEscolherOpcao || status === "defesa_em_elaboracao") ? (
                                  <Badge
                                    variant={
                                      diasRestantes !== null && diasRestantes < 0
                                        ? "destructive"
                                        : diasRestantes !== null && diasRestantes <= 5
                                          ? "destructive"
                                          : "outline"
                                    }
                                    className="w-fit gap-1"
                                  >
                                    <Clock className="h-3 w-3" />
                                    {prazoLabel}
                                  </Badge>
                                ) : null}
                                {total > 0 ? (
                                  <Badge variant="outline" className="w-fit">
                                    Checklist {checked}/{total}
                                  </Badge>
                                ) : null}
                              </div>
                              {item.decisaoEncerramento ? (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  <span className="text-foreground/80">Encerramento:</span>{" "}
                                  {DECISAO_ENCERRAMENTO_LABELS[item.decisaoEncerramento.tipo]} —{" "}
                                  {item.decisaoEncerramento.descricao}
                                </p>
                              ) : null}
                            </div>
                            <Separator className="bg-border/60" />
                            {canWriteDefesa && podeEscolherOpcao ? (
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => void iniciarDefesaFromMulta(item)}
                                >
                                  <Gavel className="h-4 w-4" />
                                  Elaborar defesa
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => {
                                    setDemandaTarget(item);
                                    setDemandaTexto("");
                                    setOpenDemanda(true);
                                  }}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                  Pedido do cliente
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1"
                                  onClick={() => {
                                    setEncerrarTarget(item);
                                    setEncerrarTipo("pagamento");
                                    setEncerrarDescricao("");
                                    setEncerrarData(new Date().toISOString().slice(0, 10));
                                    setEncerrarArquivo(null);
                                    setOpenEncerrar(true);
                                  }}
                                >
                                  <Banknote className="h-4 w-4" />
                                  Pagamento
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEncerrarTarget(item);
                                    setEncerrarTipo("parcelamento");
                                    setEncerrarDescricao("");
                                    setEncerrarData(new Date().toISOString().slice(0, 10));
                                    setEncerrarArquivo(null);
                                    setOpenEncerrar(true);
                                  }}
                                >
                                  Parcelamento
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEncerrarTarget(item);
                                    setEncerrarTipo("pecma");
                                    setEncerrarDescricao("");
                                    setEncerrarData(new Date().toISOString().slice(0, 10));
                                    setEncerrarArquivo(null);
                                    setOpenEncerrar(true);
                                  }}
                                >
                                  PECMA
                                </Button>
                              </div>
                            ) : null}
                            <div className="flex flex-wrap items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 shrink-0"
                                    type="button"
                                    onClick={() => openDefesaProcess(item)}
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span className="sr-only">
                                      Abrir processo de defesa
                                    </span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Abrir processo de defesa</p>
                                </TooltipContent>
                              </Tooltip>
                              {canWriteDefesa ? (
                                <>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        aria-label="Editar processo de defesa"
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0"
                                        type="button"
                                        onClick={() =>
                                          openDefesaProcess(item, {
                                            unlocked: true,
                                          })
                                        }
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Editar processo</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        aria-label="Exportar PDF"
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0"
                                        type="button"
                                        onClick={() => exportPdfFor(item)}
                                      >
                                        <FileDown className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Exportar PDF</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        aria-label="Exportar DOCX"
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0"
                                        type="button"
                                        onClick={() => exportDocxFor(item)}
                                      >
                                        <FileDown className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Exportar DOCX</p>
                                    </TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        aria-label="Excluir processo de defesa"
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                                        type="button"
                                        onClick={() => setDeleteTarget(item)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Excluir processo</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>
      </main>

      <Dialog open={openNovaMulta} onOpenChange={setOpenNovaMulta}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Registrar multa do cliente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                <Select
                  value={projectId}
                  onValueChange={setProjectId}
                  disabled={!empreendedorId}
                >
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
            <div className="space-y-1">
              <Label>Data da cientificação</Label>
              <BrDateInput
                value={multaDataCientificacao}
                onChange={setMultaDataCientificacao}
              />
              <p className="text-xs text-muted-foreground">
                Formato DD/MM/AAAA. Prazo legal: {PRAZO_DEFESA_1_INSTANCIA_DIAS} dias corridos
                para defesa em 1ª instância, pagamento, parcelamento ou PECMA.
              </p>
            </div>
            <div className="space-y-1">
              <Label>Nº do auto (opcional)</Label>
              <Input value={multaAutoNumero} onChange={(e) => setMultaAutoNumero(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Auto de infração — arquivo (opcional)</Label>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,image/*,application/pdf"
                multiple
                onChange={(e) => handleMultaAutoFilesChange(e.target.files)}
              />
              <p className="text-xs text-muted-foreground">
                PDF ou foto (JPG, PNG, WEBP, HEIC). Até {multaUploadLimitMb} por arquivo.
              </p>
              {multaAutoArquivos.length > 0 ? (
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {multaAutoArquivos.map((f) => (
                    <li key={`${f.name}-${f.size}-${f.lastModified}`}>
                      {f.name} ({formatBytesHuman(f.size)})
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="space-y-1">
              <Label>Valor da multa (opcional)</Label>
              <BrlCurrencyInput value={multaValorReais} onChange={setMultaValorReais} />
            </div>
            <div className="space-y-1">
              <Label>Relato / resumo (opcional)</Label>
              <Textarea value={multaRelato} onChange={(e) => setMultaRelato(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Observações internas</Label>
              <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNovaMulta(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => void saveNovaMulta()} disabled={saving}>
              {saving ? "Salvando..." : "Registrar multa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openEncerrar} onOpenChange={setOpenEncerrar}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Encerrar sem defesa</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-1">
              <Label>Opção escolhida pelo cliente</Label>
              <Select
                value={encerrarTipo}
                onValueChange={(v) => setEncerrarTipo(v as DecisaoEncerramentoTipo)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(DECISAO_ENCERRAMENTO_LABELS) as DecisaoEncerramentoTipo[]).map(
                    (k) => (
                      <SelectItem key={k} value={k}>
                        {DECISAO_ENCERRAMENTO_LABELS[k]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Data da decisão</Label>
              <BrDateInput value={encerrarData} onChange={setEncerrarData} />
            </div>
            <div className="space-y-1">
              <Label>Histórico / decisão do cliente (obrigatório)</Label>
              <Textarea
                placeholder="Descreva o que o cliente decidiu e como foi formalizado..."
                value={encerrarDescricao}
                onChange={(e) => setEncerrarDescricao(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Comprovante ou documento (opcional)</Label>
              <Input
                type="file"
                accept=".pdf,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setEncerrarArquivo(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEncerrar(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => void encerrarMultaSemDefesa()} disabled={saving || !encerrarTipo}>
              {saving ? "Salvando..." : "Encerrar demanda"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openDemanda} onOpenChange={setOpenDemanda}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pedido de defesa pelo cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Registre a solicitação do cliente para elaboração da defesa administrativa.
            </p>
            <Textarea
              placeholder="Ex.: Cliente solicitou defesa até dia..."
              value={demandaTexto}
              onChange={(e) => setDemandaTexto(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDemanda(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => void registrarDemandaCliente()} disabled={saving}>
              {saving ? "Salvando..." : "Registrar pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Nova defesa (processo completo)</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Empreendedor</Label>
                <Select value={empreendedorId} onValueChange={(value) => { setEmpreendedorId(value); setProjectId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {(empreendedores || []).map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Empreendimento</Label>
                <Select value={projectId} onValueChange={setProjectId} disabled={!empreendedorId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {filteredProjects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.propertyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Tipo de Defesa</Label>
              <Select value={tipoDefesa} onValueChange={(value) => setTipoDefesa(value as TipoDefesa)}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo de defesa" /></SelectTrigger>
                <SelectContent>
                  {TIPOS_DEFESA.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Informações internas do formulário</Label>
              <Textarea
                placeholder="Resumo interno do processo para consulta rápida no card..."
                value={informacoesInternas}
                onChange={(e) => setInformacoesInternas(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Checklist base (Decreto MG 47.383)</Label>
              <div className="space-y-3 rounded-md border p-3">
                {CHECKLIST_DECRETO_47383.map((item) => (
                  <div key={item.id} className="grid gap-2 md:grid-cols-[1fr_auto] items-center">
                    <div className="flex items-start gap-2">
                      <Checkbox
                        checked={!!checklistState[item.id]}
                        onCheckedChange={(checked) =>
                          setChecklistState((prev) => ({ ...prev, [item.id]: !!checked }))
                        }
                      />
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <Input
                      type="file"
                      accept=".pdf,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => handleChecklistFileChange(item.id, e.target.files?.[0] || null)}
                      className="max-w-[320px]"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Anexos gerais da defesa</Label>
              <Input
                type="file"
                accept=".pdf,.docx,.jpg,.jpeg,.png"
                multiple
                onChange={(e) => handleGeneralFilesChange(e.target.files)}
              />
              {generalFiles.length > 0 && (
                <p className="text-xs text-muted-foreground">{generalFiles.length} arquivo(s) selecionado(s).</p>
              )}
            </div>

            <div className="space-y-1">
              <Label>Observações</Label>
              <Textarea
                placeholder="Informações complementares para o processo interno..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={saveDefesa} disabled={saving} className="gap-2">
              <Upload className="h-4 w-4" />
              {saving ? "Salvando..." : "Criar processo de defesa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openProcess} onOpenChange={setOpenProcess}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Processo de Defesa {selectedDefesa ? `- ${selectedDefesa.processNumber}` : ""}
            </DialogTitle>
          </DialogHeader>

          {selectedDefesa && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-md border p-3">
                <div>
                  <Label>Empreendedor</Label>
                  <Input value={empreendedorNameMap.get(selectedDefesa.empreendedorId) || "N/A"} disabled />
                </div>
                <div>
                  <Label>Empreendimento</Label>
                  <Input value={projectNameMap.get(selectedDefesa.projectId) || "N/A"} disabled />
                </div>
                <div>
                  <Label>Tipo de defesa</Label>
                  <Input value={selectedDefesa.tipoDefesa} disabled />
                </div>
                <div>
                  <Label>Informações internas</Label>
                  <Input value={selectedDefesa.informacoesInternas || "N/A"} disabled />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-base">Etapa de elaboração da defesa</Label>
                <Button variant="outline" size="sm" onClick={() => setIsLocked((v) => !v)}>
                  {isLocked ? <Lock className="h-4 w-4 mr-1" /> : <LockOpen className="h-4 w-4 mr-1" />}
                  {isLocked ? "Destravar edição" : "Travar campos"}
                </Button>
              </div>

              <div className="space-y-3 rounded-md border p-3">
                <div className="space-y-1">
                  <Label>Nº do Auto</Label>
                  <Input value={autoNumero} onChange={(e) => setAutoNumero(e.target.value)} disabled={isLocked} />
                </div>
                <div className="space-y-1">
                  <Label>Código da infração</Label>
                  <Input value={autoCodigo} onChange={(e) => setAutoCodigo(e.target.value)} disabled={isLocked} />
                </div>
                <div className="space-y-1">
                  <Label>Tipificação legal (artigo/parágrafo)</Label>
                  <Input value={autoArtigoBase} onChange={(e) => setAutoArtigoBase(e.target.value)} disabled={isLocked} />
                </div>
                <div className="space-y-1">
                  <Label>Descrição do fato (relato fiscal)</Label>
                  <Textarea value={autoRelatoFiscal} onChange={(e) => setAutoRelatoFiscal(e.target.value)} disabled={isLocked} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Valor da multa</Label>
                    <Input value={autoValorMulta} onChange={(e) => setAutoValorMulta(e.target.value)} disabled={isLocked} />
                  </div>
                  <div className="space-y-1">
                    <Label>Data/Hora do fato</Label>
                    <Input value={autoDataFato} onChange={(e) => setAutoDataFato(e.target.value)} disabled={isLocked} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Medidas cautelares (embargo/apreensão/suspensão)</Label>
                  <Input value={autoMedidaCautelar} onChange={(e) => setAutoMedidaCautelar(e.target.value)} disabled={isLocked} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Empreendimento - Coordenadas UTM/GMS</Label>
                    <Input
                      value={empreendimentoCoordenadas}
                      onChange={(e) => setEmpreendimentoCoordenadas(e.target.value)}
                      disabled={isLocked}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Empreendimento - Cidade/MG</Label>
                    <Input
                      value={empreendimentoCidade}
                      onChange={(e) => setEmpreendimentoCidade(e.target.value)}
                      disabled={isLocked}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Empreendimento - Atividade principal</Label>
                    <Input
                      value={empreendimentoAtividadePrincipal}
                      onChange={(e) => setEmpreendimentoAtividadePrincipal(e.target.value)}
                      disabled={isLocked}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Empreendimento - Nº da licença</Label>
                    <Input
                      value={empreendimentoNumeroLicenca}
                      onChange={(e) => setEmpreendimentoNumeroLicenca(e.target.value)}
                      disabled={isLocked}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Parecer técnico - Número</Label>
                  <Input value={laudoNumero} onChange={(e) => setLaudoNumero(e.target.value)} disabled={isLocked} />
                </div>
                <div className="space-y-1">
                  <Label>Parecer técnico - Trecho de desconformidade</Label>
                  <Textarea
                    value={laudoTrechoTecnico}
                    onChange={(e) => setLaudoTrechoTecnico(e.target.value)}
                    disabled={isLocked}
                    placeholder="Ex.: area fiscalizada fora da zona de protecao integral..."
                  />
                </div>
                <div className="space-y-1">
                  <Label>1) Endereçamento e qualificação</Label>
                  <Textarea
                    value={enderecamentoQualificacao}
                    onChange={(e) => setEnderecamentoQualificacao(e.target.value)}
                    disabled={isLocked}
                    placeholder="Destinatário (SUPRAM/IEF/IGAM), qualificação completa do autuado e do procurador, quando houver."
                  />
                </div>
                <div className="space-y-1">
                  <Label>1) Referência (Auto de Infração e Processo Administrativo)</Label>
                  <Textarea
                    value={referenciaAutoProcesso}
                    onChange={(e) => setReferenciaAutoProcesso(e.target.value)}
                    disabled={isLocked}
                    placeholder="Número do Auto de Infração e número do processo administrativo."
                  />
                </div>
                <div className="space-y-1">
                  <Label>2) Síntese do Auto de Infração</Label>
                  <Textarea
                    value={sinteseAuto}
                    onChange={(e) => setSinteseAuto(e.target.value)}
                    disabled={isLocked}
                    placeholder="Data, local, dispositivo legal supostamente violado e descrição da conduta."
                  />
                </div>
                <div className="space-y-1">
                  <Label>3) Preliminares (nulidades / vícios de forma)</Label>
                  <Textarea
                    value={preliminaresNulidades}
                    onChange={(e) => setPreliminaresNulidades(e.target.value)}
                    disabled={isLocked}
                    placeholder="Erros de tipificação, descrição genérica, cerceamento de defesa, notificação, assinatura, etc."
                  />
                </div>
                <div className="space-y-1">
                  <Label>3) Decadência / prescrição</Label>
                  <Textarea
                    value={decadenciaPrescricao}
                    onChange={(e) => setDecadenciaPrescricao(e.target.value)}
                    disabled={isLocked}
                    placeholder="Análise dos prazos prescricionais da pretensão punitiva conforme Decreto 47.383/2018."
                  />
                </div>
                <div className="space-y-1">
                  <Label>4) Mérito - inexistência do fato</Label>
                  <Textarea
                    value={meritoInexistenciaFato}
                    onChange={(e) => setMeritoInexistenciaFato(e.target.value)}
                    disabled={isLocked}
                  />
                </div>
                <div className="space-y-1">
                  <Label>4) Mérito - atipicidade da conduta</Label>
                  <Textarea
                    value={meritoAtipicidade}
                    onChange={(e) => setMeritoAtipicidade(e.target.value)}
                    disabled={isLocked}
                  />
                </div>
                <div className="space-y-1">
                  <Label>4) Mérito - ausência de autoria/responsabilidade</Label>
                  <Textarea
                    value={meritoAusenciaAutoria}
                    onChange={(e) => setMeritoAusenciaAutoria(e.target.value)}
                    disabled={isLocked}
                  />
                </div>
                <div className="space-y-1">
                  <Label>4) Mérito - regularidade da atividade</Label>
                  <Textarea
                    value={meritoRegularidadeAtividade}
                    onChange={(e) => setMeritoRegularidadeAtividade(e.target.value)}
                    disabled={isLocked}
                  />
                </div>
                <div className="space-y-1">
                  <Label>5) Atenuantes (subsidiário)</Label>
                  <Textarea
                    value={atenuantes}
                    onChange={(e) => setAtenuantes(e.target.value)}
                    disabled={isLocked}
                    placeholder="Colaboração, reparação do dano, confissão, arrependimento eficaz, etc."
                  />
                </div>
                <div className="space-y-1">
                  <Label>5) Conversão de multa (subsidiário)</Label>
                  <Textarea
                    value={conversaoMulta}
                    onChange={(e) => setConversaoMulta(e.target.value)}
                    disabled={isLocked}
                    placeholder="Pedido de conversão da multa em serviços ambientais, conforme legislação estadual."
                  />
                </div>
                <div className="space-y-1">
                  <Label>6) Pedidos</Label>
                  <Textarea
                    value={pedidos}
                    onChange={(e) => setPedidos(e.target.value)}
                    disabled={isLocked}
                    placeholder="Anulação do auto, cancelamento/arquivamento, redução/conversão, produção de provas pericial e documental."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Checklist padrão (pode ajustar durante a elaboração)</Label>
                <div className="space-y-2 rounded-md border p-3">
                  {CHECKLIST_DECRETO_47383.map((item) => (
                    <div className="flex items-center gap-2" key={item.id}>
                      <Checkbox
                        checked={!!processChecklist[item.id]}
                        onCheckedChange={(checked) =>
                          setProcessChecklist((prev) => ({ ...prev, [item.id]: !!checked }))
                        }
                        disabled={isLocked}
                      />
                      <span className="text-sm">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Anexos (sempre disponíveis, não obrigatórios)</Label>
                <Input
                  type="file"
                  accept=".pdf,.docx,.jpg,.jpeg,.png"
                  multiple
                  onChange={(e) => handleProcessGeneralFilesChange(e.target.files)}
                />
                {processGeneralFiles.length > 0 && (
                  <p className="text-xs text-muted-foreground">{processGeneralFiles.length} arquivo(s) para anexar.</p>
                )}
                {(selectedDefesa.anexos || []).length > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Anexos já salvos: {(selectedDefesa.anexos || []).map((a) => a.name).join(", ")}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={exportPdf}>
                  <FileDown className="h-4 w-4 mr-1" />
                  Exportar PDF
                </Button>
                <Button variant="outline" onClick={exportDocx}>
                  <FileDown className="h-4 w-4 mr-1" />
                  Exportar DOCX
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenProcess(false)}>
              Fechar
            </Button>
            <Button onClick={saveProcess} disabled={savingProcess}>
              <Save className="h-4 w-4 mr-1" />
              {savingProcess ? "Salvando..." : "Salvar processo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir processo de defesa?</AlertDialogTitle>
            <AlertDialogDescription>
              O processo{" "}
              <strong>{deleteTarget?.processNumber}</strong> será removido
              permanentemente. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteDefesa();
              }}
            >
              {deleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <UploadPreparationDialog {...dialogProps} />
    </div>
  );
}

