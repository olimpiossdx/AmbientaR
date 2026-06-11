import { fetchCarByCodImovelCached } from "@/lib/geospatial/sicar-car-cache";
import { SICAR_WFS_BASE_URL } from "@/lib/geospatial/sicar-car-service";
import type { ListaAgenteHit } from "@/lib/socioambiental/listas-agente-types";

const RL_PENDENCIA_RE =
  /reserva\s*legal|compens|passivo|d[eé]ficit|irregular|pendente|retifica|suspenso|cancelado/i;

export async function consultarReservaLegalDocumento(params: {
  documento: string;
  codImovel?: string;
}): Promise<ListaAgenteHit> {
  const consultadoEmUtc = new Date().toISOString();
  const fonte = {
    nome: "SICAR GeoServer (condição cadastral)",
    url: SICAR_WFS_BASE_URL,
    consultadoEmUtc,
  };

  const cod = params.codImovel?.trim();
  if (!cod) {
    return {
      criterioId: "reserva_legal_documento",
      resultado: "Não Analisado",
      detalhe:
        "Informe e confirme o CAR do imóvel para cruzar a condição cadastral de Reserva Legal no SICAR público.",
      fonte,
    };
  }

  const car = await fetchCarByCodImovelCached(cod);
  if (!car.ok || !car.imoveis[0]) {
    return {
      criterioId: "reserva_legal_documento",
      resultado: "Não Analisado",
      detalhe: car.error ?? "CAR não localizado no SICAR para avaliação de Reserva Legal.",
      fonte: car.fonte
        ? {
            nome: car.fonte.nome,
            url: car.fonte.url,
            consultadoEmUtc: car.fonte.queriedAtUtc,
          }
        : fonte,
    };
  }

  const imovel = car.imoveis[0];
  const textoSituacao = `${imovel.condicao} ${imovel.situacao} ${imovel.statusLabel}`;
  const status = imovel.statusCodigo.toUpperCase();

  if (status === "CA") {
    return {
      criterioId: "reserva_legal_documento",
      resultado: "Inapto",
      detalhe: `CAR cancelado (${imovel.situacao}). Validar RL e documentação antes de crédito.`,
      fonte: {
        nome: car.fonte.nome,
        url: car.fonte.url,
        consultadoEmUtc: car.fonte.queriedAtUtc,
      },
    };
  }

  if (status === "SU" || RL_PENDENCIA_RE.test(textoSituacao)) {
    return {
      criterioId: "reserva_legal_documento",
      resultado: "Alerta",
      detalhe: `Condição SICAR: ${imovel.situacao}. Consulte o demonstrativo CAR para área de RL declarada e pendências.`,
      fonte: {
        nome: car.fonte.nome,
        url: car.fonte.url,
        consultadoEmUtc: car.fonte.queriedAtUtc,
      },
    };
  }

  return {
    criterioId: "reserva_legal_documento",
    resultado: "Apto",
    detalhe: `Sem indicativo público de pendência de RL na condição cadastral (${imovel.situacao}). Áreas de RL/APP detalhadas não constam no WFS — use o demonstrativo CAR.`,
    fonte: {
      nome: car.fonte.nome,
      url: car.fonte.url,
      consultadoEmUtc: car.fonte.queriedAtUtc,
    },
  };
}
