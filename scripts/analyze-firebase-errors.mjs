#!/usr/bin/env node
/**
 * Analisador de Erros Firebase Hosting
 * Conecta ao Cloud Logging para extrair padroes de erro
 * 
 * Uso:
 *   GCP_PROJECT_ID=studio-316805764 node scripts/analyze-firebase-errors.mjs
 */

import { Logging } from "@google-cloud/logging";

const projectId = process.env.GCP_PROJECT_ID || "studio-316805764";

async function analyzeErrors() {
  console.log(`Firebase Hosting Error Analysis - Project: ${projectId}`);

  const logging = new Logging({ projectId });
  const errorPatterns = {};
  let totalErrors = 0;

  try {
    console.log("Buscando logs de erro nos ultimos 7 dias...");

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const filter = `
      resource.type="firebase_project" 
      AND logName:"firebasehosting.googleapis.com"
      AND (severity="ERROR" OR httpRequest.status>=500)
      AND timestamp>="${sevenDaysAgo}"
    `;

    let options = {
      filter,
      pageSize: 500,
      orderBy: "timestamp DESC",
      autoPaginate: false,
    };

    // getEntries() retorna Promise com paginas, nao um async iterator.
    while (options) {
      const [entries, nextQuery] = await logging.getEntries(options);

      for (const entry of entries) {
        const status = entry.metadata.httpRequest?.status || "unknown";

        if (typeof status === "number" && status >= 400) {
          totalErrors++;
          const statusKey = status.toString();
          errorPatterns[statusKey] = (errorPatterns[statusKey] || 0) + 1;
        }
      }

      options = nextQuery || null;
    }

    console.log(`\nTotal de erros: ${totalErrors}\n`);

    console.log("Por codigo HTTP:");
    Object.entries(errorPatterns)
      .sort((a, b) => b[1] - a[1])
      .forEach(([code, count]) => {
        const percentage = ((count / totalErrors) * 100).toFixed(1);
        console.log(`  HTTP ${code}: ${count} erros (${percentage}%)`);
      });

  } catch (error) {
    console.error("Erro ao buscar logs:", error.message);
    console.log(`
Dicas:
1. Certifique-se de que o projeto esta no plano Blaze
2. Execute: gcloud auth application-default login
3. GCP_PROJECT_ID: ${projectId}
4. npm install @google-cloud/logging
    `);
    process.exit(1);
  }
}

analyzeErrors().catch(console.error);
