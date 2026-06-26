import type { MemorialContext, MemorialDraft } from "./types";
import { DEFAULT_MEMORIAL_METADATA, MEMORIAL_DRAFT_STORAGE_KEYS } from "./types";

export function loadMemorialDraft(context: MemorialContext): MemorialDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MEMORIAL_DRAFT_STORAGE_KEYS[context]);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MemorialDraft>;
    return {
      metadata: { ...DEFAULT_MEMORIAL_METADATA, ...parsed.metadata },
      polygon: parsed.polygon ?? null,
      confrontantes: Array.isArray(parsed.confrontantes) ? parsed.confrontantes : [],
      memorialText: typeof parsed.memorialText === "string" ? parsed.memorialText : "",
      sourceLabel: parsed.sourceLabel,
    };
  } catch {
    return null;
  }
}

export function saveMemorialDraft(context: MemorialContext, draft: MemorialDraft): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      MEMORIAL_DRAFT_STORAGE_KEYS[context],
      JSON.stringify(draft),
    );
  } catch {
    /* quota / private mode */
  }
}
