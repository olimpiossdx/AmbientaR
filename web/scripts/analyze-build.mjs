/** Ativa @next/bundle-analyzer durante o build de produção. */
process.env.ANALYZE = "true";
process.env.NODE_ENV = "production";
process.env.NODE_OPTIONS = [
  process.env.NODE_OPTIONS,
  "--max-old-space-size=8192",
]
  .filter(Boolean)
  .join(" ");

import { spawnSync } from "node:child_process";

const result = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
