import type { PerimeterParseInput } from "@/lib/geospatial/perimeter";
import type { LocalizacaoResolvida } from "@/lib/types/localizacao-imovel";

/** Converte localização resolvida em input de perímetro (sem dependências Turf). */
export function localizacaoToPerimeterInput(
  resolved: LocalizacaoResolvida,
): PerimeterParseInput {
  return {
    dataType: "polygon",
    data: JSON.stringify(resolved.perimetroFinal),
  };
}
