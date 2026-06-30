import React from "react";
import { useNavigate } from "@tanstack/react-router";
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

export function SessionLockModal() {
 const auth = useAuthSnapshot();
 const actions = useAuthActions();
 const navigate = useNavigate();
 const [isSwitchingUser, setIsSwitchingUser] = React.useState(false);

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
   description="Digite sua senha para continuar exatamente de onde parou."
   size="md"
   hideCloseButton
   closeOnBackdropClick={false}
   closeOnEscape={false}
  >
   <Form<ReloginFormModel>
    id="session-lock-form"
    model={{ password: "" }}
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
       variant="ghost"
       disabled={isSwitchingUser}
       onClick={handleSwitchUser}
      >
       Trocar usuário
      </Button>
      <Button type="submit">Entrar novamente</Button>
     </div>
    )}
   >
    <div className="space-y-4">
     <FormAlertRegion />
     <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Usuário atual</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{auth.user?.nome}</p>
      <p className="text-xs text-slate-500">{auth.user?.username}</p>
     </div>
     <Input
      name="password"
      type="password"
      label="Senha"
      placeholder="Digite sua senha"
      autoComplete="current-password"
      showPasswordToggle
      required
     />
    </div>
   </Form>
  </Modal>
 );
}
