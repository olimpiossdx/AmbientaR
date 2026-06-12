#!/usr/bin/env node
/**
 * Smoke test do scheduler FAD (local ou produção).
 * Uso:
 *   FAD_MONITORING_CRON_SECRET=dev-cron-test node scripts/fad-cron-smoke.mjs
 *   FAD_BASE_URL=https://sua-app.web.app node scripts/fad-cron-smoke.mjs
 */

const base = (process.env.FAD_BASE_URL ?? "http://localhost:9002").replace(/\/$/, "");
const secret = process.env.FAD_MONITORING_CRON_SECRET?.trim();

if (!secret) {
  console.error("Defina FAD_MONITORING_CRON_SECRET.");
  process.exit(1);
}

const url = `${base}/api/fiscal-ambiental/monitoring/scheduler/run`;

const res = await fetch(url, {
  method: "POST",
  headers: { "x-fad-cron-secret": secret },
});

const body = await res.json().catch(() => ({}));
console.log(JSON.stringify({ status: res.status, body }, null, 2));
process.exit(res.ok ? 0 : 1);
