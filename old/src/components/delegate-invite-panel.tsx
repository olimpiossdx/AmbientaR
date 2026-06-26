"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaskedInput } from "@/components/ui/masked-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import type { AccessRequestType, AppUser } from "@/lib/types";
import { formatCpfCnpjDisplay } from "@/lib/masks";
import { normalizeDocumentDigits } from "@/lib/document-lookup";
import {
  acceptDelegateInvite,
  createDelegateInviteFromTitular,
  filterInvitesCreatedByTitular,
  filterPendingInvitesForProfessional,
  findPortalUserByEmailOrCpf,
  rejectDelegateInvite,
  type DelegateInvite,
} from "@/lib/delegate-invites";

type TitularInviteFormProps = {
  titularUser: AppUser;
  titularDocuments: string[];
};

export function TitularDelegateInviteCard({
  titularUser,
  titularDocuments,
}: TitularInviteFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [role, setRole] = useState<AccessRequestType>("representative");
  const [titularDocument, setTitularDocument] = useState(
    titularDocuments[0] ?? "",
  );
  const [targetEmail, setTargetEmail] = useState("");
  const [targetCpf, setTargetCpf] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [foundProfessional, setFoundProfessional] = useState<
    (AppUser & { id: string }) | null
  >(null);

  const docOptions = useMemo(() => {
    const seen = new Set<string>();
    return titularDocuments.filter((d) => {
      const key = normalizeDocumentDigits(d);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [titularDocuments]);

  const resetSearch = () => {
    setSearchAttempted(false);
    setFoundProfessional(null);
  };

  const handleSearch = async () => {
    if (!firestore) return;
    const email = targetEmail.trim();
    const cpf = targetCpf.trim();
    if (!email && !cpf) {
      toast({
        variant: "destructive",
        title: "Informe e-mail ou CPF",
        description: "Digite ao menos um dos campos para buscar o profissional.",
      });
      return;
    }
    setSearching(true);
    setSearchAttempted(true);
    setFoundProfessional(null);
    try {
      const found = await findPortalUserByEmailOrCpf(firestore, {
        email: email || undefined,
        cpf: cpf || undefined,
      });
      if (!found) {
        toast({
          title: "Profissional não encontrado",
          description:
            "Não há conta com esse e-mail ou CPF. Você ainda pode registrar o convite para quando ele se cadastrar.",
        });
        return;
      }
      if (
        found.role !== "representative" &&
        found.role !== "consultor_representante"
      ) {
        toast({
          variant: "destructive",
          title: "Perfil incompatível",
          description: `A conta encontrada (${found.name}) não é representante nem consultor-representante.`,
        });
        return;
      }
      setFoundProfessional(found);
      if (!email && found.email) setTargetEmail(found.email);
      toast({
        title: "Profissional encontrado",
        description: `${found.name} — ${found.role === "consultor_representante" ? "Consultor-Representante" : "Representante"}`,
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro na busca",
        description: e instanceof Error ? e.message : "Tente novamente.",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!firestore) return;
    const email = foundProfessional?.email || targetEmail.trim();
    const cpf = targetCpf.trim();
    if (!email && !cpf) {
      toast({
        variant: "destructive",
        title: "Informe e-mail ou CPF",
        description: "Busque um profissional ou preencha e-mail/CPF manualmente.",
      });
      return;
    }
    setSubmitting(true);
    try {
      const result = await createDelegateInviteFromTitular({
        firestore,
        titularUser,
        titularDocument,
        role,
        targetEmail: email || undefined,
        targetCpf: cpf || undefined,
      });
      toast({
        title: "Convite registrado",
        description:
          result.status === "pending_professional_ack"
            ? "O profissional receberá uma notificação para confirmar o vínculo."
            : "Convite salvo. Quando o profissional criar conta, o vínculo poderá ser concluído.",
      });
      setTargetEmail("");
      setTargetCpf("");
      resetSearch();
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Não foi possível convidar",
        description: e instanceof Error ? e.message : "Tente novamente.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (docOptions.length === 0) return null;

  return (
    <Card id="delegate-invites-sent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Indicar representante ou consultor
        </CardTitle>
        <CardDescription>
          Busque por e-mail ou CPF para localizar representantes e
          consultores-representantes já cadastrados. Depois registre o convite
          para o vínculo com seus dados (CPF/CNPJ).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Titular (CPF/CNPJ)</Label>
            <Select value={titularDocument} onValueChange={setTitularDocument}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o titular" />
              </SelectTrigger>
              <SelectContent>
                {docOptions.map((doc) => (
                  <SelectItem key={doc} value={doc}>
                    {formatCpfCnpjDisplay(doc)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Perfil do profissional</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as AccessRequestType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="representative">Representante</SelectItem>
                <SelectItem value="consultor_representante">
                  Consultor-Representante
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email">E-mail do profissional</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="profissional@exemplo.com"
              value={targetEmail}
              onChange={(e) => {
                setTargetEmail(e.target.value);
                resetSearch();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-cpf">ou CPF do profissional</Label>
            <MaskedInput
              id="invite-cpf"
              mask="cpf"
              placeholder="000.000.000-00"
              value={targetCpf}
              onChange={(v) => {
                setTargetCpf(v);
                resetSearch();
              }}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleSearch()}
            disabled={
              searching || (!targetEmail.trim() && !targetCpf.trim())
            }
          >
            <Search className="mr-2 h-4 w-4" />
            {searching ? "Buscando..." : "Buscar profissional"}
          </Button>
        </div>
        {searchAttempted && !foundProfessional && !searching && (
          <p className="text-sm text-muted-foreground rounded-md border border-dashed px-3 py-2">
            Nenhuma conta de representante ou consultor encontrada com esses
            dados. Você pode registrar o convite mesmo assim — quando o
            profissional se cadastrar, o vínculo poderá ser concluído.
          </p>
        )}
        {foundProfessional && (
          <div className="rounded-lg border bg-muted/40 px-4 py-3 space-y-1">
            <p className="font-medium text-foreground">{foundProfessional.name}</p>
            <p className="text-sm text-muted-foreground">
              {foundProfessional.email}
            </p>
            <Badge variant="secondary" className="text-xs">
              {foundProfessional.role === "consultor_representante"
                ? "Consultor-Representante"
                : "Representante"}
            </Badge>
          </div>
        )}
        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={
            submitting ||
            (!targetEmail.trim() && !targetCpf.trim() && !foundProfessional)
          }
        >
          {submitting ? "Enviando..." : "Registrar convite"}
        </Button>
      </CardContent>
    </Card>
  );
}

type SentInvitesListProps = {
  invites: DelegateInvite[] | null | undefined;
  titularUid: string;
  /** UIDs já aprovados em clients/empreendedores — oculta convite pendente duplicado. */
  approvedProfessionalUids?: string[];
};

export function TitularSentInvitesList({
  invites,
  titularUid,
  approvedProfessionalUids = [],
}: SentInvitesListProps) {
  const approvedSet = useMemo(
    () => new Set(approvedProfessionalUids),
    [approvedProfessionalUids],
  );
  const sent = useMemo(
    () =>
      filterInvitesCreatedByTitular(invites, titularUid).filter((inv) => {
        if (inv.status !== "pending_professional_ack") return true;
        const target = inv.targetUserId?.trim();
        return !target || !approvedSet.has(target);
      }),
    [invites, titularUid, approvedSet],
  );
  if (sent.length === 0) return null;

  return (
    <div className="space-y-2 border-t pt-3">
      <h4 className="text-sm font-semibold">Convites enviados por você</h4>
      <div className="space-y-2">
        {sent.map((inv) => (
          <div
            key={inv.id}
            className="flex flex-col gap-1 rounded-md border px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">
                {inv.targetUserName ||
                  inv.targetEmail ||
                  formatCpfCnpjDisplay(inv.targetCpf)}
              </p>
              <p className="text-xs text-muted-foreground">
                Titular {formatCpfCnpjDisplay(inv.titularDocument)} ·{" "}
                {inv.role === "consultor_representante"
                  ? "Consultor"
                  : "Representante"}
              </p>
            </div>
            <InviteStatusBadge status={inv.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function InviteStatusBadge({ status }: { status: DelegateInvite["status"] }) {
  switch (status) {
    case "pending":
      return <Badge variant="outline">Aguardando cadastro</Badge>;
    case "pending_professional_ack":
      return <Badge variant="secondary">Aguardando confirmação</Badge>;
    case "accepted":
      return <Badge variant="default">Ativo</Badge>;
    case "expired":
      return <Badge variant="destructive">Expirado</Badge>;
    default:
      return null;
  }
}

type ProfessionalAckProps = {
  user: AppUser;
  invites: DelegateInvite[] | null | undefined;
};

export function DelegateInviteAckCard({ user, invites }: ProfessionalAckProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [workingId, setWorkingId] = useState<string | null>(null);

  const pending = useMemo(
    () => filterPendingInvitesForProfessional(invites, user),
    [invites, user],
  );

  if (pending.length === 0) return null;

  const handleAccept = async (invite: DelegateInvite) => {
    if (!firestore) return;
    setWorkingId(invite.id);
    try {
      await acceptDelegateInvite(firestore, {
        invite,
        acceptingUser: user,
      });
      toast({
        title: "Vínculo confirmado",
        description: "Você passou a ter acesso aos dados do titular indicado.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Erro ao confirmar",
        description: e instanceof Error ? e.message : "Tente novamente.",
      });
    } finally {
      setWorkingId(null);
    }
  };

  const handleReject = async (inviteId: string) => {
    if (!firestore) return;
    setWorkingId(inviteId);
    try {
      await rejectDelegateInvite(firestore, inviteId);
      toast({ title: "Convite recusado" });
    } finally {
      setWorkingId(null);
    }
  };

  return (
    <Card id="delegate-invite-ack" className="border-amber-500/30 bg-amber-500/5">
      <CardHeader>
        <CardTitle>Convites de titulares</CardTitle>
        <CardDescription>
          Titulares indicaram você como profissional. Confirme ciência do vínculo
          para acessar os dados ambientais deles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {pending.map((inv) => (
          <div
            key={inv.id}
            className="flex flex-col gap-3 rounded-lg border bg-background p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium">{inv.createdByName ?? "Titular"}</p>
              <p className="text-sm text-muted-foreground">
                Titular {formatCpfCnpjDisplay(inv.titularDocument)} ·{" "}
                {inv.role === "consultor_representante"
                  ? "Consultor-Representante"
                  : "Representante"}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                disabled={workingId === inv.id}
                onClick={() => void handleReject(inv.id)}
              >
                Recusar
              </Button>
              <Button
                size="sm"
                disabled={workingId === inv.id}
                onClick={() => void handleAccept(inv)}
              >
                {workingId === inv.id ? "Confirmando..." : "Confirmar vínculo"}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
