"use client";

import { Badge } from "@/components/ui/badge";
import {
  AI_PROVIDER_META,
  normalizeProviderId,
  type AiProviderId,
} from "@/lib/ai-provider-labels";
import { cn } from "@/lib/utils";

type Props = {
  provider: string | null | undefined;
  className?: string;
  showHint?: boolean;
};

export function AiProviderBadge({ provider, className, showHint = false }: Props) {
  const id = normalizeProviderId(provider);
  if (!id) return null;
  const meta = AI_PROVIDER_META[id];
  return (
    <div className={cn("inline-flex flex-col gap-1", className)}>
      <Badge
        variant="outline"
        className={cn("w-fit font-normal", meta.badgeClass)}
      >
        Motor: {meta.short}
      </Badge>
      {showHint ? (
        <p className="text-xs text-muted-foreground max-w-md">{meta.description}</p>
      ) : null}
    </div>
  );
}

export function AiRoutingInfoCard({ className }: { className?: string }) {
  const items: AiProviderId[] = ["gemini", "deepseek"];
  return (
    <div
      className={cn(
        "rounded-lg border bg-muted/30 p-4 text-sm space-y-3",
        className,
      )}
    >
      <p className="font-medium text-foreground">Como a app escolhe a IA</p>
      <ul className="space-y-2 text-muted-foreground">
        {items.map((id) => (
          <li key={id}>
            <span className="font-medium text-foreground">
              {AI_PROVIDER_META[id].short}:
            </span>{" "}
            {AI_PROVIDER_META[id].description}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        Configure <code className="text-xs">GOOGLE_GENAI_API_KEY</code> e{" "}
        <code className="text-xs">DEEPSEEK_API_KEY</code> no servidor. Detalhes
        em <code className="text-xs">docs/IA-ROTEAMENTO.md</code>.
      </p>
    </div>
  );
}
