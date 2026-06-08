import * as React from "react";
import {
  Crown,
  Gift,
  MessageSquareMore,
  Rocket,
  Star,
  Zap,
} from "lucide-react";
import type { ClientPackage } from "@/lib/types";

export const PACKAGE_ICONS: Record<ClientPackage, React.ReactNode> = {
  gratuito: <Gift className="h-6 w-6" />,
  basico: <Star className="h-6 w-6" />,
  intermediario: <Zap className="h-6 w-6" />,
  avancado: <Rocket className="h-6 w-6" />,
  completo: <Crown className="h-6 w-6" />,
  sob_consulta: <MessageSquareMore className="h-6 w-6" />,
};
