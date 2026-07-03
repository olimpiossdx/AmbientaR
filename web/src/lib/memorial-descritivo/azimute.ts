/**
 * Azimute planar UTM (Norte = 0°, sentido horário).
 * Equivalente ao atan2(dx, dy) do exemplo Python.
 */
export function azimutePlanarUtm(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let ang = (Math.atan2(dx, dy) * 180) / Math.PI;
  if (ang < 0) ang += 360;
  return ang;
}

export function distanciaPlanarUtm(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}
