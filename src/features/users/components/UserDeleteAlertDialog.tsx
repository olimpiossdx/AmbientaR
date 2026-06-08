import { isClientePortalRole } from "@/lib/role-guards";
import type { AppUser, UserRole } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type UserDeleteAlertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToDelete: AppUser | null;
  sessionTargetUid: string | null;
  currentRole: UserRole | undefined;
  onConfirm: () => void;
  onCancelClear: () => void;
};

export function UserDeleteAlertDialog({
  open,
  onOpenChange,
  userToDelete,
  sessionTargetUid,
  currentRole,
  onConfirm,
  onCancelClear,
}: UserDeleteAlertDialogProps) {
  const isSelfPortalDelete =
    !!userToDelete &&
    !!sessionTargetUid &&
    (userToDelete.id === sessionTargetUid ||
      userToDelete.uid === sessionTargetUid) &&
    (isClientePortalRole(currentRole) || currentRole === "representative");

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isSelfPortalDelete
              ? "Excluir seu usuário de acesso?"
              : "Você tem certeza?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isSelfPortalDelete ? (
              <>
                Será removido apenas o seu <strong>usuário de acesso</strong>{" "}
                (perfil de login). Você será deslogado. Os dados nos submenus{" "}
                <strong>Clientes</strong> e <strong>Empreendedores</strong> não
                serão alterados; apenas o administrador pode excluí-los.
              </>
            ) : (
              <>
                Esta ação não pode ser desfeita. Remove o perfil, a conta de
                login (Firebase Auth), notificações e pedidos de acesso de{" "}
                <span className="font-semibold">{userToDelete?.name}</span>. O
                e-mail ficará livre para novo cadastro.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancelClear}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {isSelfPortalDelete
              ? "Sim, excluir meu usuário de acesso"
              : "Deletar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
