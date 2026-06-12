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
        Esta área será activada nas próximas fases de implantação. Continue pelo{" "}
        <strong>Início</strong> ou <strong>Montar acervo</strong> quando a Fase 1 estiver disponível.
      </CardContent>
    </Card>
  );
}
