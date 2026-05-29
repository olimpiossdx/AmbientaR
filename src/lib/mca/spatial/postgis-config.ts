/** Configuração PostGIS v3 (opcional — geometria pesada). */

export type McaPostGisConfig = {
  url: string;
  schema: string;
  enabled: boolean;
};

export function getPostGisConfig(): McaPostGisConfig | null {
  const url = process.env.MCA_POSTGIS_URL?.trim();
  if (!url) return null;
  return {
    url,
    schema: process.env.MCA_POSTGIS_SCHEMA?.trim() || "mca",
    enabled: true,
  };
}

export function isPostGisConfigured(): boolean {
  return Boolean(getPostGisConfig());
}
