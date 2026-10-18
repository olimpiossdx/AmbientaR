type CoordinateDecimal = { lat: number; lng: number };

/** Converte UTM no hemisfério sul (GRS80/SIRGAS 2000) para graus decimais. */
export function utmSirgas2000ToDecimal(
  easting: number,
  northing: number,
  zone: number,
): CoordinateDecimal | null {
  if (
    !Number.isFinite(easting) || !Number.isFinite(northing) ||
    ![22, 23, 24].includes(zone) || easting < 100_000 || easting > 900_000 ||
    northing < 0 || northing > 10_000_000
  ) return null;

  const a = 6_378_137;
  const eccentricitySquared = 0.00669438002290;
  const scale = 0.9996;
  const x = easting - 500_000;
  const y = northing;
  const ePrimeSquared = eccentricitySquared / (1 - eccentricitySquared);
  const meridionalArc = y / scale;
  const mu = meridionalArc / (a * (1 - eccentricitySquared / 4 - 3 * eccentricitySquared ** 2 / 64 - 5 * eccentricitySquared ** 3 / 256));
  const e1 = (1 - Math.sqrt(1 - eccentricitySquared)) / (1 + Math.sqrt(1 - eccentricitySquared));
  const j1 = 3 * e1 / 2 - 27 * e1 ** 3 / 32;
  const j2 = 21 * e1 ** 2 / 16 - 55 * e1 ** 4 / 32;
  const j3 = 151 * e1 ** 3 / 96;
  const j4 = 1097 * e1 ** 4 / 512;
  const footprint = mu + j1 * Math.sin(2 * mu) + j2 * Math.sin(4 * mu) + j3 * Math.sin(6 * mu) + j4 * Math.sin(8 * mu);
  const sin = Math.sin(footprint);
  const cos = Math.cos(footprint);
  const tan = Math.tan(footprint);
  const n1 = a / Math.sqrt(1 - eccentricitySquared * sin ** 2);
  const t1 = tan ** 2;
  const c1 = ePrimeSquared * cos ** 2;
  const r1 = a * (1 - eccentricitySquared) / (1 - eccentricitySquared * sin ** 2) ** 1.5;
  const d = x / (n1 * scale);
  const latitude = footprint - (n1 * tan / r1) * (
    d ** 2 / 2 - (5 + 3 * t1 + 10 * c1 - 4 * c1 ** 2 - 9 * ePrimeSquared) * d ** 4 / 24 +
    (61 + 90 * t1 + 298 * c1 + 45 * t1 ** 2 - 252 * ePrimeSquared - 3 * c1 ** 2) * d ** 6 / 720
  );
  const longitude = (d - (1 + 2 * t1 + c1) * d ** 3 / 6 +
    (5 - 2 * c1 + 28 * t1 - 3 * c1 ** 2 + 8 * ePrimeSquared + 24 * t1 ** 2) * d ** 5 / 120) / cos;
  const centralMeridian = ((zone - 1) * 6 - 180 + 3) * Math.PI / 180;
  const result = { lat: latitude * 180 / Math.PI, lng: (centralMeridian + longitude) * 180 / Math.PI };
  if (!Number.isFinite(result.lat) || !Number.isFinite(result.lng) || result.lat > 0 || Math.abs(result.lng) > 180) return null;
  return result;
}
