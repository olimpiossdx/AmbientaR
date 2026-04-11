/**
 * Next.js 14 – config estável (sem PWA para evitar conflitos).
 * Para PWA no futuro, ver projeto de referência GitHub AmbientaR (next.config.ts com @ducanh2912/next-pwa).
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone'
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
      { protocol: 'https', hostname: 'placehold.co', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'storage.googleapis.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', port: '', pathname: '/**' },
    ],
  },
};

export default nextConfig;
