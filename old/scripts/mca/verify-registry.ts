/**
 * Verifica Behavior Registry v2 (YAML) + grafo de invalidação.
 * Uso: npm run mca:verify-registry
 */
import { getInvalidatedLayerKeys } from "../../src/lib/mca/behavior/invalidation";
import { loadBehaviorRegistry } from "../../src/lib/mca/behavior/load-behavior-registry";
import { knowledgeDownstream } from "../../src/lib/mca/knowledge/relations";

function main() {
  console.log("=== MCA verify-registry (v2) ===\n");

  const reg = loadBehaviorRegistry();
  const ids = Object.keys(reg);
  if (ids.length < 4) {
    console.error(`FAIL: registry com ${ids.length} entradas (mínimo 4)`);
    process.exit(1);
  }
  console.log(`PASS · entradas: ${ids.length}`);

  let missingProduces = 0;
  for (const [id, def] of Object.entries(reg)) {
    if (!def.produces) {
      console.error(`FAIL · ${id}: produces em falta`);
      missingProduces++;
    }
  }
  if (missingProduces) process.exit(1);
  console.log("PASS · produces em todas as entradas");

  const hydroInv = getInvalidatedLayerKeys(["HYD_CORREGO"]);
  if (!hydroInv.has("AMB_APP") || !hydroInv.has("AMB_RL_GLEBA")) {
    console.error("FAIL · invalidação HYD_CORREGO → APP/RL");
    process.exit(1);
  }
  console.log(`PASS · invalidação: HYD_CORREGO → ${[...hydroInv].slice(0, 5).join(", ")}`);

  const knowledge = knowledgeDownstream("HYD_CORREGO");
  if (!knowledge.includes("AMB_APP")) {
    console.error("FAIL · knowledge graph HYD → AMB_APP");
    process.exit(1);
  }
  console.log(`PASS · knowledge: HYD_CORREGO → ${knowledge.slice(0, 4).join(", ")}`);

  console.log("\n=== MCA verify-registry PASS ===");
}

main();
