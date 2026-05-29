'use client';

import * as React from 'react';
import { Loader2, MapPin, Trash2, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormDescription } from '@/components/ui/form';
import type { ProjectPerimetroReferencia } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { uploadFileToStorage, sanitizeStorageFileName } from '@/lib/storage-upload';
import {
  buildPerimetroReferenciaPayload,
  buildPerimetroReferenciaStoragePath,
  parsePerimetroReferenciaFile,
} from '@/lib/project-perimetro-referencia';

export type ProjectPerimetroReferenciaSectionProps = {
  projectId?: string;
  value?: ProjectPerimetroReferencia;
  onChange: (next: ProjectPerimetroReferencia | undefined) => void;
  /** Ficheiro pendente quando o empreendimento ainda não foi salvo (criação). */
  onPendingFileChange?: (file: File | null) => void;
};

export function ProjectPerimetroReferenciaSection({
  projectId,
  value,
  onChange,
  onPendingFileChange,
}: ProjectPerimetroReferenciaSectionProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const parsed = await parsePerimetroReferenciaFile(file);

      if (projectId) {
        const safe = sanitizeStorageFileName(file.name);
        const storagePath = buildPerimetroReferenciaStoragePath(projectId, safe);
        const fileUrl = await uploadFileToStorage(file, storagePath);
        onChange(
          buildPerimetroReferenciaPayload(parsed, file, fileUrl, user?.uid),
        );
        onPendingFileChange?.(null);
      } else {
        onChange(
          buildPerimetroReferenciaPayload(parsed, file, undefined, user?.uid),
        );
        onPendingFileChange?.(file);
      }

      toast({
        title: 'Perímetro interpretado',
        description: `${parsed.areaHa.toFixed(2)} ha — salve o empreendimento para persistir.${
          projectId ? '' : ' O arquivo será enviado ao Storage após o primeiro salvamento.'
        }`,
      });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível ler o arquivo',
        description: e instanceof Error ? e.message : 'Verifique KML, KMZ ou ZIP/SHP.',
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleRemove = () => {
    onChange(undefined);
    onPendingFileChange?.(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="flex items-start gap-2">
        <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Perímetro de referência (opcional)</h3>
          <FormDescription>
            Envie KML, KMZ ou shapefile (ZIP) da propriedade. Referência auxiliar para
            análises — não substitui CAR, mapas técnicos nem upload na hora da análise.
          </FormDescription>
        </div>
      </div>

      {value?.fileName || value?.geojson ? (
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <p className="font-medium">{value.fileName ?? 'Perímetro carregado'}</p>
          {typeof value.areaHa === 'number' ? (
            <p className="text-muted-foreground">{value.areaHa.toFixed(2)} ha</p>
          ) : null}
          {value.uploadedAt ? (
            <p className="text-xs text-muted-foreground">
              Atualizado em {new Date(value.uploadedAt).toLocaleString('pt-BR')}
            </p>
          ) : null}
          {!projectId && !value.fileUrl ? (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Será enviado ao Storage quando você salvar o empreendimento.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Input
          ref={fileRef}
          type="file"
          accept=".kml,.kmz,.xml,.zip,.shp,application/zip"
          className="max-w-md"
          disabled={uploading}
          onChange={(e) => void handleFile(e.target.files?.[0])}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          {value ? 'Substituir arquivo' : 'Enviar arquivo'}
        </Button>
        {value ? (
          <Button type="button" variant="ghost" size="sm" onClick={handleRemove}>
            <Trash2 className="mr-2 h-4 w-4" />
            Remover
          </Button>
        ) : null}
      </div>
    </div>
  );
}

/** Após criar empreendimento, envia ficheiro pendente e devolve payload completo. */
export async function finalizePendingPerimetroReferencia(
  projectId: string,
  pending: ProjectPerimetroReferencia | undefined,
  pendingFile: File | null,
  uploadedBy?: string,
): Promise<ProjectPerimetroReferencia | undefined> {
  if (!pending?.geojson) return undefined;
  if (pending.fileUrl) return pending;
  if (!pendingFile) return pending;

  const parsed = await parsePerimetroReferenciaFile(pendingFile);
  const safe = sanitizeStorageFileName(pendingFile.name);
  const storagePath = buildPerimetroReferenciaStoragePath(projectId, safe);
  const fileUrl = await uploadFileToStorage(pendingFile, storagePath);
  return buildPerimetroReferenciaPayload(parsed, pendingFile, fileUrl, uploadedBy);
}
