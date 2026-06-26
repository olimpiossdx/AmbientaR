import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Sem ligação | AmbientaR",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-xl font-semibold">Sem ligação à internet</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        Algumas páginas podem abrir a partir do cache. Para dados em tempo real,
        aguarde a rede ou tente novamente.
      </p>
      <Button asChild>
        <Link href="/">Ir ao painel</Link>
      </Button>
    </div>
  );
}
