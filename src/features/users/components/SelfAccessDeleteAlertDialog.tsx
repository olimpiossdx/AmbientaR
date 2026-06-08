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

type SelfAccessDeleteAlertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancelClear?: () => void;
};

export function SelfAccessDeleteAlertDialog({
  open,
  onOpenChange,
  onConfirm,
  onCancelClear,
}: SelfAccessDeleteAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir seu usuário de acesso?</AlertDialogTitle>
          <AlertDialogDescription>
            Será removido apenas o seu <strong>usuário de acesso</strong> (perfil
            de login). Você será deslogado. Os dados nos submenus{" "}
            <strong>Clientes</strong> e <strong>Empreendedores</strong> não
            serão alterados; apenas o administrador pode excluí-los.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancelClear}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Sim, excluir meu usuário de acesso
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
