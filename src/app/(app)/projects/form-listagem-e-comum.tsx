'use client';

import * as React from 'react';
import { useFieldArray } from 'react-hook-form';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { FormListagemEEspecifico } from './form-listagem-e-especifico';
import { FormListagemEEmpreendedor } from './form-listagem-e-empreendedor';
import { FormListagemEGeoTrecho } from './form-listagem-e-geo-trecho';
import { FormListagemESecao6 } from './form-listagem-e-secao6';
import { BooleanRadio } from './form-listagem-a-helpers';

interface FormListagemEComumProps {
  form: any;
}

export function FormListagemEDutosGasodutos({ form }: FormListagemEComumProps) {
  const faseLicenciamento = form.watch('listagemE.regularizacaoAmbiental.fase');
  const isAmpliacao = form.watch('listagemE.regularizacaoAmbiental.ampliacaoEmpreendimentoLicenciado');

  const { fields: outrasAtividadesFields, append: appendOutrasAtividades, remove: removeOutrasAtividades } =
    useFieldArray({ control: form.control, name: 'listagemE.outrasAtividades' });
  return (
    <div className="space-y-6">
      <FormListagemEEmpreendedor form={form} />
      <div className="space-y-4 rounded-md border p-4">
        <h3 className="text-lg font-medium">2. Identificação do Empreendimento</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField control={form.control} name="propertyName" render={({ field }) => (<FormItem><FormLabel>Nome / Razão social</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
          <FormField control={form.control} name="incraCode" render={({ field }) => (<FormItem><FormLabel>Inscrição no INCRA</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="fantasyName" render={({ field }) => (<FormItem><FormLabel>Nome fantasia</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="cnpj" render={({ field }) => (<FormItem><FormLabel>CNPJ</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
        </div>

        <FormField
          control={form.control}
          name="zoneType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Zona Rural?</FormLabel>
              <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4">
                <FormItem className="flex items-center gap-2"><FormControl><RadioGroupItem value="Rural" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                <FormItem className="flex items-center gap-2"><FormControl><RadioGroupItem value="Urbana" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
              </RadioGroup>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <FormField control={form.control} name="address" render={({ field }) => (<FormItem className="md:col-span-3"><FormLabel>Endereço</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="caixaPostal" render={({ field }) => (<FormItem><FormLabel>Caixa postal</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="municipio" render={({ field }) => (<FormItem><FormLabel>Município</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="district" render={({ field }) => (<FormItem><FormLabel>Distrito ou localidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="uf" render={({ field }) => (<FormItem><FormLabel>UF</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="cep" render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField control={form.control} name="inscricaoEstadual" render={({ field }) => (<FormItem><FormLabel>Inscrição estadual</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="inscricaoMunicipal" render={({ field }) => (<FormItem><FormLabel>Inscrição municipal</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
        </div>

        <FormField
          control={form.control}
          name="correspondenceIsSame"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dados de correspondência são os mesmos do empreendimento?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {!form.watch('correspondenceIsSame') && (
          <div className="grid grid-cols-1 gap-4 rounded-md border p-3 md:grid-cols-4">
            <FormField control={form.control} name="correspondenceAddress" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Endereço para correspondência</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="correspondenceCaixaPostal" render={({ field }) => (<FormItem><FormLabel>Caixa postal</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="correspondenceMunicipio" render={({ field }) => (<FormItem><FormLabel>Município</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="correspondenceUf" render={({ field }) => (<FormItem><FormLabel>UF</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="correspondenceCep" render={({ field }) => (<FormItem><FormLabel>CEP</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          </div>
        )}
      </div>

      <FormListagemEGeoTrecho form={form} />

      <FormListagemESecao6 form={form} />

<div className="space-y-4 rounded-md border p-4">
        <h3 className="text-lg font-medium">7. Outras Atividades no Empreendimento</h3>
        {outrasAtividadesFields.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-5">
            <FormField control={form.control} name={`listagemE.outrasAtividades.${index}.atividade`} render={({ field }) => (<FormItem><FormLabel>Especificar atividades</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemE.outrasAtividades.${index}.codigo`} render={({ field }) => (<FormItem><FormLabel>Código DN-217/2017</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemE.outrasAtividades.${index}.parametroUnidade`} render={({ field }) => (<FormItem><FormLabel>Parâmetro/Unidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemE.outrasAtividades.${index}.quantidade`} render={({ field }) => (<FormItem><FormLabel>Quantidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemE.outrasAtividades.${index}.inicioAtividade`} render={({ field }) => (<FormItem><FormLabel>Início da atividade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <div className="md:col-span-5 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeOutrasAtividades(index)}><Trash2 className="mr-2 h-4 w-4" />Remover</Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendOutrasAtividades({ atividade: '', codigo: '', parametroUnidade: '', quantidade: '', inicioAtividade: '' })}><PlusCircle className="mr-2 h-4 w-4" />Adicionar outra atividade</Button>
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <h3 className="text-lg font-medium">8. Fase da Regularização Ambiental</h3>
        <FormField
          control={form.control}
          name="listagemE.regularizacaoAmbiental.fase"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Situação do empreendimento</FormLabel>
              <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 gap-2">
                {['LP', 'LI', 'LIC', 'LP+LI', 'LO', 'LOC'].map((fase) => (
                  <FormItem key={fase} className="flex items-center gap-2">
                    <FormControl><RadioGroupItem value={fase} /></FormControl>
                    <FormLabel className="font-normal">Fase de licença {fase}</FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormItem>
          )}
        />
        <FormField control={form.control} name="listagemE.regularizacaoAmbiental.classe" render={({ field }) => (<FormItem><FormLabel>Classe</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
        <FormField
          control={form.control}
          name="listagemE.regularizacaoAmbiental.ampliacaoEmpreendimentoLicenciado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trata-se de licença para ampliação/modificação de empreendimento já licenciado?</FormLabel>
              <FormControl><BooleanRadio value={field.value} onChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
        {isAmpliacao && (
          <div className="grid grid-cols-1 gap-4 rounded-md border p-3 md:grid-cols-2">
            <FormField control={form.control} name="listagemE.regularizacaoAmbiental.processoUltimaLicenca" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Nº do processo da última licença</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="listagemE.regularizacaoAmbiental.capacidadeAntes" render={({ field }) => (<FormItem><FormLabel>Capacidade antes (t/dia)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="listagemE.regularizacaoAmbiental.capacidadeDepois" render={({ field }) => (<FormItem><FormLabel>Capacidade prevista após ampliação (t/dia)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="listagemE.regularizacaoAmbiental.empregadosAntes" render={({ field }) => (<FormItem><FormLabel>Empregados antes</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="listagemE.regularizacaoAmbiental.empregadosDepois" render={({ field }) => (<FormItem><FormLabel>Empregados previstos após ampliação</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="listagemE.regularizacaoAmbiental.areaUtilAntes" render={({ field }) => (<FormItem><FormLabel>Área útil antes (ha)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="listagemE.regularizacaoAmbiental.areaUtilDepois" render={({ field }) => (<FormItem><FormLabel>Área útil prevista após ampliação (ha)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          </div>
        )}
      </div>

      <FormListagemEEspecifico form={form} />

      {faseLicenciamento === 'LO' || faseLicenciamento === 'LOC' ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Para fase operacional (LO/LOC), revisar efluentes, emissões e resíduos (itens 27 a 29) e demais anexos do RCA.
        </div>
      ) : null}
    </div>
  );
}
