import { redirect } from "next/navigation";
import { GESTAO_PROCESSOS_FLUXO_PATH } from "@/lib/gestao-processos-menu";

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

/** Opção A: links antigos em `/gestao-processos` redirecionam para o fluxo. */
export default function GestaoProcessosIndexPage({ searchParams }: PageProps) {
  const params = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === "string") {
        params.set(key, value);
      } else if (Array.isArray(value)) {
        for (const entry of value) {
          params.append(key, entry);
        }
      }
    }
  }
  const query = params.toString();
  redirect(query ? `${GESTAO_PROCESSOS_FLUXO_PATH}?${query}` : GESTAO_PROCESSOS_FLUXO_PATH);
}
