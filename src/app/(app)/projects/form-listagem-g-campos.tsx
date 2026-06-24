'use client';

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import {
  BooleanRadio,
  SectionCard,
  TextAreaField,
  TextField,
} from './form-listagem-a-helpers';
import type { ListagemGFormTipo } from './listagem-g-form-registry';

type CamposProps = {
  form: any;
  tipo: ListagemGFormTipo;
};

function CamposBovinocultura({ form }: { form: any }) {
  const base = 'listagemG.bovinocultura';
  return (
    <SectionCard title="Caracterização – Criação de bovinos">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField form={form} name={`${base}.rebanhoTotal`} label="Rebanho total (cab.)" />
        <TextField form={form} name={`${base}.sistemaCriacao`} label="Sistema de criação" />
        <TextField form={form} name={`${base}.areaPastagemHa`} label="Área de pastagem (ha)" />
        <TextField form={form} name={`${base}.capacidadeConfinamento`} label="Capacidade de confinamento (cab.)" />
      </div>
      <TextAreaField form={form} name={`${base}.manejoDejetos`} label="Manejo de dejetos e efluentes" className="mt-4" />
      <TextAreaField form={form} name={`${base}.tratoSanitario`} label="Trato sanitário / vacinação" className="mt-4" />
    </SectionCard>
  );
}

function CamposIrrigados({ form }: { form: any }) {
  const base = 'listagemG.irrigados';
  return (
    <SectionCard title="Caracterização – Projetos agropecuários irrigados">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField form={form} name={`${base}.areaIrrigadaHa`} label="Área irrigada (ha)" />
        <TextField form={form} name={`${base}.sistemaIrrigacao`} label="Sistema de irrigação" />
        <TextField form={form} name={`${base}.fonteAgua`} label="Fonte de água / outorga" />
        <TextField form={form} name={`${base}.vazaoProjeto`} label="Vazão de projeto" />
      </div>
      <TextAreaField form={form} name={`${base}.culturasIrrigadas`} label="Culturas / atividades irrigadas" className="mt-4" />
    </SectionCard>
  );
}

function CamposSilvicultura({ form }: { form: any }) {
  const base = 'listagemG.silvicultura';
  return (
    <SectionCard title="Caracterização – Silvicultura e carvoejamento">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField form={form} name={`${base}.especie`} label="Espécie(s) florestais" />
        <TextField form={form} name={`${base}.areaPlantadaHa`} label="Área plantada (ha)" />
        <TextField form={form} name={`${base}.rotacaoAnos`} label="Rotação / ciclo (anos)" />
      </div>
      <FormField
        control={form.control}
        name={`${base}.carvoejamento`}
        render={({ field }) => (
          <FormItem className="mt-4">
            <FormLabel>Realiza carvoejamento?</FormLabel>
            <FormControl>
              <BooleanRadio value={field.value} onChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
      <TextAreaField form={form} name={`${base}.manejoFlorestal`} label="Manejo florestal previsto" className="mt-4" />
    </SectionCard>
  );
}

function CamposGraos({ form }: { form: any }) {
  const base = 'listagemG.graos';
  return (
    <SectionCard title="Caracterização – Beneficiamento e armazenamento de grãos">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField form={form} name={`${base}.tiposGraos`} label="Tipos de grãos / produtos" />
        <TextField form={form} name={`${base}.capacidadeArmazenamentoT`} label="Capacidade de armazenamento (t)" />
        <TextField form={form} name={`${base}.capacidadeBeneficiamentoTpd`} label="Capacidade beneficiamento (t/dia)" />
      </div>
      <TextAreaField form={form} name={`${base}.processoBeneficiamento`} label="Etapas do processo" className="mt-4" />
    </SectionCard>
  );
}

function CamposSuinocultura({ form }: { form: any }) {
  const base = 'listagemG.suinocultura';
  return (
    <SectionCard title="Caracterização – Suinocultura">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField form={form} name={`${base}.capacidadeAnimais`} label="Capacidade (animais)" />
        <TextField form={form} name={`${base}.sistemaCriacao`} label="Sistema de criação" />
        <TextField form={form} name={`${base}.numGalpoes`} label="Número de galpões / unidades" />
      </div>
      <TextAreaField form={form} name={`${base}.manejoDejetos`} label="Manejo de dejetos" className="mt-4" />
    </SectionCard>
  );
}

function CamposAvicultura({ form }: { form: any }) {
  const base = 'listagemG.avicultura';
  return (
    <SectionCard title="Caracterização – Avicultura">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField form={form} name={`${base}.linhagem`} label="Linhagem / tipo de produção" />
        <TextField form={form} name={`${base}.capacidadeAves`} label="Capacidade (aves)" />
        <TextField form={form} name={`${base}.numGalpoes`} label="Número de galpões" />
      </div>
      <TextAreaField form={form} name={`${base}.manejoCama`} label="Manejo de cama / dejetos" className="mt-4" />
    </SectionCard>
  );
}

export function FormListagemGCampos({ form, tipo }: CamposProps) {
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
    case 'geral':
    default:
      return null;
  }
}
