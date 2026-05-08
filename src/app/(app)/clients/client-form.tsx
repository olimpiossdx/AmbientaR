"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
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
import { MaskedInput } from "@/components/ui/masked-input";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Client, Empreendedor } from "@/lib/types";
import { useFirebase, useAuth, errorEmitter } from "@/firebase";
import { FirestorePermissionError } from "@/firebase/errors";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { isClientePortalRole } from "@/lib/role-guards";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logUserAction } from "@/lib/audit-log";
import { ibgeData } from "@/lib/ibge-data";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  name: z.string().min(2, "O nome é obrigatório."),
  cpfCnpj: z.string().min(11, "O CPF/CNPJ é obrigatório."),
  entityType: z.enum(["Pessoa Física", "Pessoa Jurídica", "Produtor Rural"], {
    required_error: "Selecione o tipo de pessoa.",
  }),
  phone: z.string().min(8, "O telefone é obrigatório."),
  email: z.string().email("Por favor, insira um e-mail válido."),

  identidade: z.string().optional(),
  emissor: z.string().optional(),
  nacionalidade: z.string().optional(),
  estadoCivil: z.string().optional(),
  dataNascimento: z.date().optional(),
  ctfIbama: z.string().optional(),

  address: z.string().optional(),
  numero: z.string().optional(),
  bairro: z.string().optional(),
  municipio: z.string().optional(),
  uf: z.string().optional(),
  cep: z.string().optional(),
});

type ClientFormValues = z.infer<typeof formSchema>;
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
const DEFAULT_AI_LOCAL_SOURCE_PATH =
  "F:\\SERVIDOR\\OneDrive\\Projects\\AmbientaR\\Termos de Referencia";
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

interface ClientFormProps {
  currentClient?: Client | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ClientForm({
  currentClient,
  onSuccess,
  onCancel,
}: ClientFormProps) {
  const [loading, setLoading] = React.useState(false);
  const [isAutofilling, setIsAutofilling] = React.useState(false);
  const [autofillSuggestions, setAutofillSuggestions] = React.useState<
    AutofillSuggestion[]
  >([]);
  const [showOnlyBlockedSuggestions, setShowOnlyBlockedSuggestions] =
    React.useState(false);
  const { toast } = useToast();
  const { firestore, auth, user } = useFirebase();

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentClient?.name || "",
      cpfCnpj: currentClient?.cpfCnpj || "",
      entityType: currentClient?.entityType || undefined,
      phone: currentClient?.phone || "",
      email: currentClient?.email || "",
      identidade: currentClient?.identidade || "",
      emissor: currentClient?.emissor || "",
      nacionalidade: currentClient?.nacionalidade || "Brasileira",
      estadoCivil: currentClient?.estadoCivil || "",
      dataNascimento: currentClient?.dataNascimento
        ? new Date(currentClient.dataNascimento)
        : undefined,
      ctfIbama: currentClient?.ctfIbama || "",
      address: currentClient?.address || "",
      numero: currentClient?.numero || "",
      bairro: currentClient?.bairro || "",
      municipio: currentClient?.municipio || "",
      uf: currentClient?.uf || "",
      cep: currentClient?.cep || "",
    },
  });

  const selectedUf = form.watch("uf");

  const citiesForSelectedUf = React.useMemo(() => {
    return (
      ibgeData.statesWithCities.find((state) => state.sigla === selectedUf)
        ?.cidades || []
    );
  }, [selectedUf]);

  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");

    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d)/, "$1.$2");
      value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    } else {
      value = value.replace(/^(\d{2})(\d)/, "$1.$2");
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      value = value.replace(/\.(\d{3})(\d)/, ".$1/$2");
      value = value.replace(/(\d{4})(\d)/, "$1-$2");
    }

    form.setValue("cpfCnpj", value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.substring(0, 11);

    if (value.length > 10) {
      value = value.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (value.length > 5) {
      value = value.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (value.length > 2) {
      value = value.replace(/^(\d\d)(\d{0,5}).*/, "($1) $2");
    } else {
      value = value.replace(/^(\d*)/, "($1");
    }

    form.setValue("phone", value);
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 8) value = value.substring(0, 8);
    value = value.replace(/(\d{5})(\d)/, "$1-$2");
    form.setValue("cep", value);
  };

  const normalizeDocument = (value: string | undefined | null) =>
    (value || "").replace(/\D/g, "");
  const formatCpf = (digits: string) =>
    digits
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  const formatCnpj = (digits: string) =>
    digits
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  const buildDocumentVariants = (raw: string) => {
    const digits = normalizeDocument(raw);
    if (!digits) return [];
    const variants = new Set<string>([raw, digits]);
    if (digits.length === 11) variants.add(formatCpf(digits));
    if (digits.length === 14) variants.add(formatCnpj(digits));
    return Array.from(variants).filter(Boolean);
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
        clientId: currentClient?.id || null,
        userId: user?.id || null,
        userRole: user?.role || null,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.warn("Falha ao registrar log de autofill (clientes):", error);
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

    if (s.field === "dataNascimento") {
      const parsed = new Date(s.suggestedValue);
      if (!Number.isNaN(parsed.getTime())) {
        form.setValue("dataNascimento", parsed, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    } else {
      form.setValue(
        s.field as keyof ClientFormValues,
        s.suggestedValue as never,
        {
          shouldDirty: true,
          shouldValidate: true,
        },
      );
    }
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
      applySuggestion(s);
    });
    toast({
      title: "Aplicação concluída",
      description: `${appliedCount} sugestão(ões) aplicada(s). ${blockedCount} bloqueada(s) por confiança baixa.`,
    });
  };

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
      const variants = buildDocumentVariants(cpfCnpj).slice(0, 10);
      const [clientsSnap, empreendedoresSnap] = await Promise.all([
        getDocs(
          query(
            collection(firestore, "clients"),
            where("cpfCnpj", "in", variants),
          ),
        ),
        getDocs(
          query(
            collection(firestore, "empreendedores"),
            where("cpfCnpj", "in", variants),
          ),
        ),
      ]);
      const clients: Array<Partial<Client> & { id: string }> = clientsSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Partial<Client>),
      }));
      const empreendedores: Array<Partial<Empreendedor> & { id: string }> = empreendedoresSnap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Partial<Empreendedor>),
      }));
      const normalizedTarget = normalizeDocument(cpfCnpj);
      const byDocMatch = (item: Record<string, unknown>) =>
        normalizeDocument(String(item.cpfCnpj || "")) === normalizedTarget;
      const matchedClient = clients.find(byDocMatch) || clients[0];
      const matchedEmp = empreendedores.find(byDocMatch) || empreendedores[0];

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
        if (matchedClient.dataNascimento)
          addHard(
            "dataNascimento",
            String(matchedClient.dataNascimento).slice(0, 10),
            src,
          );
      }
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
        if (matchedEmp.dataNascimento)
          addHard(
            "dataNascimento",
            String(matchedEmp.dataNascimento).slice(0, 10),
            src,
          );
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
        const requestLocalImport = async (modifiedAfter?: string) => {
          const res = await fetch("/api/ai-lab/import-reference-files", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              basePath: configuredPath,
              extensions:
                configuredExtensions.length > 0
                  ? configuredExtensions
                  : DEFAULT_AI_LOCAL_SOURCE_EXTENSIONS,
              cpfCnpj: digits,
              modifiedAfter: modifiedAfter || undefined,
            }),
          });
          const data = await res.json();
          return { res, data };
        };

        let { res: localRes, data: localData } = await requestLocalImport(
          configuredModifiedAfter || undefined,
        );
        if (
          configuredModifiedAfter &&
          localRes.ok &&
          localData?.success &&
          Array.isArray(localData.imported) &&
          localData.imported.length === 0
        ) {
          // Fallback: se o filtro de data esvaziar a busca, tenta novamente sem data.
          const retried = await requestLocalImport(undefined);
          localRes = retried.res;
          localData = retried.data;
        }

        if (
          localRes.ok &&
          localData?.success &&
          Array.isArray(localData.imported)
        ) {
          localMatchedByCpfCount = Number(localData?.matchedByCpfCount || 0);
          const docVariants = buildDocumentVariants(cpfCnpj).map((v) =>
            normalizeDocument(v),
          );
          const matchedLocal = localData.imported
            .filter(
              (item: {
                content?: string;
                title?: string;
                sourcePath?: string;
              }) => {
                const normalizedContent = normalizeDocument(item.content || "");
                const normalizedTitle = normalizeDocument(item.title || "");
                const normalizedSourcePath = normalizeDocument(
                  item.sourcePath || "",
                );
                return docVariants.some(
                  (variant) =>
                    variant &&
                    (normalizedContent.includes(variant) ||
                      normalizedTitle.includes(variant) ||
                      normalizedSourcePath.includes(variant)),
                );
              },
            )
            .slice(0, 8);
          localEvidenceCitations = matchedLocal.map(
            (item: { sourcePath?: string; title?: string }) =>
              `local:${item.sourcePath || item.title || "arquivo_local"}`,
          );
          localEvidenceText = matchedLocal
            .map(
              (item: {
                title?: string;
                sourcePath?: string;
                content?: string;
              }) =>
                `[Arquivo Local] ${item.title || "sem_titulo"} (${item.sourcePath || "sem_caminho"})\n${(item.content || "").slice(0, 1200)}`,
            )
            .join("\n\n");
        }
      } catch (error) {
        console.warn("Falha ao buscar evidências locais (clientes):", error);
      }

      if (
        !matchedClient &&
        !matchedEmp &&
        hardSuggestions.length === 0 &&
        !localEvidenceText
      ) {
        toast({
          title: "Sem contexto encontrado",
          description:
            "Nenhum cadastro vinculado a este CPF/CNPJ na base interna ou pasta local.",
        });
        return;
      }

      const hardContextJson = JSON.stringify(
        {
          matchedClient: matchedClient || null,
          matchedEmpreendedor: matchedEmp || null,
        },
        null,
        2,
      );
      const evidenceText = [matchedClient, matchedEmp]
        .filter(Boolean)
        .map((x) => JSON.stringify(x, null, 2))
        .join("\n\n")
        .concat(localEvidenceText ? `\n\n${localEvidenceText}` : "");

      const llmRes = await fetch("/api/ai-lab/autofill-empreendedor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      if (localEvidenceCitations.length > 0) {
        merged.forEach((s) => {
          s.sourceCitations = Array.from(
            new Set([...(s.sourceCitations || []), ...localEvidenceCitations]),
          );
        });
      }
      setAutofillSuggestions(merged);
      toast({
        title: "Sugestões prontas",
        description: `${merged.length} sugestão(ões) para revisão. Arquivos locais com CPF/CNPJ: ${localMatchedByCpfCount}.`,
      });
    } catch (error) {
      console.error("Autofill clientes falhou:", error);
      toast({
        variant: "destructive",
        title: "Falha no preenchimento automático",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível gerar sugestões.",
      });
    } finally {
      setIsAutofilling(false);
    }
  };

  const visibleAutofillSuggestions = showOnlyBlockedSuggestions
    ? autofillSuggestions.filter((s) => isSuggestionBlocked(s))
    : autofillSuggestions;

  async function onSubmit(values: ClientFormValues) {
    setLoading(true);

    if (!firestore || !auth) {
      toast({ variant: "destructive", title: "Firebase não inicializado." });
      setLoading(false);
      return;
    }

    const dataToSave: Partial<Client> = {
      ...values,
      dataNascimento: values.dataNascimento?.toISOString(),
    };

    if (currentClient) {
      const clientRef = doc(firestore, "clients", currentClient.id);
      const isOwnClient =
        isClientePortalRole(user?.role) && user?.id === currentClient.id;
      updateDoc(clientRef, dataToSave)
        .then(async () => {
          if (isOwnClient && user?.id) {
            try {
              await updateDoc(doc(firestore, "users", user.id), {
                cadastroIncompleto: false,
              });
            } catch (_) {}
          }
          toast({
            title: "Cliente atualizado!",
            description: "As informações do cliente foram salvas com sucesso.",
          });
          logUserAction(firestore, auth, "update_client", {
            clientId: currentClient.id,
            clientName: values.name,
          });
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: clientRef.path,
            operation: "update",
            requestResourceData: dataToSave,
          });
          errorEmitter.emit("permission-error", permissionError);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      const clientsCollectionRef = collection(firestore, "clients");
      addDoc(clientsCollectionRef, dataToSave)
        .then((docRef) => {
          toast({
            title: "Cliente criado!",
            description: `O cliente ${values.name} foi adicionado com sucesso.`,
          });
          logUserAction(firestore, auth, "create_client", {
            clientId: docRef.id,
            clientName: values.name,
          });
          form.reset();
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({
            path: clientsCollectionRef.path,
            operation: "create",
            requestResourceData: dataToSave,
          });
          errorEmitter.emit("permission-error", permissionError);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                      : "Prenchimento automático"}
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
                  <Input placeholder="Nome do cliente ou empresa" {...field} />
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
                  {isSuggestionBlocked(s) && (
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
                    {(Math.max(0, Math.min(1, s.confidence)) * 100).toFixed(0)}%
                    | {s.reason}
                  </p>
                  {s.sourceCitations && s.sourceCitations.length > 0 && (
                    <p className="text-muted-foreground">
                      Fonte: {s.sourceCitations.join(", ")}
                    </p>
                  )}
                  <div className="pt-1 flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => applySuggestion(s)}
                      disabled={isSuggestionBlocked(s)}
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
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Tipo de Pessoa</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex flex-col space-y-1 md:flex-row md:space-y-0 md:space-x-4"
                  >
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="Pessoa Física" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Pessoa Física
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="Pessoa Jurídica" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Pessoa Jurídica
                      </FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-3 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="Produtor Rural" />
                      </FormControl>
                      <FormLabel className="font-normal">
                        Produtor Rural (PR)
                      </FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4 rounded-md border p-4">
          <h3 className="text-lg font-medium">Documentação</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="identidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Identidade (RG)</FormLabel>
                  <FormControl>
                    <Input placeholder="Número do documento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="emissor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Órgão Emissor</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: SSP/MG" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nacionalidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nacionalidade</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="estadoCivil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado Civil</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Solteiro(a)">Solteiro(a)</SelectItem>
                      <SelectItem value="Casado(a)">Casado(a)</SelectItem>
                      <SelectItem value="Divorciado(a)">
                        Divorciado(a)
                      </SelectItem>
                      <SelectItem value="Viúvo(a)">Viúvo(a)</SelectItem>
                      <SelectItem value="União Estável">
                        União Estável
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="dataNascimento"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Nascimento</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      value={
                        field.value
                          ? field.value.toISOString().slice(0, 10)
                          : ""
                      }
                      onChange={(e) => {
                        const v = e.target.value;
                        if (!v) {
                          field.onChange(undefined);
                        } else {
                          const d = new Date(v);
                          if (!isNaN(d.getTime())) {
                            field.onChange(d);
                          }
                        }
                      }}
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
                  <FormLabel>Bairro/Distrito</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
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
                    <Input
                      placeholder="00000-000"
                      {...field}
                      onChange={handleCepChange}
                      maxLength={9}
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

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
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
