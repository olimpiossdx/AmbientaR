import { Book, Contact } from "lucide-react";
import type { AppModule } from "../../app/app.types";
import { entrepreneursRouteTree } from "./entrepreneurs.routes";
import { ENTREPRENEUR_CLAIMS, ENTREPRENEUR_MODULE_CLAIM } from "./entrepreneurs.types";
export const entrepreneursModule = {
 id: "entrepreneurs", order: 31, routeTree: entrepreneursRouteTree,
 navigation: [{ id: "cadastro", label: "Cadastro", order: 30, icon: Book, claim: ENTREPRENEUR_MODULE_CLAIM, children: [{ to: "/app/empreendedores", legacyHref: "/empreendedores", label: "Empreendedores", icon: Contact, claim: ENTREPRENEUR_CLAIMS.view }] }],
} satisfies AppModule;
