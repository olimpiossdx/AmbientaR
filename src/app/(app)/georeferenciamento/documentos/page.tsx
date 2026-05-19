"use client";

import { GeorefSectionPage } from "@/components/georeferenciamento/georef-section-page";
import { PROCESSO_RURAL_SIGEF } from "@/lib/georeferenciamento/processos";

const DOCS_CHECKLIST = {
  ...PROCESSO_RURAL_SIGEF,
  id: "documentos-tecnicos",
  titulo: "Documentação técnica",
  descricao:
    "Memorial descritivo georreferenciado, planta em escala adequada, ART/RRT, identificação do RT credenciado e anuências de confrontantes.",
  checklist: [
    { id: "memorial", label: "Memorial descritivo com coordenadas e confrontações", obrigatorio: true },
    { id: "planta", label: "Planta georreferenciada (escala e legenda conforme norma)", obrigatorio: true },
    { id: "art", label: "ART/RRT registrada", obrigatorio: true },
    { id: "assinaturas", label: "Assinaturas digitais ICP-Brasil (SIGEF) quando aplicável", obrigatorio: true },
    { id: "anuencias-doc", label: "Anuências e declarações anexas", obrigatorio: true },
    { id: "xml-sigef", label: "Arquivo/planilha SIGEF exportada para certificação", obrigatorio: true },
  ],
};

export default function GeorefDocumentosPage() {
  return (
    <GeorefSectionPage
      title="Documentação técnica"
      description="Pacote documental para certificação INCRA e registro: memorial, planta, responsabilidade técnica e declarações."
      processo={DOCS_CHECKLIST}
      links={[
        { label: "Manual SIGEF — planilha", href: "https://sigef.incra.gov.br/documentos/manual/" },
      ]}
    />
  );
}
