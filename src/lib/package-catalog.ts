import type { ClientPackageInfo } from "@/lib/types";
import {
  formatPackageAnnualLabel,
  formatPackageMonthlyHint,
} from "@/lib/package-pricing";
import { PACKAGE_LIMITS } from "@/lib/package-limits";

export function getClientPackageCatalog(): ClientPackageInfo[] {
  return [
    {
      id: "gratuito",
      name: "Gratuito",
      description: "Conheça o portal com 1 empreendimento.",
      price: "R$ 0",
      priceDetail: "Sem AmbBot incluído",
      features: [
        "Até 1 empreendimento",
        "1 registro por módulo (licença, outorga, etc.)",
        "Sem upload de arquivos",
        "Sem alertas automáticos de prazo",
        "Versão com publicidade de terceiros (ver contrato)",
        "AmbBot avulso (R$ 99/consulta)",
      ],
    },
    {
      id: "basico",
      name: "Autônomo 1",
      description: "Uma propriedade com gestão de documentos e prazos.",
      price: formatPackageAnnualLabel("basico"),
      priceDetail: formatPackageMonthlyHint("basico", PACKAGE_LIMITS.basico.tierLabel),
      features: [
        "Até 1 empreendimento",
        "1 GB · 30 arquivos (10 MB cada)",
        "Até 5 licenças ativas",
        "AmbBot avulso (R$ 99/consulta)",
      ],
    },
    {
      id: "intermediario",
      name: "Autônomo 2",
      description: "Duas propriedades e 1 análise AmbBot por mês.",
      price: formatPackageAnnualLabel("intermediario"),
      priceDetail: formatPackageMonthlyHint(
        "intermediario",
        PACKAGE_LIMITS.intermediario.tierLabel,
      ),
      highlighted: true,
      features: [
        "Até 2 empreendimentos",
        "3 GB · 60 arquivos",
        "1 AmbBot / mês (análise de área)",
        "Consultas extras: R$ 79",
      ],
    },
    {
      id: "avancado",
      name: "Autônomo 3",
      description: "Três propriedades com monitoramento e representante.",
      price: formatPackageAnnualLabel("avancado"),
      priceDetail: formatPackageMonthlyHint("avancado", PACKAGE_LIMITS.avancado.tierLabel),
      features: [
        "Até 3 empreendimentos",
        "6 GB · 90 arquivos",
        "1 AmbBot / mês",
        "Condicionantes e outorgas (cadastro)",
      ],
    },
    {
      id: "completo",
      name: "Autônomo 5",
      description: "Até cinco propriedades na gestão centralizada.",
      price: formatPackageAnnualLabel("completo"),
      priceDetail: formatPackageMonthlyHint("completo", PACKAGE_LIMITS.completo.tierLabel),
      features: [
        "Até 5 empreendimentos",
        "12 GB · 150 arquivos",
        "1 AmbBot / mês",
        "Suporte prioritário",
      ],
    },
    {
      id: "sob_consulta",
      name: "Sob consulta",
      description: "Mais de 5 empreendimentos ou demandas específicas.",
      price: "Personalizado",
      priceDetail: "Limites negociados",
      features: [
        "Empreendimentos e storage sob medida",
        "AmbBot e consultoria dedicada",
        "Projetos e assessoria presencial",
      ],
    },
  ];
}

export const CLIENT_PACKAGE_CATALOG: ClientPackageInfo[] = getClientPackageCatalog();
