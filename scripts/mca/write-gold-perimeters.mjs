#!/usr/bin/env node
/** @deprecated Use npm run mca:regenerate-gold-perimeters */
import { spawnSync } from "node:child_process";

const r = spawnSync("npx", ["tsx", "scripts/mca/regenerate-gold-perimeters.ts"], {
  stdio: "inherit",
  shell: true,
});
process.exit(r.status ?? 1);
