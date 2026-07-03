'use client';

import { useFieldArray } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { BooleanRadio, CheckboxOptions, NumField, SectionCard, TextField } from './form-listagem-a-helpers';

const ocupacaoEntornoC = [
  'Lavouras ou pastagens',
  'Residências',
  'Comércio',
  'Indústrias',
  'Escolas ou creche',
  'Hospitais ou centros de saúde',
  'Instalações agropecuárias',
  'Área com atividades de mineração',
  'Posto de combustível',
  'Depósito de GLP',
  'Vias públicas e passeios',
  'Interferência com dispositivos de drenagem',
  'Interferência com redes de outras concessionárias',
  'Loteamentos / expansão urbana',
  'Centro de recreação',
  'Rodovia ou ferrovia',
  'Recurso hídrico (lago, lagoa, córrego, rio, nascente)',
  'Outras',
];

const usosCorpoHidrico = [
  'Captação para uso no próprio empreendimento',
  'Captação para abastecimento público',
  'Captação para uso industrial (terceiros)',
  'Captação para irrigação (terceiros)',
  'Captação para piscicultura (terceiros)',
  'Lançamento de efluentes (terceiros)',
  'Lançamento de esgotos (terceiros)',
  'Barragem',
  'Outros usos',
];

function slugify(text: string) {
  return text.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase().slice(0, 48);
}

export function FormListagemCModulo4Complemento({ form }: { form: any }) {
  const programaParceria = form.watch('listagemC.relacionamentoComunidade.desenvolvePrograma');
  const usosAnteriores = form.watch('listagemC.usosAnteriores.comUsosAnteriores');
  const indicamPassivos = form.watch('listagemC.usosAnteriores.indicamPassivos');
  const receptorEfluente = form.watch('listagemC.recursosHidricos.corpoReceptorEfluente');

  const { fields: corposHidricos, append: appendCorpo, remove: removeCorpo } = useFieldArray({
    control: form.control,
    name: 'listagemC.recursosHidricos.corposSuperficiais',
  });

  return (
    <div className="space-y-6">
      <SectionCard title="15. Relacionamento da empresa com a comunidade">
        <CheckboxOptions
          form={form}
          name="listagemC.relacionamentoComunidade.situacao"
          options={[
            { id: 'nao_informou', label: 'A empresa ainda não informou a comunidade (LP/LI)' },
            { id: 'sem_rejeicao', label: 'A comunidade não apresenta rejeição (LP/LI)' },
            { id: 'com_rejeicao', label: 'A comunidade ou parte dela apresenta rejeição (LP/LI)' },
            { id: 'operacao_sem_reclamacoes', label: 'Em operação e sem conhecimento de reclamações' },
          ]}
        />
        <FormField
          control={form.control}
          name="listagemC.relacionamentoComunidade.registrosReclamacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Existem registros de reclamações da comunidade?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>Se sim, apresentar no Anexo XIX.</FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="listagemC.relacionamentoComunidade.possuiTac"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Possui TAC firmado com alguma instituição?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch('listagemC.relacionamentoComunidade.possuiTac') && (
          <TextField form={form} name="listagemC.relacionamentoComunidade.instituicaoTac" label="Instituição (Anexo XX)" />
        )}
        <FormField
          control={form.control}
          name="listagemC.relacionamentoComunidade.outrasInformacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Outras informações sobre o relacionamento com a comunidade</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="listagemC.relacionamentoComunidade.desenvolvePrograma"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Desenvolve ou pretende desenvolver programa em benefício da comunidade?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {programaParceria && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField form={form} name="listagemC.relacionamentoComunidade.nomePrograma" label="Qual é o programa?" />
            <TextField form={form} name="listagemC.relacionamentoComunidade.tempoPrograma" label="Há quanto tempo / a partir de quando" />
          </div>
        )}
      </SectionCard>

      <SectionCard title="17. Tipo de ocupação da área de entorno">
        <FormDescription>Indicar distância aproximada (m) dos limites do terreno.</FormDescription>
        {ocupacaoEntornoC.map((label) => {
          const slug = slugify(label);
          return (
            <div key={slug} className="mb-2 grid grid-cols-1 gap-2 rounded-md border p-2 md:grid-cols-3">
              <p className="text-sm md:col-span-2">{label}</p>
              <NumField form={form} name={`listagemC.ocupacaoEntorno.itens.${slug}.distanciaM`} label="Distância (m)" />
            </div>
          );
        })}
        <FormField
          control={form.control}
          name="listagemC.ocupacaoEntorno.observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações / especificações (rodovia, recurso hídrico etc.)</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title="17 (cont.) Recursos hídricos no entorno">
        <FormDescription>Corpos hídricos superficiais e usos na área de influência.</FormDescription>
        {corposHidricos.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-3">
            <TextField form={form} name={`listagemC.recursosHidricos.corposSuperficiais.${index}.nome`} label="Nome do corpo hídrico" />
            <NumField form={form} name={`listagemC.recursosHidricos.corposSuperficiais.${index}.menorDistanciaM`} label="Menor distância (m)" />
            <div className="flex items-end justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeCorpo(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendCorpo({})}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar corpo hídrico
        </Button>
        <FormField
          control={form.control}
          name="listagemC.recursosHidricos.corpoReceptorEfluente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Algum corpo hídrico é ou será receptor de efluente industrial e/ou esgoto?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {receptorEfluente && (
          <TextField
            form={form}
            name="listagemC.recursosHidricos.receptoresDescricao"
            label="Nomes e classe de enquadramento (DN COPAM/CERH 01/2008)"
          />
        )}
        {usosCorpoHidrico.map((uso) => {
          const slug = slugify(uso);
          return (
            <div key={slug} className="grid grid-cols-1 gap-2 rounded-md border p-2 md:grid-cols-3">
              <p className="text-sm md:col-span-3">{uso}</p>
              <NumField form={form} name={`listagemC.recursosHidricos.usosCorpo.${slug}.montanteM`} label="A montante (m)" />
              <NumField form={form} name={`listagemC.recursosHidricos.usosCorpo.${slug}.jusanteM`} label="A jusante (m)" />
            </div>
          );
        })}
        <FormDescription>Planta georreferenciada dos corpos hídricos: Anexo XXIV.</FormDescription>
      </SectionCard>

      <SectionCard title="18. Usos anteriores do terreno">
        <FormField
          control={form.control}
          name="listagemC.usosAnteriores.comUsosAnteriores"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O local trata-se de área com usos antrópicos anteriores?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {usosAnteriores && (
          <>
            <FormField
              control={form.control}
              name="listagemC.usosAnteriores.indicamPassivos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Esses usos podem indicar passivos ambientais?</FormLabel>
                  <FormControl>
                    <BooleanRadio value={field.value} onChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="listagemC.usosAnteriores.descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Informar usos anteriores{indicamPassivos ? ' e passivos' : ''}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}
      </SectionCard>

      <SectionCard title="19 e 20. Croqui de acesso e justificativas">
        <FormDescription>
          Anexo XXV – croqui de acesso; Anexos XXVI a XXIX – justificativas tecnológica, socioeconômica, ambiental e
          locacional.
        </FormDescription>
        <TextField form={form} name="listagemC.anexosJustificativas.referenciaCroqui" label="Referência ao croqui (Anexo XXV)" />
        <TextField form={form} name="listagemC.anexosJustificativas.referenciaJustificativas" label="Referência às justificativas (Anexos XXVI–XXIX)" />
      </SectionCard>
    </div>
  );
}
