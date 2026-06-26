'use client';

import * as React from 'react';
import { Upload, Loader2, FileDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import type { HecRasResultadosEstudo } from '@/lib/types';
import {
  downloadHecRasResultadosTemplate,
  parseHecRasResultadosFile,
} from '@/lib/seguranca-barragens/hec-ras-import';

type Props = {
  estudoId?: string;
  value?: HecRasResultadosEstudo;
  onChange: (value: HecRasResultadosEstudo | undefined) => void;
  disabled?: boolean;
};

export function SegurancaHecRasImportPanel({ estudoId, value, onChange, disabled }: Props) {
  const { toast } = useToast();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);

  const handleFile = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = parseHecRasResultadosFile(text, file.name);
      onChange(parsed.data);
      toast({
        title: 'Resultados HEC-RAS importados',
        description:
          parsed.warnings.length > 0
            ? parsed.warnings.join(' ')
            : `Formato: ${parsed.formatoOrigem}. Salve o estudo para persistir.`,
      });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Falha na importação',
        description: e instanceof Error ? e.message : 'Arquivo inválido.',
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleTemplate = () => {
    if (!estudoId) {
      toast({
        variant: 'destructive',
        title: 'Salve o estudo primeiro',
        description: 'O modelo JSON referencia o id do estudo de segurança.',
      });
      return;
    }
    downloadHecRasResultadosTemplate(estudoId, `modelo_HEC-RAS_resultados_${estudoId.slice(0, 8)}.json`);
  };

  const resumo = value?.resumo;
  const pontos = value?.pontos ?? [];

  return (
    <div className="space-y-3 rounded-lg border border-dashed p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Importar resultados HEC-RAS</p>
          <p className="text-xs text-muted-foreground">
            JSON (formato AmbientaR), GeoJSON de inundação ou CSV de pontos (label, lat, lng,
            profundidade, velocidade, tempo_chegada).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || busy}
            onClick={handleTemplate}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Modelo JSON
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled || busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Importar arquivo
          </Button>
          {value?.importedAt && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled || busy}
              onClick={() => onChange(undefined)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".json,.geojson,.csv"
        className="hidden"
        aria-label="Importar resultados HEC-RAS"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
        }}
      />

      {!value?.importedAt && (
        <Alert>
          <AlertDescription>
            Após rodar a simulação no HEC-RAS, exporte mapas/tabelas e importe aqui para registrar
            profundidade, velocidade e tempo de chegada no estudo.
          </AlertDescription>
        </Alert>
      )}

      {value?.importedAt && (
        <>
          <div className="grid gap-3 md:grid-cols-3 text-sm">
            <div>
              <span className="text-muted-foreground">Arquivo:</span>{' '}
              {value.sourceFile || '—'}
            </div>
            <div>
              <span className="text-muted-foreground">Prof. máx:</span>{' '}
              {resumo?.profundidadeMaxM ? `${resumo.profundidadeMaxM} m` : '—'}
            </div>
            <div>
              <span className="text-muted-foreground">Vel. máx:</span>{' '}
              {resumo?.velocidadeMaxMs ? `${resumo.velocidadeMaxMs} m/s` : '—'}
            </div>
            <div>
              <span className="text-muted-foreground">Área inundada:</span>{' '}
              {resumo?.areaInundadaM2 ? `${resumo.areaInundadaM2} m²` : '—'}
            </div>
            <div>
              <span className="text-muted-foreground">Chegada (mín.):</span>{' '}
              {resumo?.tempoChegadaMinMin ? `${resumo.tempoChegadaMinMin} min` : '—'}
            </div>
            <div>
              <span className="text-muted-foreground">Cenário:</span>{' '}
              {resumo?.cenarioModelado || '—'}
            </div>
          </div>

          {pontos.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ponto</TableHead>
                    <TableHead>h máx (m)</TableHead>
                    <TableHead>V máx (m/s)</TableHead>
                    <TableHead>Chegada (min)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pontos.slice(0, 10).map((p, i) => (
                    <TableRow key={i}>
                      <TableCell>{p.label || `P${i + 1}`}</TableCell>
                      <TableCell>{p.profundidadeMaxM || '—'}</TableCell>
                      <TableCell>{p.velocidadeMaxMs || '—'}</TableCell>
                      <TableCell>{p.tempoChegadaMin || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {pontos.length > 10 && (
                <p className="text-xs text-muted-foreground mt-1">
                  + {pontos.length - 10} ponto(s) no memorial.
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Memorial importado</Label>
            <Textarea
              rows={5}
              className="font-mono text-xs"
              value={value.memorial ?? ''}
              readOnly
            />
          </div>

          <div className="space-y-2">
            <Label>Observações RT (pós-importação)</Label>
            <Textarea
              rows={2}
              value={value.observacoes ?? ''}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  ...value,
                  observacoes: e.target.value,
                })
              }
            />
          </div>
        </>
      )}
    </div>
  );
}
