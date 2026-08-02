import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "../../app/router/authenticated-route";
import { createAuthGuard } from "../../app/router/auth-guards";
import { AgendaPage } from "./agenda-page";
import { AGENDA_CLAIMS } from "./agenda.types";

export const agendaRouteTree = createRoute({
 getParentRoute: () => authenticatedRoute,
 path: "/calendar",
 beforeLoad: createAuthGuard(AGENDA_CLAIMS.view),
 component: AgendaPage,
});

