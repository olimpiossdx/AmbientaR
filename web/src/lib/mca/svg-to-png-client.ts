"use client";

/**
 * Utilitário de preview MCA (Estudos Técnicos → Mapas).
 * Independente de src/lib/geospatial/* (Análise Geoespacial IA).
 */

export async function svgStringToPngDataUrl(
  svg: string,
  width: number,
  height: number,
  opts?: { skipBackgroundFill?: boolean },
): Promise<string> {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("Falha ao carregar SVG do preview MCA."));
      el.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível.");
    if (!opts?.skipBackgroundFill) {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, width, height);
    }
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}
