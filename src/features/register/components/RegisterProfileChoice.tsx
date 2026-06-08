import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PROFILE_CHOICE_TEXT } from "../constants/profile-choice-text";
import type { RegisterProfileMode } from "../types/register.types";

type RegisterProfileChoiceProps = {
  onSelect: (mode: RegisterProfileMode) => void;
};

export function RegisterProfileChoice({ onSelect }: RegisterProfileChoiceProps) {
  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader className="space-y-1">
        <CardTitle className="text-lg font-semibold">Cadastre-se</CardTitle>
        <CardDescription>{PROFILE_CHOICE_TEXT.intro}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Selecione o perfil que corresponde à sua situação para preencher o
          formulário de cadastro.
        </p>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onSelect("cliente_autonomo")}
            className={cn(
              "flex w-full flex-col items-start rounded-lg border-2 p-4 text-left transition-colors",
              "hover:border-primary hover:bg-primary/5",
              "border-border",
            )}
          >
            <span className="font-semibold text-foreground">Cliente Autônomo</span>
            <span className="mt-1 text-xs text-muted-foreground">
              {PROFILE_CHOICE_TEXT.cliente_autonomo}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onSelect("representative")}
            className={cn(
              "flex w-full flex-col items-start rounded-lg border-2 p-4 text-left transition-colors",
              "hover:border-primary hover:bg-primary/5",
              "border-border",
            )}
          >
            <span className="font-semibold text-foreground">Sou Representante</span>
            <span className="mt-1 text-xs text-muted-foreground">
              {PROFILE_CHOICE_TEXT.representative}
            </span>
          </button>
          <button
            type="button"
            onClick={() => onSelect("consultor_representante")}
            className={cn(
              "flex w-full flex-col items-start rounded-lg border-2 p-4 text-left transition-colors",
              "hover:border-primary hover:bg-primary/5",
              "border-border",
            )}
          >
            <span className="font-semibold text-foreground">
              Consultor-Representante
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              {PROFILE_CHOICE_TEXT.consultor_representante}
            </span>
          </button>
        </div>
        <Button variant="outline" className="w-full" asChild>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Voltar ao início
          </Link>
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Não quer se cadastrar agora? Volte à página inicial ou faça login.
        </p>
        <div className="pt-1 text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline underline-offset-2 hover:no-underline"
          >
            Faça login
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
