import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { Lock, LogIn, User, Users } from "lucide-react";
import { Form } from "../componentes/form/form";
import { FormAlertRegion } from "../componentes/form/form-alert-region";
import Button from "../componentes/button";
import Input from "../componentes/input";
import { Modal } from "../componentes/modal";
import { useAuthActions } from "./auth-provider";
import { authStore } from "./auth-store";
import { useAuthSnapshot } from "./auth-hooks";

type ReloginFormModel = {
 password: string;
};

function getInitials(name?: string | null) {
 if (!name) {
  return "U";
 }

 const initials = name
  .trim()
  .split(/\s+/)
  .slice(0, 2)
  .map((part) => part[0])
  .join("");

 return initials.toUpperCase() || "U";
}

export function SessionLockModal() {
 const auth = useAuthSnapshot();
 const actions = useAuthActions();
 const navigate = useNavigate();
 const [isSwitchingUser, setIsSwitchingUser] = React.useState(false);
 const userName = auth.user?.nome || "Usuário atual";
 const userIdentifier = auth.user?.username;

 const handleSwitchUser = React.useCallback(async () => {
  setIsSwitchingUser(true);
  await actions.switchUser();
  await navigate({ to: "/login", replace: true });
 }, [actions, navigate]);

 if (!auth.isLocked || !auth.hasKnownUser) {
  return null;
 }

 return (
  <Modal
   open
   onClose={() => undefined}
   title="Sessão bloqueada"
   description="Confirme sua senha para retomar o trabalho de onde parou."
   size="md"
   hideCloseButton
   closeOnBackdropClick={false}
   closeOnEscape={false}
   classNames={{
    overlay: "items-end p-0 sm:items-center sm:p-6",
    panel:
     "max-h-[92svh] rounded-b-none rounded-t-2xl border-x-0 border-b-0 sm:max-h-[calc(100vh-3rem)] sm:rounded-2xl sm:border",
    header: "gap-2 px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5",
    title: "text-xl leading-7 sm:text-lg sm:leading-6",
    description: "max-w-sm text-sm leading-5",
    content: "px-4 py-4 sm:px-6 sm:py-5",
   }}
  >
   <Form<ReloginFormModel>
    id="session-lock-form"
    model={{ password: "" }}
    className="flex flex-col gap-4"
    validation={{
     feedbackMode: "both",
     schema: {
      password: {
       validate: (value) => ({
        valid: typeof value === "string" && value.trim().length > 0,
        message: "Informe sua senha para continuar.",
       }),
      },
     },
    }}
    actionsClassName="border-t border-border bg-muted/40 px-4 py-3 -mx-4 -mb-4 sm:-mx-6 sm:-mb-5 sm:px-6 sm:py-4"
    defaultNotificationChannels={["alert"]}
    onSubmit={async (model) => {
     const session = await actions.relogin({ password: model.password });

     if (!session) {
      return {
       ok: false,
       status: "error",
       message: "Não foi possível revalidar sua sessão. Confira a senha e tente novamente.",
      };
     }

     const pendingLocation = authStore.getSnapshot().pendingLocation;

     if (pendingLocation) {
      authStore.setPendingLocation(null);
      await navigate({ to: pendingLocation as never, replace: true });
     }

     return {
      ok: true,
      status: "success",
      message: "Sessão revalidada.",
      data: session,
     };
    }}
    actions={() => (
     <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
      <Button
       type="button"
       variant="outline"
       className="h-11 w-full sm:w-auto"
       disabled={isSwitchingUser}
       onClick={handleSwitchUser}
       leftIcon={<Users size={16} aria-hidden="true" />}
      >
       Trocar usuário
      </Button>
      <Button
       type="submit"
       className="h-11 w-full sm:w-auto"
       leftIcon={<LogIn size={16} aria-hidden="true" />}
      >
       Entrar novamente
      </Button>
     </div>
    )}
   >
    <div className="space-y-4">
     <FormAlertRegion />

     <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/45 p-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
       {getInitials(userName)}
      </div>
      <div className="min-w-0 flex-1">
       <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <User size={13} aria-hidden="true" />
        <span>Usuário atual</span>
       </div>
       <p className="mt-1 truncate text-sm font-semibold text-foreground">
        {userName}
       </p>
       {userIdentifier && (
        <p className="truncate text-xs text-muted-foreground">
         {userIdentifier}
        </p>
       )}
      </div>
      <div className="hidden rounded-full bg-background p-2 text-muted-foreground shadow-sm sm:block">
       <Lock size={16} aria-hidden="true" />
      </div>
     </div>

     <Input
      name="password"
      type="password"
      label="Senha"
      placeholder="Sua senha"
      autoComplete="current-password"
      showPasswordToggle
      required
     />
    </div>
   </Form>
  </Modal>
 );
}
