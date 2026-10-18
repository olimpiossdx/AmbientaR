import { Book, Building2 } from "lucide-react";
import type { AppModule } from "../../app/app.types";
import { companiesRouteTree } from "./companies.routes";
import { COMPANY_CLAIMS } from "./companies.types";

export const companiesModule = {
  id: "companies", order: 33, routeTree: companiesRouteTree,
  navigation: [{
    id: "cadastro", label: "Cadastro", order: 30, icon: Book,
    children: [{ to: "/app/responsible-company", legacyHref: "/responsible-company", label: "Empresas", icon: Building2, claim: COMPANY_CLAIMS.view }],
  }],
} satisfies AppModule;
