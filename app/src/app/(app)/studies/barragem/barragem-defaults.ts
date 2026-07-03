/** Textos-modelo inspirados no memorial FPT_318-B (Fazenda Santo Antônio). */
export const BARRAGEM_APRESENTACAO_MODELO = `Este Projeto Técnico foi elaborado para subsidiar a construção de uma barragem no empreendimento indicado, de titularidade do proprietário/requerente abaixo identificado.

Descreva o uso pretendido (ex.: acumulação de água para irrigação, regularização de vazão), o espelho d'água previsto (m²) e a capacidade de armazenamento (m³).

O memorial apresenta as informações técnicas que permitiram definir o layout das estruturas projetadas e dimensioná-las: memorial descritivo, cálculos hidrológicos, dimensionamento do extravasor, implantação, conservação e manutenção.`;

export const BARRAGEM_INFO_TOPOGRAFICAS_MODELO = `As informações topográficas necessárias à quantificação da área da bacia hidrográfica e da bacia hidráulica, além do cálculo do volume de acumulação do reservatório, foram obtidas por carta cartográfica, imagem de satélite e/ou levantamento topográfico planialtimétrico.

Indique escala da planta, equidistância das curvas de nível e programas utilizados para cálculo de áreas e volumes.`;

export const BARRAGEM_CONSERVACAO_MODELO = `Encerrada a construção do barramento, recomenda-se vigilância contínua pelo proprietário, incluindo: manutenção de cobertura vegetal nos taludes; limpeza de vegetação arbustiva; controle de formigueiros; inspeção de fendas e deslizamentos; verificação da cota do coroamento; desobstrução do sangradouro/extravasor; e proteção do talude de montante (ex.: rip-rap) quando houver ação de ondas.`;

export const BARRAGEM_TIPOS_ESTRUTURA = [
  { value: 'terra_homogenea', label: 'Barragem de terra homogênea' },
  { value: 'terra_zonada', label: 'Barragem de terra zonada' },
  { value: 'enrocamento', label: 'Barragem de enrocamento' },
  { value: 'concreto_gravidade', label: 'Barragem de concreto gravidade' },
  { value: 'barramento_sem_regularizacao', label: 'Barramento sem regularização de vazão' },
] as const;

export const BARRAGEM_DEFINICAO_POR_TIPO: Record<
  (typeof BARRAGEM_TIPOS_ESTRUTURA)[number]['value'],
  string
> = {
  terra_homogenea:
    'Barragem de terra homogênea constituída por solo compactado, com controle de umidade, drenagem interna e proteção contra erosão nos taludes.',
  terra_zonada:
    'Barragem de terra zonada com núcleo impermeável, espaldares, filtros, transições e drenos conforme projeto geotécnico.',
  enrocamento:
    'Barragem de enrocamento com núcleo ou face impermeável, transições adequadas e controle de deformações.',
  concreto_gravidade:
    'Barragem de concreto gravidade dimensionada por peso próprio, com verificação de tombamento, deslizamento e tensões na base.',
  barramento_sem_regularizacao:
    'Barramento sem regularização de vazão (soleira, derivação ou pequena lâmina d\'água), sem volume útil relevante para acumulação sazonal.',
};
