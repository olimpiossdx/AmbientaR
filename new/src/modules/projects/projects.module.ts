import { Book, Trees } from "lucide-react";
import type { AppModule } from "../../app/app.types";
import { projectsRouteTree } from "./projects.routes";
import { PROJECT_CLAIMS } from "./projects.types";
export const projectsModule = {
 id:"projects", order:32, routeTree:projectsRouteTree,
 navigation:[{id:"cadastro",label:"Cadastro",order:30,icon:Book,children:[{to:"/app/projects",legacyHref:"/projects",label:"Empreendimentos",icon:Trees,claim:PROJECT_CLAIMS.view}]}],
} satisfies AppModule;
