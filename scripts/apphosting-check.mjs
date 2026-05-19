import { spawn } from "node:child_process";
import { appendFileSync, writeFileSync } from "node:fs";

const startedAt = new Date().toISOString();
const logPath = "apphosting-check.log";

writeFileSync(
  logPath,
  [
    `# App Hosting local check`,
    `startedAt=${startedAt}`,
    "",
    "## output",
    "",
  ].join("\n"),
);

const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "build"],
  {
    env: {
      ...process.env,
      APPHOSTING_STRICT_BUILD: "1",
      CI: "true",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
);

child.stdout.on("data", (chunk) => {
  process.stdout.write(chunk);
  appendFileSync(logPath, chunk);
});

child.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
  appendFileSync(logPath, chunk);
});

child.on("error", (error) => {
  appendFileSync(logPath, `\nerror=${error.message}\n`);
  console.error(error);
  process.exit(1);
});

child.on("close", (code, signal) => {
  const footer = [
    "",
    "## result",
    `finishedAt=${new Date().toISOString()}`,
    `status=${code}`,
    `signal=${signal ?? ""}`,
    "",
  ].join("\n");
  appendFileSync(logPath, footer);
  console.log(`\n[apphosting-check] status=${code}; log=${logPath}`);
  process.exit(code ?? 1);
});
