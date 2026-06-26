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
import {
  dispensaLatLngToInputString,
  inputStringToDispensaLatLng,
} from "../src/lib/pea/dispensa-coordenadas";
import {
  inventoryUnitLatLngToInputString,
  inputStringToInventoryUnitLatLng,
} from "../src/lib/inventario/inventory-unit-coordenadas";
import {
  formatGeographicLocationDisplay,
  formatEmpreendimentoCoordinatesForReport,
} from "../src/lib/coordinates/format-project-display";
import {
  formatOfficeProcessCoordinates,
  officeProcessSearchBlobWithCadastro,
  resolveOfficeProcessCadastroProjectId,
} from "../src/lib/gestao-processos/cadastro-coordinates";
import type { Project } from "../src/lib/types";
import type { ConsultoriaProject } from "../src/lib/gestao-processos/types";

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

  const dispensaInput = dispensaLatLngToInputString({
    latitude: String(refLat),
    longitude: String(refLng),
  });
  assert("dispensa lat/lng → string GMS/UTM", dispensaInput.length > 0);
  const dispensaBack = inputStringToDispensaLatLng(dispensaInput);
  assert(
    "dispensa string → lat/lng round-trip lat",
    dispensaBack.latitude != null &&
      approx(Number(dispensaBack.latitude), refLat, 1e-4),
  );

  const unitInput = inventoryUnitLatLngToInputString({
    lat: String(refLat),
    lon: String(refLng),
  });
  assert("inventário lat/lon → string GMS/UTM", unitInput.length > 0);
  const unitBack = inputStringToInventoryUnitLatLng(unitInput);
  assert(
    "inventário string → lat/lon round-trip lng",
    unitBack.lon != null && approx(Number(unitBack.lon), refLng, 1e-4),
  );

  const displayUtm = formatGeographicLocationDisplay({
    utm: {
      x: String(utm.easting),
      y: String(utm.northing),
      fuso: "23",
    },
  });
  assert(
    "formatGeographicLocationDisplay produz resumo",
    displayUtm.length > 0 && (displayUtm.includes("UTM") || displayUtm.includes(",")),
  );

  const reportFallback = formatEmpreendimentoCoordinatesForReport(
    null,
    { lat: refLat, lng: refLng },
  );
  assert(
    "formatEmpreendimentoCoordinatesForReport fallback ponto",
    reportFallback.includes(String(refLat).slice(0, 6)),
  );

  const cadastroProject = {
    id: "cad-test",
    geographicLocation: {
      format: "UTM" as const,
      datum: "SIRGAS2000" as const,
      utm: {
        x: String(utm.easting),
        y: String(utm.northing),
        fuso: "23",
      },
    },
  } as Project;
  const cadastroById = new Map<string, Project>([
    ["cad-test", cadastroProject],
  ]);
  const consultoriaProjects: ConsultoriaProject[] = [
    {
      id: "cp-test",
      name: "Projeto teste",
      status: "ativo",
      projectId: "cad-test",
    },
  ];

  assert(
    "resolveOfficeProcessCadastroProjectId via projectId direto",
    resolveOfficeProcessCadastroProjectId(
      { projectId: "cad-test", consultoriaProjectId: undefined },
      [],
    ) === "cad-test",
  );
  assert(
    "resolveOfficeProcessCadastroProjectId via consultoria",
    resolveOfficeProcessCadastroProjectId(
      { projectId: undefined, consultoriaProjectId: "cp-test" },
      consultoriaProjects,
    ) === "cad-test",
  );
  const officeCoords = formatOfficeProcessCoordinates(
    { projectId: "cad-test" },
    cadastroById,
    [],
  );
  assert(
    "formatOfficeProcessCoordinates produz resumo",
    officeCoords.length > 0 && officeCoords.includes(","),
  );
  const searchBlob = officeProcessSearchBlobWithCadastro(
    {
      numeroProcesso: "PROC-001",
      empreendedorName: "Empreendedor",
      empreendimentoName: "Empreendimento",
      projectId: "cad-test",
    },
    cadastroById,
    [],
  );
  assert(
    "officeProcessSearchBlobWithCadastro inclui coordenadas",
    searchBlob.includes("proc-001") && searchBlob.includes(","),
  );

  if (process.exitCode) {
    console.error("\nVerificação falhou.");
    process.exit(1);
  }
  console.log("\nTodas as verificações passaram.");
}

main();
