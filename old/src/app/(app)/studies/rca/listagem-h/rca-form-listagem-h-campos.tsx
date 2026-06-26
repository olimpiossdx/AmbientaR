'use client';

import {
  RcaBooleanRadio,
  RcaSectionCard,
  RcaTextAreaField,
  RcaTextField,
} from '../listagem-a/rca-form-listagem-a-helpers';

const base = 'listagemH.supressaoMataAtlantica';

export function RcaFormListagemHCamposSupressao({ form }: { form: any }) {
  return (
    <RcaSectionCard
      title="Caracterização – Supressão de vegetação (Mata Atlântica)"
      description="Empreendimentos com supressão de vegetação primária ou secundária nativa no bioma Mata Atlântica, em estágios médio e/ou avançado de regeneração — sujeitos a EIA/RIMA (Lei 11.428/2006)."
    >
      <RcaTextField form={form} name={`${base}.codigoDn`} label="Código DN" placeholder="H-01-01-1" />
      <RcaTextField form={form} name={`${base}.areaSuppressaoHa`} label="Área de supressão (ha)" />
      <RcaTextField form={form} name={`${base}.areaEmpreendimentoHa`} label="Área total do empreendimento (ha)" />
      <RcaTextField
        form={form}
        name={`${base}.tipoVegetacao`}
        label="Tipo de vegetação (primária / secundária)"
      />
      <RcaTextField
        form={form}
        name={`${base}.estagioRegeneracao`}
        label="Estágio de regeneração (médio / avançado)"
      />
      <RcaTextField
        form={form}
        name={`${base}.formacaoVegetal`}
        label="Formação vegetal / fitofisionomia"
      />
      <RcaTextAreaField
        form={form}
        name={`${base}.metodoInventario`}
        label="Método de inventário florestal / levantamento"
      />
      <RcaTextField
        form={form}
        name={`${base}.volumeMadeiraM3`}
        label="Volume estimado de madeira (m³)"
      />
      <RcaBooleanRadio
        form={form}
        name={`${base}.sujeitoEiaRima`}
        label="Empreendimento sujeito a EIA/RIMA (Lei 11.428/2006)?"
      />
      <RcaTextField
        form={form}
        name={`${base}.autorizacaoSupressao`}
        label="Autorização de supressão (órgão / processo / nº)"
      />
      <RcaTextAreaField
        form={form}
        name={`${base}.medidasCompensacao`}
        label="Medidas de compensação ambiental / reposição florestal"
      />
      <RcaTextAreaField
        form={form}
        name={`${base}.cronogramaImplementacao`}
        label="Cronograma de implementação das medidas"
      />
      <RcaTextAreaField
        form={form}
        name={`${base}.descricaoEmpreendimento`}
        label="Descrição da atividade não enquadrada em outras listagens"
      />
    </RcaSectionCard>
  );
}
