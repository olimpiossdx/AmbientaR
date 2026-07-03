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

export function PcaFormListagemALavraComplemento({ form }: { form: any }) {
  const haSupressao = form.watch('listagemA.lavraSubterranea.supressaoVegetacao.haveraSupressao');
  const intervencaoAppPassada = form.watch('listagemA.lavraSubterranea.app.intervencaoPassada');
  const intervencaoAppFutura = form.watch('listagemA.lavraSubterranea.app.intervencaoFutura');

  const { fields: corposHidricos, append: appendCorpo, remove: removeCorpo } = useFieldArray({
    control: form.control,
    name: 'listagemA.lavraSubterranea.corposHidricosSuperficiais',
  });
  const { fields: usosCorpoHidrico, append: appendUso, remove: removeUso } = useFieldArray({
    control: form.control,
    name: 'listagemA.lavraSubterranea.usosCorpoHidrico',
  });
  const { fields: acessos, append: appendAcesso, remove: removeAcesso } = useFieldArray({
    control: form.control,
    name: 'listagemA.lavraSubterranea.acessos.itens',
  });

  return (
    <div className="space-y-6">
      <PcaSectionCard title="12. Intervenção em Áreas de Preservação Permanente – APP">
        <PcaBooleanRadio form={form} name="listagemA.lavraSubterranea.app.intervencaoPassada" label="O empreendimento já fez intervenção em APP?" />
        {intervencaoAppPassada && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PcaCheckboxOptions
              form={form}
              name="listagemA.lavraSubterranea.app.intervencaoPassadaPeriodo"
              options={[
                { id: 'antes_2002', label: 'Antes de 19/06/2002' },
                { id: 'apos_2002', label: 'Após 19/06/2002 (Lei 14.309)' },
              ]}
            />
            <PcaTextField form={form} name="listagemA.lavraSubterranea.app.processoApefDaia" label="Processo APEF ou DAIA Nº" />
          </div>
        )}
        <PcaBooleanRadio form={form} name="listagemA.lavraSubterranea.app.intervencaoFutura" label="O empreendimento fará intervenção em APP?" />
        {intervencaoAppFutura && (
          <>
            <PcaCheckboxOptions
              form={form}
              name="listagemA.lavraSubterranea.app.naturezaIntervencao"
              options={[
                { id: 'baixo_impacto', label: 'Baixo impacto' },
                { id: 'interesse_social', label: 'Interesse social' },
                { id: 'utilidade_publica', label: 'Utilidade pública' },
              ]}
            />
            <PcaTextField form={form} name="listagemA.lavraSubterranea.app.processoFormalizacao" label="Processo de formalização (se aplicável)" />
          </>
        )}
        <PcaTextAreaField form={form} name="listagemA.lavraSubterranea.app.observacoesForaTerreno" label="Intervenções fora do terreno do empreendimento (localização e regularização)" />
      </PcaSectionCard>

      <PcaSectionCard title="13. Supressão de Vegetação">
        <PcaBooleanRadio form={form} name="listagemA.lavraSubterranea.supressaoVegetacao.haveraSupressao" label="Haverá necessidade de supressão de vegetação para implantação/ampliação?" />
        {haSupressao && (
          <>
            <PcaCheckboxOptions
              form={form}
              name="listagemA.lavraSubterranea.supressaoVegetacao.possuiApefDaia"
              options={[
                { id: 'sim_apef_daia', label: 'Sim, possui DAIA ou APEF' },
                { id: 'nao_continuar', label: 'Não, continuar respondendo' },
              ]}
            />
            <PcaTextField form={form} name="listagemA.lavraSubterranea.supressaoVegetacao.numeroApefDaia" label="Número DAIA/APEF" />
            <PcaCheckboxOptions
              form={form}
              name="listagemA.lavraSubterranea.supressaoVegetacao.manifestacaoIbama"
              options={[
                { id: 'sem_supressao_protegida', label: 'Não haverá supressão em bioma protegido' },
                { id: 'secundaria_inicial', label: 'Mata secundária em regeneração inicial (Lei 11.428/2006)' },
                { id: 'area_menor_50ha', label: 'Área menor que 50 ha (Decreto 6660/2008)' },
                { id: 'urbano_menor_3ha', label: 'Área urbana/metropolitana menor que 3 ha' },
                { id: 'manifestacao_solicitada', label: 'Manifestação solicitada (Anexo VIII)' },
                { id: 'possui_manifestacao', label: 'Possui manifestação (Anexo IX)' },
              ]}
            />
            <PcaCheckboxOptions
              form={form}
              name="listagemA.lavraSubterranea.supressaoVegetacao.autorizacaoCodema"
              options={[
                { id: 'zona_rural', label: 'Não – em zona rural' },
                { id: 'sem_codema', label: 'Não – município sem CODEMA deliberativo' },
                { id: 'autorizacao_solicitada', label: 'Não – autorização solicitada (Anexo X)' },
                { id: 'possui_autorizacao', label: 'Sim – possui autorização (Anexo XI)' },
              ]}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <PcaCheckboxOptions
                form={form}
                name="listagemA.lavraSubterranea.supressaoVegetacao.porte"
                options={[
                  { id: 'arboreo', label: 'Arbóreo' },
                  { id: 'arbustivo', label: 'Arbustivo' },
                  { id: 'herbaceo', label: 'Herbáceo' },
                ]}
              />
              <PcaNumField form={form} name="listagemA.lavraSubterranea.supressaoVegetacao.areaNativaHa" label="Área nativa (ha)" />
              <PcaNumField form={form} name="listagemA.lavraSubterranea.supressaoVegetacao.areaPlantadaHa" label="Área plantada (ha)" />
              <PcaNumField form={form} name="listagemA.lavraSubterranea.supressaoVegetacao.areaMistaHa" label="Área mista (ha)" />
              <PcaNumField form={form} name="listagemA.lavraSubterranea.supressaoVegetacao.arvoresIsoladas" label="Árvores isoladas" />
            </div>
            <FormDescription>
              Para Mata Atlântica e biomas protegidos, apresentar estudo de opções locacionais no Anexo XII.
            </FormDescription>
          </>
        )}
      </PcaSectionCard>

      <PcaSectionCard title="17. Usos anteriores do terreno">
        <PcaBooleanRadio form={form} name="listagemA.lavraSubterranea.usosAnteriores.houveUsoAntropico" label="Houve uso antrópico anterior?" />
        <PcaBooleanRadio form={form} name="listagemA.lavraSubterranea.usosAnteriores.indicioPassivo" label="Os usos anteriores podem indicar passivos ambientais?" />
        <PcaTextAreaField form={form} name="listagemA.lavraSubterranea.usosAnteriores.descricao" label="Descrever usos anteriores" />
      </PcaSectionCard>

      <PcaSectionCard title="18–19. Croqui de acesso e justificativas">
        <p className="text-sm text-muted-foreground">
          Anexo XXIII – croqui de acesso. Anexos XXIV a XXVII – justificativas tecnológicas, socioeconômicas, ambientais e locacionais.
        </p>
        <PcaTextField form={form} name="listagemA.lavraSubterranea.croquiAcesso.referencia" label="Ponto de referência urbana para o croqui" />
        <PcaTextField form={form} name="listagemA.lavraSubterranea.justificativas.resumo" label="Resumo das justificativas (detalhar nos anexos)" className="md:col-span-2" />
      </PcaSectionCard>

      <PcaSectionCard title="23. Capacidade de produção">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PcaNumField form={form} name="listagemA.lavraSubterranea.capacidadeProducao.movimentacaoBrutaRom" label="Movimentação bruta (ROM) t/m³" />
          <PcaNumField form={form} name="listagemA.lavraSubterranea.capacidadeProducao.recuperacaoLavraPercent" label="Recuperação na lavra (%)" />
          <PcaNumField form={form} name="listagemA.lavraSubterranea.capacidadeProducao.capacidadeNominalInstalada" label="Capacidade nominal instalada" />
          <PcaNumField form={form} name="listagemA.lavraSubterranea.capacidadeProducao.percentualExtracao" label="% de extração" />
          <PcaNumField form={form} name="listagemA.lavraSubterranea.capacidadeProducao.reservaMineral" label="Reserva mineral" />
          <PcaNumField form={form} name="listagemA.lavraSubterranea.capacidadeProducao.vidaUtilJazidaAnos" label="Vida útil da jazida (anos)" />
          <PcaNumField form={form} name="listagemA.lavraSubterranea.capacidadeProducao.avancoAnualLavraHa" label="Avanço anual de lavra (ha)" />
        </div>
        <PcaTextField form={form} name="listagemA.lavraSubterranea.capacidadeProducao.produtoPrincipal" label="Produto(s) principal(is) – produção líquida mensal" />
        <PcaTextField form={form} name="listagemA.lavraSubterranea.capacidadeProducao.subprodutos" label="Subproduto(s) – produção líquida mensal" />
      </PcaSectionCard>

      <PcaSectionCard title="Corpos hídricos superficiais e usos na área de influência">
        {corposHidricos.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-3">
            <PcaTextField form={form} name={`listagemA.lavraSubterranea.corposHidricosSuperficiais.${index}.nome`} label="Nome" />
            <PcaNumField form={form} name={`listagemA.lavraSubterranea.corposHidricosSuperficiais.${index}.menorDistanciaM`} label="Menor distância (m)" />
            <div className="flex items-end justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeCorpo(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendCorpo({ nome: '', menorDistanciaM: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar corpo hídrico
        </Button>
        <PcaBooleanRadio form={form} name="listagemA.lavraSubterranea.receptorEfluente" label="Algum corpo hídrico é ou será receptor de efluente industrial/sanitário?" />
        <PcaTextField form={form} name="listagemA.lavraSubterranea.receptorEfluenteNomes" label="Nome(s) e classe de enquadramento (DN COPAM/CERH 01/2008)" />
        {usosCorpoHidrico.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
            <PcaTextField form={form} name={`listagemA.lavraSubterranea.usosCorpoHidrico.${index}.tipoUso`} label="Tipo de uso" />
            <PcaNumField form={form} name={`listagemA.lavraSubterranea.usosCorpoHidrico.${index}.distanciaMontanteM`} label="A montante (m)" />
            <PcaNumField form={form} name={`listagemA.lavraSubterranea.usosCorpoHidrico.${index}.distanciaJusanteM`} label="A jusante (m)" />
            <div className="flex items-end justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeUso(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendUso({ tipoUso: '', distanciaMontanteM: '', distanciaJusanteM: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar uso do corpo hídrico
        </Button>
      </PcaSectionCard>

      <PcaSectionCard title="26. Acessos (detalhamento – lavra subterrânea)">
        <PcaBooleanRadio form={form} name="listagemA.lavraSubterranea.acessos.necessitaAbrir" label="Será necessário abrir acessos?" />
        <PcaBooleanRadio form={form} name="listagemA.lavraSubterranea.acessos.necessitaSupressao" label="Haverá supressão de vegetação para abertura dos acessos?" />
        {acessos.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
            <PcaTextField form={form} name={`listagemA.lavraSubterranea.acessos.itens.${index}.idAcesso`} label="ID acesso" />
            <PcaNumField form={form} name={`listagemA.lavraSubterranea.acessos.itens.${index}.extensaoKm`} label="Extensão (km)" />
            <PcaTextField form={form} name={`listagemA.lavraSubterranea.acessos.itens.${index}.pavimentacao`} label="Pavimentação" />
            <PcaTextField form={form} name={`listagemA.lavraSubterranea.acessos.itens.${index}.controleEmissoes`} label="Controle de emissões" />
            <FormField
              control={form.control}
              name={`listagemA.lavraSubterranea.acessos.itens.${index}.controleErosoes`}
              render={({ field }) => (
                <FormItem className="md:col-span-4">
                  <FormLabel>Controle de erosões</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="md:col-span-4 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeAcesso(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendAcesso({ idAcesso: '', extensaoKm: '', pavimentacao: '', controleEmissoes: '', controleErosoes: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar acesso
        </Button>
        <FormDescription>Anexos XXXI a XXXIII – drenagem, manutenção de estradas e planta dos acessos.</FormDescription>
      </PcaSectionCard>
    </div>
  );
}
