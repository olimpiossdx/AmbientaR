"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  cartaoStatus,
  certificadoStatus,
  formatCtfDateBr,
  formatCtfDateTimeBr,
  hasAnyCtfDocument,
  type CtfIbamaEntity,
} from "@/lib/ctf-ibama-utils";
import { FileText, ExternalLink } from "lucide-react";

const DetailItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) => (
  <div className="space-y-1">
    <Label className="text-sm font-medium">{label}</Label>
    <p className="text-sm text-muted-foreground">{value ?? "Não informado"}</p>
  </div>
);

export function CtfIbamaDetailSection({
  entity,
  showManageLink = true,
}: {
  entity: CtfIbamaEntity;
  showManageLink?: boolean;
}) {
  const cartao = cartaoStatus(entity);
  const cert = certificadoStatus(entity);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-semibold text-foreground">CTF/IBAMA</h4>
        {showManageLink && (
          <Button variant="outline" size="sm" className="gap-1 h-8" asChild>
            <Link href="/ctf-ibama">
              <ExternalLink className="h-3.5 w-3.5" />
              Gerenciar documentos
            </Link>
          </Button>
        )}
      </div>
      <DetailItem label="Número CTF/IBAMA" value={entity.ctfIbama} />
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className={cn("w-fit", cartao.className)}>
          {cartao.label}
        </Badge>
        <Badge variant="outline" className={cn("w-fit", cert.className)}>
          {cert.label}
        </Badge>
      </div>
      {entity.ctfIbamaCertificadoValidade?.trim() && (
        <DetailItem
          label="Validade do certificado"
          value={formatCtfDateBr(entity.ctfIbamaCertificadoValidade)}
        />
      )}
      {entity.ctfIbamaCartaoUpdatedAt && (
        <DetailItem
          label="Cartão atualizado em"
          value={formatCtfDateTimeBr(entity.ctfIbamaCartaoUpdatedAt)}
        />
      )}
      {entity.ctfIbamaCertificadoUpdatedAt && (
        <DetailItem
          label="Certificado atualizado em"
          value={formatCtfDateTimeBr(entity.ctfIbamaCertificadoUpdatedAt)}
        />
      )}
      {hasAnyCtfDocument(entity) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {entity.ctfIbamaCartaoUrl?.trim() && (
            <Button variant="secondary" size="sm" className="gap-1 h-8" asChild>
              <a
                href={entity.ctfIbamaCartaoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="h-3.5 w-3.5" />
                Cartão de Cadastro
              </a>
            </Button>
          )}
          {entity.ctfIbamaCertificadoUrl?.trim() && (
            <Button variant="secondary" size="sm" className="gap-1 h-8" asChild>
              <a
                href={entity.ctfIbamaCertificadoUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText className="h-3.5 w-3.5" />
                Certificado
              </a>
            </Button>
          )}
        </div>
      )}
      <Separator />
    </div>
  );
}
