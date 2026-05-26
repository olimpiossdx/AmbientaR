/**
 * Cadastra referências normativas de outorga MG em knowledge_sources (metadados + URL).
 * Uso: GOOGLE_APPLICATION_CREDENTIALS=... node scripts/seed-outorga-knowledge-sources.mjs
 */
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const sources = [
  {
    titulo: "Decreto 47.705/2019 — Regularização de recursos hídricos MG",
    tipo: "lei",
    orgao: "SEMAD/MG",
    uf: "MG",
    numero: "47.705/2019",
    storagePath: "http://www.siam.mg.gov.br/sla/download.pdf?idNorma=49498",
    modoInclusao: "manual",
    aprovado: true,
  },
  {
    titulo: "Portaria IGAM 48/2019 — Procedimentos de regularização hídrica",
    tipo: "portaria",
    orgao: "IGAM",
    uf: "MG",
    numero: "48/2019",
    storagePath: "http://www.siam.mg.gov.br/sla/download.pdf?idNorma=49719",
    modoInclusao: "manual",
    aprovado: true,
  },
  {
    titulo: "Portaria IGAM 79/2021 — CRH Minas Gerais",
    tipo: "portaria",
    orgao: "IGAM",
    uf: "MG",
    numero: "79/2021",
    storagePath: "http://www.siam.mg.gov.br/sla/download.pdf?idNorma=54581",
    modoInclusao: "manual",
    aprovado: true,
  },
  {
    titulo: "Tabelas de apoio — modos de uso outorga IGAM",
    tipo: "termo_referencia",
    orgao: "IGAM",
    uf: "MG",
    storagePath:
      "https://igam.mg.gov.br/documents/d/igam/tabelas_de_apoio_abr_2020-pdf",
    modoInclusao: "manual",
    aprovado: true,
  },
  {
    titulo: "Custos tabelados — processos de outorga 2026",
    tipo: "manual",
    orgao: "IGAM",
    uf: "MG",
    numero: "2026",
    storagePath:
      "https://igam.mg.gov.br/web/igam/taxas-de-processos-de-outorga",
    modoInclusao: "manual",
    aprovado: true,
  },
  {
    titulo: "TR Código 01 — Captação em corpo de água",
    tipo: "termo_referencia",
    orgao: "IGAM",
    uf: "MG",
    numero: "01",
    storagePath:
      "https://igam.mg.gov.br/documents/d/igam/cod_01-captacao_em_corpo_de_agua_set_2023-pdf",
    modoInclusao: "manual",
    aprovado: true,
  },
  {
    titulo: "TR Código 18 — Lançamento de efluentes",
    tipo: "termo_referencia",
    orgao: "IGAM",
    uf: "MG",
    numero: "18",
    storagePath:
      "https://igam.mg.gov.br/documents/d/igam/cod_18-lancamento_de_efluentes_ago_2023-pdf",
    modoInclusao: "manual",
    aprovado: true,
  },
];

function initAdmin() {
  if (getApps().length) return getFirestore();
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const localPath = resolve("config/firebase-service-account.json");
  if (credPath && existsSync(credPath)) {
    const json = JSON.parse(readFileSync(credPath, "utf8"));
    initializeApp({ credential: cert(json) });
  } else if (existsSync(localPath)) {
    const json = JSON.parse(readFileSync(localPath, "utf8"));
    initializeApp({ credential: cert(json) });
  } else {
    initializeApp();
  }
  return getFirestore();
}

async function main() {
  const db = initAdmin();
  const col = db.collection("knowledge_sources");
  let created = 0;
  for (const src of sources) {
    const snap = await col
      .where("titulo", "==", src.titulo)
      .limit(1)
      .get();
    if (!snap.empty) {
      console.log("Já existe:", src.titulo);
      continue;
    }
    await col.add({
      ...src,
      arquivado: false,
      criadoEm: new Date().toISOString(),
      tags: ["outorga", "recursos-hidricos", "IGAM", "MG"],
    });
    created++;
    console.log("Criado:", src.titulo);
  }
  console.log(`Concluído. ${created} nova(s) fonte(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
