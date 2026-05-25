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

/** React do Next (canary) exporta `cache`, exigido pelo dedupe-fetch em 14.2.x. */
const nextCompiledReact = (production) =>
  nm(
    "next",
    "dist",
    "compiled",
    "react",
    "cjs",
    production ? "react.production.min.js" : "react.development.js",
  );
const nextCompiledReactDom = (production) =>
  nm(
    "next",
    "dist",
    "compiled",
    "react-dom",
    "cjs",
    production ? "react-dom.production.min.js" : "react-dom.development.js",
  );

/** Subpaths do React (ex.: react-day-picker) — o alias de `react` acima é um .js, não o pacote. */
const nextCompiledJsxRuntime = () =>
  nm("next", "dist", "compiled", "react", "jsx-runtime.js");
const nextCompiledJsxDevRuntime = () =>
  nm("next", "dist", "compiled", "react", "jsx-dev-runtime.js");

const pdfjsServerStub = path.join(projectRoot, "src/lib/pdfjs-server-stub.js");

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
    /** Evita empacotar pdf-parse no bundle do servidor. */
    serverComponentsExternalPackages: [
      "pdf-parse",
      "@napi-rs/canvas",
      "genkit",
      "@genkit-ai/core",
      "@genkit-ai/ai",
      "@genkit-ai/google-genai",
      "@genkit-ai/compat-oai",
    ],
  },
  webpack: (config, { dev, isServer }) => {
    if (dev && config.output) {
      config.output.chunkLoadTimeout = 180000;
    }

    const production = !dev;
    /** Um único React com `cache` (bundle do Next) — evita react.cache is not a function no RSC. */
    /** `$` = só `import … from "react"`; subpaths (jsx-runtime) usam o pacote em node_modules. */
    config.resolve.alias = {
      ...config.resolve.alias,
      "react$": nextCompiledReact(production),
      "react-dom$": nextCompiledReactDom(production),
      "react/jsx-runtime": nextCompiledJsxRuntime(),
      "react/jsx-dev-runtime": nextCompiledJsxDevRuntime(),
      ...(isServer
        ? {
            "pdfjs-dist$": pdfjsServerStub,
            "pdfjs-dist/webpack.mjs": pdfjsServerStub,
            "pdfjs-dist/build/pdf.mjs": pdfjsServerStub,
            "pdfjs-dist/build/pdf.min.mjs": pdfjsServerStub,
          }
        : {}),
      ...(dev && process.platform === "win32" ? { next: nm("next") } : {}),
    };

    if (dev && process.platform === "win32") {
      /** Evita cache com caminhos D:\A vs d:\A duplicando módulos do Next/React. */
      config.cache = false;
      /** Evita o watcher varrer lixo na raiz do volume (ex. E:\found.000). Só globs string — função quebra o schema do Webpack 5. */
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
          "**/found.*/**",
          "**/System Volume Information/**",
          "**/$RECYCLE.BIN/**",
        ],
      };
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
      {
        protocol: "https",
        hostname: "studio-316805764-e4d13.firebasestorage.app",
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
