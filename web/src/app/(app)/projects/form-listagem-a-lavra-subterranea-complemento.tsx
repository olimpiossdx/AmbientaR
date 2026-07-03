'use client';

import * as React from 'react';
import { useFieldArray } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { BooleanRadio, CheckboxOptions, NumField, SectionCard, TextField } from './form-listagem-a-helpers';

export function FormListagemALavraSubterraneaComplemento({ form }: { form: any }) {
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
      <SectionCard title="12. Intervenção em Áreas de Preservação Permanente – APP">
        <FormField
          control={form.control}
          name="listagemA.lavraSubterranea.app.intervencaoPassada"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O empreendimento já fez intervenção em APP?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {intervencaoAppPassada && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <CheckboxOptions
              form={form}
              name="listagemA.lavraSubterranea.app.intervencaoPassadaPeriodo"
              options={[
                { id: 'antes_2002', label: 'Antes de 19/06/2002' },
                { id: 'apos_2002', label: 'Após 19/06/2002 (Lei 14.309)' },
              ]}
            />
            <TextField form={form} name="listagemA.lavraSubterranea.app.processoApefDaia" label="Processo APEF ou DAIA Nº" />
          </div>
        )}
        <FormField
          control={form.control}
          name="listagemA.lavraSubterranea.app.intervencaoFutura"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O empreendimento fará intervenção em APP?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {intervencaoAppFutura && (
          <>
            <CheckboxOptions
              form={form}
              name="listagemA.lavraSubterranea.app.naturezaIntervencao"
              options={[
                { id: 'baixo_impacto', label: 'Baixo impacto' },
                { id: 'interesse_social', label: 'Interesse social' },
                { id: 'utilidade_publica', label: 'Utilidade pública' },
              ]}
            />
            <TextField form={form} name="listagemA.lavraSubterranea.app.processoFormalizacao" label="Processo de formalização (se aplicável)" />
          </>
        )}
        <FormField
          control={form.control}
          name="listagemA.lavraSubterranea.app.observacoesForaTerreno"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Intervenções fora do terreno do empreendimento (localização e regularização)</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title="13. Supressão de Vegetação">
        <FormField
          control={form.control}
          name="listagemA.lavraSubterranea.supressaoVegetacao.haveraSupressao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Haverá necessidade de supressão de vegetação para implantação/ampliação?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {haSupressao && (
          <>
            <CheckboxOptions
              form={form}
              name="listagemA.lavraSubterranea.supressaoVegetacao.possuiApefDaia"
              options={[
                { id: 'sim_apef_daia', label: 'Sim, possui DAIA ou APEF' },
                { id: 'nao_continuar', label: 'Não, continuar respondendo' },
              ]}
            />
            <TextField form={form} name="listagemA.lavraSubterranea.supressaoVegetacao.numeroApefDaia" label="Número DAIA/APEF" />
            <CheckboxOptions
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
            <CheckboxOptions
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
              <CheckboxOptions
                form={form}
                name="listagemA.lavraSubterranea.supressaoVegetacao.porte"
                options={[
                  { id: 'arboreo', label: 'Arbóreo' },
                  { id: 'arbustivo', label: 'Arbustivo' },
                  { id: 'herbaceo', label: 'Herbáceo' },
                ]}
              />
              <NumField form={form} name="listagemA.lavraSubterranea.supressaoVegetacao.areaNativaHa" label="Área nativa (ha)" />
              <NumField form={form} name="listagemA.lavraSubterranea.supressaoVegetacao.areaPlantadaHa" label="Área plantada (ha)" />
              <NumField form={form} name="listagemA.lavraSubterranea.supressaoVegetacao.areaMistaHa" label="Área mista (ha)" />
              <NumField form={form} name="listagemA.lavraSubterranea.supressaoVegetacao.arvoresIsoladas" label="Árvores isoladas" />
            </div>
            <FormDescription>
              Para Mata Atlântica e biomas protegidos, apresentar estudo de opções locacionais no Anexo XII.
            </FormDescription>
          </>
        )}
      </SectionCard>

      <SectionCard title="17. Usos anteriores do terreno">
        <FormField
          control={form.control}
          name="listagemA.lavraSubterranea.usosAnteriores.houveUsoAntropico"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Houve uso antrópico anterior?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="listagemA.lavraSubterranea.usosAnteriores.indicioPassivo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Os usos anteriores podem indicar passivos ambientais?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="listagemA.lavraSubterranea.usosAnteriores.descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrever usos anteriores</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title="18–19. Croqui de acesso e justificativas">
        <p className="text-sm text-muted-foreground">
          Anexo XXIII – croqui de acesso. Anexos XXIV a XXVII – justificativas tecnológicas, socioeconômicas, ambientais e locacionais.
        </p>
        <TextField form={form} name="listagemA.lavraSubterranea.croquiAcesso.referencia" label="Ponto de referência urbana para o croqui" />
        <TextField form={form} name="listagemA.lavraSubterranea.justificativas.resumo" label="Resumo das justificativas (detalhar nos anexos)" className="md:col-span-2" />
      </SectionCard>

      <SectionCard title="23. Capacidade de produção">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NumField form={form} name="listagemA.lavraSubterranea.capacidadeProducao.movimentacaoBrutaRom" label="Movimentação bruta (ROM) t/m³" />
          <NumField form={form} name="listagemA.lavraSubterranea.capacidadeProducao.recuperacaoLavraPercent" label="Recuperação na lavra (%)" />
          <NumField form={form} name="listagemA.lavraSubterranea.capacidadeProducao.capacidadeNominalInstalada" label="Capacidade nominal instalada" />
          <NumField form={form} name="listagemA.lavraSubterranea.capacidadeProducao.percentualExtracao" label="% de extração" />
          <NumField form={form} name="listagemA.lavraSubterranea.capacidadeProducao.reservaMineral" label="Reserva mineral" />
          <NumField form={form} name="listagemA.lavraSubterranea.capacidadeProducao.vidaUtilJazidaAnos" label="Vida útil da jazida (anos)" />
          <NumField form={form} name="listagemA.lavraSubterranea.capacidadeProducao.avancoAnualLavraHa" label="Avanço anual de lavra (ha)" />
        </div>
        <TextField form={form} name="listagemA.lavraSubterranea.capacidadeProducao.produtoPrincipal" label="Produto(s) principal(is) – produção líquida mensal" />
        <TextField form={form} name="listagemA.lavraSubterranea.capacidadeProducao.subprodutos" label="Subproduto(s) – produção líquida mensal" />
      </SectionCard>

      <SectionCard title="Corpos hídricos superficiais e usos na área de influência">
        {corposHidricos.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-3">
            <TextField form={form} name={`listagemA.lavraSubterranea.corposHidricosSuperficiais.${index}.nome`} label="Nome" />
            <NumField form={form} name={`listagemA.lavraSubterranea.corposHidricosSuperficiais.${index}.menorDistanciaM`} label="Menor distância (m)" />
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
        <FormField
          control={form.control}
          name="listagemA.lavraSubterranea.receptorEfluente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Algum corpo hídrico é ou será receptor de efluente industrial/sanitário?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <TextField form={form} name="listagemA.lavraSubterranea.receptorEfluenteNomes" label="Nome(s) e classe de enquadramento (DN COPAM/CERH 01/2008)" />
        {usosCorpoHidrico.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
            <TextField form={form} name={`listagemA.lavraSubterranea.usosCorpoHidrico.${index}.tipoUso`} label="Tipo de uso" />
            <NumField form={form} name={`listagemA.lavraSubterranea.usosCorpoHidrico.${index}.distanciaMontanteM`} label="A montante (m)" />
            <NumField form={form} name={`listagemA.lavraSubterranea.usosCorpoHidrico.${index}.distanciaJusanteM`} label="A jusante (m)" />
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
      </SectionCard>

      <SectionCard title="26. Acessos (detalhamento – lavra subterrânea)">
        <FormField
          control={form.control}
          name="listagemA.lavraSubterranea.acessos.necessitaAbrir"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Será necessário abrir acessos?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="listagemA.lavraSubterranea.acessos.necessitaSupressao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Haverá supressão de vegetação para abertura dos acessos?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {acessos.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
            <TextField form={form} name={`listagemA.lavraSubterranea.acessos.itens.${index}.idAcesso`} label="ID acesso" />
            <NumField form={form} name={`listagemA.lavraSubterranea.acessos.itens.${index}.extensaoKm`} label="Extensão (km)" />
            <TextField form={form} name={`listagemA.lavraSubterranea.acessos.itens.${index}.pavimentacao`} label="Pavimentação" />
            <TextField form={form} name={`listagemA.lavraSubterranea.acessos.itens.${index}.controleEmissoes`} label="Controle de emissões" />
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
      </SectionCard>
    </div>
  );
}
