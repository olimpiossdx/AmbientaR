/**
 * Next.js 14 — PWA ativado em **produção** (@ducanh2912/next-pwa) para casca offline.
 * Em desenvolvimento o PWA fica desativado; `UnregisterServiceWorkerDev` remove SW antigos
 * para evitar ChunkLoadError. Ver docs/OFFLINE-PWA-SHELL.md.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/** Caminho canônico do projeto (evita D:\A vs d:\A duplicar módulos no Windows). */
const projectRoot = fs.realpathSync.native(
  path.dirname(fileURLToPath(import.meta.url)),
);
const nm = (...segments) => path.join(projectRoot, "node_modules", ...segments);

if (process.cwd() !== projectRoot) {
  process.chdir(projectRoot);
}

/** @type {import('next').NextConfig} */
const appHostingStrictBuild = process.env.APPHOSTING_STRICT_BUILD === "1";

const nextConfig = {
  /**
   * Evita `distDir: ".next"` explícito com `output: "standalone"`: em dev (14.1+)
   * isso pode disparar "missing required error components, refreshing...".
   * Use só quando precisar: NEXT_DIST_DIR=out/build
   */
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  /** `standalone` em dev quebra error components / App Router no Next 14. */
  ...(process.env.NODE_ENV === "production" ? { output: "standalone" } : {}),
  experimental: {
    /** Evita empacotar pdf.js no bundle do servidor (DOMMatrix/canvas em build). */
    serverComponentsExternalPackages: [
      "pdf-parse",
      "pdfjs-dist",
      "@napi-rs/canvas",
      "genkit",
      "@genkit-ai/core",
      "@genkit-ai/ai",
      "@genkit-ai/google-genai",
      "@genkit-ai/compat-oai",
    ],
  },
  webpack: (config, { dev }) => {
    if (dev && config.output) {
      config.output.chunkLoadTimeout = 180000;
    }
    if (dev && process.platform === "win32") {
      /** Evita cache com caminhos D:\A vs d:\A duplicando módulos. */
      config.cache = false;
      config.resolve.modules = [nm(), ...(config.resolve.modules ?? ["node_modules"])];
    }
    return config;
  },
  typescript: { ignoreBuildErrors: !appHostingStrictBuild },
  eslint: { ignoreDuringBuilds: !appHostingStrictBuild },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co", port: "", pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com", port: "", pathname: "/**" },
      { protocol: "https", hostname: "picsum.photos", port: "", pathname: "/**" },
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/**",
      },
      { protocol: "https", hostname: "storage.googleapis.com", port: "", pathname: "/**" },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

/** PWA/workbox só em produção — em dev no Windows quebra o App Router (D:\A vs d:\A). */
async function loadConfig() {
  if (process.env.NODE_ENV === "development") {
    return nextConfig;
  }
  const { default: withPWAInit } = await import("@ducanh2912/next-pwa");
  const withPWA = withPWAInit({
    dest: "public",
    disable: false,
    register: true,
    skipWaiting: true,
    fallbacks: {
      document: "/offline",
    },
    workboxOptions: {
      navigateFallback: "/offline",
      navigateFallbackDenylist: [/^\/api/, /^\/_next\/data\//, /^\/_next\/image/],
      disableDevLogs: true,
    },
  });
  return withPWA(nextConfig);
}

export default loadConfig();
