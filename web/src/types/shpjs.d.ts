declare module "shpjs" {
  import type { FeatureCollection } from "geojson";

  function shp(
    base: string | ArrayBuffer | ArrayBufferView,
  ): Promise<FeatureCollection | FeatureCollection[]>;

  export default shp;
}
