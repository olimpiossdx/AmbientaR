import type { MetadataRoute } from "next";

/** Manifest PWA servido pelo App Router (não depende de public/ no standalone). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "AmbientaR",
    short_name: "AmbientaR",
    description: "Gestão Ambiental Inteligente",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4CAF50",
    icons: [
      {
        src: "/icons/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/images/tree-logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
