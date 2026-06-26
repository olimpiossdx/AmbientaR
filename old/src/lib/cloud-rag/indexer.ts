import { createHash } from "crypto";
import { downloadDriveItemContent } from "@/lib/cloud-rag/content-download";
import { getMaxFilesPerIndexJob } from "@/lib/cloud-rag/config";
import { chunkFileText } from "@/lib/cloud-rag/chunker";
import { extractTextFromBuffer } from "@/lib/cloud-rag/extract/text-from-buffer";
import {
  createJob,
  deleteChunksForFile,
  getJob,
  listPendingFiles,
  saveChunks,
  updateFileIndexResult,
  updateJob,
} from "@/lib/cloud-rag/store";
import type { CloudRagJob } from "@/lib/cloud-rag/types";

export type IndexPendingResult = {
  jobId: string;
  indexed: number;
  failed: number;
  skipped: number;
};

function contentHash(text: string, eTag?: string): string {
  return createHash("sha256")
    .update(`${eTag || ""}:${text}`)
    .digest("hex")
    .slice(0, 32);
}

export async function indexPendingFiles(options?: {
  jobId?: string;
  limit?: number;
}): Promise<IndexPendingResult> {
  const limit = options?.limit ?? getMaxFilesPerIndexJob();
  const pending = await listPendingFiles(limit);

  let job: CloudRagJob | null = options?.jobId
    ? await getJob(options.jobId)
    : null;
  if (options?.jobId && !job) {
    throw new Error("Job de indexação não encontrado.");
  }
  if (!job) {
    job = await createJob({
      type: "index",
      status: "running",
      progress: { processed: 0, totalEstimate: pending.length },
      errors: [],
    });
  } else {
    await updateJob(job.id, {
      status: "running",
      progress: {
        processed: job.progress?.processed || 0,
        totalEstimate: pending.length,
      },
    });
  }

  let indexed = 0;
  let failed = 0;
  let skipped = 0;
  let processed = job.progress?.processed || 0;

  for (const file of pending) {
    try {
      if (file.isFolder || file.deleted) {
        await updateFileIndexResult(file.id, {
          indexStatus: "skipped",
          indexError: "",
        });
        skipped += 1;
        continue;
      }

      const buffer = await downloadDriveItemContent(file.driveId, file.itemId);
      const rawText = await extractTextFromBuffer(buffer, file.name);
      if (!rawText || rawText.length < 20) {
        await updateFileIndexResult(file.id, {
          indexStatus: "skipped",
          indexError: "Texto insuficiente após extração.",
          rawText: rawText || "",
        });
        skipped += 1;
        continue;
      }

      const hash = contentHash(rawText, file.eTag);
      await deleteChunksForFile(file.id);
      const chunks = chunkFileText(
        { ...file, rawText },
        rawText,
      );
      await saveChunks(chunks);

      await updateFileIndexResult(file.id, {
        indexStatus: "indexed",
        indexError: "",
        rawText,
        contentHash: hash,
        indexedAt: new Date().toISOString(),
      });
      indexed += 1;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await updateFileIndexResult(file.id, {
        indexStatus: "failed",
        indexError: message.slice(0, 500),
      });
      failed += 1;
      job.errors = [...(job.errors || []), `${file.path}: ${message}`].slice(
        -20,
      );
    }

    processed += 1;
    await updateJob(job.id, {
      progress: { processed, totalEstimate: pending.length },
      errors: job.errors,
    });
  }

  await updateJob(job.id, {
    status: "completed",
    progress: { processed, totalEstimate: pending.length },
    completedAt: new Date().toISOString(),
  });

  return { jobId: job.id, indexed, failed, skipped };
}
