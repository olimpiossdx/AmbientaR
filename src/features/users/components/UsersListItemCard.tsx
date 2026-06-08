import {
  Eye,
  FileDown,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isClientePortalRole } from "@/lib/role-guards";
import { isUserConsideredOnline } from "@/lib/user-presence";
import { formatCpfCnpjDisplay } from "@/lib/masks";
import type { AppUser, UserRole } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getRoleText } from "../lib/user-display";

type UsersListItemCardProps = {
  appUser: AppUser;
  presenceNow: number;
  currentRole: UserRole | undefined;
  sessionUid: string | null | undefined;
  sessionTargetUid: string | null;
  canEdit: boolean;
  canDelete: boolean;
  canExportLog: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onExportLog: (format: "txt" | "pdf") => void;
};

export function UsersListItemCard({
  appUser,
  presenceNow,
  currentRole,
  sessionUid,
  sessionTargetUid,
  canEdit,
  canDelete,
  canExportLog,
  onView,
  onEdit,
  onDelete,
  onExportLog,
}: UsersListItemCardProps) {
  return (
    <Card className="overflow-hidden border-border/80 shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="min-w-0 space-y-2">
            <h3 className="text-balance text-base font-semibold leading-snug text-foreground sm:text-lg">
              {appUser.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-2.5 w-2.5 shrink-0 rounded-full",
                    isUserConsideredOnline(appUser, presenceNow)
                      ? "bg-green-500"
                      : "bg-red-500",
                  )}
                />
                {isUserConsideredOnline(appUser, presenceNow)
                  ? "Online"
                  : "Offline"}
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline break-all">{appUser.email}</span>
            </div>
            <p className="hidden text-sm text-muted-foreground lg:block">
              {formatCpfCnpjDisplay(
                appUser.cpf || (appUser.cnpjs && appUser.cnpjs[0]),
              ) || "CPF/CNPJ não informado"}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {getRoleText(appUser.role)}
              </span>
              <Badge
                variant={appUser.status === "active" ? "default" : "secondary"}
                className={cn(
                  appUser.status === "active" &&
                    "bg-emerald-500/20 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
                  appUser.status === "inactive" &&
                    "bg-slate-500/20 text-slate-700 border-slate-500/30 hover:bg-slate-500/30 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
                  appUser.status === "pending_invite" &&
                    "bg-amber-500/20 text-amber-800 border-amber-500/30 dark:text-amber-300",
                )}
              >
                {appUser.status === "active"
                  ? "Ativo"
                  : appUser.status === "pending_invite"
                    ? "Convite pendente"
                    : "Inativo"}
              </Badge>
            </div>
          </div>
          <Separator className="bg-border/60" />
          <div className="flex flex-wrap items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  type="button"
                  onClick={onView}
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">Visualizar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Visualizar detalhes</p>
              </TooltipContent>
            </Tooltip>
            {canEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    type="button"
                    onClick={onEdit}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Editar</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {appUser.id === sessionUid || appUser.uid === sessionUid
                      ? "Editar meu cadastro"
                      : "Editar usuário"}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
            {canDelete && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-destructive hover:text-destructive"
                    type="button"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Excluir</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {(appUser.id === sessionTargetUid ||
                      appUser.uid === sessionTargetUid) &&
                    (isClientePortalRole(currentRole) ||
                      currentRole === "representative")
                      ? "Excluir usuário de acesso (apenas seus dados de acesso; Clientes/Empreendedores não são alterados)"
                      : "Excluir usuário (somente administrador)"}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
            {canExportLog && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      type="button"
                      onClick={() => onExportLog("txt")}
                    >
                      <FileText className="h-4 w-4" />
                      <span className="sr-only">Exportar log como .txt</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Exportar log como .txt</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      type="button"
                      onClick={() => onExportLog("pdf")}
                    >
                      <FileDown className="h-4 w-4" />
                      <span className="sr-only">Exportar log como .pdf</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Exportar log como .pdf</p>
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
