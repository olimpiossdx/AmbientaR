import { Suspense } from "react";
import { FadMontarAcervoClient } from "./fad-montar-acervo-client";

export const metadata = {
  title: "Montar acervo — Fiscal Ambiental Digital",
};

export default function FadMontarAcervoPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">A carregar…</p>}>
      <FadMontarAcervoClient />
    </Suspense>
  );
}
