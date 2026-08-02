import { FileSearch } from "lucide-react";
import type { AppModule } from "../../app/app.types";
import { examplesRouteTree } from "./examples.routes";

export const examplesModule = {
 id: "examples",
 order: 90,
 routeTree: examplesRouteTree,
 navigation: [{
  to: "/app/exemplos",
  label: "Catálogo UI",
  order: 90,
  icon: FileSearch,
  claim: { claimType: "recurso.claim", claimValue: "visualizar" },
 }],
} satisfies AppModule;
