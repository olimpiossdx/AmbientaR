"use client";

import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Circle,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AppUser, UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";

type OnboardingStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  done?: boolean;
};

function OnboardingStepList({ steps }: { steps: OnboardingStep[] }) {
  return (
    <ul className="space-y-3">
      {steps.map((step) => (
        <li
          key={step.id}
          className={cn(
            "flex items-start gap-3 rounded-lg border p-3",
            step.done ? "border-emerald-500/30 bg-emerald-500/5" : "bg-muted/30",
          )}
        >
          {step.done ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          ) : (
            <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm">{step.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {step.description}
            </p>
          </div>
          {!step.done && (
            <Button variant="outline" size="sm" className="shrink-0" asChild>
              <Link href={step.href}>
                Ir
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}

function stepsForClienteAutonomo(user: AppUser): OnboardingStep[] {
  const uid = user.uid || user.id;

  return [
    {
      id: "profile",
      title: "Complete seu perfil",
      description: "Confirme nome, telefone e dados da conta.",
      href: uid ? `/users/${uid}/edit` : "/users",
      done: false,
    },
    {
      id: "titular",
      title: "Cadastre um titular CPF/CNPJ",
      description:
        "Informe se o titular ambiental é Pessoa Física ou Jurídica antes de operar empreendimentos.",
      href: "/empreendedores/new",
      done: false,
    },
    {
      id: "empreendimento",
      title: "Cadastre seu primeiro empreendimento",
      description: "Vincule o empreendimento ao titular correto.",
      href: "/empreendedores/new",
      done: false,
    },
    {
      id: "financeiro",
      title: "Vincule cliente financeiro, se necessário",
      description: "Opcional: complete dados em Cadastro → Clientes.",
      href: "/clients",
      done: false,
    },
  ];
}

function stepsForDelegate(_role: UserRole): OnboardingStep[] {
  return [
    {
      id: "profile",
      title: "Complete seu perfil",
      description: "Mantenha seus dados de contato atualizados.",
      href: "/users",
      done: true,
    },
    {
      id: "access",
      title: "Solicite acesso a um titular CPF/CNPJ",
      description:
        "Informe o documento do titular cujos empreendimentos você irá representar.",
      href: "/users#delegate-access-portfolio",
      done: false,
    },
    {
      id: "pending",
      title: "Acompanhe pedidos pendentes",
      description: "Aguarde a aprovação do titular em Usuários.",
      href: "/users#delegate-access-portfolio",
      done: false,
    },
  ];
}

type TitularOnboardingCardProps = {
  user: AppUser;
};

export function TitularOnboardingCard({ user }: TitularOnboardingCardProps) {
  const isAutonomo = user.role === "cliente_autonomo";
  const isDelegate =
    user.role === "representative" || user.role === "consultor_representante";

  if (!isAutonomo && !isDelegate) return null;
  if (isAutonomo && !user.cadastroIncompleto) return null;

  const steps = isAutonomo
    ? stepsForClienteAutonomo(user)
    : stepsForDelegate(user.role);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {isAutonomo ? (
            <Building2 className="h-5 w-5 text-primary" />
          ) : (
            <UserPlus className="h-5 w-5 text-primary" />
          )}
          {isAutonomo ? "Próximos passos" : "Comece como representante"}
        </CardTitle>
        <CardDescription>
          {isAutonomo
            ? "Separamos a criação da conta do cadastro do titular ambiental. Siga os passos abaixo."
            : "Sua conta foi criada. Solicite acesso ao titular quando estiver pronto."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OnboardingStepList steps={steps} />
        {isDelegate && (
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Pedidos de acesso ficam em Usuários → Carteira de titulares.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
