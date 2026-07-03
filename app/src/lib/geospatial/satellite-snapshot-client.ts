"use client";

/** Snapshot Esri World Imagery para fundo cartográfico (opcional na exportação). */
export async function fetchEsriSatelliteSnapshot(
  bbox: [number, number, number, number],
  width = 700,
  height = 520,
): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const [minX, minY, maxX, maxY] = bbox;
  const params = new URLSearchParams({
    bbox: `${minX},${minY},${maxX},${maxY}`,
    bboxSR: "4326",
    imageSR: "4326",
    size: `${width},${height}`,
    format: "png",
    f: "image",
  });
  const url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?${params}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Falha ao ler imagem de satélite."));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
