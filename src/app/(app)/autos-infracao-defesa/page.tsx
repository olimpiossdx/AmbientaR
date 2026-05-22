import { redirect } from "next/navigation";
import { MULTAS_DEFESAS_PATH } from "@/lib/multas-defesas";

/** URL legada → módulo canónico Multas e Defesas. */
export default function AutosInfracaoDefesaRedirectPage() {
  redirect(MULTAS_DEFESAS_PATH);
}
