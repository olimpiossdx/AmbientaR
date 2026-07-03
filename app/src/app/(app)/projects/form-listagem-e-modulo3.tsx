'use client';

import { useFieldArray } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import {
  BooleanRadio,
  CheckboxOptions,
  NumField,
  SectionCard,
  TextField,
} from './form-listagem-a-helpers';

const biomas = ['Cerrado', 'Mata Atlântica', 'Outro'] as const;

const formacoesVegetais = [
  'Floresta Ombrófila Sub Montana',
  'Floresta Ombrófila Montana',
  'Floresta Estacional Semidecidual',
  'Campo',
  'Campo Rupestre',
  'Cerrado',
  'Cerradão',
  'Vereda',
  'Outro',
];

const tiposCarstica = [
  { id: 'rocha_carbonatica', label: 'Rocha carbonática' },
  { id: 'dolinas', label: 'Dolinas' },
  { id: 'rios_subterraneos', label: 'Rios subterrâneos' },
  { id: 'sitios_arqueologicos', label: 'Sítios arqueológicos' },
  { id: 'fosseis', label: 'Fósseis' },
  { id: 'cavidade', label: 'Cavidade natural subterrânea' },
];

const intervencoesAgua = [
  { id: 'poco_tubular', label: 'Captação em poço tubular' },
  { id: 'cisterna', label: 'Captação em cisterna ou poço manual' },
  { id: 'rebaixamento', label: 'Rebaixamento do lençol freático' },
  { id: 'barramento', label: 'Captação em barramento' },
  { id: 'nascente', label: 'Captação em nascente' },
  { id: 'curso_superficial', label: "Captação/derivação em curso d'água superficial" },
  { id: 'lancamento_efluente', label: 'Lançamento de efluente em corpo dágua' },
  { id: 'pontes', label: 'Intervenções – Pontes' },
  { id: 'bueiros', label: 'Intervenções – Bueiros' },
  { id: 'drenos', label: 'Intervenções – Drenos' },
  { id: 'outras', label: 'Outras captações/intervenções' },
];

function OutorgaIntervencao({ form, basePath }: { form: any; basePath: string }) {
  return (
    <div className="mt-2 grid grid-cols-1 gap-2 md:grid-cols-3">
      <NumField form={form} name={`${basePath}.volumeM3Mes`} label="Volume (m³/mês)" />
      <TextField form={form} name={`${basePath}.portaria`} label="Portaria Nº (IGAM/ANA)" />
      <TextField form={form} name={`${basePath}.processo`} label="Processo Nº" />
      <FormField
        control={form.control}
        name={`${basePath}.situacaoOutorga`}
        render={({ field }) => (
          <FormItem className="md:col-span-3">
            <FormLabel>Situação da outorga</FormLabel>
            <FormControl>
              <Input placeholder="Outorgada / em formalização / com licenciamento" {...field} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}

export function FormListagemEModulo3({ form }: { form: any }) {
  const haSupressao = form.watch('listagemE.supressaoVegetacao.necessaria');
  const intervencaoCursos = form.watch('listagemE.recursosHidricos.intervencaoCursosAgua');

  const { fields: corposAgua, append: appendCorpo, remove: removeCorpo } = useFieldArray({
    control: form.control,
    name: 'listagemE.recursosHidricos.corposSuperficiais',
  });

  return (
    <div className="space-y-6">
      <SectionCard title="Módulo 3 – Intervenções ambientais">
        <FormDescription>Itens 9 a 14 do RCA – dutos e gasodutos (DN 217/17).</FormDescription>
      </SectionCard>

      <SectionCard title="9. Restrições locacionais">
        <FormField
          control={form.control}
          name="locationalRestrictions.biome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Qual bioma o empreendimento está localizado?</FormLabel>
              <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4">
                {biomas.map((bioma) => (
                  <FormItem key={bioma} className="flex items-center gap-2">
                    <FormControl>
                      <RadioGroupItem value={bioma} />
                    </FormControl>
                    <FormLabel className="font-normal">{bioma}</FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormItem>
          )}
        />
        <TextField form={form} name="listagemE.restricoesLocacionais.biomaOutro" label="Outro bioma (qual?)" />
        <FormField
          control={form.control}
          name="listagemE.restricoesLocacionais.remanescenteVegetacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Remanescente de formações vegetais nativas?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch('listagemE.restricoesLocacionais.remanescenteVegetacao') && (
          <CheckboxOptions
            form={form}
            name="listagemE.restricoesLocacionais.tipologiasVegetacao"
            options={formacoesVegetais.map((f) => ({ id: f, label: f }))}
          />
        )}
        <FormField
          control={form.control}
          name="locationalRestrictions.inKarstArea"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Localiza-se em área cárstica?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch('locationalRestrictions.inKarstArea') && (
          <CheckboxOptions form={form} name="listagemE.restricoesLocacionais.tiposCarstica" options={tiposCarstica} />
        )}
        <FormField
          control={form.control}
          name="locationalRestrictions.inFluvialLacustrineArea"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Localiza-se em área fluvial/lacustre?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title="10. Unidades de conservação">
        <FormField
          control={form.control}
          name="conservationUnit.isInConservationUnit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Está em UC, zona de amortecimento ou até 3 km do limite?</FormLabel>
              <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <RadioGroupItem value="Não" />
                  </FormControl>
                  <FormLabel className="font-normal">Não, passar para o item 11</FormLabel>
                </FormItem>
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <RadioGroupItem value="Sim" />
                  </FormControl>
                  <FormLabel className="font-normal">Sim</FormLabel>
                </FormItem>
              </RadioGroup>
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <TextField form={form} name="conservationUnit.distance" label="Distância" />
          <TextField form={form} name="conservationUnit.ucName" label="Nome da UC" />
          <TextField form={form} name="conservationUnit.jurisdiction" label="Jurisdição" />
        </div>
        <TextField form={form} name="conservationUnit.managementCategory" label="Categoria de manejo" />
        <TextField form={form} name="conservationUnit.managingBody" label="Órgão gestor" />
      </SectionCard>

      <SectionCard title="11. Reserva legal">
        <FormField
          control={form.control}
          name="legalReserve.status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Situação da reserva legal</FormLabel>
              <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 gap-2">
                {[
                  { v: 'NAO_ZONA_RURAL', l: 'Não – empreendimento não em zona rural' },
                  { v: 'NAO_EM_DEMARCACAO', l: 'Não – demarcação com este licenciamento' },
                  { v: 'TERMO_COMPROMISSO', l: 'Não – termo de compromisso IEF' },
                  { v: 'DEMARCADA_AGUARDANDO', l: 'Não – demarcada, aguardando averbação' },
                  { v: 'AVERBADA', l: 'Sim – averbada no cartório' },
                ].map((op) => (
                  <FormItem key={op.v} className="flex items-center gap-2">
                    <FormControl>
                      <RadioGroupItem value={op.v} />
                    </FormControl>
                    <FormLabel className="font-normal">{op.l}</FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormItem>
          )}
        />
        <TextField form={form} name="listagemE.reservaLegal.numeroProcesso" label="Nº processo / referência (se aplicável)" />
      </SectionCard>

      <SectionCard title="12. Intervenção em APP">
        <FormField
          control={form.control}
          name="listagemE.app.existeNoTerreno"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Há APP no terreno do empreendimento?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch('listagemE.app.existeNoTerreno') && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <NumField form={form} name="listagemE.app.areaHa" label="Área APP (ha)" />
            <TextField form={form} name="listagemE.app.coberturaVegetal" label="Situação da cobertura vegetal" />
          </div>
        )}
        <TextField
          form={form}
          name="listagemE.app.intervencaoAnterior"
          label="Intervenção anterior em APP (resumo / processo)"
        />
        <TextField
          form={form}
          name="listagemE.app.intervencaoPrevista"
          label="Intervenção prevista em APP (tipo e situação)"
        />
      </SectionCard>

      <SectionCard title="13. Supressão de vegetação">
        <FormField
          control={form.control}
          name="listagemE.supressaoVegetacao.necessaria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Haverá supressão de vegetação?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {haSupressao && (
          <>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <NumField form={form} name="listagemE.supressaoVegetacao.areaNativaHa" label="Nativa (ha)" />
              <NumField form={form} name="listagemE.supressaoVegetacao.areaPlantadaHa" label="Plantada (ha)" />
              <NumField form={form} name="listagemE.supressaoVegetacao.areaMistaHa" label="Mista (ha)" />
              <NumField form={form} name="listagemE.supressaoVegetacao.arvoresIsoladas" label="Árvores isoladas" />
            </div>
            <TextField form={form} name="listagemE.supressaoVegetacao.manifestacaoIbama" label="Manifestação IBAMA / CODEMA (resumo)" />
            <FormField
              control={form.control}
              name="listagemE.supressaoVegetacao.especiesEndemicas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Espécies endêmicas presentes?</FormLabel>
                  <FormControl>
                    <BooleanRadio value={field.value} onChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="listagemE.supressaoVegetacao.especiesAmeacadas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Espécies ameaçadas presentes?</FormLabel>
                  <FormControl>
                    <BooleanRadio value={field.value} onChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}
      </SectionCard>

      <SectionCard title="14. Intervenção em recursos hídricos">
        <FormField
          control={form.control}
          name="listagemE.recursosHidricos.usoConcessionaria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Faz uso de água da concessionária local?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch('listagemE.recursosHidricos.usoConcessionaria') && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField form={form} name="listagemE.recursosHidricos.concessionariaNome" label="Empresa" />
            <NumField form={form} name="listagemE.recursosHidricos.concessionariaVolume" label="Volume (m³/mês)" />
          </div>
        )}
        {intervencoesAgua.map((item) => (
          <div key={item.id} className="mb-4 rounded-md border p-3">
            <FormField
              control={form.control}
              name={`listagemE.recursosHidricos.intervencoes.${item.id}.ativa`}
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={Boolean(field.value)}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">{item.label}</FormLabel>
                </FormItem>
              )}
            />
            {form.watch(`listagemE.recursosHidricos.intervencoes.${item.id}.ativa`) && (
              <OutorgaIntervencao form={form} basePath={`listagemE.recursosHidricos.intervencoes.${item.id}`} />
            )}
          </div>
        ))}
        <FormField
          control={form.control}
          name="listagemE.recursosHidricos.intervencaoCursosAgua"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Intervirá em cursos dágua (bueiros, pontes, drenos etc.)?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {intervencaoCursos && (
          <TextField
            form={form}
            name="listagemE.recursosHidricos.nomesCorposHidricos"
            label="Nome(s) do(s) corpo(s) hídrico(s) da captação/intervenção"
          />
        )}
        <p className="text-sm font-medium">Corpos hídricos superficiais próximos</p>
        {corposAgua.map((row, index) => (
          <div key={row.id} className="mb-2 flex gap-2">
            <TextField form={form} name={`listagemE.recursosHidricos.corposSuperficiais.${index}.nome`} label="Nome" />
            <NumField
              form={form}
              name={`listagemE.recursosHidricos.corposSuperficiais.${index}.distanciaM`}
              label="Menor distância (m)"
            />
            <Button type="button" variant="outline" size="sm" onClick={() => removeCorpo(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendCorpo({})}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar corpo hídrico
        </Button>
        <CheckboxOptions
          form={form}
          name="listagemE.recursosHidricos.classesEnquadramento"
          options={[
            { id: 'especial', label: 'Classe especial' },
            { id: '1', label: 'Classe 1' },
            { id: '2', label: 'Classe 2' },
            { id: '3', label: 'Classe 3' },
            { id: '4', label: 'Classe 4' },
          ]}
        />
      </SectionCard>
    </div>
  );
}
