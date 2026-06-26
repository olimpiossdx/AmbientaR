'use client';

import { useFieldArray } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { BooleanRadio, CheckboxOptions, NumField, SectionCard, TextField } from './form-listagem-a-helpers';

const impactosMeioFisico = [
  'Contaminação do ar',
  'Interferência em sistemas de drenagem',
  'Interferência em redes de utilidades',
  'Compactação do solo',
  'Contaminação de águas superficiais por efluentes',
  'Erosão',
  'Contaminação do solo por óleo/combustíveis',
  'Vazamento de combustíveis armazenados',
  'Vibração',
  'Impermeabilização do solo',
  'Assoreamento de cursos d’água',
  'Contaminação por esgoto',
  'Alteração topográfica e da paisagem',
  'Intervenção em nascentes',
  'Emissão de material particulado',
  'Emissões atmosféricas de equipamentos',
  'Ruído de veículos',
];

const impactosMeioBiotico = [
  'Destruição de habitat e afugentamento da fauna',
  'Fragmentação florestal',
  'Aumento de vetores',
  'Risco de eutrofização',
  'Supressão de vegetação',
  'Intervenção em APP',
];

const impactosMeioSocioeconomico = [
  'Risco iminente de acidentes (explosões e/ou incêndios)',
  'Dificuldade de relacionamento com a população do entorno',
  'Risco à saúde',
  'Geração de empregos',
  'Arrecadação de impostos',
  'Alteração do tráfego local',
  'Conflitos de uso dos recursos naturais',
];

const zeeGeofisico = [
  'Potencialidade social',
  'Vulnerabilidade natural',
  'Disponibilidade natural de água superficial',
  'Disponibilidade natural de água subterrânea',
  'Risco ambiental',
  'Qualidade ambiental',
  'Vulnerabilidade de decomposição de matéria orgânica do solo',
  'Qualidade da água superficial',
  'Susceptibilidade à degradação estrutural do solo',
  'Integridade da flora',
  'Probabilidade de contaminação por uso do solo',
  'Nível de comprometimento dos recursos hídricos superficiais',
  'Erodibilidade',
  'Geologia (mapa simplificado de solos)',
];

export function FormListagemBFundidosImpactos({ form }: { form: any }) {
  const trAbordouTodos = form.watch('listagemB.outrosImpactos.trAbordouTodos');
  const outrosAgentes = form.watch('listagemB.outrosAgentesImpactos.existe');

  const { fields: municipiosZee, append: appendMunicipio, remove: removeMunicipio } = useFieldArray({
    control: form.control,
    name: 'listagemB.zeeSocioeconomico',
  });

  return (
    <div className="space-y-6">
      <SectionCard title="52. Possibilidades de acidentes com danos ambientais">
        <FormDescription>Apresentar descrição das hipóteses de acidentes no Anexo XXXII.</FormDescription>
        <FormField
          control={form.control}
          name="listagemB.acidentesAmbientais.observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações / referência ao anexo</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title="53. Outros agentes causadores de impactos ambientais">
        <FormField
          control={form.control}
          name="listagemB.outrosAgentesImpactos.existe"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Há outros agentes causadores de impactos negativos não abordados nos itens 40 a 49?
              </FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {outrosAgentes && (
          <FormField
            control={form.control}
            name="listagemB.outrosAgentesImpactos.descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrever os agentes e impactos</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </SectionCard>

      <SectionCard title="54. Melhorias significativas">
        <FormField
          control={form.control}
          name="listagemB.melhoriasSignificativas.descricao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Descrever melhorias significativas de processos com impactos ambientais positivos
              </FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title="55. Cronograma de implantação">
        <FormDescription>Apresentar cronograma no Anexo XXXIII.</FormDescription>
        <TextField form={form} name="listagemB.cronogramaImplantacao.referenciaAnexo" label="Referência / observações" />
      </SectionCard>

      <SectionCard title="56 a 58. Possíveis impactos ambientais (Módulo 6)">
        <CheckboxOptions form={form} name="listagemB.impactos.meioFisico" options={impactosMeioFisico.map((i) => ({ id: i, label: i }))} />
        <TextField form={form} name="listagemB.impactos.meioFisicoOutros" label="Meio físico – outros" />
        <CheckboxOptions form={form} name="listagemB.impactos.meioBiotico" options={impactosMeioBiotico.map((i) => ({ id: i, label: i }))} />
        <TextField form={form} name="listagemB.impactos.meioBioticoOutros" label="Meio biótico – outros" />
        <CheckboxOptions form={form} name="listagemB.impactos.meioSocioeconomico" options={impactosMeioSocioeconomico.map((i) => ({ id: i, label: i }))} />
        <TextField form={form} name="listagemB.impactos.meioSocioeconomicoOutros" label="Meio socioeconômico – outros" />
        <FormDescription>Identificação e avaliação detalhada no Anexo XXXIV; medidas mitigadoras no Anexo XXXV.</FormDescription>
      </SectionCard>

      <SectionCard title="59. Outros impactos não abordados no TR">
        <FormField
          control={form.control}
          name="listagemB.outrosImpactos.trAbordouTodos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Este TR abordou todos os possíveis impactos ambientais negativos?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {trAbordouTodos === false && (
          <FormField
            control={form.control}
            name="listagemB.outrosImpactos.descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Impactos positivos e negativos não abordados</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </SectionCard>

      <SectionCard title="61. Componente geofísico e biótico (ZEE)">
        <FormDescription>
          Se o ZEE indicar percentuais elevados em classes desfavoráveis, apresentar justificativas no Anexo XXXVI.
        </FormDescription>
        {zeeGeofisico.map((camada) => {
          const slug = camada.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
          return (
            <div key={slug} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-2">
              <TextField form={form} name={`listagemB.zeeGeofisico.${slug}.classificacao`} label={camada} />
              <NumField form={form} name={`listagemB.zeeGeofisico.${slug}.percentual`} label="Distribuição (%)" />
            </div>
          );
        })}
      </SectionCard>

      <SectionCard title="62. Componente socioeconômico (ZEE)">
        {municipiosZee.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-md border p-3">
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeMunicipio(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover município
              </Button>
            </div>
            <TextField form={form} name={`listagemB.zeeSocioeconomico.${index}.municipio`} label="Município" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <TextField form={form} name={`listagemB.zeeSocioeconomico.${index}.ips`} label="IPS" />
              <TextField form={form} name={`listagemB.zeeSocioeconomico.${index}.populacao`} label="População" />
              <TextField form={form} name={`listagemB.zeeSocioeconomico.${index}.distribuicaoEspacial`} label="Distribuição espacial" />
              <TextField form={form} name={`listagemB.zeeSocioeconomico.${index}.razaoDependencia`} label="Razão de dependência" />
              <TextField form={form} name={`listagemB.zeeSocioeconomico.${index}.malhaRodoviaria`} label="Índice malha rodoviária" />
              <TextField form={form} name={`listagemB.zeeSocioeconomico.${index}.vaIndustria`} label="Índice VA indústria" />
              <TextField form={form} name={`listagemB.zeeSocioeconomico.${index}.vaServicos`} label="Índice VA serviços" />
              <TextField form={form} name={`listagemB.zeeSocioeconomico.${index}.vaAgropecuaria`} label="Índice VA agropecuária" />
              <TextField form={form} name={`listagemB.zeeSocioeconomico.${index}.exportacoes`} label="Índice exportações" />
              <TextField form={form} name={`listagemB.zeeSocioeconomico.${index}.renda`} label="Índice renda" />
              <TextField form={form} name={`listagemB.zeeSocioeconomico.${index}.saude`} label="Índice saúde" />
              <TextField form={form} name={`listagemB.zeeSocioeconomico.${index}.educacao`} label="Índice educação" />
              <TextField form={form} name={`listagemB.zeeSocioeconomico.${index}.idhM`} label="IDH-M" />
              <TextField form={form} name={`listagemB.zeeSocioeconomico.${index}.gestaoAmbiental`} label="Gestão ambiental" />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendMunicipio({ municipio: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar município
        </Button>
      </SectionCard>
    </div>
  );
}
