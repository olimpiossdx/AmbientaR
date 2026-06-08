import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FirebaseAdminSetupHelp } from "@/components/admin/firebase-admin-setup-help";

type OrphanEmailReleaseCardProps = {
  orphanEmail: string;
  onOrphanEmailChange: (value: string) => void;
  isReleasing: boolean;
  adminSdkConfigured: boolean | null;
  showSetupHelp: boolean;
  onRelease: () => void;
};

export function OrphanEmailReleaseCard({
  orphanEmail,
  onOrphanEmailChange,
  isReleasing,
  adminSdkConfigured,
  showSetupHelp,
  onRelease,
}: OrphanEmailReleaseCardProps) {
  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Liberar e-mail bloqueado</CardTitle>
        <CardDescription>
          Use quando o perfil já foi apagado mas o login (Firebase Auth) ainda
          impede criar o mesmo e-mail — ex.: após exclusão antiga só no Firestore.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(adminSdkConfigured === false || showSetupHelp) && (
          <FirebaseAdminSetupHelp
            variant="banner"
            emailHint={orphanEmail.trim() || undefined}
          />
        )}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Label htmlFor="orphan-email">E-mail</Label>
            <Input
              id="orphan-email"
              type="email"
              placeholder="financeiro@exemplo.com.br"
              value={orphanEmail}
              onChange={(e) => onOrphanEmailChange(e.target.value)}
              disabled={isReleasing}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={isReleasing || !orphanEmail.trim()}
            onClick={onRelease}
          >
            {isReleasing ? "Liberando…" : "Liberar e-mail"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
