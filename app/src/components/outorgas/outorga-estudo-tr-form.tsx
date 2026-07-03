"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Loader2, FileText } from "lucide-react";
import {
  estudoTrProgress,
  getEstudoTrSections,
  type OutorgaEstudoTr,
  type OutorgaEstudoTrFieldDef,
} from "@/lib/outorga-estudo-tr";
import { formatTaxaBrl } from "@/lib/outorga-mg-catalog";
import { OutorgaFinalidadeSelect } from "@/components/outorgas/outorga-finalidade-select";
import { CoordinateStringField } from "@/components/coordinates";

type Props = {
  modoUsoCodigo: string;
  modoUsoLabel: string;
  formularioTecnico?: string;
  taxaValorBrl?: number;
  trPdfUrl?: string;
  values: OutorgaEstudoTr;
  onChange: (next: OutorgaEstudoTr) => void;
  onSave: () => void | Promise<void>;
  saving?: boolean;
};

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: OutorgaEstudoTrFieldDef;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = `estudo-tr-${field.id}`;
  if (field.type === "finalidade_tabela03") {
    return (
      <OutorgaFinalidadeSelect
        id={id}
        value={value}
        onValueChange={onChange}
      />
    );
  }
  if (field.type === "coordenadas") {
    return (
      <CoordinateStringField
        value={value}
        onChange={onChange}
      />
    );
  }
  if (field.type === "textarea") {
    return (
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={field.rows ?? 3}
        className="min-h-[80px]"
      />
    );
  }
  if (field.type === "number") {
    return (
      <Input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    );
  }
  return (
    <Input
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
    />
  );
}

export function OutorgaEstudoTrForm({
  modoUsoCodigo,
  modoUsoLabel,
  formularioTecnico,
  taxaValorBrl,
  trPdfUrl,
  values,
  onChange,
  onSave,
  saving = false,
}: Props) {
  const sections = React.useMemo(
    () => getEstudoTrSections(modoUsoCodigo),
    [modoUsoCodigo],
  );
  const prog = estudoTrProgress(modoUsoCodigo, values);

  const setField = (fieldId: string, v: string) => {
    onChange({ ...values, [fieldId]: v });
  };

  const defaultOpen = sections.slice(0, 2).map((s) => s.id);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Estudo técnico — elaboração do pedido (TR código {modoUsoCodigo})
            </CardTitle>
            <CardDescription className="mt-1">
              {modoUsoLabel}. Preencha os campos abaixo para compor o formulário
              técnico e o relatório exigidos pelo IGAM. O PDF do TR permanece
              como referência normativa.
            </CardDescription>
          </div>
          <Badge variant="secondary">{prog.percentual}% preenchido</Badge>
        </div>
        <Progress value={prog.percentual} className="h-2 mt-3" />
        <p className="text-xs text-muted-foreground mt-1">
          {prog.preenchidos} de {prog.total} campos · Formulário indicado:{" "}
          <strong>{formularioTecnico ?? "portal IGAM"}</strong> · Taxa:{" "}
          <strong>{formatTaxaBrl(taxaValorBrl)}</strong>
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {trPdfUrl ? (
          <Button variant="outline" size="sm" asChild>
            <a href={trPdfUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir TR em PDF (IGAM) — referência
            </a>
          </Button>
        ) : null}

        <Accordion type="multiple" defaultValue={defaultOpen} className="w-full">
          {sections.map((sec) => (
            <AccordionItem key={sec.id} value={sec.id}>
              <AccordionTrigger className="text-sm font-medium hover:no-underline">
                {sec.title}
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2 pb-4">
                {sec.description && (
                  <p className="text-sm text-muted-foreground">{sec.description}</p>
                )}
                {sec.fields.map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <Label htmlFor={`estudo-tr-${field.id}`}>{field.label}</Label>
                    <FieldControl
                      field={field}
                      value={values[field.id] ?? ""}
                      onChange={(v) => setField(field.id, v)}
                    />
                    {field.hint && (
                      <p className="text-xs text-muted-foreground">{field.hint}</p>
                    )}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button type="button" onClick={() => void onSave()} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Salvar estudo técnico
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
