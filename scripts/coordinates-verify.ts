/**
 * Verifica conversões SIRGAS 2000 / UTM 23S e GMS (MG).
 * Uso: npm run coordinates:verify
 */
import {
  applyMgHemisphere,
  decimalToDmsMagnitudes,
  decimalToUtmSirgas2000,
  dmsMgToDecimal,
  gmsPairMgToDecimal,
  utmSirgas2000ToDecimal,
} from "../src/lib/coordinates";

function approx(a: number, b: number, epsilon = 1e-4): boolean {
  return Math.abs(a - b) <= epsilon;
}

function assert(name: string, ok: boolean): void {
  if (!ok) {
    console.error(`FAIL · ${name}`);
    process.exitCode = 1;
    return;
  }
  console.log(`PASS · ${name}`);
}

function main() {
  console.log("=== coordinates verify (SIRGAS2000 / UTM 23S / GMS MG) ===\n");

  // Praça da Liberdade, BH (referência aproximada)
  const refLat = -19.9386;
  const refLng = -43.9378;

  const utm = decimalToUtmSirgas2000(refLat, refLng, "23");
  assert("decimal → UTM 23S produz inteiros", Number.isInteger(utm.easting) && Number.isInteger(utm.northing));

  const roundTrip = utmSirgas2000ToDecimal(utm.easting, utm.northing, "23");
  assert(
    "UTM 23S → decimal round-trip lat",
    approx(roundTrip.lat, refLat, 1e-5),
  );
  assert(
    "UTM 23S → decimal round-trip lng",
    approx(roundTrip.lng, refLng, 1e-5),
  );

  const gms = gmsPairMgToDecimal(
    { grau: "19", min: "56", seg: "15" },
    { grau: "43", min: "56", seg: "15" },
  );
  assert("GMS MG → decimal (sinais negativos)", gms != null && gms.lat < 0 && gms.lng < 0);

  const latOnly = dmsMgToDecimal({ grau: "19", min: "55", seg: "0" }, "lat");
  assert("GMS lat MG → negativo", latOnly != null && latOnly < 0);

  const dmsBack = decimalToDmsMagnitudes(refLat);
  assert("decimal → GMS magnitudes positivas", dmsBack.grau === "19" && !dmsBack.grau.startsWith("-"));

  const mg = applyMgHemisphere({ lat: 19.5, lng: 43.5 });
  assert("applyMgHemisphere força sul/oeste", mg.lat < 0 && mg.lng < 0);

  if (process.exitCode) {
    console.error("\nVerificação falhou.");
    process.exit(1);
  }
  console.log("\nTodas as verificações passaram.");
}

main();
