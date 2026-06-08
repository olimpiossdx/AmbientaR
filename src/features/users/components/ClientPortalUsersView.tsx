import { ArrowUp, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { UpgradeDialog } from "@/components/upgrade-dialog";
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
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getPackageLabel, getRoleText } from "../lib/user-display";
import { AccessConsentSection } from "./AccessConsentSection";
import { ApprovedConsultorsSection } from "./ApprovedConsultorsSection";
import { DeleteAccountAlertDialog } from "./DeleteAccountAlertDialog";
import { SelfAccessDeleteAlertDialog } from "./SelfAccessDeleteAlertDialog";
import { UserDetailItem } from "./UserDetailItem";
import { UserEditDialog } from "./UserEditDialog";

type ClientPortalUsersViewProps = {
  clientUser: AppUser;
  isLoadingProfile: boolean;
  editingUser: AppUser | null;
  isDialogOpen: boolean;
  onDialogOpenChange: (open: boolean) => void;
  onEditProfile: () => void;
  onFormSuccess: () => void;
  representativesForClientInDialog: {
    id: string;
    requestedByName: string;
    requestedByUserId: string;
    status: string;
    representativeCpf?: string;
  }[];
  isUpgradeOpen: boolean;
  onUpgradeOpenChange: (open: boolean) => void;
  pendingRequestsForMe: AccessRequest[];
  resolvingRequestId: string | null;
  onResolveAccessRequest: (requestId: string, approve: boolean) => void;
  approvedRepresentatives: AppUser[];
  isLoadingApprovedReps: boolean;
  revokingRepresentativeId: string | null;
  onRevokeRepresentative: (representativeUserId: string) => void;
  approvedConsultors: AppUser[];
  isLoadingApprovedConsultors: boolean;
  revokingConsultorId: string | null;
  onRevokeConsultor: (consultorUserId: string) => void;
  accessRequestsError: unknown;
  isAlertOpen: boolean;
  onAlertOpenChange: (open: boolean) => void;
  onConfirmDeleteAccess: () => void;
  onCancelDelete: () => void;
  isDeleteAccountOpen: boolean;
  onDeleteAccountOpenChange: (open: boolean) => void;
  isDeletingAccount: boolean;
  onConfirmDeleteAccount: () => void;
  onRequestDeleteAccess: () => void;
  onRequestDeleteAccount: () => void;
};

export function ClientPortalUsersView({
  clientUser,
  isLoadingProfile,
  editingUser,
  isDialogOpen,
  onDialogOpenChange,
  onEditProfile,
  onFormSuccess,
  representativesForClientInDialog,
  isUpgradeOpen,
  onUpgradeOpenChange,
  pendingRequestsForMe,
  resolvingRequestId,
  onResolveAccessRequest,
  approvedRepresentatives,
  isLoadingApprovedReps,
  revokingRepresentativeId,
  onRevokeRepresentative,
  approvedConsultors,
  isLoadingApprovedConsultors,
  revokingConsultorId,
  onRevokeConsultor,
  accessRequestsError,
  isAlertOpen,
  onAlertOpenChange,
  onConfirmDeleteAccess,
  onCancelDelete,
  isDeleteAccountOpen,
  onDeleteAccountOpenChange,
  isDeletingAccount,
  onConfirmDeleteAccount,
  onRequestDeleteAccess,
  onRequestDeleteAccount,
}: ClientPortalUsersViewProps) {
  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Meu Perfil" />
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6 max-w-3xl mx-auto w-full">
          <TooltipProvider>
            {isLoadingProfile && (
              <Card>
                <CardHeader>
                  <CardTitle>Carregando Perfil...</CardTitle>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            )}
            {clientUser && !isLoadingProfile && (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <CardTitle>{clientUser.name}</CardTitle>
                        <CardDescription>
                          Suas informações de perfil e de acesso.
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
                      <UserDetailItem label="Email" value={clientUser.email} />
                      <UserDetailItem
                        label="Telefone"
                        value={clientUser.phone}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <UserDetailItem
                        label="CPF"
                        value={formatCpfDisplay(
                          clientUser.cpf || clientUser.userCpf,
                        )}
                      />
                      <UserDetailItem
                        label="Data de Nascimento"
                        value={
                          clientUser.dataNascimento
                            ? new Date(
                                clientUser.dataNascimento,
                              ).toLocaleDateString("pt-BR")
                            : ""
                        }
                      />
                    </div>
                    <UserDetailItem
                      label="CNPJs Vinculados"
                      value={clientUser.cnpjs}
                    />
                    <Separator />
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground">
                        Plano e Acesso
                      </h4>
                      <Button
                        size="sm"
                        onClick={() => onUpgradeOpenChange(true)}
                        className="gap-1.5 bg-gradient-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-white"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                        Alterar Plano
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <UserDetailItem
                        label="Pacote Contratado"
                        value={getPackageLabel(clientUser.package ?? undefined)}
                      />
                      <UserDetailItem
                        label="Nível de Acesso"
                        value={getRoleText(clientUser.role)}
                      />
                      <UserDetailItem
                        label="Status da Conta"
                        value={
                          clientUser.status === "active" ? "Ativo" : "Inativo"
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <AccessConsentSection
                  pendingRequests={pendingRequestsForMe}
                  resolvingRequestId={resolvingRequestId}
                  onResolve={onResolveAccessRequest}
                  approvedRepresentatives={approvedRepresentatives}
                  isLoadingApprovedReps={isLoadingApprovedReps}
                  revokingRepresentativeId={revokingRepresentativeId}
                  onRevokeRepresentative={onRevokeRepresentative}
                />

                <ApprovedConsultorsSection
                  approvedConsultors={approvedConsultors}
                  isLoading={isLoadingApprovedConsultors}
                  revokingConsultorId={revokingConsultorId}
                  onRevoke={onRevokeConsultor}
                />

                {accessRequestsError ? (
                  <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
                    <CardContent className="pt-4 space-y-2">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        Não foi possível carregar os pedidos de acesso.
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        Para o titular poder aprovar ou rejeitar representantes,
                        o administrador deve publicar as regras do Firestore: no
                        terminal, na pasta do projeto, execute{" "}
                        <code className="rounded bg-amber-200/50 dark:bg-amber-900/50 px-1">
                          npm run deploy:rules
                        </code>
                        . É preciso estar logado no Firebase (
                        <code className="rounded bg-amber-200/50 dark:bg-amber-900/50 px-1">
                          firebase login
                        </code>
                        ).
                      </p>
                    </CardContent>
                  </Card>
                ) : null}

                <Card className="border-destructive/30">
                  <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2">
                      <Trash2 className="h-5 w-5" />
                      Exclusão de Dados
                    </CardTitle>
                    <CardDescription>
                      Você pode remover apenas seu usuário de acesso (login) ou
                      solicitar a exclusão completa da conta. Os dados nos submenus
                      Clientes e Empreendedores só podem ser excluídos pelo
                      administrador.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="text-destructive border-destructive hover:bg-destructive/10"
                      onClick={onRequestDeleteAccess}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir usuário de acesso
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Remove apenas seu perfil de acesso. Você será deslogado.
                      Dados em Clientes/Empreendedores não são alterados.
                    </p>
                    <Separator />
                    <Button variant="destructive" onClick={onRequestDeleteAccount}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir minha conta e dados
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Remove sua conta de autenticação e seu perfil. Irreversível.
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </TooltipProvider>
        </main>
      </div>

      <UpgradeDialog open={isUpgradeOpen} onOpenChange={onUpgradeOpenChange} />

      <DeleteAccountAlertDialog
        open={isDeleteAccountOpen}
        onOpenChange={onDeleteAccountOpenChange}
        isDeleting={isDeletingAccount}
        onConfirm={onConfirmDeleteAccount}
      />

      <SelfAccessDeleteAlertDialog
        open={isAlertOpen}
        onOpenChange={onAlertOpenChange}
        onConfirm={onConfirmDeleteAccess}
        onCancelClear={onCancelDelete}
      />

      <UserEditDialog
        open={isDialogOpen}
        onOpenChange={onDialogOpenChange}
        currentUser={editingUser || clientUser}
        onSuccess={onFormSuccess}
        representativesForThisClient={representativesForClientInDialog}
      />
    </>
  );
}
