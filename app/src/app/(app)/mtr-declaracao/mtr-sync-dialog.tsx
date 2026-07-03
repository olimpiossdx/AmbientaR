"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Empreendedor } from "@/lib/types";
import { useFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { mtrCredentialsFromEmpreendedor } from "@/lib/mtr/mtr-sync-service";
import { formatMtrDateBr, mtrLastMonthRange } from "@/lib/mtr/mtr-declaracao-utils";

type MtrSyncDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  empreendedor: Empreendedor | null;
  onSynced?: () => void;
};

export function MtrSyncDialog({
  open,
  onOpenChange,
  empreendedor,
  onSynced,
}: MtrSyncDialogProps) {
  const { auth, firestore, user } = useFirebase();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [pessoaCodigo, setPessoaCodigo] = React.useState("");
  const [usuarioCpf, setUsuarioCpf] = React.useState("");
  const [senha, setSenha] = React.useState("");
  const [salvarCredenciais, setSalvarCredenciais] = React.useState(false);

  const range = mtrLastMonthRange();

  React.useEffect(() => {
    if (!open || !empreendedor) return;
    const mtr = empreendedor.mtrIntegracao;
    setPessoaCodigo(mtr?.pessoaCodigo != null ? String(mtr.pessoaCodigo) : "");
    setUsuarioCpf(mtr?.usuarioCpf ?? "");
    setSenha(mtr?.senha ?? "");
    setSalvarCredenciais(false);
  }, [open, empreendedor]);

  const handleSync = async () => {
    if (!empreendedor || !firestore || !user || !auth?.currentUser) {
      toast({ variant: "destructive", title: "Sessão inválida." });
      return;
    }
    const cnpj = empreendedor.cpfCnpj?.replace(/\D/g, "");
    if (!cnpj) {
      toast({
        variant: "destructive",
        title: "CNPJ/CPF ausente",
        description: "Cadastre o CPF/CNPJ do empreendedor antes de sincronizar.",
      });
      return;
    }
    const codigo = Number(pessoaCodigo);
    if (!codigo || !usuarioCpf.trim() || !senha) {
      toast({
        variant: "destructive",
        title: "Credenciais incompletas",
        description: "Informe código da unidade, CPF do usuário MTR e senha.",
      });
      return;
    }

    setLoading(true);
    try {
      const credentials = {
        pessoaCodigo: codigo,
        pessoaCnpj: cnpj,
        usuarioCpf: usuarioCpf.replace(/\D/g, ""),
        senha,
      };

      await updateDoc(doc(firestore, "empreendedores", empreendedor.id), {
        mtrIntegracao: {
          ...(empreendedor.mtrIntegracao ?? {}),
          pessoaCodigo: codigo,
          usuarioCpf: credentials.usuarioCpf,
          senha,
          ...(salvarCredenciais
            ? {
                autoSyncEnabled: true,
                autoSyncIntervalHours:
                  empreendedor.mtrIntegracao?.autoSyncIntervalHours ?? 24,
              }
            : {}),
        },
      });

      const sessionToken = await auth.currentUser.getIdToken();
      const res = await fetch("/api/mtr/sync-batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ empreendedorIds: [empreendedor.id] }),
      });
      const json = (await res.json()) as {
        error?: string;
        results?: Array<{
          added: number;
          skipped: number;
          pdfsAttached: number;
          error?: string;
        }>;
      };
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      const result = json.results?.[0];
      if (result?.error) throw new Error(result.error);

      toast({
        title: "Sincronização concluída",
        description: result
          ? `${result.added} novo(s), ${result.skipped} já existente(s).${result.pdfsAttached ? ` ${result.pdfsAttached} PDF(s) anexado(s).` : ""}`
          : "Sync concluído.",
      });
      onSynced?.();
      onOpenChange(false);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Falha na sincronização",
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setLoading(false);
    }
  };

  const canAuto = empreendedor
    ? Boolean(mtrCredentialsFromEmpreendedor(empreendedor))
    : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Buscar no MTR-MG</DialogTitle>
          <DialogDescription>
            Consulta CDFs e manifestos dos últimos 30 dias (
            {formatMtrDateBr(range.inicio)} a {formatMtrDateBr(range.fim)}) via
            WebService SEMAD/FEAM.
            {empreendedor ? ` — ${empreendedor.name}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {!empreendedor?.cpfCnpj && (
            <p className="text-sm text-destructive">
              Este empreendedor não tem CPF/CNPJ cadastrado.
            </p>
          )}
          {canAuto && (
            <p className="text-sm text-muted-foreground">
              Credenciais salvas encontradas. Ajuste abaixo se necessário.
            </p>
          )}
          <div className="space-y-1">
            <Label htmlFor="mtr-pessoa-codigo">Código da unidade (pessoaCodigo)</Label>
            <Input
              id="mtr-pessoa-codigo"
              inputMode="numeric"
              value={pessoaCodigo}
              onChange={(e) => setPessoaCodigo(e.target.value)}
              placeholder="Ex.: 4"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="mtr-usuario-cpf">CPF do usuário MTR</Label>
            <Input
              id="mtr-usuario-cpf"
              value={usuarioCpf}
              onChange={(e) => setUsuarioCpf(e.target.value)}
              placeholder="Somente números"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="mtr-senha">Senha MTR</Label>
            <Input
              id="mtr-senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="mtr-salvar"
              checked={salvarCredenciais}
              onCheckedChange={(v) => setSalvarCredenciais(v === true)}
            />
            <Label htmlFor="mtr-salvar" className="text-sm font-normal">
              Guardar credenciais neste empreendedor (sync automático depois)
            </Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => void handleSync()} disabled={loading || !empreendedor}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Buscando…
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sincronizar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
