import fs from "fs";
import path from "path";

const apiDir = "e:/A/src/app/api/uploads";
const financial = new Set(["invoices", "transactions", "signed-contracts"]);

for (const name of fs.readdirSync(apiDir)) {
  const f = path.join(apiDir, name, "route.ts");
  if (!fs.existsSync(f)) continue;
  let s = fs.readFileSync(f, "utf8");
  if (!s.includes("MAX_FILE_SIZE")) continue;
  const isFin = financial.has(name);
  const constName = isFin ? "UPLOAD_MAX_BYTES_FINANCIAL" : "UPLOAD_MAX_BYTES_DEFAULT";
  if (!s.includes("upload-limits")) {
    s = `import { ${constName} } from "@/lib/upload-limits";\n${s}`;
  }
  s = s.replace(/const MAX_FILE_SIZE = [^;]+;/g, `const MAX_FILE_SIZE = ${constName};`);
  fs.writeFileSync(f, s);
  console.log("updated api", name);
}
