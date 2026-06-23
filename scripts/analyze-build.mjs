/** Ativa @next/bundle-analyzer durante o build de produção. */
process.env.ANALYZE = "true";
process.env.NODE_ENV = "production";

import { spawnSync } from "node:child_process";

const result = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
