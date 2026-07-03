import proj4 from "proj4";
import type { Fuso } from "@/lib/types";
import {
  EPSG_SIRGAS2000_GEOGRAPHIC,
  epsgSirgas2000UtmS,
} from "./constants";

let registered = false;

/** Registra SIRGAS 2000 geográfico e UTM 22–24S (idempotente). */
export function ensureSirgas2000Defs(): void {
  if (registered) return;
  registered = true;

  proj4.defs(
    `EPSG:${EPSG_SIRGAS2000_GEOGRAPHIC}`,
    "+proj=longlat +ellps=GRS80 +no_defs +type=crs",
  );

  for (const fuso of ["22", "23", "24"] as Fuso[]) {
    const epsg = epsgSirgas2000UtmS(fuso);
    proj4.defs(
      `EPSG:${epsg}`,
      `+proj=utm +zone=${fuso} +south +ellps=GRS80 +units=m +no_defs +type=crs`,
    );
  }
}

ensureSirgas2000Defs();
