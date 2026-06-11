'use client';



import * as React from 'react';

import { useFieldArray } from 'react-hook-form';

import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';

import { Input } from '@/components/ui/input';

import { Textarea } from '@/components/ui/textarea';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { Checkbox } from '@/components/ui/checkbox';

import { Button } from '@/components/ui/button';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { PlusCircle, Trash2 } from 'lucide-react';

import type { UseFormReturn } from 'react-hook-form';

import type { PcaListagemAFormValues } from './pca-listagem-a-schema';

import {

  PcaBooleanRadio,

  PcaCheckboxOptions,

  PcaNumField,

  PcaSectionCard,

  PcaTabelaLinhasFixas,

  PcaTextField,

  PcaTextAreaField,

  PcaSituacaoRegularizacao,

} from './pca-form-listagem-a-helpers';

import { PcaFormListagemARochasAgendas } from './pca-form-listagem-a-rochas-agendas';

const gruposFauna = ['Aves', 'Mamíferos', 'Peixes', 'Répteis', 'Anfíbios', 'Invertebrados'];

export function PcaFormListagemARochasComplemento({ form }: { form: any }) {
  const base = 'listagemA.rochasOrnamentais';
  const haEspeciesAmeacadas = form.watch(`${base}.fauna.especiesAmeacadas`);
  const haEspeciesEndemicas = form.watch(`${base}.fauna.especiesEndemicas`);

  const { fields: outrasAtividades, append: appendAtividade, remove: removeAtividade } = useFieldArray({
    control: form.control,
    name: `${base}.outrasAtividades`,
  });
  const { fields: especiesAmeacadas, append: appendAmeacada, remove: removeAmeacada } = useFieldArray({
    control: form.control,
    name: `${base}.fauna.listaAmeacadas`,
  });
  const { fields: especiesEndemicas, append: appendEndemica, remove: removeEndemica } = useFieldArray({
    control: form.control,
    name: `${base}.fauna.listaEndemicas`,
  });

  return (
    <div className="space-y-6">
      <PcaFormListagemARochasAgendas form={form} />

      <PcaSectionCard title="12. Outras atividades não descritas (DN 74/04)">
        <FormDescription>
          Ex.: pilhas de estéril/rejeitos (A-05-04-5), estradas de transporte (A-05-06-3).
        </FormDescription>
        {outrasAtividades.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-5">
            <PcaTextField form={form} name={`${base}.outrasAtividades.${index}.atividade`} label="Atividade" />
            <PcaTextField form={form} name={`${base}.outrasAtividades.${index}.codigo`} label="Código DN-74/2004" />
            <PcaTextField form={form} name={`${base}.outrasAtividades.${index}.unidade`} label="Unidade" />
            <PcaTextField form={form} name={`${base}.outrasAtividades.${index}.quantidade`} label="Quantidade" />
            <PcaTextField form={form} name={`${base}.outrasAtividades.${index}.inicio`} label="Início da atividade" />
            <div className="md:col-span-5 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeAtividade(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => appendAtividade({ atividade: '', codigo: '', unidade: '', quantidade: '', inicio: '' })}
        >
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar atividade
        </Button>
      </PcaSectionCard>

      <PcaSectionCard title="13. Dados do empreendimento conforme legislação municipal">
        <PcaBooleanRadio form={form} name={`${base}.legislacaoMunicipal.temPlanoDiretor`} label="O município possui Plano Diretor / Lei de Uso e Ocupação do Solo?" />
        <PcaBooleanRadio form={form} name={`${base}.legislacaoMunicipal.concordanciaMunicipal`} label="Há concordância municipal com o empreendimento?" />
        <PcaBooleanRadio form={form} name={`${base}.legislacaoMunicipal.vizinhoExtracaoMineral`} label="A área é vizinha a outras áreas de extração mineral?" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PcaNumField form={form} name={`${base}.legislacaoMunicipal.distanciaNucleoM`} label="Distância ao núcleo populacional mais próximo (m)" />
          <PcaTextField form={form} name={`${base}.legislacaoMunicipal.referenciaLocalizacao`} label="Referência de localização" />
        </div>
      </PcaSectionCard>

      <PcaSectionCard title="14. Capacidade de produção">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PcaNumField form={form} name={`${base}.capacidadeProducao.movimentacaoBrutaRom`} label="Movimentação bruta (ROM)" />
          <PcaNumField form={form} name={`${base}.capacidadeProducao.recuperacaoLavraPercent`} label="Recuperação na lavra (%)" />
          <PcaTextField form={form} name={`${base}.capacidadeProducao.produtoPrincipal`} label="Produto(s) principal(is)" />
          <PcaTextField form={form} name={`${base}.capacidadeProducao.subprodutos`} label="Subproduto(s)" />
          <PcaNumField form={form} name={`${base}.capacidadeProducao.producaoLiquidaMensalT`} label="Produção líquida mensal (t)" />
          <PcaNumField form={form} name={`${base}.capacidadeProducao.producaoLiquidaMensalM2`} label="Produção líquida mensal (m²)" />
          <PcaNumField form={form} name={`${base}.capacidadeProducao.producaoLiquidaMensalM3`} label="Produção líquida mensal (m³)" />
          <PcaNumField form={form} name={`${base}.capacidadeProducao.capacidadeNominalInstalada`} label="Capacidade nominal instalada" />
          <PcaNumField form={form} name={`${base}.capacidadeProducao.percentualExtracao`} label="% de extração" />
          <PcaNumField form={form} name={`${base}.capacidadeProducao.reservaMineralM3`} label="Reserva mineral (m³)" />
          <PcaNumField form={form} name={`${base}.capacidadeProducao.reservaMineralT`} label="Reserva mineral (t)" />
          <PcaNumField form={form} name={`${base}.capacidadeProducao.vidaUtilAnos`} label="Vida útil da jazida (anos)" />
          <PcaNumField form={form} name={`${base}.capacidadeProducao.avancoAnualHa`} label="Avanço anual da lavra (ha)" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <PcaNumField form={form} name={`${base}.capacidadeProducao.horasDia`} label="Horas/dia" />
          <PcaNumField form={form} name={`${base}.capacidadeProducao.diasSemana`} label="Dias/semana" />
          <PcaNumField form={form} name={`${base}.capacidadeProducao.numTurnos`} label="Nº de turnos" />
          <PcaNumField form={form} name={`${base}.capacidadeProducao.funcionariosTurno`} label="Funcionários/turno" />
        </div>
      </PcaSectionCard>

      <PcaSectionCard title="15 e 16. Licenciamento mineral (DNPM) e área do empreendimento">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <PcaTextField form={form} name={`${base}.licenciamentoMineral.titular`} label="Titular do processo" />
          <PcaTextField form={form} name={`${base}.licenciamentoMineral.numeroProcesso`} label="Processo nº" />
          <PcaTextField form={form} name={`${base}.licenciamentoMineral.substancias`} label="Substância(s) mineral(is)" />
          <PcaNumField form={form} name={`${base}.licenciamentoMineral.areaConcedidaHa`} label="Área concedida (ha)" />
        </div>
        <PcaBooleanRadio form={form} name={`${base}.licenciamentoMineral.titularProprietario`} label="O titular é proprietário do terreno?" />
        <PcaTextField form={form} name={`${base}.licenciamentoMineral.situacaoLavra`} label="Situação atual da lavra (em atividade / paralisada / não iniciada)" />
        <PcaBooleanRadio form={form} name={`${base}.licenciamentoMineral.direitosArrendados`} label="Direitos minerários arrendados?" />
        <PcaTextAreaField
          form={form}
          name={`${base}.licenciamentoMineral.fasesProcesso`}
          label="Fase atual do processo e datas"
        />
        <PcaTextField form={form} name={`${base}.licenciamentoMineral.informacoesAdicionais`} label="Informações adicionais sobre o processo" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <PcaNumField form={form} name={`${base}.areaEmpreendimento.totalPoligonalHa`} label="Área total poligonal (ha)" />
          <PcaNumField form={form} name={`${base}.areaEmpreendimento.areaLavraHa`} label="Área da lavra (ha)" />
          <PcaNumField form={form} name={`${base}.areaEmpreendimento.areaServidaoHa`} label="Área de servidão (ha)" />
          <PcaNumField form={form} name={`${base}.areaEmpreendimento.areaConstruidaHa`} label="Área construída (ha)" />
          <PcaNumField form={form} name={`${base}.areaEmpreendimento.percentualDegradada`} label="% área degradada" />
        </div>
        <PcaTextAreaField form={form} name={`${base}.areaEmpreendimento.necessitaPrad`} label="Existem áreas degradadas que necessitam PRAD?" />
        <FormDescription>Apresentar planta de detalhe georreferenciada conforme anexo do TR.</FormDescription>
      </PcaSectionCard>

      <PcaSectionCard title="17. Fauna da área de influência direta">
        <PcaCheckboxOptions
          form={form}
          name={`${base}.fauna.grupos`}
          options={gruposFauna.map((g) => ({ id: g, label: g }))}
        />
        <PcaBooleanRadio form={form} name={`${base}.fauna.especiesAmeacadas`} label="Presença de espécies ameaçadas de extinção?" />
        {haEspeciesAmeacadas &&
          especiesAmeacadas.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-3">
              <PcaTextField form={form} name={`${base}.fauna.listaAmeacadas.${index}.nomeComum`} label="Nome comum" />
              <PcaTextField form={form} name={`${base}.fauna.listaAmeacadas.${index}.nomeCientifico`} label="Nome científico" className="md:col-span-2" />
              <div className="md:col-span-3 flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => removeAmeacada(index)}>
                  <Trash2 className="mr-2 h-4 w-4" />Remover
                </Button>
              </div>
            </div>
          ))}
        {haEspeciesAmeacadas && (
          <Button type="button" variant="outline" onClick={() => appendAmeacada({ nomeComum: '', nomeCientifico: '' })}>
            <PlusCircle className="mr-2 h-4 w-4" />Adicionar espécie ameaçada
          </Button>
        )}
        <PcaBooleanRadio form={form} name={`${base}.fauna.especiesEndemicas`} label="Presença de espécies endêmicas?" />
        {haEspeciesEndemicas &&
          especiesEndemicas.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-3">
              <PcaTextField form={form} name={`${base}.fauna.listaEndemicas.${index}.nomeComum`} label="Nome comum" />
              <PcaTextField form={form} name={`${base}.fauna.listaEndemicas.${index}.nomeCientifico`} label="Nome científico" className="md:col-span-2" />
              <div className="md:col-span-3 flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => removeEndemica(index)}>
                  <Trash2 className="mr-2 h-4 w-4" />Remover
                </Button>
              </div>
            </div>
          ))}
        {haEspeciesEndemicas && (
          <Button type="button" variant="outline" onClick={() => appendEndemica({ nomeComum: '', nomeCientifico: '' })}>
            <PlusCircle className="mr-2 h-4 w-4" />Adicionar espécie endêmica
          </Button>
        )}
        <PcaBooleanRadio form={form} name={`${base}.fauna.sitiosReproducao`} label="Sítios de reprodução (aves, mamíferos, peixes, répteis, anfíbios, biospeleologia)" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PcaBooleanRadio
            form={form}
            name={`${base}.fauna.especiesNaoIdentificadas`}
            label="Presença de espécies não identificadas?"
          />
          <PcaTextField form={form} name={`${base}.fauna.generoNaoIdentificado`} label="Gênero (se aplicável)" />
          <PcaBooleanRadio form={form} name={`${base}.fauna.morcegosHematofagos`} label="Presença de morcegos hematófagos?" />
          <PcaTextField form={form} name={`${base}.fauna.especiesMorcegos`} label="Espécies de morcegos (se aplicável)" />
        </div>
      </PcaSectionCard>
    </div>
  );
}
