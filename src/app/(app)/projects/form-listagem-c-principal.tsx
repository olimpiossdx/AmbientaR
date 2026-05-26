'use client';

import * as React from 'react';
import { useFieldArray } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { FormListagemCEspecifico } from './form-listagem-c-especifico';
import { FormListagemCSecao6 } from './form-listagem-c-secao6';

interface FormListagemCComumProps {
  form: any;
}

const datums = ['SAD-69', 'WGS-84', 'Córrego Alegre'] as const;
const fusos = ['22', '23', '24'] as const;
const biomas = ['Cerrado', 'Mata Atlântica', 'Outro'] as const;
function BooleanRadio({
  value,
  onChange,
}: {
  value: boolean | undefined;
  onChange: (next: boolean) => void;
}) {
  return (
    <RadioGroup
      onValueChange={(v) => onChange(v === 'true')}
      value={value === undefined ? undefined : String(value)}
      className="flex gap-4"
    >
      <FormItem className="flex items-center gap-2">
        <FormControl>
          <RadioGroupItem value="true" />
        </FormControl>
        <FormLabel className="font-normal">Sim</FormLabel>
      </FormItem>
      <FormItem className="flex items-center gap-2">
        <FormControl>
          <RadioGroupItem value="false" />
        </FormControl>
        <FormLabel className="font-normal">Não</FormLabel>
      </FormItem>
    </RadioGroup>
  );
}

export function FormListagemCPrincipal({ form }: FormListagemCComumProps) {
  const coordinateFormat = form.watch('geographicLocation.format');
  const faseLicenciamento = form.watch('listagemC.regularizacaoAmbiental.fase');
  const isAmpliacao = form.watch('listagemC.regularizacaoAmbiental.ampliacaoEmpreendimentoLicenciado');

  const { fields: outrasAtividadesFields, append: appendOutrasAtividades, remove: removeOutrasAtividades } =
    useFieldArray({ control: form.control, name: 'listagemC.outrasAtividades' });
  const { fields: nucleoPopulacionalFields, append: appendNucleoPopulacional, remove: removeNucleoPopulacional } =
    useFieldArray({ control: form.control, name: 'listagemC.legislacaoMunicipal.nucleosPopulacionais' });
  const { fields: ocupacaoEntornoFields, append: appendOcupacaoEntorno, remove: removeOcupacaoEntorno } =
    useFieldArray({ control: form.control, name: 'listagemC.ocupacaoEntorno.ocorrencias' });
  const { fields: recursosHidricosFields, append: appendRecursosHidricos, remove: removeRecursosHidricos } =
    useFieldArray({ control: form.control, name: 'listagemC.recursosHidricos.intervencoes' });
  return (
    <div className="space-y-6">
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

      <div className="space-y-4 rounded-md border p-4">
        <h3 className="text-lg font-medium">5. Localização Geográfica</h3>
        <FormField
          control={form.control}
          name="geographicLocation.datum"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Assinalar Datum (Obrigatório)</FormLabel>
              <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4">
                {datums.map((datum) => (
                  <FormItem key={datum} className="flex items-center gap-2">
                    <FormControl><RadioGroupItem value={datum} /></FormControl>
                    <FormLabel className="font-normal">{datum}</FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="geographicLocation.format"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Formato da coordenada</FormLabel>
              <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4">
                <FormItem className="flex items-center gap-2"><FormControl><RadioGroupItem value="Lat/Long" /></FormControl><FormLabel className="font-normal">Lat/Long</FormLabel></FormItem>
                <FormItem className="flex items-center gap-2"><FormControl><RadioGroupItem value="UTM" /></FormControl><FormLabel className="font-normal">UTM (X,Y)</FormLabel></FormItem>
              </RadioGroup>
            </FormItem>
          )}
        />
        {coordinateFormat === 'Lat/Long' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">Latitude</p>
              <div className="grid grid-cols-3 gap-2">
                <FormField control={form.control} name="geographicLocation.latLong.lat.grau" render={({ field }) => (<FormItem><FormLabel>Grau</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="geographicLocation.latLong.lat.min" render={({ field }) => (<FormItem><FormLabel>Min</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="geographicLocation.latLong.lat.seg" render={({ field }) => (<FormItem><FormLabel>Seg</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
              </div>
            </div>
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">Longitude</p>
              <div className="grid grid-cols-3 gap-2">
                <FormField control={form.control} name="geographicLocation.latLong.long.grau" render={({ field }) => (<FormItem><FormLabel>Grau</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="geographicLocation.latLong.long.min" render={({ field }) => (<FormItem><FormLabel>Min</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                <FormField control={form.control} name="geographicLocation.latLong.long.seg" render={({ field }) => (<FormItem><FormLabel>Seg</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <FormField control={form.control} name="geographicLocation.utm.x" render={({ field }) => (<FormItem><FormLabel>X (6 dígitos)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="geographicLocation.utm.y" render={({ field }) => (<FormItem><FormLabel>Y (7 dígitos)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField
              control={form.control}
              name="geographicLocation.utm.fuso"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fuso</FormLabel>
                  <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                    {fusos.map((fuso) => (
                      <FormItem key={fuso} className="flex items-center gap-2">
                        <FormControl><RadioGroupItem value={fuso} /></FormControl>
                        <FormLabel className="font-normal">{fuso}</FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormItem>
              )}
            />
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField control={form.control} name="geographicLocation.local" render={({ field }) => (<FormItem><FormLabel>Local (fazenda, sítio etc.)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="geographicLocation.municipio" render={({ field }) => (<FormItem><FormLabel>Município(s)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="geographicLocation.additionalLocationInfo" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Referência adicional para localização</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="geographicLocation.hydrographicBasin" render={({ field }) => (<FormItem><FormLabel>Bacia hidrográfica</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="geographicLocation.hydrographicSubBasin" render={({ field }) => (<FormItem><FormLabel>Sub-bacia hidrográfica</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="geographicLocation.upgrh" render={({ field }) => (<FormItem><FormLabel>UPGRH</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="geographicLocation.nearestWaterCourse" render={({ field }) => (<FormItem><FormLabel>Curso d&apos;água mais próximo</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
        </div>
      </div>
      <FormListagemCSecao6 form={form} />

<div className="space-y-4 rounded-md border p-4">
        <h3 className="text-lg font-medium">7. Outras Atividades no Empreendimento</h3>
        {outrasAtividadesFields.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-5">
            <FormField control={form.control} name={`listagemC.outrasAtividades.${index}.atividade`} render={({ field }) => (<FormItem><FormLabel>Especificar atividades</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemC.outrasAtividades.${index}.codigo`} render={({ field }) => (<FormItem><FormLabel>Código DN-217/2017</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemC.outrasAtividades.${index}.parametroUnidade`} render={({ field }) => (<FormItem><FormLabel>Parâmetro/Unidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemC.outrasAtividades.${index}.quantidade`} render={({ field }) => (<FormItem><FormLabel>Quantidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemC.outrasAtividades.${index}.inicioAtividade`} render={({ field }) => (<FormItem><FormLabel>Início da atividade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
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
          name="listagemC.regularizacaoAmbiental.fase"
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
        <FormField control={form.control} name="listagemC.regularizacaoAmbiental.classe" render={({ field }) => (<FormItem><FormLabel>Classe</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
        <FormField
          control={form.control}
          name="listagemC.regularizacaoAmbiental.ampliacaoEmpreendimentoLicenciado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Trata-se de licença para ampliação/modificação de empreendimento já licenciado?</FormLabel>
              <FormControl><BooleanRadio value={field.value} onChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
        {isAmpliacao && (
          <div className="grid grid-cols-1 gap-4 rounded-md border p-3 md:grid-cols-2">
            <FormField control={form.control} name="listagemC.regularizacaoAmbiental.processoUltimaLicenca" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Nº do processo da última licença</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="listagemC.regularizacaoAmbiental.capacidadeAntes" render={({ field }) => (<FormItem><FormLabel>Capacidade antes (t/dia)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="listagemC.regularizacaoAmbiental.capacidadeDepois" render={({ field }) => (<FormItem><FormLabel>Capacidade prevista após ampliação (t/dia)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="listagemC.regularizacaoAmbiental.empregadosAntes" render={({ field }) => (<FormItem><FormLabel>Empregados antes</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="listagemC.regularizacaoAmbiental.empregadosDepois" render={({ field }) => (<FormItem><FormLabel>Empregados previstos após ampliação</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="listagemC.regularizacaoAmbiental.areaUtilAntes" render={({ field }) => (<FormItem><FormLabel>Área útil antes (ha)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="listagemC.regularizacaoAmbiental.areaUtilDepois" render={({ field }) => (<FormItem><FormLabel>Área útil prevista após ampliação (ha)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <h3 className="text-lg font-medium">9. Restrições Locacionais</h3>
        <FormField
          control={form.control}
          name="locationalRestrictions.biome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bioma predominante</FormLabel>
              <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4">
                {biomas.map((bioma) => (
                  <FormItem key={bioma} className="flex items-center gap-2">
                    <FormControl><RadioGroupItem value={bioma} /></FormControl>
                    <FormLabel className="font-normal">{bioma}</FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="listagemC.restricoesLocacionais.descricaoRemanescenteVegetacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remanescente de formações vegetais nativas</FormLabel>
              <FormControl><Textarea placeholder="Descrever tipologia e contexto" {...field} /></FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="locationalRestrictions.inKarstArea"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Localiza-se em área cárstica?</FormLabel>
              <FormControl><BooleanRadio value={field.value} onChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="locationalRestrictions.inFluvialLacustrineArea"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Localiza-se em área fluvial/lacustre?</FormLabel>
              <FormControl><BooleanRadio value={field.value} onChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <h3 className="text-lg font-medium">10. Unidades de Conservação</h3>
        <FormField
          control={form.control}
          name="conservationUnit.isInConservationUnit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Está em UC, zona de amortecimento ou faixa de 3 km?</FormLabel>
              <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                <FormItem className="flex items-center gap-2"><FormControl><RadioGroupItem value="Sim" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                <FormItem className="flex items-center gap-2"><FormControl><RadioGroupItem value="Não" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
              </RadioGroup>
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField control={form.control} name="conservationUnit.distance" render={({ field }) => (<FormItem><FormLabel>Distância</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="conservationUnit.ucName" render={({ field }) => (<FormItem><FormLabel>Nome da UC</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
          <FormField control={form.control} name="conservationUnit.jurisdiction" render={({ field }) => (<FormItem><FormLabel>Jurisdição</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
        </div>
        <FormField control={form.control} name="conservationUnit.managementCategory" render={({ field }) => (<FormItem><FormLabel>Categoria da UC</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
        <FormField control={form.control} name="conservationUnit.managingBody" render={({ field }) => (<FormItem><FormLabel>Informar o órgão gestor</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <h3 className="text-lg font-medium">11 e 12. Reserva Legal e APP</h3>
        <FormField
          control={form.control}
          name="legalReserve.status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reserva legal regularizada?</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 gap-2">
                  <FormItem className="flex items-center gap-2"><FormControl><RadioGroupItem value="NAO_ZONA_RURAL" /></FormControl><FormLabel className="font-normal">Não localizado em zona rural</FormLabel></FormItem>
                  <FormItem className="flex items-center gap-2"><FormControl><RadioGroupItem value="NAO_EM_DEMARCACAO" /></FormControl><FormLabel className="font-normal">Não, em demarcação</FormLabel></FormItem>
                  <FormItem className="flex items-center gap-2"><FormControl><RadioGroupItem value="TERMO_COMPROMISSO" /></FormControl><FormLabel className="font-normal">Não, com termo de compromisso</FormLabel></FormItem>
                  <FormItem className="flex items-center gap-2"><FormControl><RadioGroupItem value="DEMARCADA_AGUARDANDO" /></FormControl><FormLabel className="font-normal">Não, demarcada aguardando averbação</FormLabel></FormItem>
                  <FormItem className="flex items-center gap-2"><FormControl><RadioGroupItem value="AVERBADA" /></FormControl><FormLabel className="font-normal">Sim, averbada</FormLabel></FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
        <FormField control={form.control} name="listagemC.app.existeApp" render={({ field }) => (<FormItem><FormLabel>Existe APP no terreno?</FormLabel><FormControl><BooleanRadio value={field.value} onChange={field.onChange} /></FormControl></FormItem>)} />
        {form.watch('listagemC.app.existeApp') && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField control={form.control} name="listagemC.app.areaHa" render={({ field }) => (<FormItem><FormLabel>Quantificação da área APP (ha)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name="listagemC.app.situacaoCobertura" render={({ field }) => (<FormItem><FormLabel>Situação da cobertura vegetal</FormLabel><FormControl><Input placeholder="Preservada / protegida / outra" {...field} /></FormControl></FormItem>)} />
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <h3 className="text-lg font-medium">14. Intervenção em Recursos Hídricos</h3>
        {recursosHidricosFields.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-6">
            <FormField control={form.control} name={`listagemC.recursosHidricos.intervencoes.${index}.tipo`} render={({ field }) => (<FormItem><FormLabel>Tipo de intervenção</FormLabel><FormControl><Input placeholder="Poço tubular / captação etc." {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemC.recursosHidricos.intervencoes.${index}.volume`} render={({ field }) => (<FormItem><FormLabel>Volume (m3/mês)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemC.recursosHidricos.intervencoes.${index}.outorgada`} render={({ field }) => (<FormItem><FormLabel>Outorgada?</FormLabel><FormControl><Input placeholder="Sim/Não" {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemC.recursosHidricos.intervencoes.${index}.orgao`} render={({ field }) => (<FormItem><FormLabel>Órgão</FormLabel><FormControl><Input placeholder="IGAM/ANA" {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemC.recursosHidricos.intervencoes.${index}.portaria`} render={({ field }) => (<FormItem><FormLabel>Portaria Nº</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemC.recursosHidricos.intervencoes.${index}.processo`} render={({ field }) => (<FormItem><FormLabel>Processo Nº</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <div className="md:col-span-6 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeRecursosHidricos(index)}><Trash2 className="mr-2 h-4 w-4" />Remover</Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendRecursosHidricos({ tipo: '', volume: '', outorgada: '', orgao: '', portaria: '', processo: '' })}><PlusCircle className="mr-2 h-4 w-4" />Adicionar intervenção hídrica</Button>
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <h3 className="text-lg font-medium">15 e 16. Legislação Municipal e Ocupação do Entorno</h3>
        <FormField control={form.control} name="listagemC.legislacaoMunicipal.temPlanoDiretor" render={({ field }) => (<FormItem><FormLabel>Município tem Plano Diretor / Lei de Uso e Ocupação do Solo?</FormLabel><FormControl><BooleanRadio value={field.value} onChange={field.onChange} /></FormControl></FormItem>)} />
        <FormField control={form.control} name="listagemC.legislacaoMunicipal.interfereNucleosPopulacionais" render={({ field }) => (<FormItem><FormLabel>Interfere com núcleos populacionais?</FormLabel><FormControl><BooleanRadio value={field.value} onChange={field.onChange} /></FormControl></FormItem>)} />
        {nucleoPopulacionalFields.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-5">
            <FormField control={form.control} name={`listagemC.legislacaoMunicipal.nucleosPopulacionais.${index}.nome`} render={({ field }) => (<FormItem><FormLabel>Núcleo populacional</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemC.legislacaoMunicipal.nucleosPopulacionais.${index}.localizacao`} render={({ field }) => (<FormItem><FormLabel>Localização</FormLabel><FormControl><Input placeholder="Urbano/Rural" {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemC.legislacaoMunicipal.nucleosPopulacionais.${index}.distanciaM`} render={({ field }) => (<FormItem><FormLabel>Distância da rede (m)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemC.legislacaoMunicipal.nucleosPopulacionais.${index}.referencia`} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Referência</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <div className="md:col-span-5 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeNucleoPopulacional(index)}><Trash2 className="mr-2 h-4 w-4" />Remover</Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendNucleoPopulacional({ nome: '', localizacao: '', distanciaM: '', referencia: '' })}><PlusCircle className="mr-2 h-4 w-4" />Adicionar núcleo populacional</Button>

        {ocupacaoEntornoFields.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-3">
            <FormField control={form.control} name={`listagemC.ocupacaoEntorno.ocorrencias.${index}.ocorrencia`} render={({ field }) => (<FormItem><FormLabel>Ocorrência</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemC.ocupacaoEntorno.ocorrencias.${index}.distanciaM`} render={({ field }) => (<FormItem><FormLabel>Distância (m)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <div className="flex items-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeOcupacaoEntorno(index)}><Trash2 className="mr-2 h-4 w-4" />Remover</Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendOcupacaoEntorno({ ocorrencia: '', distanciaM: '' })}><PlusCircle className="mr-2 h-4 w-4" />Adicionar ocorrência do entorno</Button>
      </div>
<FormListagemCEspecifico form={form} />

      {faseLicenciamento === 'LO' || faseLicenciamento === 'LOC' ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Para fase operacional (LO/LOC), revisar com atenção os blocos de efluentes, emissões e resíduos (itens 29 a 36).
        </div>
      ) : null}
    </div>
  );
}
