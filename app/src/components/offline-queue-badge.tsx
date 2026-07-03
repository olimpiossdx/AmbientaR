"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { CloudOff, RefreshCw } from "lucide-react";
import { useOfflineOptional } from "@/lib/offline";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/** Indicador compacto de rede / fila local (Dexie outbox + storage). */
export function OfflineQueueBadge() {
  const offline = useOfflineOptional();
  if (!offline) return null;

  const pending = offline.pendingOutbox + offline.pendingStorage;
  const show = !offline.isOnline || pending > 0;
  if (!show) return null;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={offline.isOnline ? "secondary" : "destructive"}
            className="hidden shrink-0 gap-1 md:inline-flex cursor-default font-normal"
          >
            {!offline.isOnline ? (
              <>
                <CloudOff className="h-3 w-3" />
                Offline
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3" />
                Pendente {pending}
              </>
            )}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs">
          {!offline.isOnline
            ? "Sem ligação: o Firestore pode guardar alterações localmente; filas Dexie enviam quando voltar a rede."
            : pending > 0
              ? `${offline.pendingOutbox} operação(ões) na fila e ${offline.pendingStorage} upload(s) pendente(s).`
              : ""}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
