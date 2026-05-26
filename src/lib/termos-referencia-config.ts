/**
 * Reexportações seguras para cliente (sem `server-only` nem `path`).
 * Funções de caminho no disco: `@/lib/termos-referencia-config.server`.
 */

export type { StudySlug } from "@/lib/termos-referencia-study-folders";
export {
  STUDY_TR_FOLDER,
  LINKED_STUDIES,
  getTrFolderForStudy,
  isStudyLinkedToTr,
} from "@/lib/termos-referencia-study-folders";
