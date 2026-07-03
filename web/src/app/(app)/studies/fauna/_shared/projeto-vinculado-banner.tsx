import type { FaunaStudy } from "@/lib/types";
import { getFaunaStudyLabel } from "@/lib/fauna-study-utils";

export function ProjetoVinculadoBanner({
  study,
}: {
  study: FaunaStudy | null | undefined;
}) {
  if (!study) return null;

  return (
    <div className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
      <p className="font-medium text-foreground">Dados importados do projeto</p>
      <p className="text-muted-foreground">{getFaunaStudyLabel(study)}</p>
      <p className="text-xs text-muted-foreground mt-1">
        Revise e complete o relatório com os resultados de campo.
      </p>
    </div>
  );
}
