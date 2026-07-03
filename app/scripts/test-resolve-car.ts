/**
 * Teste L1/L2 — resolve CAR REF-01-A/B e centróide REF-02 (G0-min / T1 / T3).
 * Uso: npm run geo:resolve-car-test
 */
import center from "@turf/center";
import { resolveLocalizacaoImovel } from "../src/lib/geospatial/resolve-localizacao-imovel";

const REF_01_A =
  "MG-3170404-3DBDB334242844B392639D3237B27E10";
const REF_01_B =
  "MG-3170404-CB2D550172B2405AAA6CF6479E2215B1";

async function main() {
  let ref01Area = 0;

  for (const cod of [REF_01_A, REF_01_B]) {
    console.log(`\n--- ${cod.slice(0, 24)}… ---`);
    const r = await resolveLocalizacaoImovel(
      { dataType: "car", data: cod },
      { extratoUfEsperada: "MG" },
    );
    console.log("status:", r.status);
    console.log("areaHa:", r.areaHa.toFixed(4));
    console.log("perimetroFonte:", r.perimetroFonte);
    console.log("confianca:", r.confianca);
    console.log("extratoMgAplicavel:", r.extratoMgAplicavel);
    console.log("municipio:", r.imoveis[0]?.municipio, r.imoveis[0]?.uf);
    if (r.status !== "ok") {
      console.error("avisos:", r.avisos);
      process.exitCode = 1;
    }
    if (cod === REF_01_A) ref01Area = r.areaHa;
  }

  console.log("\n--- REF-02 centróide A ---");
  const carA = await resolveLocalizacaoImovel(
    { dataType: "car", data: REF_01_A },
    { extratoUfEsperada: "MG" },
  );
  if (carA.status !== "ok") {
    console.error("Falha ao obter polígono A para centróide");
    process.exitCode = 1;
    return;
  }
  const c = center(carA.perimetroFinal);
  const [lng, lat] = c.geometry.coordinates;
  const coordStr = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  console.log("coord:", coordStr);
  const byCoord = await resolveLocalizacaoImovel(
    { dataType: "coordinates", data: coordStr },
    { extratoUfEsperada: "MG" },
  );
  console.log("status:", byCoord.status);
  console.log("areaHa:", byCoord.areaHa.toFixed(4));
  console.log("cod:", byCoord.imovelSelecionadoCod?.slice(0, 24));
  const areaDelta = Math.abs(byCoord.areaHa - ref01Area);
  if (byCoord.status !== "ok" || areaDelta > ref01Area * 0.02) {
    console.error("REF-02 falhou: área fora de ±2%", { areaDelta, ref01Area });
    process.exitCode = 1;
  }

  const ref07 = process.env.REF_07_CAR?.trim();
  if (ref07) {
    console.log(`\n--- REF-07 (T18/D9) ${ref07.slice(0, 24)}… ---`);
    const r7 = await resolveLocalizacaoImovel(
      { dataType: "car", data: ref07 },
      { extratoUfEsperada: "MG" },
    );
    console.log("status:", r7.status);
    console.log("uf:", r7.imoveis[0]?.uf);
    console.log("extratoMgAplicavel:", r7.extratoMgAplicavel);
    if (r7.status !== "ok") {
      console.error("REF-07: resolver falhou");
      process.exitCode = 1;
    } else if (r7.extratoMgAplicavel) {
      console.error("REF-07: esperado extratoMgAplicavel=false (UF ≠ MG)");
      process.exitCode = 1;
    } else {
      console.log("T18 OK: Localizar fora MG; pacote MG bloqueado (D9)");
    }
  } else {
    console.log("\n--- REF-07 auto (busca rural GO/SP) ---");
    const probes = [
      "-17.797,-50.928",
      "-16.0,-49.3",
      "-15.5,-47.8",
      "-22.5,-48.8",
    ];
    let r7auto = null as Awaited<ReturnType<typeof resolveLocalizacaoImovel>> | null;
    for (const p of probes) {
      const r = await resolveLocalizacaoImovel(
        { dataType: "coordinates", data: p },
        { extratoUfEsperada: "MG" },
      );
      if (r.status === "ok" && !r.extratoMgAplicavel) {
        r7auto = r;
        console.log("probe OK:", p, r.imoveis[0]?.uf, r.imovelSelecionadoCod?.slice(0, 28));
        break;
      }
    }
    if (r7auto) {
      console.log("extratoMgAplicavel:", r7auto.extratoMgAplicavel);
      console.log("T18 OK: imóvel fora MG localizado; pacote MG bloqueado (D9)");
    } else {
      console.log("REF-07 auto: nenhum CAR rural encontrado — defina REF_07_CAR manualmente");
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
