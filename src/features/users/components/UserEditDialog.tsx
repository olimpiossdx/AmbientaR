import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AppUser } from "@/lib/types";
import { UserForm } from "@/app/(app)/users/user-form";

type RepresentativeForClient = {
  id: string;
  requestedByName: string;
  requestedByUserId: string;
  status: string;
  representativeCpf?: string;
};

type UserEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  currentUser: AppUser | null;
  onSuccess: () => void;
  representativesForThisClient?: RepresentativeForClient[];
  representativeRequestedCpf?: string | null;
  representativeRequestedCpfsCnpjs?: string[];
};

export function UserEditDialog({
  open,
  onOpenChange,
  title = "Atualizar Cadastro",
  description = "Altere seus dados de acesso e informações pessoais.",
  currentUser,
  onSuccess,
  representativesForThisClient,
  representativeRequestedCpf,
  representativeRequestedCpfsCnpjs,
}: UserEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl h-full max-h-[90dvh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <UserForm
          currentUser={currentUser}
          onSuccess={onSuccess}
          representativesForThisClient={representativesForThisClient}
          representativeRequestedCpf={representativeRequestedCpf}
          representativeRequestedCpfsCnpjs={representativeRequestedCpfsCnpjs}
        />
      </DialogContent>
    </Dialog>
  );
}
