"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExternalLink, Search } from "lucide-react";
import {
  formatTaxaBrl,
  listModosParaNovaOutorga,
  OUTORGA_CATEGORIA_LABELS,
  OUTORGA_MG_EXERCICIO_TAXAS,
  OUTORGA_MG_LINKS,
  OUTORGA_MG_UFEMG,
  type OutorgaModoCategoria,
  type OutorgaModoUsoDef,
} from "@/lib/outorga-mg-catalog";

type Props = {
  onSelect: (modo: OutorgaModoUsoDef) => void;
  selectedCodigo?: string;
};

export function OutorgaModoUsoPicker({ onSelect, selectedCodigo }: Props) {
  const [busca, setBusca] = React.useState("");
  const [categoria, setCategoria] = React.useState<OutorgaModoCategoria | "all">(
    "all",
  );

  const modos = listModosParaNovaOutorga();

  const filtrados = React.useMemo(() => {
    const q = busca.trim().toLowerCase();
    return modos.filter((m) => {
      if (categoria !== "all" && m.categoria !== categoria) return false;
      if (!q) return true;
      return (
        m.codigo.toLowerCase().includes(q) ||
        m.label.toLowerCase().includes(q)
      );
    });
  }, [modos, busca, categoria]);

  const categorias = React.useMemo(() => {
    const set = new Set(modos.map((m) => m.categoria));
    return Array.from(set);
  }, [modos]);

  const selected = modos.find((m) => m.codigo === selectedCodigo);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Filtrar por código ou descrição..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
        <Select
          value={categoria}
          onValueChange={(v) =>
            setCategoria(v as OutorgaModoCategoria | "all")
          }
        >
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categorias.map((c) => (
              <SelectItem key={c} value={c}>
                {OUTORGA_CATEGORIA_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">
        Selecione o <strong>código do modo de uso</strong> (Tabela 01 — Portaria
        IGAM 48/2019). Taxas vigentes a partir de 01/01/
        {OUTORGA_MG_EXERCICIO_TAXAS} (UFEMG R${" "}
        {OUTORGA_MG_UFEMG.toLocaleString("pt-BR", {
          minimumFractionDigits: 4,
        })}
        ).
      </p>

      <div className="space-y-2">
        <Select
          value={selectedCodigo || undefined}
          onValueChange={(codigo) => {
            const modo = modos.find((m) => m.codigo === codigo);
            if (modo) onSelect(modo);
          }}
        >
          <SelectTrigger className="w-full h-auto min-h-10 py-2">
            <SelectValue placeholder="Escolha o código do modo de uso na lista..." />
          </SelectTrigger>
          <SelectContent className="max-h-[min(60vh,320px)]">
            {filtrados.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                Nenhum modo de uso encontrado.
              </p>
            ) : (
              filtrados.map((modo) => (
                <SelectItem
                  key={modo.codigo}
                  value={modo.codigo}
                  className="items-start py-2"
                >
                  <span className="font-mono text-xs mr-2 shrink-0">
                    {modo.codigo}
                  </span>
                  <span className="text-left leading-snug">{modo.label}</span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {selected && (
        <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              {selected.codigo}
            </Badge>
            <Badge variant="outline">
              {OUTORGA_CATEGORIA_LABELS[selected.categoria]}
            </Badge>
          </div>
          <p className="font-medium">{selected.label}</p>
          <p className="text-xs text-muted-foreground">
            Taxa análise/publicação: {formatTaxaBrl(selected.taxaAnaliseBrl)}
            {selected.taxaInsignificanteBrl != null &&
              ` · Insignificante: ${formatTaxaBrl(selected.taxaInsignificanteBrl)}`}
          </p>
          {selected.trPdfUrl && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0"
              asChild
            >
              <a
                href={selected.trPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1 inline" />
                TR IGAM (PDF)
              </a>
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t">
        <Button variant="outline" size="sm" asChild>
          <a
            href={OUTORGA_MG_LINKS.custosOutorga}
            target="_blank"
            rel="noopener noreferrer"
          >
            Tabela de custos IGAM
          </a>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <a
            href={OUTORGA_MG_LINKS.orientacoesSout}
            target="_blank"
            rel="noopener noreferrer"
          >
            Orientações SOUT
          </a>
        </Button>
      </div>
    </div>
  );
}
