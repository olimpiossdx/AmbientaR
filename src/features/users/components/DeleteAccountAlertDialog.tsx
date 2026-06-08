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

type DeleteAccountAlertDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDeleting: boolean;
  onConfirm: () => void;
};

export function DeleteAccountAlertDialog({
  open,
  onOpenChange,
  isDeleting,
  onConfirm,
}: DeleteAccountAlertDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir sua conta permanentemente?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação{" "}
            <span className="font-semibold">não pode ser desfeita</span>. Ao
            confirmar, todos os seus dados pessoais, incluindo nome, e-mail,
            telefone, CPF e histórico de uso serão removidos permanentemente da
            plataforma AmbientaR. Você perderá acesso ao sistema e não poderá
            recuperar sua conta.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Excluindo..." : "Sim, excluir minha conta"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
