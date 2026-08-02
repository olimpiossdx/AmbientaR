import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "../../app/router/authenticated-route";
import { createAuthGuard } from "../../app/router/auth-guards";
import { UsersListPage } from "./users-list-page";
import { USERS_CLAIMS, USERS_MODULE_CLAIM } from "./users.types";

export const usersRouteTree = createRoute({
 getParentRoute: () => authenticatedRoute,
 path: "/users",
 beforeLoad: async (options) => {
  await createAuthGuard(USERS_MODULE_CLAIM)(options);
  await createAuthGuard(USERS_CLAIMS.view)(options);
 },
 component: UsersListPage,
});
