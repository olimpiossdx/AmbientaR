import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type FadComingSoonProps = {
  title: string;
  description: string;
  phase?: string;
};

export function FadComingSoon({ title, description, phase }: FadComingSoonProps) {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {phase ? `${phase} — ` : ""}
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Esta área ainda não está disponível nesta versão. Continue pelo <strong>Início</strong> ou
        consulte <strong>Configurações</strong> para o estado do módulo.
      </CardContent>
    </Card>
  );
}
