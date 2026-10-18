import { ClipboardCheck, Book } from "lucide-react";
import type { AppModule } from "../../app/app.types";
import { conditionsRouteTree } from "./conditions.routes";
import { CONDITION_CLAIMS } from "./conditions.types";
export const conditionsModule={id:"conditions",order:42,routeTree:conditionsRouteTree,navigation:[{id:"documentos-ambientais",label:"Documentos Ambientais",order:40,icon:Book,children:[{to:"/app/compliance",legacyHref:"/compliance",label:"Condicionantes",icon:ClipboardCheck,claim:CONDITION_CLAIMS.view}]}]} satisfies AppModule;
