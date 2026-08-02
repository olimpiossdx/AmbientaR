import { Book, UserCog } from "lucide-react";
import type { AppModule } from "../../app/app.types";
import { usersRouteTree } from "./users.routes";
import { USERS_CLAIMS, USERS_MODULE_CLAIM } from "./users.types";

export const usersModule = {
 id: "users",
 order: 30,
 routeTree: usersRouteTree,
 navigation: [{
  id: "cadastro",
  label: "Cadastro",
  order: 30,
  icon: Book,
  claim: USERS_MODULE_CLAIM,
  children: [{
   to: "/app/users",
   legacyHref: "/users",
   label: "Usuários",
   icon: UserCog,
   claim: USERS_CLAIMS.view,
  }],
 }],
} satisfies AppModule;
