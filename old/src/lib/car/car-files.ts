import type { CarStoredFile, ProjectCar } from "@/lib/types";

export function normalizeCarPdfFiles(car: ProjectCar): CarStoredFile[] {
  if (car.pdfFiles?.length) return car.pdfFiles;
  if (car.pdfUrl) return [{ url: car.pdfUrl, name: "Recibo PDF" }];
  return [];
}

export function normalizeCarGeometryFiles(car: ProjectCar): CarStoredFile[] {
  if (car.geometryFiles?.length) return car.geometryFiles;
  if (car.shpUrl) return [{ url: car.shpUrl, name: "Geometria" }];
  return [];
}

export function buildCarPayload(params: {
  clientId?: string;
  receiptNumber: string;
  pdfFiles: CarStoredFile[];
  geometryFiles: CarStoredFile[];
}): ProjectCar {
  const receiptNumber = params.receiptNumber.trim();
  return {
    clientId: params.clientId || undefined,
    receiptNumber,
    pdfUrl: params.pdfFiles[0]?.url,
    shpUrl: params.geometryFiles[0]?.url,
    pdfFiles: params.pdfFiles.length ? params.pdfFiles : undefined,
    geometryFiles: params.geometryFiles.length ? params.geometryFiles : undefined,
  };
}

export function isGeometryCarFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return name.endsWith(".zip") || name.endsWith(".shp");
}
