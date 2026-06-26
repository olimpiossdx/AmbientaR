"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Sparkles } from "lucide-react";
import {
  PETITION_MODELS,
  PETITION_SECTION_META,
  applyPetitionModel,
  type PetitionModelId,
} from "@/lib/multas-defesas/petition-templates";
import type { DefesaConteudo, PetitionSectionId } from "@/lib/multas-defesas/types";
import { useToast } from "@/hooks/use-toast";

type Props = {
  conteudo: DefesaConteudo;
  disabled?: boolean;
  orgao?: string;
  onChange: (next: DefesaConteudo) => void;
  modeloPeticaoId?: string;
  onModeloChange: (id: PetitionModelId) => void;
};

export function MultaDefesaPetitionPanel({
  conteudo,
  disabled,
  orgao,
  onChange,
  modeloPeticaoId,
  onModeloChange,
}: Props) {
  const { toast } = useToast();
  const [suggesting, setSuggesting] = React.useState<PetitionSectionId | null>(null);
  const [aiHint, setAiHint] = React.useState("");

  const setField = (id: PetitionSectionId, value: string) => {
    onChange({ ...conteudo, [id]: value });
  };

  const applyModel = (mode: "replace_empty" | "append") => {
    const id = (modeloPeticaoId || "supram_formal") as PetitionModelId;
    const next = applyPetitionModel(id, conteudo, mode);
    onChange({ ...conteudo, ...next });
    toast({
      title: "Modelo aplicado",
      description: PETITION_MODELS.find((m) => m.id === id)?.label,
    });
  };

  const suggestSection = async (sectionId: PetitionSectionId) => {
    setSuggesting(sectionId);
    try {
      const res = await fetch("/api/multas-defesas/suggest-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionId,
          orgao,
          pedidoUsuario: aiHint,
          autoResumo: [
            conteudo.autoNumero && `Auto ${conteudo.autoNumero}`,
            conteudo.autoRelatoFiscal,
            conteudo.autoArtigoBase,
            conteudo.autoValorMulta,
          ]
            .filter(Boolean)
            .join("\n"),
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Falha na IA");
      const prev = (conteudo[sectionId] || "").trim();
      setField(
        sectionId,
        prev ? `${prev}\n\n${data.text}` : data.text,
      );
      toast({ title: "Texto sugerido pela IA", description: "Revise antes de protocolar." });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "IA indisponível",
        description: e instanceof Error ? e.message : "Erro ao sugerir texto.",
      });
    } finally {
      setSuggesting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label>Modelo de petição</Label>
          <Select
            value={modeloPeticaoId || "supram_formal"}
            onValueChange={(v) => onModeloChange(v as PetitionModelId)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PETITION_MODELS.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {PETITION_MODELS.find((m) => m.id === (modeloPeticaoId || "supram_formal"))
              ?.description}
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => applyModel("replace_empty")}
          >
            Aplicar modelo (campos vazios)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={() => applyModel("append")}
          >
            Anexar ao texto atual
          </Button>
        </div>
      </div>

      <div className="space-y-1">
        <Label>Orientação para a IA (opcional)</Label>
        <Textarea
          placeholder="Ex.: enfatizar tempestividade, nulidade do relato, licença válida…"
          value={aiHint}
          onChange={(e) => setAiHint(e.target.value)}
          disabled={disabled}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1 md:col-span-2">
          <Label>Dados do auto (referência interna)</Label>
          <div className="grid md:grid-cols-2 gap-2">
            <Textarea
              placeholder="Nº do auto"
              value={conteudo.autoNumero || ""}
              onChange={(e) => onChange({ ...conteudo, autoNumero: e.target.value })}
              disabled={disabled}
              rows={1}
            />
            <Textarea
              placeholder="Código da infração"
              value={conteudo.autoCodigo || ""}
              onChange={(e) => onChange({ ...conteudo, autoCodigo: e.target.value })}
              disabled={disabled}
              rows={1}
            />
            <Textarea
              placeholder="Artigo / tipificação"
              value={conteudo.autoArtigoBase || ""}
              onChange={(e) => onChange({ ...conteudo, autoArtigoBase: e.target.value })}
              disabled={disabled}
              rows={1}
            />
            <Textarea
              placeholder="Valor da multa"
              value={conteudo.autoValorMulta || ""}
              onChange={(e) => onChange({ ...conteudo, autoValorMulta: e.target.value })}
              disabled={disabled}
              rows={1}
            />
            <Textarea
              className="md:col-span-2"
              placeholder="Relato fiscal"
              value={conteudo.autoRelatoFiscal || ""}
              onChange={(e) => onChange({ ...conteudo, autoRelatoFiscal: e.target.value })}
              disabled={disabled}
              rows={2}
            />
          </div>
        </div>
      </div>

      {PETITION_SECTION_META.map((section) => (
        <div key={section.id} className="space-y-1 rounded-md border p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label>
              {section.phaseLabel} — {section.label}
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1"
              disabled={disabled || suggesting === section.id}
              onClick={() => void suggestSection(section.id)}
            >
              {suggesting === section.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Sugerir com IA
            </Button>
          </div>
          <Textarea
            placeholder={section.placeholder}
            value={conteudo[section.id] || ""}
            onChange={(e) => setField(section.id, e.target.value)}
            disabled={disabled}
            rows={section.id === "pedidos" ? 5 : 4}
          />
        </div>
      ))}
    </div>
  );
}
