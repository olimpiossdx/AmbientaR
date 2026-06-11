'use client';

import {
  RcaBooleanRadio,
  RcaSectionCard,
  RcaTextAreaField,
  RcaTextField,
} from '../listagem-a/rca-form-listagem-a-helpers';
import type { RcaListagemGFormTipo } from './rca-listagem-g-registry';

type CamposProps = {
  form: any;
  tipo: RcaListagemGFormTipo;
};

function CamposBovinocultura({ form }: { form: any }) {
  const base = 'listagemG.bovinocultura';
  return (
    <RcaSectionCard title="Caracterização – Criação de bovinos">
      <RcaTextField form={form} name={`${base}.rebanhoTotal`} label="Rebanho total (cab.)" />
      <RcaTextField form={form} name={`${base}.sistemaCriacao`} label="Sistema de criação (pasto / confinamento / semi)" />
      <RcaTextField form={form} name={`${base}.areaPastagemHa`} label="Área de pastagem (ha)" />
      <RcaTextField form={form} name={`${base}.capacidadeConfinamento`} label="Capacidade de confinamento (cab.)" />
      <RcaTextAreaField form={form} name={`${base}.manejoDejetos`} label="Manejo de dejetos e efluentes" />
      <RcaTextAreaField form={form} name={`${base}.tratoSanitario`} label="Trato sanitário / vacinação" />
    </RcaSectionCard>
  );
}

function CamposIrrigados({ form }: { form: any }) {
  const base = 'listagemG.irrigados';
  return (
    <RcaSectionCard title="Caracterização – Projetos agropecuários irrigados">
      <RcaTextField form={form} name={`${base}.areaIrrigadaHa`} label="Área irrigada (ha)" />
      <RcaTextField form={form} name={`${base}.sistemaIrrigacao`} label="Sistema de irrigação (aspersão, gotejamento…)" />
      <RcaTextField form={form} name={`${base}.fonteAgua`} label="Fonte de água / outorga" />
      <RcaTextField form={form} name={`${base}.vazaoProjeto`} label="Vazão de projeto (L/s ou m³/h)" />
      <RcaTextAreaField form={form} name={`${base}.culturasIrrigadas`} label="Culturas / atividades irrigadas" />
    </RcaSectionCard>
  );
}

function CamposSilvicultura({ form }: { form: any }) {
  const base = 'listagemG.silvicultura';
  return (
    <RcaSectionCard title="Caracterização – Silvicultura e carvoejamento">
      <RcaTextField form={form} name={`${base}.especie`} label="Espécie(s) florestais" />
      <RcaTextField form={form} name={`${base}.areaPlantadaHa`} label="Área plantada (ha)" />
      <RcaTextField form={form} name={`${base}.rotacaoAnos`} label="Rotação / ciclo (anos)" />
      <RcaBooleanRadio form={form} name={`${base}.carvoejamento`} label="Realiza carvoejamento?" />
      <RcaTextAreaField form={form} name={`${base}.manejoFlorestal`} label="Manejo florestal previsto" />
    </RcaSectionCard>
  );
}

function CamposGraos({ form }: { form: any }) {
  const base = 'listagemG.graos';
  return (
    <RcaSectionCard title="Caracterização – Beneficiamento e armazenamento de grãos">
      <RcaTextField form={form} name={`${base}.tiposGraos`} label="Tipos de grãos / produtos" />
      <RcaTextField form={form} name={`${base}.capacidadeArmazenamentoT`} label="Capacidade de armazenamento (t)" />
      <RcaTextField form={form} name={`${base}.capacidadeBeneficiamentoTpd`} label="Capacidade beneficiamento (t/dia)" />
      <RcaTextAreaField form={form} name={`${base}.processoBeneficiamento`} label="Etapas do processo" />
    </RcaSectionCard>
  );
}

function CamposSuinocultura({ form }: { form: any }) {
  const base = 'listagemG.suinocultura';
  return (
    <RcaSectionCard title="Caracterização – Suinocultura">
      <RcaTextField form={form} name={`${base}.capacidadeAnimais`} label="Capacidade (animais)" />
      <RcaTextField form={form} name={`${base}.sistemaCriacao`} label="Sistema (granja tecnificada, semi-intensivo…)" />
      <RcaTextField form={form} name={`${base}.numGalpoes`} label="Número de galpões / unidades" />
      <RcaTextAreaField form={form} name={`${base}.manejoDejetos`} label="Manejo de dejetos (biodigestor, lagoa, compostagem…)" />
    </RcaSectionCard>
  );
}

function CamposAvicultura({ form }: { form: any }) {
  const base = 'listagemG.avicultura';
  return (
    <RcaSectionCard title="Caracterização – Avicultura">
      <RcaTextField form={form} name={`${base}.linhagem`} label="Linhagem / tipo de produção" />
      <RcaTextField form={form} name={`${base}.capacidadeAves`} label="Capacidade (aves/lote ou aves/ano)" />
      <RcaTextField form={form} name={`${base}.numGalpoes`} label="Número de galpões" />
      <RcaTextAreaField form={form} name={`${base}.manejoCama`} label="Manejo de cama / dejetos" />
    </RcaSectionCard>
  );
}

export function RcaFormListagemGCamposEspecificos({ form, tipo }: CamposProps) {
  switch (tipo) {
    case 'bovinocultura':
      return <CamposBovinocultura form={form} />;
    case 'irrigados':
      return <CamposIrrigados form={form} />;
    case 'silvicultura':
      return <CamposSilvicultura form={form} />;
    case 'graos':
      return <CamposGraos form={form} />;
    case 'suinocultura':
      return <CamposSuinocultura form={form} />;
    case 'avicultura':
      return <CamposAvicultura form={form} />;
    case 'culturas':
    default:
      return null;
  }
}
