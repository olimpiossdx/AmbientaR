import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Página não encontrada</h1>
      <p className="max-w-md text-center text-sm text-muted-foreground">
        O endereço não existe ou foi movido.
      </p>
      <Button asChild>
        <Link href="/">Voltar ao início</Link>
      </Button>
    </div>
  );
}
