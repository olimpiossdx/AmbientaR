import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import https from "https";
import type { SicoobPixConfig } from "@/lib/sicoob-pix/config";

export function loadTlsMaterials(config: SicoobPixConfig): {
  cert: string;
  key: string;
} | null {
  if (config.certPem && config.keyPem) {
    return { cert: config.certPem, key: config.keyPem };
  }
  const certPath = config.certPath ? resolve(config.certPath) : null;
  const keyPath = config.keyPath ? resolve(config.keyPath) : null;
  if (certPath && keyPath && existsSync(certPath) && existsSync(keyPath)) {
    return {
      cert: readFileSync(certPath, "utf8"),
      key: readFileSync(keyPath, "utf8"),
    };
  }
  return null;
}

export function hasSicoobCertificate(config: SicoobPixConfig): boolean {
  return loadTlsMaterials(config) !== null;
}

export function createSicoobHttpsAgent(config: SicoobPixConfig): https.Agent | undefined {
  const tls = loadTlsMaterials(config);
  if (!tls) return undefined;
  return new https.Agent({
    cert: tls.cert,
    key: tls.key,
    rejectUnauthorized: true,
  });
}

export async function sicoobHttpsFetch(
  url: string,
  config: SicoobPixConfig,
  init: RequestInit & { headers?: Record<string, string> } = {},
): Promise<Response> {
  const agent = createSicoobHttpsAgent(config);
  if (!agent) {
    throw new Error(
      "Certificado Sicoob não configurado. Defina SICOOB_CERT_PEM + SICOOB_CERT_KEY ou SICOOB_CERT_PATH + SICOOB_KEY_PATH.",
    );
  }

  const headers = new Headers(init.headers);
  const body = init.body;

  return new Promise((resolvePromise, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: `${parsed.pathname}${parsed.search}`,
        method: init.method ?? "GET",
        headers: Object.fromEntries(headers.entries()),
        agent,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          resolvePromise(
            new Response(text, {
              status: res.statusCode ?? 500,
              headers: res.headers as HeadersInit,
            }),
          );
        });
      },
    );
    req.on("error", reject);
    if (body) req.write(typeof body === "string" ? body : body.toString());
    req.end();
  });
}
