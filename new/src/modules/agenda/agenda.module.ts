import { Calendar } from "lucide-react";
import type { AppModule } from "../../app/app.types";
import { agendaRouteTree } from "./agenda.routes";
import { AGENDA_CLAIMS } from "./agenda.types";

export const agendaModule = {
 id: "agenda",
 order: 40,
 routeTree: agendaRouteTree,
 navigation: [{
  to: "/app/calendar",
  legacyHref: "/calendar",
  label: "Agenda",
  order: 40,
  icon: Calendar,
  claim: AGENDA_CLAIMS.view,
 }],
} satisfies AppModule;
