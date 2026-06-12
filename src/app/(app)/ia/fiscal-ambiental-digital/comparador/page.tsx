import { Suspense } from "react";
import { FadComparadorPageClient } from "@/components/fiscal-ambiental/fad-comparador-client";

export const metadata = {
  title: "Comparador — Fiscal Ambiental Digital",
};

export default function FadComparadorPage() {
  return (
    <Suspense fallback={<p className="p-6 text-sm text-muted-foreground">A carregar…</p>}>
      <FadComparadorPageClient />
    </Suspense>
  );
}
