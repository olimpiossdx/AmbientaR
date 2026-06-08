import { getAccessRequestType } from "@/lib/consultor-assignments";
import { formatCpfCnpjDisplay } from "@/lib/masks";
import type { AccessRequest, AppUser } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type AccessConsentSectionProps = {
  pendingRequests: AccessRequest[];
  resolvingRequestId: string | null;
  onResolve: (requestId: string, approve: boolean) => void;
  approvedRepresentatives: AppUser[];
  isLoadingApprovedReps: boolean;
  revokingRepresentativeId: string | null;
  onRevokeRepresentative: (representativeUserId: string) => void;
};

export function AccessConsentSection({
  pendingRequests,
  resolvingRequestId,
  onResolve,
  approvedRepresentatives,
  isLoadingApprovedReps,
  revokingRepresentativeId,
  onRevokeRepresentative,
}: AccessConsentSectionProps) {
  return (
    <Card id="access-requests-card">
      <CardHeader>
        <CardTitle>Consentimento de acesso (representantes e consultores)</CardTitle>
        <CardDescription>
          Aceite ou recuse pedidos de representantes e consultores-representantes
          que solicitaram acesso aos seus dados (CPF/CNPJ do titular ou do
          empreendedor).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingRequests.length > 0 ? (
          pendingRequests.map((req) => (
            <div
              key={req.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border p-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">
                    {req.requestedByName}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {getAccessRequestType(req) === "consultor_representante"
                      ? "Consultor-Representante"
                      : "Representante"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  E-mail: {req.requestedByEmail}
                </p>
                <p className="text-xs text-muted-foreground">
                  Solicitou acesso ao CPF/CNPJ:{" "}
                  {formatCpfCnpjDisplay(req.cpfOfInterested)}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={resolvingRequestId === req.id}
                      onClick={() => onResolve(req.id, false)}
                    >
                      Recusar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Recusar o pedido de acesso deste representante aos seus
                      dados
                    </p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      disabled={resolvingRequestId === req.id}
                      onClick={() => onResolve(req.id, true)}
                    >
                      Aceitar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Aceitar o pedido e conceder a este representante acesso aos
                      seus dados (cliente/empreendedor)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          ))
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground py-2">
              Nenhum pedido de acesso pendente. Quando um representante ou
              consultor solicitar acesso, você poderá aceitar ou recusar aqui.
            </p>
            <p className="text-xs text-muted-foreground border-t pt-2">
              Se alguém já pediu acesso ao CNPJ do empreendedor e não aparece
              aqui: confira se o <strong>CNPJ está salvo</strong> no seu perfil
              ou no cadastro de Empreendedores vinculado à sua conta, e se o
              solicitante informou o <strong>mesmo documento</strong> (com ou
              sem pontuação).
            </p>
          </div>
        )}

        <div className="space-y-2 border-t pt-3">
          <h4 className="text-sm font-semibold text-foreground">
            Representantes com acesso aprovado aos seus dados
          </h4>
          {isLoadingApprovedReps ? (
            <p className="text-xs text-muted-foreground">
              Carregando representantes...
            </p>
          ) : approvedRepresentatives.length > 0 ? (
            <div className="space-y-2">
              {approvedRepresentatives.map((rep) => (
                <div
                  key={rep.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border px-3 py-2 bg-muted/40"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {rep.name}{" "}
                      <span className="text-xs text-muted-foreground">
                        (Representante)
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">{rep.email}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive hover:bg-destructive/10"
                    disabled={revokingRepresentativeId === rep.uid}
                    onClick={() =>
                      onRevokeRepresentative(rep.uid || rep.id)
                    }
                  >
                    {revokingRepresentativeId === rep.uid
                      ? "Revogando..."
                      : "Revogar acesso"}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhum representante aprovado no momento. Assim que você aceitar um
              pedido, ele aparecerá aqui com a opção de revogar o acesso a
              qualquer momento.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
