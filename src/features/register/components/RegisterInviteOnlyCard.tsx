import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CLIENT_GESTAO_INVITE_TEXT } from "../constants/profile-choice-text";

export function RegisterInviteOnlyCard() {
  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg font-semibold">
          {CLIENT_GESTAO_INVITE_TEXT.title}
        </CardTitle>
        <CardDescription>{CLIENT_GESTAO_INVITE_TEXT.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{CLIENT_GESTAO_INVITE_TEXT.hint}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button className="w-full sm:flex-1" asChild>
            <Link href="/login">Ir para login</Link>
          </Button>
          <Button variant="outline" className="w-full sm:flex-1" asChild>
            <Link href="/register?tipo=cliente_autonomo">
              Sou Cliente Autônomo (planos)
            </Link>
          </Button>
        </div>
        <Button variant="ghost" className="w-full" asChild>
          <Link href="/register">Ver outros perfis de cadastro</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
