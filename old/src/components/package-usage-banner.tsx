"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatStorageLimit } from "@/lib/package-limits";
import type { PackageUsageState } from "@/hooks/use-package-usage";
import { Info } from "lucide-react";

type PackageUsageBannerProps = {
  usage: PackageUsageState;
  showAmbbot?: boolean;
};

export function PackageUsageBanner({
  usage,
  showAmbbot = false,
}: PackageUsageBannerProps) {
  if (!usage.enforced) return null;

  const { limits, empreendimentos, ambbotIncludedRemaining, ambbotPrepaidCredits } =
    usage;
  const atEmpLimit = empreendimentos >= limits.maxEmpreendimentos;

  return (
    <Alert variant={atEmpLimit ? "destructive" : "default"} className="mb-4">
      <Info className="h-4 w-4" />
      <AlertTitle>
        Plano {limits.tierLabel} — uso do portal
      </AlertTitle>
      <AlertDescription className="space-y-2 text-sm">
        <p>
          Empreendimentos:{" "}
          <strong>
            {empreendimentos} / {limits.maxEmpreendimentos}
          </strong>
          {" · "}
          Documentos: até {limits.maxTotalFiles} arquivos (
          {formatStorageLimit(limits.maxStorageBytes)} total, máx.{" "}
          {formatStorageLimit(limits.maxFileSizeBytes)} por arquivo)
        </p>
        {showAmbbot && (
          <p>
            AmbBot (análise de área):{" "}
            <strong>{ambbotIncludedRemaining}</strong> inclusa(s) neste mês
            {ambbotPrepaidCredits > 0
              ? ` · ${ambbotPrepaidCredits} crédito(s) avulso(s)`
              : ""}
            {limits.ambbotIncludedPerMonth === 0 &&
              ambbotPrepaidCredits === 0 &&
              ` · avulso ${limits.ambbotExtraPriceLabel}`}
          </p>
        )}
        {atEmpLimit && (
          <p className="text-xs text-muted-foreground">
            Use o botão <strong>Upgrade</strong> no menu lateral para ampliar seu plano.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
}
