"use client";

import { useCallback, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  buildSeiJuntadaIndex,
  computeChecklistProgress,
  getFullChecklist,
  groupChecklistByPhase,
  type CompensacaoTipo,
} from "@/lib/compensacao-ambiental/config";
import type { CompensacaoProcessoDraft } from "@/lib/compensacao-ambiental/storage";
import { FileUp, Copy, ExternalLink } from "lucide-react";

type Props = {
  tipo: CompensacaoTipo;
  draft: CompensacaoProcessoDraft;
  onChange: (draft: CompensacaoProcessoDraft) => void;
  referenciaIef: string;
};

export function CompensacaoChecklistPanel({ tipo, draft, onChange, referenciaIef }: Props) {
  const { toast } = useToast();
  const items = useMemo(() => getFullChecklist(tipo), [tipo]);
  const checkedSet = useMemo(() => new Set(draft.checkedIds), [draft.checkedIds]);
  const progress = useMemo(
    () => computeChecklistProgress(items, checkedSet),
    [items, checkedSet]
  );
  const groups = useMemo(() => groupChecklistByPhase(items), [items]);

  const toggle = useCallback(
    (id: string, checked: boolean) => {
      const next = new Set(draft.checkedIds);
      if (checked) next.add(id);
      else next.delete(id);
      onChange({ ...draft, checkedIds: [...next] });
    },
    [draft, onChange]
  );

  const handleTemplateUpload = (itemId: string, file: File | null) => {
    const templateFiles = { ...draft.templateFiles };
    if (file) templateFiles[itemId] = file.name;
    else delete templateFiles[itemId];
    onChange({ ...draft, templateFiles });
    if (file) {
      toast({
        title: "Modelo anexado (local)",
        description: `${file.name} — será enviado ao SEI manualmente após revisão.`,
      });
    }
  };

  const copyJuntadaIndex = async () => {
    const text = buildSeiJuntadaIndex(items, checkedSet, {
      titulo: draft.titulo || draft.empreendimento,
      sei: draft.seiCompensacao || draft.seiLicenca,
    });
    await navigator.clipboard.writeText(text);
    toast({ title: "Índice de juntada copiado", description: "Cole no SEI ou num documento índice." });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="text-base">Checklist de juntada</CardTitle>
              <CardDescription>
                Itens obrigatórios: {progress.requiredDone}/{progress.requiredTotal} — marque conforme
                for reunindo documentos para o SEI.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-1" onClick={copyJuntadaIndex}>
                <Copy className="h-4 w-4" />
                Copiar índice SEI
              </Button>
              <Button type="button" variant="outline" size="sm" className="gap-1" asChild>
                <a href={referenciaIef} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                  Site IEF
                </a>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Conclusão (obrigatórios)</span>
            <span className="font-medium">{progress.percent}%</span>
          </div>
          <Progress value={progress.percent} className="h-2" />
          <p className="text-xs text-muted-foreground">
            Total marcado: {progress.done}/{progress.total} itens (inclui condicionais).
          </p>
        </CardContent>
      </Card>

      {groups.map((group) => (
        <Card key={group.phase}>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-semibold">{group.label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {group.items.map((checkItem) => {
              const checked = checkedSet.has(checkItem.id);
              const uploaded = draft.templateFiles[checkItem.id];
              return (
                <div
                  key={checkItem.id}
                  className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex gap-3 min-w-0 flex-1">
                    <Checkbox
                      id={checkItem.id}
                      checked={checked}
                      onCheckedChange={(v) => toggle(checkItem.id, v === true)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0 space-y-1">
                      <Label htmlFor={checkItem.id} className="font-normal leading-snug cursor-pointer">
                        <span className="text-muted-foreground font-mono text-xs mr-2">
                          {checkItem.id}
                        </span>
                        {checkItem.label}
                      </Label>
                      <div className="flex flex-wrap gap-1">
                        {checkItem.required ? (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0">
                            Obrigatório
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Condicional
                          </Badge>
                        )}
                        {checkItem.templateWord && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            Modelo Word IEF
                          </Badge>
                        )}
                      </div>
                      {checkItem.note && (
                        <p className="text-xs text-muted-foreground">{checkItem.note}</p>
                      )}
                      {checkItem.source && (
                        <p className="text-xs text-muted-foreground italic">{checkItem.source}</p>
                      )}
                    </div>
                  </div>
                  {checkItem.templateWord && (
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0] ?? null;
                            handleTemplateUpload(checkItem.id, f);
                            e.target.value = "";
                          }}
                        />
                        <Button type="button" variant="outline" size="sm" className="gap-1" asChild>
                          <span>
                            <FileUp className="h-3.5 w-3.5" />
                            {uploaded ? "Substituir" : "Word"}
                          </span>
                        </Button>
                      </label>
                      {uploaded && (
                        <span className="text-xs text-muted-foreground max-w-[140px] truncate" title={uploaded}>
                          {uploaded}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
