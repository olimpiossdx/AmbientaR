import { createRoute, lazyRouteComponent, Outlet } from "@tanstack/react-router";
import { authenticatedRoute } from "../../app/router/authenticated-route";
import { createAuthGuard } from "../../app/router/auth-guards";
import { CONDITION_CLAIMS } from "./conditions.types";
const root=createRoute({getParentRoute:()=>authenticatedRoute,path:"/compliance",beforeLoad:createAuthGuard(),component:Outlet});
const list=createRoute({getParentRoute:()=>root,path:"/",beforeLoad:createAuthGuard(CONDITION_CLAIMS.view),validateSearch:(search:Record<string,unknown>)=>({q:typeof search.q==="string"?search.q.slice(0,200):"",status:typeof search.status==="string"?search.status:"",page:Number.isSafeInteger(Number(search.page))&&Number(search.page)>0?Math.min(100000,Number(search.page)):1}),component:lazyRouteComponent(()=>import("./conditions-page"),"ConditionsPage")});
export const conditionsRouteTree=root.addChildren([list]);
