/** Metadados STAC (B5) — pré-visualização sem GEE. */
export type StacPreviewItem = {
  id: string;
  collection: string;
  datetime: string | null;
  cloudCover: number | null;
  thumbnailHref: string | null;
};

/** Resposta JSON da API (sem tipos Firestore no cliente). */
export type StudyMapExportJobResponse = {
  jobId: string;
  uid: string;
  projectTitle: string;
  status: "queued" | "running" | "done" | "error";
  fetchOsm: boolean;
  targetCrs: string;
  createdAt: string;
  finishedAt?: string;
  errorMessage?: string;
  artifactUrls?: Record<string, string>;
  osmWarning?: string | null;
  stacPreview?: StacPreviewItem[];
};
