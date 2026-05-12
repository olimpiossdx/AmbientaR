/**
 * Next.js 14 — PWA ativado em **produção** (@ducanh2912/next-pwa) para casca offline.
 * Em desenvolvimento o PWA fica desativado; `UnregisterServiceWorkerDev` remove SW antigos
 * para evitar ChunkLoadError. Ver docs/OFFLINE-PWA-SHELL.md.
 */
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    navigateFallback: "/offline",
    /** Evita que otimização de imagens e dados RSC caiam no HTML de fallback. */
    navigateFallbackDenylist: [
      /^\/api/,
      /^\/_next\/data\//,
      /^\/_next\/image/,
    ],
    disableDevLogs: true,
  },
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Evita `distDir: ".next"` explícito com `output: "standalone"`: em dev (14.1+)
   * isso pode disparar "missing required error components, refreshing...".
   * Use só quando precisar: NEXT_DIST_DIR=out/build
   */
  ...(process.env.NEXT_DIST_DIR ? { distDir: process.env.NEXT_DIST_DIR } : {}),
  output: "standalone",
  experimental: {
    /** Evita empacotar pdf.js no bundle do servidor (DOMMatrix/canvas em build). */
    serverComponentsExternalPackages: [
      "pdf-parse",
      "pdfjs-dist",
      "@napi-rs/canvas",
    ],
  },
  webpack: (config, { dev }) => {
    if (dev && config.output) {
      config.output.chunkLoadTimeout = 180000;
    }
    return config;
  },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
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

export default withPWA(nextConfig);
