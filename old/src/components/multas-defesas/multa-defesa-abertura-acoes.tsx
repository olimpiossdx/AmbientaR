"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BrDateInput } from "@/components/form/br-date-input";
import { useFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import {
  DECISAO_ENCERRAMENTO_LABELS,
  type DecisaoEncerramentoTipo,
  type MultaDefesaStatus,
  inferMultaStatus,
} from "@/lib/multas-defesas";
import type { AutoInfracaoDefesaRecord } from "@/lib/multas-defesas/types";
import { STORAGE_PREFIX } from "@/lib/multas-defesas/utils";
import { effectiveMimeType } from "@/lib/file-mime";
import {
  sanitizeStorageFileName,
  uploadFileToStorage,
} from "@/lib/storage-upload";
import { usePreparedUpload } from "@/hooks/use-prepared-upload";
import { Gavel, Banknote, MessageSquare } from "lucide-react";

type Props = {
  record: AutoInfracaoDefesaRecord;
  canWrite: boolean;
  onUpdated?: () => void;
};

export function MultaDefesaAberturaAcoes({ record, canWrite, onUpdated }: Props) {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const { prepareFile } = usePreparedUpload({ storagePathPrefix: STORAGE_PREFIX });

  const [openEncerrar, setOpenEncerrar] = React.useState(false);
  const [openDemanda, setOpenDemanda] = React.useState(false);
  const [encerrarTipo, setEncerrarTipo] = React.useState<DecisaoEncerramentoTipo>("pagamento");
  const [encerrarDescricao, setEncerrarDescricao] = React.useState("");
  const [encerrarData, setEncerrarData] = React.useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [encerrarArquivo, setEncerrarArquivo] = React.useState<File | null>(null);
  const [demandaTexto, setDemandaTexto] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const status = inferMultaStatus(record);
  const podeEscolherOpcao =
    status === "aguardando_opcao" || status === "demanda_defesa_pendente";

  if (!canWrite || !podeEscolherOpcao) return null;

  const iniciarDefesa = async () => {
    if (!firestore) return;
    setSaving(true);
    try {
      await updateDoc(doc(firestore, "autoInfracaoDefesas", record.id), {
        status: "defesa_em_elaboracao",
        faseAtual: "instrucao",
        tipoDefesa: record.tipoDefesa || "Defesa em 1º Instância / Administrativa",
        solicitacaoDefesaCliente: record.solicitacaoDefesaCliente
          ? { ...record.solicitacaoDefesaCliente, status: "em_atendimento" as const }
          : undefined,
      });
      toast({ title: "Defesa em elaboração" });
      onUpdated?.();
    } catch {
      toast({ variant: "destructive", title: "Erro ao iniciar defesa" });
    } finally {
      setSaving(false);
    }
  };

  const registrarDemanda = async () => {
    if (!firestore) return;
    setSaving(true);
    try {
      await updateDoc(doc(firestore, "autoInfracaoDefesas", record.id), {
        status: "demanda_defesa_pendente",
        solicitacaoDefesaCliente: {
          solicitadoEm: new Date().toISOString(),
          texto: demandaTexto.trim(),
          status: "pendente",
        },
      });
      toast({ title: "Demanda registrada" });
      setOpenDemanda(false);
      onUpdated?.();
    } catch {
      toast({ variant: "destructive", title: "Erro ao registrar demanda" });
    } finally {
      setSaving(false);
    }
  };

  const encerrar = async () => {
    if (!firestore || !user || !encerrarDescricao.trim()) {
      toast({
        variant: "destructive",
        title: "Descreva a decisão do cliente.",
      });
      return;
    }
    setSaving(true);
    try {
      let anexo: { name: string; url: string; contentType: string } | undefined;
      if (encerrarArquivo) {
        const prepared = await prepareFile(encerrarArquivo);
        if (!prepared) throw new Error("Upload cancelado.");
        const path = `${STORAGE_PREFIX}${record.processYear}/decisao-${record.id}-${Date.now()}-${sanitizeStorageFileName(encerrarArquivo.name)}`;
        const url = await uploadFileToStorage(prepared, path);
        anexo = {
          name: encerrarArquivo.name,
          url,
          contentType: effectiveMimeType(encerrarArquivo) || "application/octet-stream",
        };
      }
      const statusMap: Record<DecisaoEncerramentoTipo, MultaDefesaStatus> = {
        pagamento: "encerrada_pagamento",
        parcelamento: "encerrada_parcelamento",
        pecma: "encerrada_pecma",
      };
      await updateDoc(doc(firestore, "autoInfracaoDefesas", record.id), {
        status: statusMap[encerrarTipo],
        faseAtual: "encerrado",
        decisaoEncerramento: {
          tipo: encerrarTipo,
          descricao: encerrarDescricao.trim(),
          dataDecisao: encerrarData,
          anexo,
          registradoEm: new Date().toISOString(),
          registradoPor: user.uid,
        },
      });
      toast({
        title: "Demanda encerrada",
        description: DECISAO_ENCERRAMENTO_LABELS[encerrarTipo],
      });
      setOpenEncerrar(false);
      onUpdated?.();
    } catch {
      toast({ variant: "destructive", title: "Erro ao encerrar" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="gap-1" disabled={saving} onClick={() => void iniciarDefesa()}>
          <Gavel className="h-4 w-4" />
          Iniciar elaboração da defesa
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={() => {
            setDemandaTexto(record.solicitacaoDefesaCliente?.texto || "");
            setOpenDemanda(true);
          }}
        >
          <MessageSquare className="h-4 w-4" />
          Pedido do cliente
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1"
          onClick={() => {
            setEncerrarTipo("pagamento");
            setEncerrarDescricao("");
            setEncerrarData(new Date().toISOString().slice(0, 10));
            setEncerrarArquivo(null);
            setOpenEncerrar(true);
          }}
        >
          <Banknote className="h-4 w-4" />
          Encerrar (pagamento / parcelamento / PECMA)
        </Button>
      </div>

      <Dialog open={openDemanda} onOpenChange={setOpenDemanda}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Pedido de defesa pelo cliente</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Ex.: Cliente solicitou defesa até…"
            value={demandaTexto}
            onChange={(e) => setDemandaTexto(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDemanda(false)}>
              Cancelar
            </Button>
            <Button disabled={saving} onClick={() => void registrarDemanda()}>
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openEncerrar} onOpenChange={setOpenEncerrar}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Encerrar sem defesa</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>Opção do cliente</Label>
              <Select
                value={encerrarTipo}
                onValueChange={(v) => setEncerrarTipo(v as DecisaoEncerramentoTipo)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(DECISAO_ENCERRAMENTO_LABELS) as DecisaoEncerramentoTipo[]).map(
                    (k) => (
                      <SelectItem key={k} value={k}>
                        {DECISAO_ENCERRAMENTO_LABELS[k]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Data da decisão</Label>
              <BrDateInput value={encerrarData} onChange={setEncerrarData} />
            </div>
            <div className="space-y-1">
              <Label>Histórico / decisão (obrigatório)</Label>
              <Textarea
                value={encerrarDescricao}
                onChange={(e) => setEncerrarDescricao(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Comprovante (opcional)</Label>
              <Input
                type="file"
                accept=".pdf,.docx,.jpg,.jpeg,.png"
                onChange={(e) => setEncerrarArquivo(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenEncerrar(false)}>
              Cancelar
            </Button>
            <Button disabled={saving} onClick={() => void encerrar()}>
              Encerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
