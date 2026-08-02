import type { AppModule } from "../../app/app.types";
import { usersRouteTree } from "./users.routes";

export const usersModule = {
 id: "users",
 order: 30,
 routeTree: usersRouteTree,
} satisfies AppModule;
