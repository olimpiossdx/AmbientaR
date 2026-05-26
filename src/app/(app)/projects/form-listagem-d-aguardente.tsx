'use client';

import * as React from 'react';
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
import { FormListagemDEspecifico } from './form-listagem-d-especifico';
import { FormListagemDEmpreendedor } from './form-listagem-d-empreendedor';
import { FormListagemDSecao6 } from './form-listagem-d-secao6';
import { FormListagemDAgendas } from './form-listagem-d-agendas';
import { BooleanRadio, TextField } from './form-listagem-a-helpers';

interface FormListagemDAguardenteProps {
  form: any;
}

const datums = ['SAD-69', 'WGS-84', 'Córrego Alegre'] as const;
const fusos = ['22', '23', '24'] as const;
const biomas = ['Cerrado', 'Mata Atlântica', 'Outro'] as const;

export function FormListagemDAguardente({ form }: FormListagemDAguardenteProps) {
  const coordinateFormat = form.watch('geographicLocation.format');
  const faseLicenciamento = form.watch('listagemD.regularizacaoAmbiental.fase');
  const isAmpliacao = form.watch('listagemD.regularizacaoAmbiental.ampliacaoEmpreendimentoLicenciado');

  return (
    <div className="space-y-6">
      <FormListagemDEmpreendedor form={form} />
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

      <FormListagemDSecao6 form={form} />

      <div className="space-y-4 rounded-md border p-4">
        <h3 className="text-lg font-medium">7. Fase da regularização ambiental</h3>
        <FormField
          control={form.control}
          name="listagemD.regularizacaoAmbiental.ampliacaoEmpreendimentoLicenciado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>A licença é para ampliação ou modificação de empreendimento já licenciado?</FormLabel>
              <FormControl><BooleanRadio value={field.value} onChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
        {isAmpliacao && (
          <TextField form={form} name="listagemD.regularizacaoAmbiental.processoUltimaLicenca" label="Nº do processo" />
        )}
        <FormField
          control={form.control}
          name="listagemD.regularizacaoAmbiental.fase"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fase de licenciamento</FormLabel>
              <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 gap-2">
                {['LI', 'LIC', 'LP+LI', 'LOC'].map((fase) => (
                  <FormItem key={fase} className="flex items-center gap-2">
                    <FormControl><RadioGroupItem value={fase} /></FormControl>
                    <FormLabel className="font-normal">Fase de licença {fase}</FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormItem>
          )}
        />
        <FormField control={form.control} name="listagemD.regularizacaoAmbiental.classe" render={({ field }) => (<FormItem><FormLabel>Classe *</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
      </div>

      <FormListagemDAgendas form={form} />

      <div className="space-y-4 rounded-md border p-4">
        <h3 className="text-lg font-medium">10. Restrições locacionais</h3>
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
          name="listagemD.restricoesLocacionais.descricaoRemanescenteVegetacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remanescente de formações vegetais nativas</FormLabel>
              <FormControl><Textarea placeholder="Descrever tipologia e contexto" {...field} /></FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="locationalRestrictions.inApp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O empreendimento está localizado em APP?</FormLabel>
              <FormControl><BooleanRadio value={field.value} onChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="locationalRestrictions.propertyHasApp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>A propriedade possui APP?</FormLabel>
              <FormControl><BooleanRadio value={field.value} onChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="locationalRestrictions.appPreserved"
          render={({ field }) => (
            <FormItem>
              <FormLabel>A APP se encontra comprovadamente preservada?</FormLabel>
              <FormControl><BooleanRadio value={field.value} onChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="locationalRestrictions.appProtected"
          render={({ field }) => (
            <FormItem>
              <FormLabel>A APP está protegida?</FormLabel>
              <FormControl><BooleanRadio value={field.value} onChange={field.onChange} /></FormControl>
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
        <h3 className="text-lg font-medium">11. Unidades de conservação</h3>
        <FormField
          control={form.control}
          name="conservationUnit.isInConservationUnit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Está em UC, zona de amortecimento ou raio de 10 km?</FormLabel>
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

      <FormListagemDEspecifico form={form} />

      {faseLicenciamento === 'LO' || faseLicenciamento === 'LOC' ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Para fase operacional (LO/LOC), revisar com atenção os blocos de efluentes, emissões e resíduos (itens 29 a 36).
        </div>
      ) : null}
    </div>
  );
}
