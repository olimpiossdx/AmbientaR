'use client';

import { useFieldArray } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { BooleanRadio, CheckboxOptions, NumField, SectionCard, TextField } from './form-listagem-a-helpers';

const impactosMeioFisico = [
  'Interferência com dispositivos de drenagem ou redes de concessionárias',
  'Compactação do solo',
  'Contaminação de águas superficiais por efluentes de processo',
  'Contaminação de águas superficiais por efluentes sanitários',
  'Erosão devido à exposição do solo',
  'Contaminação do solo por óleo, graxas e combustíveis',
  'Assoreamento de cursos d’água (fase de obras)',
  'Alterações topográficas e da paisagem',
  'Intervenção em nascentes',
  'Emissão de material particulado (poeira)',
  'Emissões atmosféricas de equipamentos móveis',
  'Ruídos de veículos e equipamentos',
];

const impactosMeioBiotico = [
  'Destruição de habitat e afugentamento da fauna',
  'Fragmentação de maciços florestais',
  'Aumento de população de vetores',
  'Supressão de vegetação',
  'Intervenção em APP',
];

const impactosMeioSocioeconomico = [
  'Risco iminente de acidentes (explosões e/ou incêndios)',
  'Dificuldade de relacionamento com a população do entorno',
  'Risco à saúde',
  'Geração de empregos',
  'Arrecadação de impostos',
  'Alteração de tráfego local',
  'Conflitos de uso dos recursos naturais',
];

const zeeGeofisico = [
  'Potencialidade social',
  'Vulnerabilidade natural',
  'Vulnerabilidade do solo à erosão',
  'Disponibilidade natural de água superficial',
  'Disponibilidade natural de água subterrânea',
  'Risco ambiental',
  'Qualidade ambiental',
  'Vulnerabilidade da decomposição da matéria orgânica',
  'Qualidade da água superficial',
  'Susceptibilidade à degradação estrutural do solo',
  'Integridade da flora',
  'Probabilidade de contaminação ambiental pelo uso do solo',
  'Nível de comprometimento dos recursos hídricos superficiais',
  'Erodibilidade',
  'Geologia (mapa simplificado de solos)',
];

function slugify(text: string) {
  return text.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
}

export function FormListagemCDomissanitariosImpactos({ form }: { form: any }) {
  const trAbordouTodos = form.watch('listagemC.domissanitarios.outrosImpactos.trAbordouTodos');
  const haPassivo = form.watch('listagemC.domissanitarios.passivos.existe');

  const { fields: municipiosZee, append: appendMunicipio, remove: removeMunicipio } = useFieldArray({
    control: form.control,
    name: 'listagemC.domissanitarios.zeeSocioeconomico',
  });

  return (
    <div className="space-y-6">
      <SectionCard title="36. Documentação junto ao Corpo de Bombeiros e ANVISA">
        <FormField
          control={form.control}
          name="listagemC.domissanitarios.corpoBombeiros.projetoAprovado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O projeto de combate a incêndio já foi aprovado pelo corpo de bombeiros?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>Não: Anexo XXXIII (protocolo). Sim: Anexo XXXIV (laudo de conformidade).</FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="listagemC.domissanitarios.anvisa.possuiAutorizacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O empreendimento possui Autorização de funcionamento cedida pela ANVISA?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>Não: Anexo XXXV (protocolo). Sim: Anexo XXXVI (autorização).</FormDescription>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title="37. Passivos ambientais">
        <FormField
          control={form.control}
          name="listagemC.domissanitarios.passivos.existe"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Há passivo ambiental associado ao empreendimento?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {haPassivo && (
          <FormField
            control={form.control}
            name="listagemC.domissanitarios.passivos.descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Informar passivos e alternativas de intervenção</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </SectionCard>

      <SectionCard title="38. Cronograma de implantação">
        <FormDescription>Apresentar cronograma no Anexo XXXVII.</FormDescription>
        <TextField form={form} name="listagemC.domissanitarios.cronograma.referenciaAnexo" label="Referência / observações" />
      </SectionCard>

      <SectionCard title="39 a 41. Possíveis impactos ambientais (Módulo 5)">
        <FormDescription>Identificação e avaliação detalhada no Anexo XXXVIII.</FormDescription>
        <CheckboxOptions
          form={form}
          name="listagemC.domissanitarios.impactos.meioFisico"
          options={impactosMeioFisico.map((i) => ({ id: slugify(i), label: i }))}
        />
        <TextField form={form} name="listagemC.domissanitarios.impactos.meioFisicoOutros" label="Meio físico – outros" />
        <CheckboxOptions
          form={form}
          name="listagemC.domissanitarios.impactos.meioBiotico"
          options={impactosMeioBiotico.map((i) => ({ id: slugify(i), label: i }))}
        />
        <TextField form={form} name="listagemC.domissanitarios.impactos.meioBioticoOutros" label="Meio biótico – outros" />
        <CheckboxOptions
          form={form}
          name="listagemC.domissanitarios.impactos.meioSocioeconomico"
          options={impactosMeioSocioeconomico.map((i) => ({ id: slugify(i), label: i }))}
        />
        <TextField
          form={form}
          name="listagemC.domissanitarios.impactos.meioSocioeconomicoOutros"
          label="Meio socioeconômico – outros"
        />
      </SectionCard>

      <SectionCard title="42. Outros agentes causadores de impactos ambientais">
        <FormField
          control={form.control}
          name="listagemC.domissanitarios.outrosImpactos.trAbordouTodos"
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
            name="listagemC.domissanitarios.outrosImpactos.descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Impactos não abordados neste TR</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </SectionCard>

      <SectionCard title="43. Medidas mitigadoras e plano de gestão ambiental">
        <FormDescription>Apresentar medidas mitigadoras no Anexo XXXIX.</FormDescription>
        <TextField form={form} name="listagemC.domissanitarios.medidasMitigadoras.referenciaAnexo" label="Referência / observações" />
      </SectionCard>

      <SectionCard title="44. Componente geofísico e biótico (ZEE)">
        <FormDescription>
          Se o ZEE indicar classes desfavoráveis, apresentar justificativas no Anexo XL.
        </FormDescription>
        {zeeGeofisico.map((camada) => {
          const slug = slugify(camada);
          return (
            <div key={slug} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-2">
              <TextField form={form} name={`listagemC.domissanitarios.zeeGeofisico.${slug}.classificacao`} label={camada} />
              <NumField form={form} name={`listagemC.domissanitarios.zeeGeofisico.${slug}.percentual`} label="Distribuição (%)" />
            </div>
          );
        })}
      </SectionCard>

      <SectionCard title="45. Componente socioeconômico (ZEE)">
        {municipiosZee.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-md border p-3">
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeMunicipio(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover município
              </Button>
            </div>
            <TextField form={form} name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.municipio`} label="Município" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <TextField form={form} name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.ips`} label="IPS" />
              <TextField form={form} name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.populacao`} label="População" />
              <TextField
                form={form}
                name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.distribuicaoEspacial`}
                label="Distribuição espacial"
              />
              <TextField
                form={form}
                name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.razaoDependencia`}
                label="Razão de dependência"
              />
              <TextField
                form={form}
                name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.malhaRodoviaria`}
                label="Índice malha rodoviária"
              />
              <TextField form={form} name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.vaIndustria`} label="Índice VA indústria" />
              <TextField form={form} name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.vaServicos`} label="Índice VA serviços" />
              <TextField
                form={form}
                name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.vaAgropecuaria`}
                label="Índice VA agropecuária"
              />
              <TextField form={form} name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.exportacoes`} label="Índice exportações" />
              <TextField form={form} name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.doet`} label="Índice DOET" />
              <TextField
                form={form}
                name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.concentracaoFundiaria`}
                label="Concentração fundiária"
              />
              <TextField
                form={form}
                name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.agricultoresFamiliares`}
                label="Agricultores familiares"
              />
              <TextField
                form={form}
                name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.nivelTecnologico`}
                label="Nível tecnológico agropecuário"
              />
              <TextField form={form} name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.icmsEcologico`} label="ICMS ecológico" />
              <TextField form={form} name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.renda`} label="Índice renda" />
              <TextField form={form} name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.saude`} label="Índice saúde" />
              <TextField form={form} name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.educacao`} label="Índice educação" />
              <TextField form={form} name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.idhM`} label="IDH-M" />
              <TextField form={form} name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.habitacao`} label="Índice habitação" />
              <TextField form={form} name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.gestaoRural`} label="Gestão desenv. rural" />
              <TextField
                form={form}
                name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.capacidadeInstitucional`}
                label="Capacidade institucional"
              />
              <TextField form={form} name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.gestaoAmbiental`} label="Gestão ambiental" />
              <TextField form={form} name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.orgJuridicas`} label="Org. jurídicas" />
              <TextField
                form={form}
                name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.orgFiscalizacao`}
                label="Org. fiscalização e controle"
              />
              <TextField
                form={form}
                name={`listagemC.domissanitarios.zeeSocioeconomico.${index}.orgEnsino`}
                label="Org. ensino superior e profissional"
              />
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
