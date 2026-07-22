import { createRoute } from "@tanstack/react-router";
import { authenticatedRoute } from "../../app/router/authenticated-route";
import HomePage from "../../pages/home-page";

export const homeRouteTree = createRoute({
 getParentRoute: () => authenticatedRoute,
 path: "/",
 component: HomePage,
});
