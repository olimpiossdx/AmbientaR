/**
 * One-off: optional chaining for useParams().id / .runId (TS18047).
 * Run: node scripts/fix-ts-params-null.cjs
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src");

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(tsx|ts)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

const files = walk(ROOT);
let changed = 0;
for (const f of files) {
  let c = fs.readFileSync(f, "utf8");
  const orig = c;
  c = c.replace(
    /params\.id as string/g,
    "(params?.id as string | undefined) ?? ''",
  );
  c = c.replace(
    /params\.runId as string/g,
    "(params?.runId as string | undefined) ?? ''",
  );
  if (c !== orig) {
    fs.writeFileSync(f, c);
    changed++;
    console.log("updated", path.relative(path.join(__dirname, ".."), f));
  }
}
console.log("files changed:", changed);
