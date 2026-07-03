/**
 * Verifica cálculos e formatação do Memorial Descritivo.
 * Uso: npm run memorial-descritivo:check
 */
import {
  azimutePlanarUtm,
  buildMemorialFullText,
  buildMemorialSegments,
  decimalBr,
  distanciaPlanarUtm,
  grausMinSeg,
  perimeterLengthM,
  shoelaceAreaM2,
} from "../src/lib/memorial-descritivo";
import { DEFAULT_MEMORIAL_METADATA } from "../src/lib/memorial-descritivo/types";

function approx(a: number, b: number, epsilon = 0.01): boolean {
  return Math.abs(a - b) <= epsilon;
}

function assert(name: string, ok: boolean): void {
  if (!ok) {
    console.error(`FAIL · ${name}`);
    process.exitCode = 1;
  } else {
    console.log(`OK   · ${name}`);
  }
}

// Quadrado 100×100 m em UTM (plano)
const square = [
  { easting: 500_000, northing: 7_500_000 },
  { easting: 500_100, northing: 7_500_000 },
  { easting: 500_100, northing: 7_500_100 },
  { easting: 500_000, northing: 7_500_100 },
  { easting: 500_000, northing: 7_500_000 },
];

const areaM2 = shoelaceAreaM2(square);
const perim = perimeterLengthM(square);
assert("shoelace area 1 ha", approx(areaM2, 10_000, 0.1));
assert("perimeter 400 m", approx(perim, 400, 0.1));

const segments = buildMemorialSegments(square);
assert("4 segments", segments.length === 4);
assert("azimute norte ~0°", approx(azimutePlanarUtm(0, 0, 0, 100), 0, 0.01));
assert("azimute leste ~90°", approx(azimutePlanarUtm(0, 0, 100, 0), 90, 0.01));
assert(
  "distância 100 m",
  approx(distanciaPlanarUtm(0, 0, 100, 0), 100, 0.001),
);

assert('decimalBr "1.234,567"', decimalBr(1234.567, 3) === "1.234,567");
assert("grausMinSeg formato", grausMinSeg(127.4521).includes("127°"));

const text = buildMemorialFullText({
  metadata: {
    ...DEFAULT_MEMORIAL_METADATA,
    imovel: "Fazenda Teste",
    municipio: "Bonfinópolis de Minas",
    matricula: "6.256",
    tituloArea: "PERÍMETRO DA SEDE",
  },
  segments,
  metrics: {
    areaHa: areaM2 / 10_000,
    perimetroM: perim,
    vertexCount: 4,
    fuso: "23",
  },
});

assert("texto contém Inicia-se", text.includes("Inicia-se a descrição"));
assert("texto contém SIRGAS-2000", text.includes("SIRGAS-2000"));
assert("texto contém fuso 23S", text.includes("fuso 23S"));

if (process.exitCode) {
  console.error("\n[memorial-descritivo:check] Falhou.\n");
  process.exit(process.exitCode);
}
console.log("\n[memorial-descritivo:check] OK.\n");
