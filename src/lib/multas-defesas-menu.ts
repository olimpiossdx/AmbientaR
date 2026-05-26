import {
  MULTAS_DEFESAS_PATH,
  MULTAS_E_DEFESAS_MENU_LABEL,
} from "@/lib/multas-defesas";

export const MULTAS_DEFESAS_LIST_LABEL = "Consultar multas e defesas";
export const MULTAS_DEFESAS_NOVA_LABEL = "Nova multa / processo";

export const MULTAS_DEFESAS_NOVA_PATH = `${MULTAS_DEFESAS_PATH}/nova`;

export function multasDefesasTramitePath(id: string): string {
  return `${MULTAS_DEFESAS_PATH}/${id}`;
}

export { MULTAS_E_DEFESAS_MENU_LABEL, MULTAS_DEFESAS_PATH };
