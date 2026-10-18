import { Files, Book } from "lucide-react";
import type { AppModule } from "../../app/app.types";
import { carRouteTree } from "./car.routes";
import { CAR_CLAIMS } from "./car.types";
export const carModule = {
  id: "car", order: 41, routeTree: carRouteTree,
  navigation: [{ id: "documentos-ambientais", label: "Documentos Ambientais", order: 40, icon: Book, children: [{ to: "/app/car", legacyHref: "/car", label: "CAR", icon: Files, claim: CAR_CLAIMS.view }] }],
} satisfies AppModule;
