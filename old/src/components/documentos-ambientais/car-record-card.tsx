"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AttachmentPreviewSection } from "@/components/shared/attachment-preview-section";
import { downloadCarFile } from "@/lib/car/download-car-file";
import {
  normalizeCarGeometryFiles,
  normalizeCarPdfFiles,
} from "@/lib/car/car-files";
import type { CarStoredFile, Project, ProjectCar } from "@/lib/types";
import { Download, Eye, FileText, Map as MapIcon, Pencil, Trash2 } from "lucide-react";

type Props = {
  project: Project;
  car: ProjectCar;
  clientLabel?: string;
  canManage: boolean;
  canDownload: boolean;
  onEdit: () => void;
  onDelete: () => void;
};

function CarAttachmentRow({
  file,
  isPdf,
  canDownload,
  onView,
}: {
  file: CarStoredFile;
  isPdf: boolean;
  canDownload: boolean;
  onView?: () => void;
}) {
  const Icon = isPdf ? FileText : MapIcon;

  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-muted/15 px-3 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm">{file.name}</span>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {isPdf && onView ? (
          <Button type="button" variant="secondary" size="sm" onClick={onView}>
            <Eye className="mr-1 h-3.5 w-3.5" />
            Ver
          </Button>
        ) : null}
        {canDownload ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void downloadCarFile(file.url, file.name)}
          >
            <Download className="mr-1 h-3.5 w-3.5" />
            Baixar
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" asChild>
            <a href={file.url} target="_blank" rel="noopener noreferrer">
              Abrir
            </a>
          </Button>
        )}
      </div>
    </li>
  );
}

export function CarRecordCard({
  project,
  car,
  clientLabel,
  canManage,
  canDownload,
  onEdit,
  onDelete,
}: Props) {
  const pdfFiles = normalizeCarPdfFiles(car);
  const geometryFiles = normalizeCarGeometryFiles(car);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);

  return (
    <>
      <Card className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="min-w-0 space-y-2">
              <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
                {project.propertyName}
                {project.municipio ? ` — ${project.municipio}/${project.uf}` : ""}
              </h3>
              <p className="text-sm text-muted-foreground">
                {clientLabel ?? "Cliente não vinculado"}
              </p>
              <p className="text-sm text-muted-foreground">
                Nº recibo CAR: {car.receiptNumber}
              </p>
            </div>

            <Separator className="bg-border/60" />

            <div className="space-y-3">
              <p className="text-sm font-medium">Anexos</p>
              {pdfFiles.length === 0 && geometryFiles.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  Nenhum anexo disponível.
                </p>
              ) : (
                <ul className="space-y-2">
                  {pdfFiles.map((file, index) => (
                    <CarAttachmentRow
                      key={`pdf-${file.url}-${index}`}
                      file={file}
                      isPdf
                      canDownload={canDownload}
                      onView={() => setPreviewUrl(file.url)}
                    />
                  ))}
                  {geometryFiles.map((file, index) => (
                    <CarAttachmentRow
                      key={`geo-${file.url}-${index}`}
                      file={file}
                      isPdf={false}
                      canDownload={canDownload}
                    />
                  ))}
                </ul>
              )}
            </div>

            {canManage ? (
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onEdit}>
                  <Pencil className="mr-1 h-4 w-4" />
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                >
                  <Trash2 className="mr-1 h-4 w-4" />
                  Excluir
                </Button>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={!!previewUrl}
        onOpenChange={(open) => {
          if (!open) setPreviewUrl(null);
        }}
      >
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Recibo CAR (PDF)</DialogTitle>
            <DialogDescription>Visualização do documento anexado.</DialogDescription>
          </DialogHeader>
          {previewUrl ? (
            <AttachmentPreviewSection
              fileUrl={previewUrl}
              sectionLabel="Documento"
              zoomTitle="Recibo CAR"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
