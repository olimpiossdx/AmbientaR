import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DelegateAccessPortfolioCard } from "@/components/delegate-access-portfolio-card";
import { formatCpfDisplay } from "@/lib/masks";
import type { AccessRequest, AppUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ApprovedTitularEntry } from "../lib/user-display";
import { getRoleText } from "../lib/user-display";
import { SelfAccessDeleteAlertDialog } from "./SelfAccessDeleteAlertDialog";
import { UserDetailItem } from "./UserDetailItem";
import { UserEditDialog } from "./UserEditDialog";

type RepresentativePortalUsersViewProps = {
  repUser: AppUser;
  editingUser: AppUser | null;
  isDialogOpen: boolean;
  onDialogOpenChange: (open: boolean) => void;
  onEditProfile: () => void;
  onFormSuccess: () => void;
  myDelegateAccessRequests: AccessRequest[] | null | undefined;
  approvedTitulares: ApprovedTitularEntry[];
  repUid: string;
  myDelegatePendingCpfsCnpjs: string[];
  isAlertOpen: boolean;
  onAlertOpenChange: (open: boolean) => void;
  onConfirmDeleteAccess: () => void;
  onCancelDelete: () => void;
  onRequestDeleteAccess: () => void;
};

export function RepresentativePortalUsersView({
  repUser,
  editingUser,
  isDialogOpen,
  onDialogOpenChange,
  onEditProfile,
  onFormSuccess,
  myDelegateAccessRequests,
  approvedTitulares,
  repUid,
  myDelegatePendingCpfsCnpjs,
  isAlertOpen,
  onAlertOpenChange,
  onConfirmDeleteAccess,
  onCancelDelete,
  onRequestDeleteAccess,
}: RepresentativePortalUsersViewProps) {
  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Meu Perfil" />
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6 max-w-3xl mx-auto w-full">
          <TooltipProvider>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <CardTitle>{repUser.name}</CardTitle>
                    <CardDescription>
                      Perfil de representante. Você tem acesso aos dados dos
                      titulares listados abaixo.
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={onEditProfile}>
                    Atualizar / Editar Cadastro
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold text-foreground">
                  Informações Pessoais
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UserDetailItem label="Email" value={repUser.email} />
                  <UserDetailItem label="Telefone" value={repUser.phone} />
                </div>
                <UserDetailItem
                  label="CPF pessoal"
                  value={formatCpfDisplay(repUser.userCpf)}
                />
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <UserDetailItem
                    label="Nível de Acesso"
                    value={getRoleText(repUser.role)}
                  />
                  <UserDetailItem
                    label="Status da Conta"
                    value={repUser.status === "active" ? "Ativo" : "Inativo"}
                  />
                </div>
              </CardContent>
            </Card>

            <DelegateAccessPortfolioCard
              role="representative"
              accessRequests={myDelegateAccessRequests}
              approvedTitulares={approvedTitulares}
              requesterUserId={repUid}
              requesterName={repUser.name || ""}
              requesterEmail={repUser.email || ""}
              showCarteiraLink={false}
            />

            <Card className="border-destructive/30">
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Exclusão de Dados
                </CardTitle>
                <CardDescription>
                  Você pode remover apenas seu usuário de acesso (login). Os
                  dados dos clientes/empreendedores são dos titulares e só podem
                  ser excluídos por eles ou pelo administrador.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="text-destructive border-destructive hover:bg-destructive/10"
                  onClick={onRequestDeleteAccess}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir meu usuário de acesso
                </Button>
              </CardContent>
            </Card>
          </TooltipProvider>
        </main>
      </div>

      <SelfAccessDeleteAlertDialog
        open={isAlertOpen}
        onOpenChange={onAlertOpenChange}
        onConfirm={onConfirmDeleteAccess}
        onCancelClear={onCancelDelete}
      />

      <UserEditDialog
        open={isDialogOpen}
        onOpenChange={onDialogOpenChange}
        currentUser={editingUser || repUser}
        onSuccess={onFormSuccess}
        representativeRequestedCpf={myDelegatePendingCpfsCnpjs[0] ?? undefined}
        representativeRequestedCpfsCnpjs={myDelegatePendingCpfsCnpjs}
      />
    </>
  );
}
