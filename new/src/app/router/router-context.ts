import type { AuthRouterContext } from "../../auth/auth-router-context";
import type { AuthorizationService } from "../authorization/authorization-service";

export type AppRouterContext = {
 auth: AuthRouterContext;
 authorization: AuthorizationService;
};
