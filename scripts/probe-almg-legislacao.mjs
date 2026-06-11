const docUrl =
  "https://dadosabertos.almg.gov.br/documentacao/arquivos/legislacao-mineira";
const html = await fetch(docUrl, { headers: { Accept: "text/html" } }).then(
  (r) => r.text(),
);

const apis = [...html.matchAll(/(https?:\/\/[^"'\s]+|\/api\/[^"'\s]+)/g)].map(
  (m) => m[1],
);
const unique = [...new Set(apis)].filter(
  (u) =>
    u.includes("legisl") ||
    u.includes("csv") ||
    u.includes("arquivo") ||
    u.includes("/api/"),
);
console.log("urls in page:", unique.slice(0, 40));

const candidates = [
  "https://dadosabertos.almg.gov.br/api/v2/arquivos/legislacao-mineira",
  "https://dadosabertos.almg.gov.br/api/v2/arquivos/legislacao-mineira/csv",
  "https://dadosabertos.almg.gov.br/api/v2/legislacao-mineira/csv",
  "https://dadosabertos.almg.gov.br/arquivos/legislacao-mineira.csv",
];

for (const u of candidates) {
  await new Promise((r) => setTimeout(r, 1100));
  const res = await fetch(u, {
    headers: { Accept: "application/json,text/csv" },
  });
  const ct = res.headers.get("content-type") || "";
  const preview = (await res.text()).slice(0, 100).replace(/\n/g, " ");
  console.log(res.status, ct, u, preview);
}
