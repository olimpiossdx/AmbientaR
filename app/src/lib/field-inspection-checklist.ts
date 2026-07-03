/**
 * Template do checklist de fiscalização em campo (Vistoria Técnica).
 * Textos alinhados ao roteiro operacional; independente de outros módulos.
 */

export type ChecklistItemStatus =
  | 'conforme'
  | 'nao_conforme'
  | 'nao_aplicavel'
  | 'nao_verificado';

export type FieldInspectionMotivo =
  | 'Denúncia'
  | 'Rotina'
  | 'Condicionante'
  | 'Auto anterior';

export const FIELD_INSPECTION_MOTIVOS: FieldInspectionMotivo[] = [
  'Denúncia',
  'Rotina',
  'Condicionante',
  'Auto anterior',
];

export type FieldInspectionChecklistSection = {
  id: string;
  title: string;
  items: { id: string; label: string }[];
};

export const FIELD_INSPECTION_CHECKLIST: FieldInspectionChecklistSection[] = [
  {
    id: 'documentacao',
    title: '2. Documentação e Licenciamento (Conformidade Legal)',
    items: [
      { id: 'licenca_vigente', label: 'Licença Ambiental (LP/LI/LO/LAC) vigente e afixada no local?' },
      { id: 'condicionantes', label: 'Condicionantes das licenças sendo integralmente cumpridas?' },
      { id: 'aia', label: 'Autorização de Intervenção Ambiental (AIA) válida, se houver corte de vegetação/intervenção em APP?' },
      { id: 'outorga', label: 'Outorga de direito de uso de recursos hídricos ou cadastro de uso insignificante?' },
      { id: 'livro_inspecao', label: 'Livro de inspeção ou registros de operação disponíveis e atualizados?' },
      { id: 'auto_anterior', label: 'Cópia do Auto de Infração/Boletim de Ocorrência anterior (se em caráter corretivo)?' },
    ],
  },
  {
    id: 'hidricos',
    title: '3. Recursos Hídricos e Efluentes',
    items: [
      { id: 'lancamento_efluentes', label: 'Lançamento de efluentes líquidos (industriais ou sanitários) ocorrendo?' },
      { id: 'ete_operando', label: 'Sistema de tratamento de efluentes implantado e operando adequadamente?' },
      { id: 'poluicao_visivel', label: 'Há indícios visuais de poluição ou contaminação em corpos d\'água próximos?' },
      { id: 'ete_fossa', label: 'Estação de Tratamento de Efluentes (ETE) ou fossa séptica com manutenção em dia?' },
      { id: 'medicao_captacao', label: 'Medição de captação de água e efluente sendo realizada e registrada?' },
    ],
  },
  {
    id: 'atmosfera',
    title: '4. Emissões Atmosféricas e Ruído',
    items: [
      { id: 'poeira_odores', label: 'Presença de poeira em suspensão, fumaça ou odores fortes fora dos padrões?' },
      { id: 'controle_poluicao', label: 'Sistemas de controle de poluição (filtros, ciclones, lavadores de gases) operantes?' },
      { id: 'ruido_divisas', label: 'Nível de ruído perceptível nas divisas do terreno (incômodo à vizinhança)?' },
      { id: 'manutencao_emissoes', label: 'Equipamentos em manutenção preventiva para redução de emissões?' },
    ],
  },
  {
    id: 'residuos',
    title: '5. Resíduos Sólidos',
    items: [
      { id: 'segregacao', label: 'Segregação correta dos resíduos (comuns, recicláveis, perigosos)?' },
      { id: 'area_perigosos', label: 'Área de armazenamento de Resíduos Perigosos (Classe I) coberta, impermeabilizada e com bacia de contenção?' },
      { id: 'destinacao', label: 'Destinação final licenciada (comprovantes de destinação corretos)?' },
      { id: 'recipientes', label: 'Existência de recipientes adequados e identificados para óleos usados, pilhas e lâmpadas?' },
    ],
  },
  {
    id: 'app',
    title: '6. Área de Preservação Permanente (APP) e Flora',
    items: [
      { id: 'supressao', label: 'Supressão de vegetação nativa sendo realizada?' },
      { id: 'intervencoes_irregulares', label: 'Há intervenções irregulares em cursos d\'água, nascentes, topos de morro ou encostas?' },
      { id: 'mineracao', label: 'Em caso de mineração, os taludes e pilhas de estéril estão devidamente conformados?' },
      { id: 'prad', label: 'Plano de Recuperação de Áreas Degradadas (PRAD) sendo executado?' },
    ],
  },
  {
    id: 'reserva_legal',
    title: '7. Reserva Legal',
    items: [
      {
        id: 'rl_demarcada_percentual',
        label:
          'A Reserva Legal está demarcada no imóvel e atende ao percentual mínimo exigido pelo Código Florestal para o bioma/região?',
      },
      {
        id: 'rl_vegetacao_uso',
        label:
          'A área de RL mantém vegetação nativa ou regeneração, sem uso incompatível (pastagem intensiva, construções, supressão ou queimadas)?',
      },
      {
        id: 'rl_averbacao_termo',
        label:
          'Há averbação da RL na matrícula do imóvel ou Termo de Compromisso de reconstituição/regularização vigente junto ao órgão ambiental?',
      },
      {
        id: 'rl_car_campo',
        label:
          'A delimitação da RL no CAR/SICAR (mapa/croqui) é compatível com o observado em campo?',
      },
      {
        id: 'rl_supressao_nao_autorizada',
        label:
          'Há supressão de vegetação ou intervenção não autorizada em área de Reserva Legal?',
      },
      {
        id: 'rl_recuperacao_passivo',
        label:
          'Áreas de RL degradadas possuem PRAD, plano de recuperação ou termo de compromisso em execução?',
      },
      {
        id: 'rl_protecao_fogo_pisoteio',
        label:
          'A RL está protegida contra fogo, pisoteio por animais e outras formas de degradação?',
      },
    ],
  },
  {
    id: 'solo_estradas',
    title: '8. Conservação do Solo e Estradas/Acessos',
    items: [
      {
        id: 'solo_erosao_controle',
        label:
          'Há processos erosivos visíveis (sulcos, voçorocas, lavracão) em taludes, pastagem ou lavoura sem medidas de controle adequadas?',
      },
      {
        id: 'solo_praticas_conservacao',
        label:
          'Práticas de conservação do solo estão adotadas onde necessário (curvas de nível, plantio em nível, cobertura vegetal, capina seletiva ou ILPF)?',
      },
      {
        id: 'solo_exposicao_compactacao',
        label:
          'Há exposição excessiva do solo ou compactação por tráfego de máquinas/animais sem recuperação?',
      },
      {
        id: 'estrada_drenagem',
        label:
          'Estradas vicinais e acessos possuem drenagem adequada (sarjetas, dissipadores, valetas) para reduzir enxurrada e erosão?',
      },
      {
        id: 'estrada_cruzamento_app',
        label:
          'Acessos ou obras em estradas cruzam APP, encostas íngremes ou cursos d\'água sem autorização ou sem obras de proteção (estabilização, bueiros, dissipadores)?',
      },
      {
        id: 'estrada_manutencao',
        label:
          'Existe manutenção das vias de acesso (reparos, controle de sedimentos) conforme projeto, programa ou boas práticas?',
      },
      {
        id: 'estrada_obra_sem_autorizacao',
        label:
          'Obra nova ou ampliação relevante de estrada/acesso principal foi feita sem autorização ambiental, quando exigível?',
      },
    ],
  },
  {
    id: 'evidencias',
    title: '9. Evidências e Instrução do Auto de Fiscalização',
    items: [
      { id: 'fotos_geo', label: 'Fotografias georreferenciadas tiradas de todos os pontos de inconformidade.' },
      { id: 'pontos_gps', label: 'Pontos de GPS demarcados para eventuais embargos.' },
      { id: 'croqui', label: 'Croqui da área (desenho esquemático indicando onde ocorreu a infração).' },
      { id: 'amostras', label: 'Coleta de amostras (se necessária, com cadeia de custódia preenchida).' },
    ],
  },
];

export type FieldInspectionChecklistRow = {
  sectionId: string;
  itemId: string;
  label: string;
  status: ChecklistItemStatus;
  criticality?: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
  observations?: string;
  imageUrls: string[];
};

export function defaultChecklistResponses(): FieldInspectionChecklistRow[] {
  return FIELD_INSPECTION_CHECKLIST.flatMap((section) =>
    section.items.map((item) => ({
      sectionId: section.id,
      itemId: item.id,
      label: item.label,
      status: 'nao_verificado' as ChecklistItemStatus,
      imageUrls: [] as string[],
    })),
  );
}

export function mergeChecklistWithTemplate(
  saved:
    | {
        sectionId: string;
        itemId: string;
        label?: string;
        status?: ChecklistItemStatus;
        criticality?: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
        observations?: string;
        imageUrls?: string[];
      }[]
    | undefined,
): FieldInspectionChecklistRow[] {
  const defaults = defaultChecklistResponses();
  if (!saved?.length) return defaults;
  const byKey = new Map(saved.map((r) => [`${r.sectionId}:${r.itemId}`, r]));
  return defaults.map((d) => {
    const key = `${d.sectionId}:${d.itemId}`;
    const prev = byKey.get(key);
    if (!prev) return d;
    return {
      ...d,
      label: prev.label || d.label,
      status: prev.status ?? d.status,
      criticality: prev.criticality,
      observations: prev.observations,
      imageUrls: prev.imageUrls ?? [],
    };
  });
}

export const CHECKLIST_STATUS_LABELS: Record<ChecklistItemStatus, string> = {
  conforme: 'Conforme',
  nao_conforme: 'Não conforme',
  nao_aplicavel: 'N/A',
  nao_verificado: 'Não verificado',
};
