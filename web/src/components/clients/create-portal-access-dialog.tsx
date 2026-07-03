"use client";

import { useCallback, useEffect, useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaskedInput } from "@/components/ui/masked-input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useFirebase } from "@/firebase";
import type { AppUser, Client } from "@/lib/types";
import { FirebaseAdminSetupHelp } from "@/components/admin/firebase-admin-setup-help";
import {
  FIREBASE_AUTH_USERS_CONSOLE_URL,
  isAdminCredentialsMissing,
} from "@/lib/admin/firebase-admin-setup";
import { ToastAction } from "@/components/ui/toast";
import { UserPlus, Mail } from "lucide-react";

type CreatePortalAccessDialogProps = {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreatePortalAccessDialog({
  client,
  open,
  onOpenChange,
}: CreatePortalAccessDialogProps) {
  const { auth, firestore } = useFirebase();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [userCpf, setUserCpf] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [portalUsers, setPortalUsers] = useState<AppUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showAdminHelp, setShowAdminHelp] = useState(false);

  useEffect(() => {
    if (!open || !client) return;
    setName(client.name || "");
    setEmail(client.email?.trim() || "");
    setUserCpf("");
  }, [open, client]);

  const loadPortalUsers = useCallback(async () => {
    if (!firestore || !client) {
      setPortalUsers([]);
      return;
    }
    setLoadingUsers(true);
    try {
      const uids = new Set<string>();
      if (client.userId) uids.add(client.userId);
      (client.portalUserIds || []).forEach((id) => uids.add(id));
      if (uids.size === 0) {
        setPortalUsers([]);
        return;
      }
      const found: AppUser[] = [];
      for (const uid of uids) {
        const snap = await getDocs(
          query(collection(firestore, "users"), where("uid", "==", uid)),
        );
        snap.forEach((d) => {
          found.push({ id: d.id, ...(d.data() as Omit<AppUser, "id">) });
        });
      }
      setPortalUsers(found);
    } finally {
      setLoadingUsers(false);
    }
  }, [firestore, client]);

  useEffect(() => {
    if (open) void loadPortalUsers();
  }, [open, loadPortalUsers]);

  const sendInviteEmail = async (targetEmail: string) => {
    if (!auth) throw new Error("Autenticação indisponível.");
    await sendPasswordResetEmail(auth, targetEmail.trim().toLowerCase());
  };

  const handleCreate = async () => {
    if (!auth || !client) return;
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    if (!trimmedEmail || !trimmedName) {
      toast({
        variant: "destructive",
        title: "Dados obrigatórios",
        description: "Informe nome e e-mail do responsável pelo portal.",
      });
      return;
    }

    setSubmitting(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sessão inválida. Faça login novamente.");

      const res = await fetch("/api/admin/create-portal-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId: client.id,
          email: trimmedEmail,
          name: trimmedName,
          userCpf: userCpf.trim() || undefined,
        }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
        code?: string;
        result?: { email: string; isAdditionalPortalUser?: boolean };
      };

      if (!res.ok || !data.success) {
        if (isAdminCredentialsMissing(res.status, data.code)) {
          setShowAdminHelp(true);
        }
        throw new Error(
          data.error || "Não foi possível criar o acesso ao portal.",
        );
      }

      try {
        await sendInviteEmail(trimmedEmail);
      } catch (mailErr) {
        console.warn("E-mail de senha não enviado:", mailErr);
        toast({
          variant: "destructive",
          title: "Conta criada, e-mail não enviado",
          description:
            "O usuário foi criado, mas o Firebase não enviou o e-mail. Reenvie pelo botão abaixo ou use Esqueci minha senha.",
        });
        await loadPortalUsers();
        return;
      }

      toast({
        title: "Acesso ao portal criado",
        description: data.result?.isAdditionalPortalUser
          ? `Novo responsável (${trimmedEmail}) vinculado. E-mail enviado para definir a senha.`
          : `Convite enviado para ${trimmedEmail}. O titular define a senha pelo link do e-mail.`,
      });
      setEmail("");
      setUserCpf("");
      await loadPortalUsers();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Falha ao criar acesso",
        description:
          err instanceof Error ? err.message : "Tente novamente.",
        action: showAdminHelp ? (
          <ToastAction altText="Abrir Authentication" asChild>
            <a
              href={FIREBASE_AUTH_USERS_CONSOLE_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Authentication
            </a>
          </ToastAction>
        ) : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async (targetEmail: string) => {
    if (!auth) return;
    try {
      await sendInviteEmail(targetEmail);
      toast({
        title: "E-mail reenviado",
        description: `Link para definir senha enviado para ${targetEmail}.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Falha ao reenviar",
        description:
          err instanceof Error ? err.message : "Verifique o e-mail no Firebase.",
      });
    }
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Acesso ao portal — Cliente Gestão
          </DialogTitle>
          <DialogDescription>
            Cria login para <strong>{client.name}</strong>. Pacote e pagamento
            consideram-se já definidos pela consultoria. O titular define a senha
            por e-mail (sem senha padrão).
          </DialogDescription>
        </DialogHeader>

        {showAdminHelp && <FirebaseAdminSetupHelp variant="inline" />}

        <div className="space-y-4">
          <div className="rounded-md border bg-muted/30 p-3 space-y-2">
            <p className="text-sm font-medium">Usuários do portal vinculados</p>
            {loadingUsers ? (
              <p className="text-xs text-muted-foreground">Carregando...</p>
            ) : portalUsers.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum acesso portal criado ainda.
              </p>
            ) : (
              <ul className="space-y-2">
                {portalUsers.map((u) => (
                  <li
                    key={u.id}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm border rounded-md px-2 py-2"
                  >
                    <div>
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant={
                          u.status === "pending_invite" ? "outline" : "secondary"
                        }
                      >
                        {u.status === "pending_invite"
                          ? "Aguardando 1º acesso"
                          : u.status === "active"
                            ? "Ativo"
                            : "Inativo"}
                      </Badge>
                      {u.status === "pending_invite" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void handleResend(u.email)}
                        >
                          <Mail className="h-3 w-3 mr-1" />
                          Reenviar
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="portal-name">Nome do responsável</Label>
            <Input
              id="portal-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portal-email">E-mail de login</Label>
            <Input
              id="portal-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@empresa.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="portal-cpf">CPF do responsável (opcional)</Label>
            <MaskedInput
              id="portal-cpf"
              mask="cpf"
              value={userCpf}
              onChange={setUserCpf}
              placeholder="000.000.000-00"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Fechar
          </Button>
          <Button
            type="button"
            onClick={() => void handleCreate()}
            disabled={submitting}
          >
            {submitting ? "Criando..." : "Criar e enviar convite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
