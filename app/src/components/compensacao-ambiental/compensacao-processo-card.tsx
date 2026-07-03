"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SNUC_VR_RAMOS } from "@/lib/compensacao-ambiental/config";
import type { CompensacaoProcessoDraft } from "@/lib/compensacao-ambiental/storage";
import type { CompensacaoTipo } from "@/lib/compensacao-ambiental/config";

type Props = {
  tipo: CompensacaoTipo;
  draft: CompensacaoProcessoDraft;
  onChange: (draft: CompensacaoProcessoDraft) => void;
};

export function CompensacaoProcessoCard({ tipo, draft, onChange }: Props) {
  const patch = (partial: Partial<CompensacaoProcessoDraft>) =>
    onChange({ ...draft, ...partial });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Identificação do processo</CardTitle>
        <CardDescription>
          Rascunho guardado no navegador. A persistência em nuvem (Firestore) será adicionada numa fase
          seguinte.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="titulo">Título interno</Label>
          <Input
            id="titulo"
            placeholder="Ex.: Compensação espécies — Fazenda Santa Rita"
            value={draft.titulo}
            onChange={(e) => {
              patch({ titulo: e.target.value });
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="empreendimento">Empreendimento</Label>
          <Input
            id="empreendimento"
            value={draft.empreendimento}
            onChange={(e) => {
              patch({ empreendimento: e.target.value });
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seiLicenca">Nº SEI — licença / intervenção</Label>
          <Input
            id="seiLicenca"
            placeholder="Ex.: 1234.567890/2024-01"
            value={draft.seiLicenca}
            onChange={(e) => {
              patch({ seiLicenca: e.target.value });
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seiCompensacao">Nº SEI — compensação (se já existir)</Label>
          <Input
            id="seiCompensacao"
            value={draft.seiCompensacao}
            onChange={(e) => {
              patch({ seiCompensacao: e.target.value });
            }}
          />
        </div>
        {tipo === "snuc" && (
          <div className="space-y-2 sm:col-span-2">
            <Label>Planilha VR — ramo de atividade (IEF)</Label>
            <Select
              value={draft.snucRamoVr ?? ""}
              onValueChange={(v) => patch({ snucRamoVr: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a planilha 01–26" />
              </SelectTrigger>
              <SelectContent>
                {SNUC_VR_RAMOS.map((r) => (
                  <SelectItem key={r.code} value={r.code}>
                    {r.code} — {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="condicionante">Condicionante (trecho ou resumo)</Label>
          <Textarea
            id="condicionante"
            rows={3}
            value={draft.condicionante}
            onChange={(e) => {
              patch({ condicionante: e.target.value });
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
