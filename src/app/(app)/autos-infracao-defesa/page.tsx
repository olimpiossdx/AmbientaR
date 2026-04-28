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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PlusCircle, Upload, Eye, Lock, LockOpen, Save, FileDown } from "lucide-react";
import { CardSearchInput } from "@/components/card-search-input";
import { useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import type { Empreendedor, Project } from "@/lib/types";

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

type AutoInfracaoDefesa = {
  id: string;
  empreendedorId: string;
  projectId: string;
  processNumber: string;
  processYear: number;
  processSequence: number;
  tipoDefesa: TipoDefesa;
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
  checklist: Array<{ itemId: string; checked: boolean }>;
  anexos: DefesaAnexo[];
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

function sanitizeFileName(name: string): string {
  return name.replace(/[^\w.\-]/g, "_");
}

function getExt(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx).toLowerCase() : "";
}

function isAcceptedFile(file: File): boolean {
  return ACCEPTED_EXTENSIONS.includes(getExt(file.name));
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

export default function AutosInfracaoDefesaPage() {
  const { firestore, firebaseApp, user } = useFirebase();
  const { toast } = useToast();

  const [open, setOpen] = React.useState(false);
  const [openProcess, setOpenProcess] = React.useState(false);
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
    () => (projects || []).filter((p) => p.empreendedorId === empreendedorId),
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
    if (!firestore || !firebaseApp || !user) return;
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
      const storage = getStorage(firebaseApp);

      const anexos: DefesaAnexo[] = [];
      for (const item of CHECKLIST_DECRETO_47383) {
        const file = checklistFiles[item.id];
        if (!file) continue;
        const filePath = `autos-infracao-defesa/${year}/${Date.now()}-${sanitizeFileName(file.name)}`;
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        anexos.push({
          name: file.name,
          url,
          contentType: file.type || "application/octet-stream",
          checklistItemId: item.id,
        });
      }

      for (const file of generalFiles) {
        const filePath = `autos-infracao-defesa/${year}/${Date.now()}-${sanitizeFileName(file.name)}`;
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        anexos.push({
          name: file.name,
          url,
          contentType: file.type || "application/octet-stream",
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

  const openDefesaProcess = (defesa: AutoInfracaoDefesa) => {
    setSelectedDefesa(defesa);
    setIsLocked(true);
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
    if (!firestore || !firebaseApp || !selectedDefesa) return;
    setSavingProcess(true);
    try {
      const storage = getStorage(firebaseApp);
      const newAnexos: DefesaAnexo[] = [];
      for (const file of processGeneralFiles) {
        const filePath = `autos-infracao-defesa/${selectedDefesa.processYear}/${Date.now()}-${sanitizeFileName(file.name)}`;
        const storageRef = ref(storage, filePath);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        newAnexos.push({
          name: file.name,
          url,
          contentType: file.type || "application/octet-stream",
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

  const exportDocx = () => {
    if (!selectedDefesa) return;
    const empreendedorNome = empreendedorNameMap.get(selectedDefesa.empreendedorId) || "N/A";
    const empreendimentoNome = projectNameMap.get(selectedDefesa.projectId) || "N/A";
    const content = formatDefesaDocContent(selectedDefesa, empreendedorNome, empreendimentoNome);
    const blob = new Blob([content], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `defesa-${selectedDefesa.processNumber.replace("/", "-")}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = () => {
    if (!selectedDefesa) return;
    const empreendedorNome = empreendedorNameMap.get(selectedDefesa.empreendedorId) || "N/A";
    const empreendimentoNome = projectNameMap.get(selectedDefesa.projectId) || "N/A";
    const content = formatDefesaDocContent(selectedDefesa, empreendedorNome, empreendimentoNome).replace(/\n/g, "<br/>");
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><head><title>Defesa ${selectedDefesa.processNumber}</title></head><body style="font-family:Arial,sans-serif;padding:24px;">${content}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  const isLoading = isLoadingDefesas || isLoadingEmpreendedores || isLoadingProjects;
  const filteredDefesas = React.useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const base = !term
      ? defesas || []
      : (defesas || []).filter((item) => {
      const empreendedor = (empreendedorNameMap.get(item.empreendedorId) || "").toLowerCase();
      const empreendimento = (projectNameMap.get(item.projectId) || "").toLowerCase();
      return (
        item.processNumber.toLowerCase().includes(term) ||
        item.tipoDefesa.toLowerCase().includes(term) ||
        (item.informacoesInternas || "").toLowerCase().includes(term) ||
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

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Autos de Infração - Defesa">
        <Button size="sm" className="gap-1" onClick={() => setOpen(true)}>
          <PlusCircle className="h-4 w-4" />
          Nova Defesa
        </Button>
      </PageHeader>

      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Processos de Defesa</CardTitle>
            <CardDescription>
              Controle interno de defesas administrativas com checklist e anexos.
            </CardDescription>
            <CardSearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar processo, empreendedor, empreendimento..."
            />
          </CardHeader>
          <CardContent>
            <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nº Processo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="hidden md:table-cell">Empreendedor</TableHead>
                  <TableHead className="hidden lg:table-cell">Empreendimento</TableHead>
                  <TableHead className="hidden lg:table-cell">Informações internas</TableHead>
                  <TableHead className="hidden sm:table-cell">Checklist</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7}>Carregando...</TableCell>
                  </TableRow>
                ) : filteredDefesas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>Nenhuma defesa cadastrada.</TableCell>
                  </TableRow>
                ) : (
                  filteredDefesas.map((item) => {
                    const checked = (item.checklist || []).filter((c) => c.checked).length;
                    const total = (item.checklist || []).length;
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.processNumber}</TableCell>
                        <TableCell>{item.tipoDefesa}</TableCell>
                        <TableCell className="hidden md:table-cell">{empreendedorNameMap.get(item.empreendedorId) || "N/A"}</TableCell>
                        <TableCell className="hidden lg:table-cell">{projectNameMap.get(item.projectId) || "N/A"}</TableCell>
                        <TableCell className="hidden max-w-[320px] truncate lg:table-cell">{item.informacoesInternas || "Não informado"}</TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="outline">{checked}/{total}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" onClick={() => openDefesaProcess(item)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Abrir processo de defesa</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
            </TooltipProvider>
          </CardContent>
        </Card>
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Nova Defesa de Auto de Infração</DialogTitle>
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
    </div>
  );
}

