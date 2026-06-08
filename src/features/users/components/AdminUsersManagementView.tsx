import { PlusCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { canEditUserInUsersList } from "@/lib/role-guards";
import type { AccessRequest, AppUser, UserRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OrphanEmailReleaseCard } from "./OrphanEmailReleaseCard";
import { UserDeleteAlertDialog } from "./UserDeleteAlertDialog";
import { UserEditDialog } from "./UserEditDialog";
import { UserViewDialog } from "./UserViewDialog";
import { UsersListItemCard } from "./UsersListItemCard";

type AdminUsersManagementViewProps = {
  currentRole: UserRole | undefined;
  sessionUid: string | null | undefined;
  sessionTargetUid: string | null;
  isAdmin: boolean;
  onAddNew: () => void;
  orphanEmail: string;
  onOrphanEmailChange: (value: string) => void;
  isReleasingOrphanEmail: boolean;
  adminSdkConfigured: boolean | null;
  showOrphanEmailSetupHelp: boolean;
  onReleaseOrphanEmail: () => void;
  isLoading: boolean;
  appUsers: AppUser[] | null | undefined;
  presenceNow: number;
  canDeleteUser: (target: AppUser | null) => boolean;
  onView: (user: AppUser) => void;
  onEdit: (user: AppUser) => void;
  onDeleteConfirm: (user: AppUser) => void;
  onExportLog: (user: AppUser, format: "txt" | "pdf") => void;
  isDialogOpen: boolean;
  onDialogOpenChange: (open: boolean) => void;
  editingUser: AppUser | null;
  onFormSuccess: () => void;
  allPendingRequests: AccessRequest[] | null | undefined;
  representativesForClientInDialog: {
    id: string;
    requestedByName: string;
    requestedByUserId: string;
    status: string;
    representativeCpf?: string;
  }[];
  isViewOpen: boolean;
  onViewOpenChange: (open: boolean) => void;
  viewingUser: AppUser | null;
  isAlertOpen: boolean;
  onAlertOpenChange: (open: boolean) => void;
  userToDelete: AppUser | null;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
};

function skeletonCountForRole(role: UserRole | undefined): number {
  if (role === "admin" || role === "supervisor" || role === "diretor_fauna") {
    return 5;
  }
  if (role === "financial") return 3;
  return 1;
}

export function AdminUsersManagementView({
  currentRole,
  sessionUid,
  sessionTargetUid,
  isAdmin,
  onAddNew,
  orphanEmail,
  onOrphanEmailChange,
  isReleasingOrphanEmail,
  adminSdkConfigured,
  showOrphanEmailSetupHelp,
  onReleaseOrphanEmail,
  isLoading,
  appUsers,
  presenceNow,
  canDeleteUser,
  onView,
  onEdit,
  onDeleteConfirm,
  onExportLog,
  isDialogOpen,
  onDialogOpenChange,
  editingUser,
  onFormSuccess,
  allPendingRequests,
  representativesForClientInDialog,
  isViewOpen,
  onViewOpenChange,
  viewingUser,
  isAlertOpen,
  onAlertOpenChange,
  userToDelete,
  onConfirmDelete,
  onCancelDelete,
}: AdminUsersManagementViewProps) {
  const canExportLog =
    currentRole === "admin" || currentRole === "supervisor";

  return (
    <>
      <div className="flex flex-col h-full">
        <PageHeader title="Usuários">
          {isAdmin && (
            <Button size="sm" className="gap-1" onClick={onAddNew}>
              <PlusCircle className="h-4 w-4" />
              Adicionar Usuário
            </Button>
          )}
        </PageHeader>
        <main className="flex-1 overflow-auto p-4 md:p-6 space-y-4">
          {isAdmin && (
            <OrphanEmailReleaseCard
              orphanEmail={orphanEmail}
              onOrphanEmailChange={onOrphanEmailChange}
              isReleasing={isReleasingOrphanEmail}
              adminSdkConfigured={adminSdkConfigured}
              showSetupHelp={showOrphanEmailSetupHelp}
              onRelease={onReleaseOrphanEmail}
            />
          )}
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <TooltipProvider>
                <div className="space-y-4">
                  {isLoading &&
                    Array.from({ length: skeletonCountForRole(currentRole) }).map(
                      (_, i) => (
                        <Skeleton key={i} className="h-28 w-full rounded-lg" />
                      ),
                    )}
                  {appUsers?.map((appUser) => (
                    <UsersListItemCard
                      key={appUser.id}
                      appUser={appUser}
                      presenceNow={presenceNow}
                      currentRole={currentRole}
                      sessionUid={sessionUid}
                      sessionTargetUid={sessionTargetUid}
                      canEdit={canEditUserInUsersList(
                        currentRole,
                        sessionUid ?? undefined,
                        appUser,
                      )}
                      canDelete={canDeleteUser(appUser)}
                      canExportLog={canExportLog}
                      onView={() => onView(appUser)}
                      onEdit={() => onEdit(appUser)}
                      onDelete={() => onDeleteConfirm(appUser)}
                      onExportLog={(format) => onExportLog(appUser, format)}
                    />
                  ))}
                  {!isLoading && (!appUsers || appUsers.length === 0) && (
                    <div className="flex h-24 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 text-center text-sm text-muted-foreground">
                      Nenhum usuário encontrado.
                    </div>
                  )}
                </div>
              </TooltipProvider>
            </CardContent>
          </Card>
        </main>
      </div>

      <UserEditDialog
        open={isDialogOpen}
        onOpenChange={onDialogOpenChange}
        title={editingUser ? "Editar usuário" : "Adicionar usuário"}
        description="Preencha os dados do usuário abaixo."
        currentUser={editingUser}
        onSuccess={onFormSuccess}
        representativesForThisClient={representativesForClientInDialog}
        representativeRequestedCpf={
          editingUser?.role === "representative"
            ? (allPendingRequests?.find(
                (r) => r.requestedByUserId === editingUser.id,
              )?.cpfOfInterested ?? null)
            : undefined
        }
        representativeRequestedCpfsCnpjs={
          editingUser?.role === "representative"
            ? ((allPendingRequests
                ?.filter((r) => r.requestedByUserId === editingUser.id)
                .map((r) => r.cpfOfInterested)
                .filter(Boolean) as string[]) ?? [])
            : undefined
        }
      />

      <UserViewDialog
        open={isViewOpen}
        onOpenChange={onViewOpenChange}
        user={viewingUser}
        presenceNow={presenceNow}
      />

      <UserDeleteAlertDialog
        open={isAlertOpen}
        onOpenChange={onAlertOpenChange}
        userToDelete={userToDelete}
        sessionTargetUid={sessionTargetUid}
        currentRole={currentRole}
        onConfirm={onConfirmDelete}
        onCancelClear={onCancelDelete}
      />
    </>
  );
}
