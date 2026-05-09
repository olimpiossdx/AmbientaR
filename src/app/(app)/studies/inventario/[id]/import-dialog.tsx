"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileCode,
  SearchX,
  Leaf,
  Fence,
  Check,
  AlertCircle,
  ChevronsRight,
  ChevronsLeft,
  ArrowLeftRight,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import * as XLSX from "@e965/xlsx";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { useFirebase } from "@/firebase";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";

const steps = [
  { label: "Carregar Arquivo", icon: Upload },
  { label: "Associar", icon: FileCode },
  { label: "Inconsistências", icon: SearchX },
  { label: "Lista de Espécies", icon: Leaf },
  { label: "Lista de Parcelas", icon: Fence },
  { label: "Conferir Informações", icon: Check },
];

const softwareColumns = [
  "Nome",
  "Parcela",
  "Área da Parcela",
  "Alt. Comercial",
  "Alt. Total",
  "CAP",
  "DAP",
  "Cód. Classe Reg.",
  "Cód. Espécie",
  "Comp. Copa",
  "Família",
];

type LimitRule = {
  field: string;
  min: number;
  max: number;
};

type InconsistencyItem = {
  row: number;
  field: string;
  error: string;
  action: string;
};

type SpeciesItem = {
  id: string;
  codigoEspecie: string;
  nomeCientifico: string;
  nomeComum: string;
  familia: string;
};

type ParcelItem = {
  id: string;
  parcela: string;
  areaM2: string;
  up: string;
  us: string;
  ni: string;
  regNatural: boolean;
  selected: boolean;
};

type ReviewRow = {
  parcela: string;
  numArvore: string;
  nomeComum: string;
  nomeCientifico: string;
  cap: string;
  altTotal: string;
  dap: string;
  areaParcela: string;
};

function normalizeString(value: unknown): string {
  return String(value ?? "").trim().toLowerCase();
}

function parseNumeric(value: unknown): number | null {
  if (value == null || value === "") return null;
  const raw = String(value).trim().replace(",", ".");
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
}

function toTitleCase(value: string): string {
  return value
    .split(" ")
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}` : word))
    .join(" ");
}

interface ImportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
}

export function ImportDialog({ isOpen, onOpenChange, projectId }: ImportDialogProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [workbook, setWorkbook] = React.useState<XLSX.WorkBook | null>(null);
  const [sheetNames, setSheetNames] = React.useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = React.useState<string>("");
  const [sheetHeaders, setSheetHeaders] = React.useState<string[]>([]);
  const [sheetData, setSheetData] = React.useState<any[]>([]);

  const [selectedPlanilhaColumn, setSelectedPlanilhaColumn] = React.useState<
    string | null
  >(null);
  const [selectedSoftwareColumn, setSelectedSoftwareColumn] = React.useState<
    string | null
  >(null);
  const [associations, setAssociations] = React.useState<
    Record<string, string>
  >({});
  const [limitRules, setLimitRules] = React.useState<LimitRule[]>([]);
  const [inconsistencies, setInconsistencies] = React.useState<InconsistencyItem[]>([]);
  const [speciesList, setSpeciesList] = React.useState<SpeciesItem[]>([]);
  const [editingSpeciesId, setEditingSpeciesId] = React.useState<string | null>(null);
  const [parcelList, setParcelList] = React.useState<ParcelItem[]>([]);
  const [isFillParcelDialogOpen, setIsFillParcelDialogOpen] = React.useState(false);
  const [fillField, setFillField] = React.useState<"areaM2" | "up" | "us" | "ni">("areaM2");
  const [fillValue, setFillValue] = React.useState("");
  const [fillTarget, setFillTarget] = React.useState<"all" | "selected" | "filter">("all");
  const [fillFilterColumn, setFillFilterColumn] = React.useState<"parcela" | "up" | "us" | "ni">("parcela");
  const [fillFilterValue, setFillFilterValue] = React.useState("");
  const [isImportingNow, setIsImportingNow] = React.useState(false);
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputEl = event.currentTarget;
    const file = inputEl.files?.[0];
    if (file) {
      // Permite selecionar o mesmo arquivo novamente sem depender do estado anterior do input.
      inputEl.value = "";
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        if (wb.SheetNames.length > 0) {
          const firstSheet = wb.SheetNames[0];
          setSelectedSheet(firstSheet);
          processSheet(wb, firstSheet);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const processSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) return;
    const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    if (jsonData.length > 0) {
      const headers = (jsonData[0] as string[]).filter((h) => h); // Filter out empty headers
      setSheetHeaders(headers);
      const data = jsonData.slice(1).map((row) => {
        const rowData: { [key: string]: any } = {};
        headers.forEach((header, index) => {
          rowData[header] = row[index];
        });
        return rowData;
      });
      setSheetData(data);
    } else {
      setSheetHeaders([]);
      setSheetData([]);
    }
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbook) {
      processSheet(workbook, sheetName);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Parcela",
      "Área da Parcela",
      "Núm. Árvore",
      "Nome Científico",
      "Nome Comum",
      "Família",
      "CAP",
      "Alt. Total",
      "Alt. Comercial",
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "IMPORTAR");
    XLSX.writeFile(wb, "ModeloDePlanilhaParaImportacao.xlsx");
  };

  const handleAssociate = () => {
    if (selectedPlanilhaColumn && selectedSoftwareColumn) {
      setAssociations((prev) => ({
        ...prev,
        [selectedPlanilhaColumn]: selectedSoftwareColumn,
      }));
      setSelectedPlanilhaColumn(null);
      setSelectedSoftwareColumn(null);
    }
  };

  const handleAutoAssociate = () => {
    const newAssociations: Record<string, string> = {};
    const availableSoftwareCols = [...softwareColumns];

    sheetHeaders.forEach((planilhaCol) => {
      const matchIndex = availableSoftwareCols.findIndex(
        (softwareCol) =>
          softwareCol.toLowerCase() === planilhaCol.toLowerCase(),
      );
      if (matchIndex > -1) {
        newAssociations[planilhaCol] = availableSoftwareCols[matchIndex];
        availableSoftwareCols.splice(matchIndex, 1);
      }
    });
    setAssociations((prev) => ({ ...prev, ...newAssociations }));
  };

  const handleRemoveAssociation = (planilhaColumn: string) => {
    setAssociations((prev) => {
      const newAssocs = { ...prev };
      delete newAssocs[planilhaColumn];
      return newAssocs;
    });
  };

  const unassociatedPlanilhaCols = sheetHeaders.filter(
    (h) => !Object.keys(associations).includes(h),
  );
  const unassociatedSoftwareCols = softwareColumns.filter(
    (sc) => !Object.values(associations).includes(sc),
  );

  const associationBySoftware = React.useMemo(() => {
    const reversed: Record<string, string> = {};
    Object.entries(associations).forEach(([sheetCol, softwareCol]) => {
      reversed[softwareCol] = sheetCol;
    });
    return reversed;
  }, [associations]);

  const buildDefaultLimitRules = React.useCallback((): LimitRule[] => {
    const candidates = ["Parcela", "Núm. Árvore", "CAP", "DAP", "Alt. Total"];

    return candidates.map((field) => {
      const sourceColumn = associationBySoftware[field] ?? field;
      const values = sheetData
        .map((row) => parseNumeric(row?.[sourceColumn]))
        .filter((n): n is number => n != null);

      if (!values.length) {
        return { field, min: 0, max: 0 };
      }
      const min = Math.min(...values);
      const max = Math.max(...values);
      return {
        field,
        min: Number(min.toFixed(2)),
        max: Number(max.toFixed(2)),
      };
    });
  }, [associationBySoftware, sheetData]);

  const runInconsistencyCheck = React.useCallback(
    (rulesToUse: LimitRule[]) => {
      const issues: InconsistencyItem[] = [];

      const parcelaColumn = associationBySoftware["Parcela"] ?? "Parcela";
      const arvoreColumn = associationBySoftware["Núm. Árvore"] ?? "Núm. Árvore";
      const especieColumn =
        associationBySoftware["Nome"] ??
        associationBySoftware["Nome Comum"] ??
        associationBySoftware["Nome Científico"];

      sheetData.forEach((row, index) => {
        const lineNumber = index + 2; // +2 porque a linha 1 costuma ser cabeçalho

        if (!normalizeString(row?.[parcelaColumn])) {
          issues.push({
            row: lineNumber,
            field: "Parcela",
            error: "Parcela não informada.",
            action: "Preencher a parcela na planilha.",
          });
        }

        if (!normalizeString(row?.[arvoreColumn])) {
          issues.push({
            row: lineNumber,
            field: "Núm. Árvore",
            error: "Número da árvore não informado.",
            action: "Preencher a identificação da árvore.",
          });
        }

        if (especieColumn && !normalizeString(row?.[especieColumn])) {
          issues.push({
            row: lineNumber,
            field: toTitleCase(especieColumn),
            error: "Espécie sem identificação.",
            action: "Informar nome comum/científico da espécie.",
          });
        }

        rulesToUse.forEach((rule) => {
          const sourceColumn = associationBySoftware[rule.field] ?? rule.field;
          const numeric = parseNumeric(row?.[sourceColumn]);
          if (numeric == null) return;

          if (numeric < rule.min || numeric > rule.max) {
            issues.push({
              row: lineNumber,
              field: rule.field,
              error: `Valor fora do limite (${rule.min} a ${rule.max}).`,
              action: "Revisar medição ou ajustar limite.",
            });
          }
        });
      });

      setInconsistencies(issues);
    },
    [associationBySoftware, sheetData]
  );

  React.useEffect(() => {
    if (currentStep !== 2) return;
    const defaults = buildDefaultLimitRules();
    setLimitRules(defaults);
    runInconsistencyCheck(defaults);
  }, [currentStep, buildDefaultLimitRules, runInconsistencyCheck]);

  const updateLimitRule = (field: string, key: "min" | "max", value: string) => {
    const parsed = parseNumeric(value);
    setLimitRules((prev) =>
      prev.map((rule) =>
        rule.field === field
          ? { ...rule, [key]: parsed ?? 0 }
          : rule
      )
    );
  };

  const buildSpeciesList = React.useCallback((): SpeciesItem[] => {
    const getMappedColumn = (...softwareNames: string[]) => {
      for (const name of softwareNames) {
        if (associationBySoftware[name]) return associationBySoftware[name];
      }
      for (const name of softwareNames) {
        if (sheetHeaders.includes(name)) return name;
      }
      return "";
    };

    const codigoCol = getMappedColumn("Cód. Espécie", "Código Espécie", "Cod Especie");
    const cientificoCol = getMappedColumn("Nome Científico");
    const comumCol = getMappedColumn("Nome Comum", "Nome");
    const familiaCol = getMappedColumn("Família");

    const map = new Map<string, SpeciesItem>();
    let autoCode = 1;

    sheetData.forEach((row) => {
      const nomeCientifico = String(row?.[cientificoCol] ?? "").trim();
      const nomeComum = String(row?.[comumCol] ?? "").trim();
      const familia = String(row?.[familiaCol] ?? "").trim();
      const codigoOriginal = String(row?.[codigoCol] ?? "").trim();

      if (!nomeCientifico && !nomeComum) return;

      const key = `${nomeCientifico.toLowerCase()}|${nomeComum.toLowerCase()}|${familia.toLowerCase()}`;
      if (map.has(key)) return;

      map.set(key, {
        id: key,
        codigoEspecie: codigoOriginal || String(autoCode++),
        nomeCientifico,
        nomeComum,
        familia,
      });
    });

    return Array.from(map.values());
  }, [associationBySoftware, sheetData, sheetHeaders]);

  React.useEffect(() => {
    if (currentStep !== 3) return;
    setSpeciesList(buildSpeciesList());
  }, [currentStep, buildSpeciesList]);

  const updateSpeciesField = (
    id: string,
    field: keyof Pick<SpeciesItem, "codigoEspecie" | "nomeCientifico" | "nomeComum" | "familia">,
    value: string
  ) => {
    setSpeciesList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const buildParcelList = React.useCallback((): ParcelItem[] => {
    const getMappedColumn = (...softwareNames: string[]) => {
      for (const name of softwareNames) {
        if (associationBySoftware[name]) return associationBySoftware[name];
      }
      for (const name of softwareNames) {
        if (sheetHeaders.includes(name)) return name;
      }
      return "";
    };

    const parcelaCol = getMappedColumn("Parcela");
    const areaCol = getMappedColumn("Área da Parcela");
    const upCol = getMappedColumn("UP", "U.P", "Unidade Primária");
    const usCol = getMappedColumn("US", "U.S", "Unidade Secundária");
    const niCol = getMappedColumn("NI", "Nível de Inclusão");
    const regNaturalCol = getMappedColumn("Reg. Natural", "Reg Natural", "Regeneração Natural");

    const map = new Map<string, ParcelItem>();
    let fallbackIndex = 1;

    sheetData.forEach((row) => {
      const parcela = String(row?.[parcelaCol] ?? "").trim() || String(fallbackIndex++);
      if (map.has(parcela)) return;

      const regRaw = normalizeString(row?.[regNaturalCol]);
      const regNatural =
        regRaw === "1" || regRaw === "sim" || regRaw === "true" || regRaw === "x";

      map.set(parcela, {
        id: parcela,
        parcela,
        areaM2: String(row?.[areaCol] ?? "").trim(),
        up: String(row?.[upCol] ?? "").trim(),
        us: String(row?.[usCol] ?? "").trim(),
        ni: String(row?.[niCol] ?? "").trim(),
        regNatural,
        selected: false,
      });
    });

    return Array.from(map.values()).sort((a, b) => {
      const an = Number(a.parcela);
      const bn = Number(b.parcela);
      if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
      return a.parcela.localeCompare(b.parcela);
    });
  }, [associationBySoftware, sheetData, sheetHeaders]);

  React.useEffect(() => {
    if (currentStep !== 4) return;
    setParcelList(buildParcelList());
  }, [currentStep, buildParcelList]);

  const applyFillValuesToParcels = () => {
    const normalizedFilter = normalizeString(fillFilterValue);

    setParcelList((prev) =>
      prev.map((item) => {
        const matchByTarget =
          fillTarget === "all" ||
          (fillTarget === "selected" && item.selected) ||
          (fillTarget === "filter" &&
            normalizeString(item[fillFilterColumn as keyof ParcelItem]).includes(normalizedFilter));

        if (!matchByTarget) return item;
        return { ...item, [fillField]: fillValue };
      })
    );

    setIsFillParcelDialogOpen(false);
  };

  const reviewRows = React.useMemo<ReviewRow[]>(() => {
    const getMappedColumn = (...softwareNames: string[]) => {
      for (const name of softwareNames) {
        if (associationBySoftware[name]) return associationBySoftware[name];
      }
      for (const name of softwareNames) {
        if (sheetHeaders.includes(name)) return name;
      }
      return "";
    };

    const parcelaCol = getMappedColumn("Parcela");
    const numArvoreCol = getMappedColumn("Núm. Árvore", "Num. Árvore");
    const nomeComumCol = getMappedColumn("Nome Comum", "Nome");
    const nomeCientificoCol = getMappedColumn("Nome Científico");
    const capCol = getMappedColumn("CAP");
    const altTotalCol = getMappedColumn("Alt. Total");
    const dapCol = getMappedColumn("DAP");
    const areaCol = getMappedColumn("Área da Parcela");

    return sheetData.map((row) => ({
      parcela: String(row?.[parcelaCol] ?? ""),
      numArvore: String(row?.[numArvoreCol] ?? ""),
      nomeComum: String(row?.[nomeComumCol] ?? ""),
      nomeCientifico: String(row?.[nomeCientificoCol] ?? ""),
      cap: String(row?.[capCol] ?? ""),
      altTotal: String(row?.[altTotalCol] ?? ""),
      dap: String(row?.[dapCol] ?? ""),
      areaParcela: String(row?.[areaCol] ?? ""),
    }));
  }, [associationBySoftware, sheetData, sheetHeaders]);

  const handleImport = async () => {
    if (!projectId || !firestore) {
      toast({
        variant: "destructive",
        title: "Projeto indisponível",
        description: "Não foi possível identificar o projeto para salvar os dados importados.",
      });
      return;
    }

    setIsImportingNow(true);
    try {
      const importedSpecies = speciesList.map((item) => ({
        id: item.id,
        codigoEspecie: item.codigoEspecie,
        nomeCientifico: item.nomeCientifico,
        nomeComum: item.nomeComum,
        familia: item.familia,
      }));

      const importedParcels = parcelList.map((item) => ({
        id: item.id,
        parcela: item.parcela,
        areaM2: item.areaM2,
        up: item.up,
        us: item.us,
        ni: item.ni,
        regNatural: item.regNatural,
      }));

      const importedTrees = reviewRows.map((row, index) => ({
        id: `${row.parcela || "parcela"}-${row.numArvore || index}-${index}`,
        parcela: row.parcela,
        numArvore: row.numArvore,
        nomeComum: row.nomeComum,
        nomeCientifico: row.nomeCientifico,
        cap: row.cap,
        altTotal: row.altTotal,
        dap: row.dap,
        areaParcela: row.areaParcela,
      }));

      const ref = doc(firestore, "inventories", projectId);
      await updateDoc(ref, {
        importedSpecies,
        importedParcels,
        importedTrees,
        importSummary: {
          importedAt: serverTimestamp(),
          totalSpecies: importedSpecies.length,
          totalParcels: importedParcels.length,
          totalTrees: importedTrees.length,
        },
        updatedAt: serverTimestamp(),
      });

      toast({
        title: "Importação concluída",
        description: `Espécies: ${importedSpecies.length}, Parcelas: ${importedParcels.length}, Árvores: ${importedTrees.length}.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao importar",
        description: (error as Error).message || "Falha ao salvar dados importados.",
      });
    } finally {
      setIsImportingNow(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Importar Planilha</DialogTitle>
          <DialogDescription>Fluxo guiado de importação de planilha.</DialogDescription>
        </DialogHeader>

        <div className="px-4 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-1 border rounded-sm bg-background p-1">
            {steps.map((step, index) => (
              <button
                key={step.label}
                type="button"
                onClick={() => setCurrentStep(index)}
                className={cn(
                  "h-10 px-2 text-xs md:text-sm rounded-sm border flex items-center justify-center gap-2 transition-colors",
                  index === currentStep
                    ? "bg-green-700 text-white border-green-700"
                    : "bg-muted/30 text-foreground border-border hover:bg-muted",
                )}
              >
                <step.icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{step.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-hidden px-4 py-3">
          <div className="p-3 border rounded-sm h-full flex flex-col bg-background">
            {currentStep === 0 && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">Arquivo escolhido:</h3>
                    <div className="flex items-center gap-3 border rounded-sm px-2 py-2 min-h-16">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 bg-green-700 hover:bg-green-800 text-white border-green-700"
                        onClick={handleUploadClick}
                      >
                        <Upload className="h-5 w-5" />
                      </Button>
                      <div>
                        <p className="text-sm leading-tight">
                          {fileName ||
                            "Clique no botão ao lado para escolher um arquivo excel."}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          O arquivo não deve conter mais de 10000 linhas.
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".xls,.xlsx"
                          onChange={handleFileChange}
                          className="hidden"
                          aria-label="Ficheiro Excel para importação"
                          title="Ficheiro Excel para importação"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">Planilha escolhida:</h3>
                    <Select
                      disabled={!fileName}
                      value={selectedSheet}
                      onValueChange={handleSheetChange}
                    >
                      <SelectTrigger className="rounded-sm">
                        <SelectValue placeholder="Escolha a aba da planilha" />
                      </SelectTrigger>
                      <SelectContent>
                        {sheetNames.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3 flex-1 border rounded-sm overflow-hidden flex flex-col">
                  <div className="px-3 py-2 bg-muted/40 border-b text-sm font-medium">
                    Dados da Planilha
                  </div>
                  <ScrollArea className="flex-1">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {sheetHeaders.map((header) => (
                            <TableHead key={header}>{header}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sheetData.length > 0 ? (
                          sheetData.slice(0, 100).map((row, rowIndex) => (
                            <TableRow key={rowIndex}>
                              {sheetHeaders.map((header) => (
                                <TableCell key={header}>
                                  {row[header]}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={sheetHeaders.length || 1}
                              className="h-48 text-center text-muted-foreground"
                            >
                              {fileName
                                ? "Sem dados para mostrar nesta aba."
                                : "Aguardando arquivo..."}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </>
            )}
            {currentStep === 1 && (
              <div className="flex flex-col h-full gap-3">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  <Alert className="rounded-sm border">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Atenção</AlertTitle>
                    <AlertDescription>
                      Sua tabela deverá ter, pelo menos, as seguintes colunas:
                      <ul className="list-disc pl-5 mt-1">
                        <li>Parcela</li>
                        <li>Número da Árvore</li>
                        <li>
                          Nome Comum (ou pelo menos uma informação da espécie)
                        </li>
                      </ul>
                      O limite de caracteres para os campos nome científico,
                      nome comum e família é de 250.
                    </AlertDescription>
                  </Alert>
                  <div className="p-3 border rounded-sm text-sm space-y-3 bg-muted/10">
                    <div>
                      <Label>Eu possuo CAP ou DAP?</Label>
                      <RadioGroup
                        defaultValue="cap"
                        className="flex items-center space-x-4 mt-1"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cap" id="cap" />
                          <Label htmlFor="cap" className="font-normal">
                            CAP
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="dap" id="dap" />
                          <Label htmlFor="dap" className="font-normal">
                            DAP
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                    <div className="flex items-center space-x-2 pt-2">
                      <Checkbox id="calculate-dap" />
                      <Label htmlFor="calculate-dap" className="font-normal">
                        Calcular automaticamente o DAP
                      </Label>
                    </div>
                    <div className="mt-4">
                      <Label>Unidade do CAP/DAP</Label>
                      <Select defaultValue="cm">
                        <SelectTrigger className="mt-1 h-9 rounded-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cm">Centímetro</SelectItem>
                          <SelectItem value="m">Metro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_220px_1fr_1.25fr] gap-3 overflow-hidden min-h-0">
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Colunas da Planilha</Label>
                    <ScrollArea className="border rounded-sm flex-1 min-h-[220px] bg-background">
                      <div className="p-2">
                        {unassociatedPlanilhaCols.map((header) => (
                          <div
                            key={header}
                            onClick={() => setSelectedPlanilhaColumn(header)}
                            className={cn(
                              "p-1.5 rounded-sm cursor-pointer text-sm",
                              selectedPlanilhaColumn === header &&
                                "bg-green-700 text-white",
                            )}
                          >
                            {header}
                          </div>
                        ))}
                        {unassociatedPlanilhaCols.length === 0 && (
                          <p className="text-xs text-muted-foreground p-2">Todas as colunas já foram associadas.</p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="flex flex-col gap-2 justify-center">
                    <Button
                      variant="secondary"
                      className="bg-green-700 hover:bg-green-800 text-white h-10 rounded-sm"
                      onClick={handleAutoAssociate}
                    >
                      <ChevronsRight className="mr-2 h-4 w-4" /> Auto Associar
                    </Button>
                    <Button
                      variant="secondary"
                      className="bg-green-700 hover:bg-green-800 text-white h-10 rounded-sm"
                      onClick={handleAssociate}
                      disabled={!selectedPlanilhaColumn || !selectedSoftwareColumn}
                    >
                      <ArrowLeftRight className="mr-2 h-4 w-4" /> Associar
                    </Button>
                    <Button
                      variant="secondary"
                      className="bg-red-600 hover:bg-red-700 text-white h-10 rounded-sm"
                      onClick={() =>
                        selectedPlanilhaColumn &&
                        handleRemoveAssociation(selectedPlanilhaColumn)
                      }
                      disabled={!selectedPlanilhaColumn}
                    >
                      <ChevronsLeft className="mr-2 h-4 w-4" /> Remover
                      Associação
                    </Button>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Colunas do Software</Label>
                    <ScrollArea className="border rounded-sm flex-1 min-h-[220px] bg-background">
                      <div className="p-2">
                        {unassociatedSoftwareCols.map((col) => (
                          <div
                            key={col}
                            onClick={() => setSelectedSoftwareColumn(col)}
                            className={cn(
                              "p-1.5 rounded-sm cursor-pointer text-sm",
                              selectedSoftwareColumn === col &&
                                "bg-green-700 text-white",
                            )}
                          >
                            {col}
                          </div>
                        ))}
                        {unassociatedSoftwareCols.length === 0 && (
                          <p className="text-xs text-muted-foreground p-2">Sem colunas restantes do software.</p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  <div className="flex flex-col gap-2 min-h-0">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Campos Associados</Label>
                    <ScrollArea className="border rounded-sm flex-1 min-h-[220px] bg-background">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Colunas da planilha</TableHead>
                            <TableHead>Colunas do software</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(associations).map(
                            ([planilhaCol, softwareCol]) => (
                              <TableRow
                                key={planilhaCol}
                                onClick={() =>
                                  handleRemoveAssociation(planilhaCol)
                                }
                                className="cursor-pointer"
                              >
                                <TableCell>{planilhaCol}</TableCell>
                                <TableCell>{softwareCol}</TableCell>
                              </TableRow>
                            ),
                          )}
                          {Object.keys(associations).length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={2}
                                className="text-center text-xs text-muted-foreground h-24"
                              >
                                Sem linhas para mostrar
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            )}
            {currentStep === 2 && (
              <div className="flex flex-col h-full gap-3">
                <Alert className="rounded-sm border">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Atenção</AlertTitle>
                  <AlertDescription>
                    Você pode mudar os limites abaixo para encontrar possíveis Outliers nos seus dados de campo.
                    O sistema mostrará as informações em <strong>"Erros encontrados"</strong>.
                  </AlertDescription>
                </Alert>

                <div className="border rounded-sm overflow-hidden bg-background">
                  <div className="px-3 py-2 border-b text-sm font-semibold flex items-center justify-between">
                    <span>Verificar Limite de Dados</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => runInconsistencyCheck(limitRules)}
                    >
                      Exibir dados
                    </Button>
                  </div>
                  <div className="overflow-auto max-h-44">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Variável</TableHead>
                          <TableHead>Limite inferior</TableHead>
                          <TableHead>Limite superior</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {limitRules.map((rule) => (
                          <TableRow key={rule.field}>
                            <TableCell>{rule.field}</TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="h-8 rounded-sm"
                                value={rule.min}
                                onChange={(e) => updateLimitRule(rule.field, "min", e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <Input
                                type="number"
                                className="h-8 rounded-sm"
                                value={rule.max}
                                onChange={(e) => updateLimitRule(rule.field, "max", e.target.value)}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="border rounded-sm overflow-hidden bg-background flex-1 min-h-0">
                  <div className="px-3 py-2 border-b text-sm font-semibold">
                    Erros encontrados
                  </div>
                  <ScrollArea className="h-[220px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Linha</TableHead>
                          <TableHead>Campo</TableHead>
                          <TableHead>Erro</TableHead>
                          <TableHead>Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inconsistencies.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="text-center text-xs text-muted-foreground h-24"
                            >
                              Sem linhas para mostrar
                            </TableCell>
                          </TableRow>
                        ) : (
                          inconsistencies.map((item, idx) => (
                            <TableRow key={`${item.row}-${item.field}-${idx}`}>
                              <TableCell>{item.row}</TableCell>
                              <TableCell>{item.field}</TableCell>
                              <TableCell>{item.error}</TableCell>
                              <TableCell>{item.action}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </div>
            )}
            {currentStep === 3 && (
              <div className="flex flex-col h-full gap-3">
                <Alert className="rounded-sm border">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Atenção</AlertTitle>
                  <AlertDescription>
                    Caso as espécies não possuam um código de espécie pré definido, um código será associado a elas no ato de importação.
                  </AlertDescription>
                </Alert>

                <div className="border rounded-sm overflow-hidden bg-background flex-1 min-h-0">
                  <div className="px-3 py-2 border-b text-sm font-semibold">
                    Lista de Espécies ({speciesList.length} encontradas)
                  </div>
                  <ScrollArea className="h-[360px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cód Espécie</TableHead>
                          <TableHead>Nome Científico</TableHead>
                          <TableHead>Nome Comum</TableHead>
                          <TableHead>Família</TableHead>
                          <TableHead>Ação</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {speciesList.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-xs text-muted-foreground h-24">
                              Sem linhas para mostrar
                            </TableCell>
                          </TableRow>
                        ) : (
                          speciesList.map((species) => {
                            const isEditing = editingSpeciesId === species.id;
                            return (
                              <TableRow key={species.id}>
                                <TableCell>
                                  {isEditing ? (
                                    <Input
                                      value={species.codigoEspecie}
                                      className="h-8 rounded-sm"
                                      onChange={(e) => updateSpeciesField(species.id, "codigoEspecie", e.target.value)}
                                    />
                                  ) : (
                                    species.codigoEspecie || "-"
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isEditing ? (
                                    <Input
                                      value={species.nomeCientifico}
                                      className="h-8 rounded-sm"
                                      onChange={(e) => updateSpeciesField(species.id, "nomeCientifico", e.target.value)}
                                    />
                                  ) : (
                                    species.nomeCientifico || "-"
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isEditing ? (
                                    <Input
                                      value={species.nomeComum}
                                      className="h-8 rounded-sm"
                                      onChange={(e) => updateSpeciesField(species.id, "nomeComum", e.target.value)}
                                    />
                                  ) : (
                                    species.nomeComum || "-"
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isEditing ? (
                                    <Input
                                      value={species.familia}
                                      className="h-8 rounded-sm"
                                      onChange={(e) => updateSpeciesField(species.id, "familia", e.target.value)}
                                    />
                                  ) : (
                                    species.familia || "-"
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    size="sm"
                                    className="bg-green-700 hover:bg-green-800 h-8 rounded-sm"
                                    onClick={() => setEditingSpeciesId(isEditing ? null : species.id)}
                                  >
                                    {isEditing ? "Salvar" : "Editar"}
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </div>
            )}
            {currentStep === 4 && (
              <div className="flex flex-col h-full gap-3">
                <div className="border rounded-sm overflow-hidden bg-background flex-1 min-h-0">
                  <div className="px-3 py-2 border-b text-sm font-semibold flex items-center justify-between">
                    <span>Lista de Parcelas ({parcelList.length} encontradas)</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-sm"
                      onClick={() => setIsFillParcelDialogOpen(true)}
                    >
                      Preencher
                    </Button>
                  </div>
                  <ScrollArea className="h-[380px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Parcela</TableHead>
                          <TableHead>Área (m²)</TableHead>
                          <TableHead>UP</TableHead>
                          <TableHead>US</TableHead>
                          <TableHead>NI</TableHead>
                          <TableHead>Reg. Natural</TableHead>
                          <TableHead>Selecionar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parcelList.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-xs text-muted-foreground h-24">
                              Sem linhas para mostrar
                            </TableCell>
                          </TableRow>
                        ) : (
                          parcelList.map((parcel) => (
                            <TableRow key={parcel.id}>
                              <TableCell>{parcel.parcela || "-"}</TableCell>
                              <TableCell>{parcel.areaM2 || "-"}</TableCell>
                              <TableCell>{parcel.up || "-"}</TableCell>
                              <TableCell>{parcel.us || "-"}</TableCell>
                              <TableCell>{parcel.ni || "-"}</TableCell>
                              <TableCell>
                                <Checkbox
                                  checked={parcel.regNatural}
                                  onCheckedChange={(checked) =>
                                    setParcelList((prev) =>
                                      prev.map((item) =>
                                        item.id === parcel.id
                                          ? { ...item, regNatural: Boolean(checked) }
                                          : item
                                      )
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Checkbox
                                  checked={parcel.selected}
                                  onCheckedChange={(checked) =>
                                    setParcelList((prev) =>
                                      prev.map((item) =>
                                        item.id === parcel.id
                                          ? { ...item, selected: Boolean(checked) }
                                          : item
                                      )
                                    )
                                  }
                                />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>

                <Dialog open={isFillParcelDialogOpen} onOpenChange={setIsFillParcelDialogOpen}>
                  <DialogContent className="max-w-xl rounded-sm">
                    <DialogHeader>
                      <DialogTitle>Preencher valores</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label>Campo</Label>
                        <Select
                          value={fillField}
                          onValueChange={(value) => setFillField(value as "areaM2" | "up" | "us" | "ni")}
                        >
                          <SelectTrigger className="h-9 rounded-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="areaM2">Área</SelectItem>
                            <SelectItem value="up">UP</SelectItem>
                            <SelectItem value="us">US</SelectItem>
                            <SelectItem value="ni">NI</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label>Valor</Label>
                        <Input
                          value={fillValue}
                          onChange={(e) => setFillValue(e.target.value)}
                          placeholder="Ex.: 500"
                          className="h-9 rounded-sm"
                        />
                      </div>

                      <div className="border rounded-sm p-3 space-y-2">
                        <Label>Atualizar Parcelas</Label>
                        <RadioGroup
                          value={fillTarget}
                          onValueChange={(value) => setFillTarget(value as "all" | "selected" | "filter")}
                          className="space-y-2"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" id="fill-all" />
                            <Label htmlFor="fill-all" className="font-normal">Todas</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="selected" id="fill-selected" />
                            <Label htmlFor="fill-selected" className="font-normal">Selecionadas</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="filter" id="fill-filter" />
                            <Label htmlFor="fill-filter" className="font-normal">Filtro</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="border rounded-sm p-3 space-y-2">
                        <Label>Filtro</Label>
                        <Select
                          value={fillFilterColumn}
                          onValueChange={(value) => setFillFilterColumn(value as "parcela" | "up" | "us" | "ni")}
                          disabled={fillTarget !== "filter"}
                        >
                          <SelectTrigger className="h-9 rounded-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="parcela">Parcela</SelectItem>
                            <SelectItem value="up">UP</SelectItem>
                            <SelectItem value="us">US</SelectItem>
                            <SelectItem value="ni">NI</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={fillFilterValue}
                          onChange={(e) => setFillFilterValue(e.target.value)}
                          placeholder="Valor do filtro"
                          disabled={fillTarget !== "filter"}
                          className="h-9 rounded-sm"
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsFillParcelDialogOpen(false)}>
                        Fechar
                      </Button>
                      <Button
                        className="bg-green-700 hover:bg-green-800"
                        onClick={applyFillValuesToParcels}
                      >
                        Preencher
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
            {currentStep === 5 && (
              <div className="flex flex-col h-full gap-3">
                <div className="border rounded-sm overflow-hidden bg-background flex-1 min-h-0">
                  <div className="px-3 py-2 border-b text-sm font-semibold">
                    Dados da Importação ({reviewRows.length} fustes encontrados)
                  </div>
                  <ScrollArea className="h-[390px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Parcela</TableHead>
                          <TableHead>Núm. Árvore</TableHead>
                          <TableHead>Nome Comum</TableHead>
                          <TableHead>Nome Científico</TableHead>
                          <TableHead>CAP</TableHead>
                          <TableHead>Alt. Total</TableHead>
                          <TableHead>DAP</TableHead>
                          <TableHead>Área da Parcela</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reviewRows.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-xs text-muted-foreground h-24">
                              Sem linhas para mostrar
                            </TableCell>
                          </TableRow>
                        ) : (
                          reviewRows.map((row, index) => (
                            <TableRow key={`${row.parcela}-${row.numArvore}-${index}`}>
                              <TableCell>{row.parcela || "-"}</TableCell>
                              <TableCell>{row.numArvore || "-"}</TableCell>
                              <TableCell>{row.nomeComum || "-"}</TableCell>
                              <TableCell>{row.nomeCientifico || "-"}</TableCell>
                              <TableCell>{row.cap || "-"}</TableCell>
                              <TableCell>{row.altTotal || "-"}</TableCell>
                              <TableCell>{row.dap || "-"}</TableCell>
                              <TableCell>{row.areaParcela || "-"}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
              </div>
            )}
            {currentStep > 5 && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {steps[currentStep].label} (em construção)
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-3 border-t bg-muted/40 justify-between">
          <div>
            <Button variant="secondary" className="bg-blue-600 hover:bg-blue-700 text-white">
              Ajuda
            </Button>
            <Button
              variant="secondary"
              className="ml-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleDownloadTemplate}
            >
              Baixar planilha modelo
            </Button>
          </div>
          <div>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            {currentStep > 0 && (
              <Button variant="outline" className="ml-2" onClick={handleBack} disabled={isImportingNow}>
                Voltar
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button className="ml-2 bg-green-700 hover:bg-green-800" onClick={handleNext} disabled={isImportingNow}>
                Prosseguir
              </Button>
            ) : (
              <Button className="ml-2 bg-green-700 hover:bg-green-800" onClick={handleImport} disabled={isImportingNow}>
                {isImportingNow ? "Importando..." : "Importar"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
