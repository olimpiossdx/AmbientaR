import type { AppUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ApprovedConsultorsSectionProps = {
  approvedConsultors: AppUser[];
  isLoading: boolean;
  revokingConsultorId: string | null;
  onRevoke: (consultorUserId: string) => void;
};

export function ApprovedConsultorsSection({
  approvedConsultors,
  isLoading,
  revokingConsultorId,
  onRevoke,
}: ApprovedConsultorsSectionProps) {
  return (
    <Card id="consultor-access-requests-card">
      <CardHeader>
        <CardTitle>Consultores-representantes aprovados</CardTitle>
        <CardDescription>
          Pedidos pendentes de consultores aparecem no card &quot;Consentimento
          de acesso&quot; acima. Aqui ficam os consultores já autorizados.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 border-t pt-3">
          <h4 className="text-sm font-semibold text-foreground">
            Consultores com acesso aprovado
          </h4>
          {isLoading ? (
            <p className="text-xs text-muted-foreground">Carregando consultores...</p>
          ) : approvedConsultors.length > 0 ? (
            <div className="space-y-2">
              {approvedConsultors.map((consultor) => (
                <div
                  key={consultor.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border px-3 py-2 bg-muted/40"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {consultor.name}{" "}
                      <span className="text-xs text-muted-foreground">
                        (Consultor-Representante)
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {consultor.email}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive border-destructive hover:bg-destructive/10"
                    disabled={revokingConsultorId === consultor.uid}
                    onClick={() => onRevoke(consultor.uid || consultor.id)}
                  >
                    {revokingConsultorId === consultor.uid
                      ? "Revogando..."
                      : "Revogar acesso"}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Nenhum consultor aprovado no momento.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
