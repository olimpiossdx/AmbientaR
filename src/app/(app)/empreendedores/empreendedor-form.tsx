"use client";

import * as React from "react";
import { z } from "zod";
import { useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { BrDateFormControl } from "@/components/form/br-date-input";
import { MaskedInput } from "@/components/ui/masked-input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { AccessRequest, Client, Empreendedor } from "@/lib/types";
import {
  buildRepresentativeRequestedDocumentsMap,
  formatRepresentativeRequestedDocumentsLabel,
  getRepresentativeRequestedDocumentDigits,
  representativeRequestedDocumentsMatches,
} from "@/lib/representative-requested-documents";
import { useFirebase, useAuth, errorEmitter } from "@/firebase";
import { FirestorePermissionError } from "@/firebase/errors";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  where,
  setDoc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { useCollection, useMemoFirebase } from "@/firebase";
import type { AppUser } from "@/lib/types";
import { isClientePortalRole } from "@/lib/role-guards";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ibgeData } from "@/lib/ibge-data";
import { DEFAULT_AI_LOCAL_SOURCE_PATH } from "@/lib/ai-local-source-defaults";
import { getAdminApiRequestHeaders } from "@/lib/admin-api-client";
import { searchReferences } from "@/lib/reference-search/client";
import { fetchOnedriveAutofillContext } from "@/lib/autofill/fetch-onedrive-context";
import {
  buildCpfCnpjVariants,
  normalizeDocumentDigits,
} from "@/lib/document-lookup";
import { MtrIntegracaoFields, type MtrIntegracaoFormValues } from "@/components/empreendedores/mtr-integracao-fields";

const entityTypes = [
  { id: "Pessoa Física", label: "Pessoa Física" },
  { id: "Pessoa Jurídica", label: "Pessoa Jurídica" },
  { id: "Produtor Rural", label: "Produtor Rural" },
] as const;

function toDateInputValue(value?: string | null): string {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);

  // Fallback para valores legados no formato dd/mm/yyyy
  const brMatch = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (brMatch) {
    const [, dd, mm, yyyy] = brMatch;
    return `${yyyy}-${mm}-${dd}`;
  }
  return "";
}

const formSchema = z.object({
  name: z.string().min(2, "O nome é obrigatório."),
  cpfCnpj: z.string().min(11, "O CPF/CNPJ é obrigatório."),
  entityType: z
    .array(z.string())
    .refine((value) => value.some((item) => item), {
      message: "Você deve selecionar ao menos um tipo.",
    }),
  phone: z.string().min(8, "O telefone é obrigatório."),
  email: z.string().email("Por favor, insira um e-mail válido."),

  dataNascimento: z.string().optional(),
  ctfIbama: z.string().optional(),

  address: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  complemento: z.string().optional(),
  municipio: z.string().optional(),
  uf: z.string().optional(),
  cep: z.string().optional(),
  userId: z.string().optional(),
  representativeUserIds: z.preprocess((value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed ? [trimmed] : [];
    }
    return [];
  }, z.array(z.string())),
  mtrPessoaCodigo: z.string().optional(),
  mtrUsuarioCpf: z.string().optional(),
  mtrSenha: z.string().optional(),
  mtrAutoSyncEnabled: z.boolean().optional(),
  mtrAutoBaixarPdf: z.boolean().optional(),
  mtrAutoSyncIntervalHours: z.string().optional(),
});

type EmpreendedorFormValues = z.infer<typeof formSchema>;
type AutofillField =
  | "name"
  | "email"
  | "phone"
  | "address"
  | "numero"
  | "bairro"
  | "municipio"
  | "uf"
  | "cep"
  | "dataNascimento"
  | "ctfIbama";

type AutofillSuggestion = {
  field: AutofillField;
  suggestedValue: string;
  confidence: number;
  reason: string;
  sourceCitations?: string[];
};

const AI_LOCAL_SOURCE_PATH_KEY = "ai_lab_local_source_path_v1";
const AI_LOCAL_SOURCE_EXTENSIONS_KEY = "ai_lab_local_source_extensions_v1";
const AI_LOCAL_SOURCE_MODIFIED_AFTER_KEY =
  "ai_lab_local_source_modified_after_v1";
const DEFAULT_AI_LOCAL_SOURCE_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".md",
  ".csv",
];

const FIELD_CONFIDENCE_THRESHOLD: Record<AutofillField, number> = {
  name: 0.9,
  email: 0.85,
  phone: 0.85,
  address: 0.85,
  numero: 0.8,
  bairro: 0.8,
  municipio: 0.85,
  uf: 0.9,
  cep: 0.9,
  dataNascimento: 0.95,
  ctfIbama: 0.9,
};

const CRITICAL_FIELDS = new Set<AutofillField>([
  "name",
  "dataNascimento",
  "uf",
  "cep",
]);

interface EmpreendedorFormProps {
  currentItem?: Empreendedor | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function EmpreendedorForm({
  currentItem,
  onSuccess,
  onCancel,
}: EmpreendedorFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [isAutofilling, setIsAutofilling] = React.useState(false);
  const [autofillSuggestions, setAutofillSuggestions] = React.useState<
    AutofillSuggestion[]
  >([]);
  const [showOnlyBlockedSuggestions, setShowOnlyBlockedSuggestions] =
    React.useState(false);
  const { toast } = useToast();
  const { firestore, auth } = useFirebase();
  const { user } = useAuth();

  const upsertClientFromEmpreendedor = React.useCallback(
    async (
      clientId: string,
      empreendedorValues: EmpreendedorFormValues,
      approvedUserIds: string[],
    ) => {
      if (!firestore) return;

      const cpfCnpjDigits = (empreendedorValues.cpfCnpj || "").replace(
        /\D/g,
        "",
      );

      const entityType = empreendedorValues.entityType?.includes(
        "Pessoa Jurídica",
      )
        ? "Pessoa Jurídica"
        : empreendedorValues.entityType?.includes("Produtor Rural")
          ? "Produtor Rural"
          : "Pessoa Física";

      // Evita enviar `undefined` no Firestore: campos vazios viram strings vazias.
      await setDoc(
        doc(firestore, "clients", clientId),
        {
          name: empreendedorValues.name || "",
          cpfCnpj: cpfCnpjDigits,
          entityType,
          phone: empreendedorValues.phone || "",
          email: empreendedorValues.email || "",
          dataNascimento: empreendedorValues.dataNascimento
            ? new Date(
                `${empreendedorValues.dataNascimento}T00:00:00`,
              ).toISOString()
            : "",
          ctfIbama: empreendedorValues.ctfIbama || "",
          address: empreendedorValues.address || "",
          numero: empreendedorValues.numero || "",
          bairro: empreendedorValues.bairro || "",
          municipio: empreendedorValues.municipio || "",
          uf: empreendedorValues.uf || "",
          cep: empreendedorValues.cep || "",
          userId: empreendedorValues.userId || user?.id || "",
          approvedUserIds,
        },
        { merge: true },
      );
    },
    [firestore, user?.id],
  );

  const form = useForm<EmpreendedorFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentItem?.name || "",
      cpfCnpj: currentItem?.cpfCnpj || "",
      entityType: Array.isArray(currentItem?.entityType)
        ? currentItem.entityType
        : currentItem?.entityType
          ? [currentItem.entityType]
          : [],
      phone: currentItem?.phone || "",
      email: currentItem?.email || "",
      dataNascimento: toDateInputValue(currentItem?.dataNascimento || ""),
      ctfIbama: currentItem?.ctfIbama || "",
      address: currentItem?.address || "",
      numero: currentItem?.numero || "",
      bairro: currentItem?.bairro || "",
      complemento: "", // Não existe no tipo, é apenas UI
      municipio: currentItem?.municipio || "",
      uf: currentItem?.uf || "",
      cep: currentItem?.cep || "",
      userId: currentItem?.userId || "",
      representativeUserIds: currentItem?.approvedUserIds || [],
      mtrPessoaCodigo:
        currentItem?.mtrIntegracao?.pessoaCodigo != null
          ? String(currentItem.mtrIntegracao.pessoaCodigo)
          : "",
      mtrUsuarioCpf: currentItem?.mtrIntegracao?.usuarioCpf || "",
      mtrSenha: "",
      mtrAutoSyncEnabled: currentItem?.mtrIntegracao?.autoSyncEnabled ?? false,
      mtrAutoBaixarPdf: currentItem?.mtrIntegracao?.autoBaixarPdf ?? false,
      mtrAutoSyncIntervalHours:
        currentItem?.mtrIntegracao?.autoSyncIntervalHours != null
          ? String(currentItem.mtrIntegracao.autoSyncIntervalHours)
          : "24",
    },
  });

  const representativeUsersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "users"),
      where("role", "==", "representative"),
      where("status", "==", "active"),
    );
  }, [firestore]);
  const { data: representativeUsers } = useCollection<AppUser>(
    representativeUsersQuery,
  );

  const pendingAccessRequestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "access_requests"),
      where("status", "==", "pending"),
    );
  }, [firestore]);
  const approvedAccessRequestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, "access_requests"),
      where("status", "==", "approved"),
    );
  }, [firestore]);
  const { data: pendingAccessRequests } = useCollection<AccessRequest>(
    pendingAccessRequestsQuery,
  );
  const { data: approvedAccessRequests } = useCollection<AccessRequest>(
    approvedAccessRequestsQuery,
  );

  const empreendedorCpfCnpj = form.watch("cpfCnpj");

  const representativeRequestedDocsByRepId = React.useMemo(() => {
    const accessRequests = [
      ...(pendingAccessRequests || []),
      ...(approvedAccessRequests || []),
    ];
    return buildRepresentativeRequestedDocumentsMap(
      accessRequests,
      representativeUsers || [],
    );
  }, [
    pendingAccessRequests,
    approvedAccessRequests,
    representativeUsers,
  ]);

  const selectedUf = form.watch("uf");

  const citiesForSelectedUf = React.useMemo(() => {
    return (
      ibgeData.statesWithCities.find((state) => state.sigla === selectedUf)
        ?.cidades || []
    );
  }, [selectedUf]);

  const normalizeDocument = normalizeDocumentDigits;

  const applySuggestion = (s: AutofillSuggestion) => {
    const threshold = FIELD_CONFIDENCE_THRESHOLD[s.field] ?? 0.85;
    if (CRITICAL_FIELDS.has(s.field) && s.confidence < threshold) {
      toast({
        variant: "destructive",
        title: "Bloqueado por confiança baixa",
        description: `Campo crítico "${s.field}" exige >= ${(threshold * 100).toFixed(0)}% de confiança.`,
      });
      return;
    }
    form.setValue(
      s.field as keyof EmpreendedorFormValues,
      s.suggestedValue as never,
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
    void logAutofillDecision(s, "applied");
    setAutofillSuggestions((prev) =>
      prev.filter(
        (x) =>
          !(
            x.field === s.field &&
            x.suggestedValue === s.suggestedValue &&
            x.confidence === s.confidence
          ),
      ),
    );
  };

  const applyAllSuggestions = () => {
    let appliedCount = 0;
    let blockedCount = 0;
    autofillSuggestions.forEach((s) => {
      const threshold = FIELD_CONFIDENCE_THRESHOLD[s.field] ?? 0.85;
      const blocked = CRITICAL_FIELDS.has(s.field) && s.confidence < threshold;
      if (blocked) {
        blockedCount += 1;
        return;
      }
      appliedCount += 1;
      form.setValue(
        s.field as keyof EmpreendedorFormValues,
        s.suggestedValue as never,
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
      void logAutofillDecision(s, "applied");
    });
    setAutofillSuggestions((prev) =>
      prev.filter((s) => {
        const threshold = FIELD_CONFIDENCE_THRESHOLD[s.field] ?? 0.85;
        return CRITICAL_FIELDS.has(s.field) && s.confidence < threshold;
      }),
    );
    toast({
      title: "Aplicação concluída",
      description: `${appliedCount} sugestão(ões) aplicada(s). ${blockedCount} bloqueada(s) por confiança baixa em campo crítico.`,
    });
  };

  const ignoreSuggestion = (s: AutofillSuggestion) => {
    void logAutofillDecision(s, "ignored");
    setAutofillSuggestions((prev) =>
      prev.filter(
        (x) =>
          !(
            x.field === s.field &&
            x.suggestedValue === s.suggestedValue &&
            x.confidence === s.confidence
          ),
      ),
    );
  };

  const logAutofillDecision = async (
    s: AutofillSuggestion,
    action: "applied" | "ignored",
  ) => {
    if (!firestore) return;
    try {
      const cpf = normalizeDocument(form.getValues("cpfCnpj"));
      await addDoc(collection(firestore, "ai_autofill_logs"), {
        action,
        field: s.field,
        suggestedValue: s.suggestedValue,
        confidence: s.confidence,
        reason: s.reason,
        sourceCitations: s.sourceCitations || [],
        cpf,
        empreendedorId: currentItem?.id || null,
        userId: user?.id || null,
        userRole: user?.role || null,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.warn("Falha ao registrar log de autofill:", error);
    }
  };

  const isSuggestionBlocked = (s: AutofillSuggestion) =>
    CRITICAL_FIELDS.has(s.field) &&
    s.confidence < (FIELD_CONFIDENCE_THRESHOLD[s.field] ?? 0.85);

  const getRiskLevel = (s: AutofillSuggestion): "alto" | "medio" | "baixo" => {
    if (isSuggestionBlocked(s)) return "alto";
    if (s.confidence < 0.9) return "medio";
    return "baixo";
  };

  const visibleAutofillSuggestions = showOnlyBlockedSuggestions
    ? autofillSuggestions.filter((s) => isSuggestionBlocked(s))
    : autofillSuggestions;

  const handleAutofillByCpf = async () => {
    const cpfCnpj = form.getValues("cpfCnpj");
    const digits = normalizeDocument(cpfCnpj);
    if (digits.length < 11) {
      toast({
        variant: "destructive",
        title: "CPF/CNPJ inválido",
        description: "Informe um CPF/CNPJ válido para buscar contexto.",
      });
      return;
    }
    if (!firestore) {
      toast({ variant: "destructive", title: "Firestore indisponível" });
      return;
    }

    setIsAutofilling(true);
    setAutofillSuggestions([]);
    try {
      const variants = buildCpfCnpjVariants(cpfCnpj).slice(0, 10);
      const [empreendedoresSnap, clientsSnap] = await Promise.all([
        getDocs(
          query(
            collection(firestore, "empreendedores"),
            where("cpfCnpj", "in", variants),
          ),
        ),
        getDocs(
          query(
            collection(firestore, "clients"),
            where("cpfCnpj", "in", variants),
          ),
        ),
      ]);

      const empreendedores: Array<Partial<Empreendedor> & { id: string }> = empreendedoresSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Partial<Empreendedor>),
      }));
      const clients: Array<Partial<Client> & { id: string }> = clientsSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Partial<Client>),
      }));
      const normalizedTarget = normalizeDocument(cpfCnpj);
      const byDocMatch = (item: Record<string, unknown>) =>
        normalizeDocument(String(item.cpfCnpj || "")) === normalizedTarget;
      const matchedEmp = empreendedores.find(byDocMatch) || empreendedores[0];
      const matchedClient = clients.find(byDocMatch) || clients[0];

      const hardSuggestions: AutofillSuggestion[] = [];
      const addHard = (
        field: AutofillField,
        value: unknown,
        source: string,
      ) => {
        const text = typeof value === "string" ? value.trim() : "";
        if (!text) return;
        if (hardSuggestions.some((s) => s.field === field)) return;
        hardSuggestions.push({
          field,
          suggestedValue: text,
          confidence: 0.98,
          reason: "Campo estruturado encontrado na base interna.",
          sourceCitations: [source],
        });
      };

      if (matchedEmp) {
        const src = `empreendedores/${matchedEmp.id}`;
        addHard("name", matchedEmp.name, src);
        addHard("email", matchedEmp.email, src);
        addHard("phone", matchedEmp.phone, src);
        addHard("address", matchedEmp.address, src);
        addHard("numero", matchedEmp.numero, src);
        addHard("bairro", matchedEmp.bairro, src);
        addHard("municipio", matchedEmp.municipio, src);
        addHard("uf", matchedEmp.uf, src);
        addHard("cep", matchedEmp.cep, src);
        addHard("ctfIbama", matchedEmp.ctfIbama, src);
        if (matchedEmp.dataNascimento) {
          const raw = String(matchedEmp.dataNascimento);
          const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : raw.slice(0, 10);
          addHard("dataNascimento", date, src);
        }
      }
      if (matchedClient) {
        const src = `clients/${matchedClient.id}`;
        addHard("name", matchedClient.name, src);
        addHard("email", matchedClient.email, src);
        addHard("phone", matchedClient.phone, src);
        addHard("address", matchedClient.address, src);
        addHard("numero", matchedClient.numero, src);
        addHard("bairro", matchedClient.bairro, src);
        addHard("municipio", matchedClient.municipio, src);
        addHard("uf", matchedClient.uf, src);
        addHard("cep", matchedClient.cep, src);
        addHard("ctfIbama", matchedClient.ctfIbama, src);
        if (matchedClient.dataNascimento) {
          const raw = String(matchedClient.dataNascimento);
          const date = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : raw.slice(0, 10);
          addHard("dataNascimento", date, src);
        }
      }

      const configuredPath =
        typeof window !== "undefined"
          ? window.localStorage.getItem(AI_LOCAL_SOURCE_PATH_KEY) ||
            DEFAULT_AI_LOCAL_SOURCE_PATH
          : DEFAULT_AI_LOCAL_SOURCE_PATH;
      const configuredExtensions =
        typeof window !== "undefined"
          ? (window.localStorage.getItem(AI_LOCAL_SOURCE_EXTENSIONS_KEY) || "")
              .split(",")
              .map((ext) => ext.trim())
              .filter(Boolean)
          : [];
      const configuredModifiedAfter =
        typeof window !== "undefined"
          ? window.localStorage.getItem(AI_LOCAL_SOURCE_MODIFIED_AFTER_KEY) ||
            ""
          : "";

      let localEvidenceText = "";
      let localEvidenceCitations: string[] = [];
      let localMatchedByCpfCount = 0;
      try {
        const searchResult = await searchReferences(auth, {
          cpfCnpj: digits,
          basePath: configuredPath,
          extensions:
            configuredExtensions.length > 0
              ? configuredExtensions
              : DEFAULT_AI_LOCAL_SOURCE_EXTENSIONS,
          modifiedAfter: configuredModifiedAfter || undefined,
          maxResults: 8,
        });
        localMatchedByCpfCount =
          searchResult.matchedByCpfCount ?? searchResult.hits.length;
        localEvidenceCitations = searchResult.citations;
        localEvidenceText = searchResult.contextText;
      } catch (localError) {
        console.warn(
          "Falha ao buscar evidências (biblioteca IA) para autofill:",
          localError,
        );
      }

      let onedriveEvidenceText = "";
      let onedriveCitations: string[] = [];
      let onedriveExtractedCount = 0;
      let onedriveCatalogCount = 0;
      const onedriveHints: string[] = [];
      const od = await fetchOnedriveAutofillContext(auth, digits);
      if (od.success) {
        onedriveEvidenceText = od.evidenceText || "";
        onedriveCitations = od.citations || [];
        onedriveExtractedCount = od.extractedFileCount ?? 0;
        onedriveCatalogCount = od.catalogFileCount ?? 0;
        if (od.hints?.length) onedriveHints.push(...od.hints);
      } else {
        if (od.error) onedriveHints.push(od.error);
        if (od.hints?.length) onedriveHints.push(...od.hints);
        console.warn("OneDrive autofill:", od.error, od.diagnostics);
      }

      if (
        !matchedEmp &&
        !matchedClient &&
        hardSuggestions.length === 0 &&
        !localEvidenceText &&
        !onedriveEvidenceText
      ) {
        toast({
          title: "Sem contexto encontrado",
          description:
            onedriveHints[0] ||
            "Nenhum cadastro vinculado a este CPF/CNPJ na base interna, pasta OneDrive ou biblioteca local.",
        });
        return;
      }

      const hardContextJson = JSON.stringify(
        {
          matchedEmpreendedor: matchedEmp || null,
          matchedClient: matchedClient || null,
        },
        null,
        2,
      );
      const evidenceText = [matchedEmp, matchedClient]
        .filter(Boolean)
        .map((x) => JSON.stringify(x, null, 2))
        .join("\n\n")
        .concat(localEvidenceText ? `\n\n${localEvidenceText}` : "")
        .concat(onedriveEvidenceText ? `\n\n${onedriveEvidenceText}` : "");
      const llmRes = await fetch("/api/ai-lab/autofill-empreendedor", {
        method: "POST",
        headers: await getAdminApiRequestHeaders(auth),
        body: JSON.stringify({ cpf: digits, hardContextJson, evidenceText }),
      });
      const llmData = await llmRes.json();
      const softSuggestions: AutofillSuggestion[] =
        llmRes.ok && llmData?.success && Array.isArray(llmData.suggestions)
          ? llmData.suggestions
              .filter(
                (s: AutofillSuggestion) =>
                  s?.field &&
                  typeof s.suggestedValue === "string" &&
                  s.suggestedValue.trim(),
              )
              .map((s: AutofillSuggestion) => ({
                ...s,
                confidence: Number(s.confidence || 0.7),
              }))
          : [];

      const merged = [...hardSuggestions];
      softSuggestions.forEach((s) => {
        if (!merged.some((m) => m.field === s.field)) merged.push(s);
      });
      const allCitations = [
        ...localEvidenceCitations,
        ...onedriveCitations,
      ];
      if (allCitations.length > 0) {
        merged.forEach((s) => {
          s.sourceCitations = Array.from(
            new Set([...(s.sourceCitations || []), ...allCitations]),
          );
        });
      }
      setAutofillSuggestions(merged);
      const onedrivePart =
        onedriveCatalogCount > 0
          ? ` OneDrive: ${onedriveExtractedCount} ficheiro(s) lidos (${onedriveCatalogCount} no catálogo).`
          : "";
      toast({
        title: "Sugestões prontas",
        description: `${merged.length} sugestão(ões) para revisão. Locais: ${localMatchedByCpfCount}.${onedrivePart}${
          onedriveHints[0] ? ` ${onedriveHints[0]}` : ""
        }`,
      });
    } catch (error) {
      console.error("Autofill por CPF falhou:", error);
      toast({
        variant: "destructive",
        title: "Falha no autofill",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível gerar sugestões.",
      });
    } finally {
      setIsAutofilling(false);
    }
  };

  async function onSubmit(values: EmpreendedorFormValues) {
    setLoading(true);

    if (!firestore) {
      toast({ variant: "destructive", title: "Firebase não inicializado." });
      setLoading(false);
      return;
    }

    const {
      representativeUserIds,
      mtrPessoaCodigo,
      mtrUsuarioCpf,
      mtrSenha,
      mtrAutoSyncEnabled,
      mtrAutoBaixarPdf,
      mtrAutoSyncIntervalHours,
      ...baseValues
    } = values;
    const safeRepresentativeUserIds = Array.isArray(representativeUserIds)
      ? representativeUserIds
      : [];

    const mtrIntegracao: Record<string, unknown> = {
      ...(currentItem?.mtrIntegracao ?? {}),
    };
    const pessoaCodigo = mtrPessoaCodigo?.trim()
      ? Number(mtrPessoaCodigo.trim())
      : undefined;
    if (pessoaCodigo && !Number.isNaN(pessoaCodigo)) {
      mtrIntegracao.pessoaCodigo = pessoaCodigo;
    }
    if (mtrUsuarioCpf?.trim()) {
      mtrIntegracao.usuarioCpf = mtrUsuarioCpf.replace(/\D/g, "");
    }
    if (mtrSenha?.trim()) {
      mtrIntegracao.senha = mtrSenha;
    } else if (currentItem?.mtrIntegracao?.senha) {
      mtrIntegracao.senha = currentItem.mtrIntegracao.senha;
    }
    mtrIntegracao.autoSyncEnabled = mtrAutoSyncEnabled === true;
    mtrIntegracao.autoBaixarPdf = mtrAutoBaixarPdf === true;
    const intervalHours = mtrAutoSyncIntervalHours?.trim()
      ? Number(mtrAutoSyncIntervalHours.trim())
      : 24;
    if (!Number.isNaN(intervalHours) && intervalHours >= 6) {
      mtrIntegracao.autoSyncIntervalHours = Math.min(168, intervalHours);
    }

    const hasMtrFields =
      mtrIntegracao.pessoaCodigo ||
      mtrIntegracao.usuarioCpf ||
      mtrIntegracao.senha;

    const dataToSave = {
      ...baseValues,
      dataNascimento: values.dataNascimento
        ? new Date(`${values.dataNascimento}T00:00:00`).toISOString()
        : null,
      userId:
        values.userId ||
        currentItem?.userId ||
        (isClientePortalRole(user?.role) ? user?.id ?? null : null),
      approvedUserIds: safeRepresentativeUserIds,
      ...(hasMtrFields || currentItem?.mtrIntegracao
        ? { mtrIntegracao }
        : {}),
    };

    try {
      if (currentItem) {
        const empreendedorRef = doc(
          firestore,
          "empreendedores",
          currentItem.id,
        );
        await updateDoc(empreendedorRef, dataToSave);

        // Regra de negócio: todo empreendedor deve existir também em Financeiro > Clientes.
        await upsertClientFromEmpreendedor(
          currentItem.id,
          { ...values, userId: dataToSave.userId || "" },
          dataToSave.approvedUserIds,
        );

        const isOwnEmpreendedor =
          isClientePortalRole(user?.role) &&
          (currentItem.userId === user?.id || currentItem.id === user?.id);
        if (isOwnEmpreendedor && user?.id) {
          try {
            await updateDoc(doc(firestore, "users", user.id), {
              cadastroIncompleto: false,
            });
          } catch (_) {}
        }

        toast({
          title: "Empreendedor atualizado!",
          description:
            "As informações do empreendedor foram salvas com sucesso.",
        });
        onSuccess?.();
      } else {
        const empreendedoresCollectionRef = collection(
          firestore,
          "empreendedores",
        );
        const createdRef = await addDoc(
          empreendedoresCollectionRef,
          dataToSave,
        );

        // Regra de negócio: ao criar empreendedor, cria automaticamente o cliente espelho.
        await upsertClientFromEmpreendedor(
          createdRef.id,
          { ...values, userId: dataToSave.userId || "" },
          dataToSave.approvedUserIds,
        );

        toast({
          title: "Empreendedor criado!",
          description: `O empreendedor ${values.name} foi adicionado com sucesso.`,
        });
        form.reset();
        onSuccess?.();
      }
    } catch (serverError) {
      const path = currentItem
        ? doc(firestore, "empreendedores", currentItem.id).path
        : collection(firestore, "empreendedores").path;
      const operation = currentItem ? "update" : "create";
      const permissionError = new FirestorePermissionError({
        path,
        operation,
        requestResourceData: dataToSave,
      });
      errorEmitter.emit("permission-error", permissionError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="h-full flex flex-col overflow-hidden"
      >
        <div className="form-scroll-body space-y-4 py-4">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="cpfCnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF / CNPJ</FormLabel>
                  <FormControl>
                    <MaskedInput
                      mask="cpfCnpj"
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      {...field}
                    />
                  </FormControl>
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAutofillByCpf}
                      disabled={isAutofilling}
                    >
                      {isAutofilling
                        ? "Buscando contexto..."
                        : "Preenchimento automático (CPF + OneDrive)"}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome / Razão Social</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome do cliente ou empresa"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {autofillSuggestions.length > 0 && (
              <div className="rounded-md border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    Sugestões de preenchimento (IA + base interna)
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="text-xs flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={showOnlyBlockedSuggestions}
                        onChange={(e) =>
                          setShowOnlyBlockedSuggestions(e.target.checked)
                        }
                      />
                      Mostrar só bloqueadas
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={applyAllSuggestions}
                    >
                      Aplicar tudo
                    </Button>
                  </div>
                </div>
                {visibleAutofillSuggestions.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Nenhuma sugestão para o filtro atual.
                  </p>
                )}
                {visibleAutofillSuggestions.map((s, idx) => (
                  <div
                    key={`${s.field}-${idx}`}
                    className="rounded border p-2 text-xs"
                  >
                    {CRITICAL_FIELDS.has(s.field) &&
                      s.confidence <
                        (FIELD_CONFIDENCE_THRESHOLD[s.field] ?? 0.85) && (
                        <p className="text-destructive font-medium mb-1">
                          Campo crítico bloqueado por baixa confiança.
                        </p>
                      )}
                    <div className="mb-1">
                      {getRiskLevel(s) === "alto" && (
                        <Badge
                          variant="outline"
                          className="border-red-500/40 text-red-700 bg-red-500/10"
                        >
                          Risco alto
                        </Badge>
                      )}
                      {getRiskLevel(s) === "medio" && (
                        <Badge
                          variant="outline"
                          className="border-amber-500/40 text-amber-700 bg-amber-500/10"
                        >
                          Risco médio
                        </Badge>
                      )}
                      {getRiskLevel(s) === "baixo" && (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/40 text-emerald-700 bg-emerald-500/10"
                        >
                          Risco baixo
                        </Badge>
                      )}
                    </div>
                    <p>
                      <span className="font-medium">{s.field}</span>:{" "}
                      {s.suggestedValue}
                    </p>
                    <p className="text-muted-foreground">
                      Confiança:{" "}
                      {(Math.max(0, Math.min(1, s.confidence)) * 100).toFixed(
                        0,
                      )}
                      % | {s.reason}
                    </p>
                    {s.sourceCitations && s.sourceCitations.length > 0 && (
                      <p className="text-muted-foreground">
                        Fonte: {s.sourceCitations.join(", ")}
                      </p>
                    )}
                    <div className="pt-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => applySuggestion(s)}
                        disabled={
                          CRITICAL_FIELDS.has(s.field) &&
                          s.confidence <
                            (FIELD_CONFIDENCE_THRESHOLD[s.field] ?? 0.85)
                        }
                      >
                        Aplicar
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => ignoreSuggestion(s)}
                      >
                        Ignorar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <FormField
              control={form.control}
              name="entityType"
              render={() => (
                <FormItem>
                  <FormLabel>Tipo de Pessoa</FormLabel>
                  <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4">
                    {entityTypes.map((item) => (
                      <FormField
                        key={item.id}
                        control={form.control}
                        name="entityType"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item.id)}
                                  onCheckedChange={(checked) => {
                                    let newValues = field.value
                                      ? [...field.value]
                                      : [];
                                    if (checked) {
                                      if (
                                        item.id === "Pessoa Física" &&
                                        newValues.includes("Pessoa Jurídica")
                                      ) {
                                        newValues = newValues.filter(
                                          (v) => v !== "Pessoa Jurídica",
                                        );
                                      }
                                      if (
                                        item.id === "Pessoa Jurídica" &&
                                        newValues.includes("Pessoa Física")
                                      ) {
                                        newValues = newValues.filter(
                                          (v) => v !== "Pessoa Física",
                                        );
                                      }
                                      newValues.push(item.id);
                                    } else {
                                      newValues = newValues.filter(
                                        (value) => value !== item.id,
                                      );
                                    }
                                    field.onChange(newValues);
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {item.label}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4 rounded-md border p-4">
            <h3 className="text-lg font-medium">Documentação Adicional</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dataNascimento"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <BrDateFormControl
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ctfIbama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CTF/IBAMA</FormLabel>
                    <FormControl>
                      <Input placeholder="Número de registro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <MtrIntegracaoFields
            control={form.control as unknown as Control<MtrIntegracaoFormValues>}
            showLastSync={
              currentItem?.mtrIntegracao
                ? {
                    lastSyncAt: currentItem.mtrIntegracao.lastSyncAt,
                    lastSyncSummary: currentItem.mtrIntegracao.lastSyncSummary,
                    lastSyncError: currentItem.mtrIntegracao.lastSyncError,
                  }
                : undefined
            }
          />

          <div className="space-y-4 rounded-md border p-4">
            <h3 className="text-lg font-medium">Contato e Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="col-span-3">
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, Avenida, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº</FormLabel>
                    <FormControl>
                      <Input placeholder="123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bairro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input placeholder="Centro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="complemento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                      <Input placeholder="Apto 101, Bloco B" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="uf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UF</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue("municipio", "");
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ibgeData.statesWithCities.map((state) => (
                          <SelectItem key={state.sigla} value={state.sigla}>
                            {state.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="municipio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Município</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                      disabled={!selectedUf}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              !selectedUf
                                ? "Selecione um estado primeiro"
                                : "Selecione um município"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {citiesForSelectedUf.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <MaskedInput
                        mask="cep"
                        placeholder="00000-000"
                        maxLength={9}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone (com DDD)</FormLabel>
                    <FormControl>
                      <MaskedInput
                        mask="phone"
                        placeholder="(XX) XXXXX-XXXX"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-md border p-4">
            <h3 className="text-lg font-medium">Acesso de representante</h3>
            <p className="text-sm text-muted-foreground">
              Vincule um usuário com perfil Representante para acesso autorizado
              aos dados deste empreendedor.
            </p>
            <p className="text-xs text-muted-foreground">
              {(form.watch("representativeUserIds") || []).length}{" "}
              representante(s) vinculado(s)
            </p>
            <FormField
              control={form.control}
              name="representativeUserIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuários representantes</FormLabel>
                  <div className="space-y-2 rounded-md border p-3 max-h-44 overflow-auto">
                    {(representativeUsers || []).length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Nenhum representante ativo encontrado.
                      </p>
                    )}
                    {(representativeUsers || []).map((u) => {
                      const selected = (field.value || []).includes(u.id);
                      const requestedDigits =
                        getRepresentativeRequestedDocumentDigits(
                          u,
                          representativeRequestedDocsByRepId,
                        );
                      const requestedLabel =
                        formatRepresentativeRequestedDocumentsLabel(
                          requestedDigits,
                        );
                      const matchesThisCadastro =
                        representativeRequestedDocumentsMatches(
                          requestedDigits,
                          empreendedorCpfCnpj,
                        );
                      return (
                        <label
                          key={u.id}
                          className="flex items-start gap-2 text-sm cursor-pointer"
                        >
                          <Checkbox
                            className="mt-0.5"
                            checked={selected}
                            onCheckedChange={(checked) => {
                              const prev = field.value || [];
                              if (checked) {
                                field.onChange([...prev, u.id]);
                              } else {
                                field.onChange(
                                  prev.filter((id) => id !== u.id),
                                );
                              }
                            }}
                          />
                          <span className="flex min-w-0 flex-1 flex-col gap-1">
                            <span>
                              {u.name} ({u.email})
                            </span>
                            {requestedDigits.length > 0 && (
                              <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                <span>
                                  Já solicitou acesso a{" "}
                                  {requestedDigits.length === 1
                                    ? "1 documento"
                                    : `${requestedDigits.length} documentos`}
                                  : {requestedLabel}
                                </span>
                                {matchesThisCadastro && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] font-normal"
                                  >
                                    compatível com este cadastro
                                  </Badge>
                                )}
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 mt-auto border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              form.reset();
              onCancel?.();
            }}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
