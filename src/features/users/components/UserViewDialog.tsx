import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { PlatformSubscriptionAcceptanceViewer } from "@/components/platform-subscription-contract/acceptance-viewer";
import { formatCpfDisplay } from "@/lib/masks";
import { isUserConsideredOnline } from "@/lib/user-presence";
import type { AppUser } from "@/lib/types";
import { getRoleText } from "../lib/user-display";
import { UserDetailItem } from "./UserDetailItem";

type UserViewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AppUser | null;
  presenceNow: number;
};

export function UserViewDialog({
  open,
  onOpenChange,
  user,
  presenceNow,
}: UserViewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{user?.name}</DialogTitle>
          <DialogDescription>
            Detalhes do usuário cadastrado no sistema.
          </DialogDescription>
        </DialogHeader>
        {user && (
          <div className="form-scroll-body max-h-[60vh] space-y-4">
            <UserDetailItem label="Nome Completo" value={user.name} />
            <UserDetailItem label="Email" value={user.email} />
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <UserDetailItem
                label="Nível de Acesso"
                value={getRoleText(user.role)}
              />
              <UserDetailItem
                label="Status da Conta"
                value={user.status === "active" ? "Ativo" : "Inativo"}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <UserDetailItem
                label="Status Online"
                value={
                  isUserConsideredOnline(user, presenceNow) ? "Online" : "Offline"
                }
              />
              <UserDetailItem
                label="Último Login"
                value={
                  user.lastLogin
                    ? new Date(user.lastLogin.seconds * 1000).toLocaleString(
                        "pt-BR",
                      )
                    : "Nunca"
                }
              />
            </div>
            <Separator />
            <h4 className="font-semibold text-foreground">Documentos</h4>
            <UserDetailItem
              label="CPF"
              value={formatCpfDisplay(user.cpf || user.userCpf)}
            />
            <UserDetailItem label="CNPJs Vinculados" value={user.cnpjs} />
            <UserDetailItem
              label="Data de Nascimento"
              value={
                user.dataNascimento
                  ? new Date(user.dataNascimento).toLocaleDateString("pt-BR")
                  : ""
              }
            />
            {user.platformSubscriptionAcceptanceId ? (
              <>
                <Separator />
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">Contrato de plataforma</p>
                    <p className="text-xs text-muted-foreground">
                      Cópia do aceite no cadastro (somente admin altera ou apaga).
                    </p>
                  </div>
                  <PlatformSubscriptionAcceptanceViewer
                    acceptanceId={user.platformSubscriptionAcceptanceId}
                    userLabel={user.name}
                    compact
                  />
                </div>
              </>
            ) : null}
          </div>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Fechar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
