import { PageHeader } from "@/components/page-header";
import { DelegateAccessPortfolioCard } from "@/components/delegate-access-portfolio-card";
import type { AccessRequest, AppUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { ApprovedTitularEntry } from "../lib/user-display";
import { getRoleText } from "../lib/user-display";
import { UserDetailItem } from "./UserDetailItem";
import { UserEditDialog } from "./UserEditDialog";

type ConsultorPortalUsersViewProps = {
  consultorUser: AppUser;
  editingUser: AppUser | null;
  isDialogOpen: boolean;
  onDialogOpenChange: (open: boolean) => void;
  onEditProfile: () => void;
  onFormSuccess: () => void;
  myDelegateAccessRequests: AccessRequest[] | null | undefined;
  approvedTitulares: ApprovedTitularEntry[];
  consultorUid: string;
  myDelegatePendingCpfsCnpjs: string[];
};

export function ConsultorPortalUsersView({
  consultorUser,
  editingUser,
  isDialogOpen,
  onDialogOpenChange,
  onEditProfile,
  onFormSuccess,
  myDelegateAccessRequests,
  approvedTitulares,
  consultorUid,
  myDelegatePendingCpfsCnpjs,
}: ConsultorPortalUsersViewProps) {
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
                    <CardTitle>{consultorUser.name}</CardTitle>
                    <CardDescription>
                      Perfil de consultor-representante. Opere licenças, outorgas
                      e cadastros dos titulares que aprovaram sua carteira.
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={onEditProfile}>
                    Atualizar / Editar Cadastro
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <UserDetailItem label="Email" value={consultorUser.email} />
                <UserDetailItem
                  label="Nível de Acesso"
                  value={getRoleText("consultor_representante")}
                />
              </CardContent>
            </Card>

            <DelegateAccessPortfolioCard
              role="consultor_representante"
              accessRequests={myDelegateAccessRequests}
              approvedTitulares={approvedTitulares}
              requesterUserId={consultorUid}
              requesterName={consultorUser.name || ""}
              requesterEmail={consultorUser.email || ""}
            />
          </TooltipProvider>
        </main>
      </div>

      <UserEditDialog
        open={isDialogOpen}
        onOpenChange={onDialogOpenChange}
        description=""
        currentUser={editingUser || consultorUser}
        onSuccess={onFormSuccess}
        representativeRequestedCpfsCnpjs={myDelegatePendingCpfsCnpjs}
      />
    </>
  );
}
