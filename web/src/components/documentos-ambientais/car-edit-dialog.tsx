"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { handleFirestoreFormError } from "@/lib/firestore-form-errors";
import { useFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { CarFileUploadZone } from "@/components/documentos-ambientais/car-file-upload-zone";
import {
  buildCarPayload,
  normalizeCarGeometryFiles,
  normalizeCarPdfFiles,
} from "@/lib/car/car-files";
import type { CarStoredFile, Project, ProjectCar } from "@/lib/types";
import type { CarUploadKind } from "@/hooks/use-car-file-upload";
import { Loader2, Save } from "lucide-react";
import { NOTIFICATION_LINKS, NOTIFICATION_SOURCE } from "@/lib/notification-events";
import { notifyProjectPortalUsers } from "@/lib/notifications";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  car: ProjectCar;
  clientId?: string;
  limitLabel?: string;
  uploadCarFiles: (
    files: File[],
    kind: CarUploadKind,
    onInvalid?: (message: string) => void,
  ) => Promise<CarStoredFile[]>;
  onSaved: () => void;
};

export function CarEditDialog({
  open,
  onOpenChange,
  project,
  car,
  clientId,
  limitLabel,
  uploadCarFiles,
  onSaved,
}: Props) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const [receiptNumber, setReceiptNumber] = React.useState(car.receiptNumber);
  const [pdfFiles, setPdfFiles] = React.useState<CarStoredFile[]>([]);
  const [geometryFiles, setGeometryFiles] = React.useState<CarStoredFile[]>([]);
  const [uploadingPdf, setUploadingPdf] = React.useState(false);
  const [uploadingGeometry, setUploadingGeometry] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setReceiptNumber(car.receiptNumber);
    setPdfFiles(normalizeCarPdfFiles(car));
    setGeometryFiles(normalizeCarGeometryFiles(car));
  }, [open, car]);

  const handleUpload = async (files: File[], kind: CarUploadKind) => {
    const setUploading = kind === "pdf" ? setUploadingPdf : setUploadingGeometry;
    const setFiles = kind === "pdf" ? setPdfFiles : setGeometryFiles;
    setUploading(true);
    try {
      const uploaded = await uploadCarFiles(files, kind, (message) => {
        toast({ variant: "destructive", title: "Arquivo inválido", description: message });
      });
      if (uploaded.length > 0) {
        setFiles((prev) => [...prev, ...uploaded]);
        toast({
          title: uploaded.length > 1 ? "Arquivos enviados" : "Arquivo enviado",
          description:
            kind === "pdf"
              ? `${uploaded.length} PDF(s) adicionado(s) ao registro.`
              : `${uploaded.length} arquivo(s) de geometria adicionado(s).`,
        });
      }
    } catch (error) {
      console.error("Erro no upload CAR (edição):", error);
      toast({
        variant: "destructive",
        title: "Erro no upload",
        description: "Não foi possível enviar o arquivo.",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!firestore || !user) {
      toast({ variant: "destructive", title: "Erro de autenticação." });
      return;
    }
    if (!receiptNumber.trim()) {
      toast({
        variant: "destructive",
        title: "Informe o número do recibo do CAR.",
      });
      return;
    }
    if (pdfFiles.length === 0) {
      toast({
        variant: "destructive",
        title: "Envie ao menos um PDF do CAR.",
      });
      return;
    }

    const carData = buildCarPayload({
      clientId: clientId || car.clientId,
      receiptNumber,
      pdfFiles,
      geometryFiles,
    });

    setSaving(true);
    const projectRef = doc(firestore, "projects", project.id);
    try {
      await updateDoc(projectRef, { car: carData });
      try {
        await notifyProjectPortalUsers(
          firestore,
          project.id,
          {
            title: "CAR atualizado no empreendimento",
            description: `Recibo ${receiptNumber.trim()} foi atualizado em Documentos Ambientais.`,
            link: NOTIFICATION_LINKS.car,
            sourceType: NOTIFICATION_SOURCE.car,
            sourceId: `${project.id}_${receiptNumber.trim()}_${Date.now()}`,
            actorRole: user.role,
          },
          { excludeUserId: user.uid },
        );
      } catch (notifyErr) {
        console.warn("[CAR] notificação (edição):", notifyErr);
      }
      toast({
        title: "CAR atualizado",
        description: "O registro foi salvo com sucesso.",
      });
      onOpenChange(false);
      onSaved();
    } catch (error) {
      handleFirestoreFormError(error, {
        toast,
        title: "Erro ao atualizar CAR",
        context: {
          path: projectRef.path,
          operation: "update",
          requestResourceData: { car: carData },
        },
      });
    } finally {
      setSaving(false);
    }
  };

  const propertyLabel = `${project.propertyName}${
    project.municipio ? ` — ${project.municipio}/${project.uf}` : ""
  }`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[95vw] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar CAR</DialogTitle>
          <DialogDescription>
            Atualize o recibo e os anexos do empreendimento{" "}
            <span className="font-medium text-foreground">{propertyLabel}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Empreendimento</Label>
            <Input value={propertyLabel} disabled />
          </div>

          <div className="space-y-2">
            <Label>Número do Recibo do CAR</Label>
            <Input
              value={receiptNumber}
              onChange={(event) => setReceiptNumber(event.target.value)}
              placeholder="Ex: MG-1234-5678-9012"
            />
          </div>

          <CarFileUploadZone
            label="Recibo / Documentos em PDF"
            description="Arraste ou selecione um ou mais PDFs."
            accept="application/pdf,.pdf"
            files={pdfFiles}
            uploading={uploadingPdf}
            limitLabel={limitLabel}
            fileKind="pdf"
            onFilesAdded={(files) => void handleUpload(files, "pdf")}
            onRemove={(index) =>
              setPdfFiles((prev) => prev.filter((_, i) => i !== index))
            }
          />

          <CarFileUploadZone
            label="Arquivos de Geometria (SHP ou ZIP)"
            description="Opcional. Arraste ou selecione arquivos de geometria."
            accept=".zip,.shp,application/zip"
            files={geometryFiles}
            uploading={uploadingGeometry}
            limitLabel={limitLabel}
            fileKind="geometry"
            onFilesAdded={(files) => void handleUpload(files, "geometry")}
            onRemove={(index) =>
              setGeometryFiles((prev) => prev.filter((_, i) => i !== index))
            }
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving || uploadingPdf || uploadingGeometry}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
