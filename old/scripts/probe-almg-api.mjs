const html = await fetch("https://dadosabertos.almg.gov.br", {
  headers: { Accept: "text/html" },
}).then((r) => r.text());

const links = [...html.matchAll(/href="([^"]*legisl[^"]*)"/gi)].map((m) => m[1]);
console.log("legisl links:", [...new Set(links)].slice(0, 30));

const csvLinks = [...html.matchAll(/href="([^"]*\.csv[^"]*)"/gi)].map((m) => m[1]);
console.log("csv links:", [...new Set(csvLinks)].slice(0, 20));
