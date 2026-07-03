'use client';

import { useFieldArray } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { BooleanRadio, CheckboxOptions, NumField, SectionCard, TextField } from './form-listagem-a-helpers';

const impactosMeioFisico = [
  'Contaminação do ar',
  'Interferência com dispositivos de drenagem',
  'Compactação do solo',
  'Contaminação de águas superficiais',
  'Erosão',
  'Contaminação por óleos, graxas e combustíveis',
  'Vazamentos de combustíveis',
  'Vibração',
  'Impermeabilização do solo',
  'Assoreamento de cursos d’água',
  'Esgotos de canteiros de obras',
  'Alterações topográficas',
  'Intervenção em nascentes',
  'Emissão de material particulado (poeira)',
  'Emissões atmosféricas de equipamentos',
  'Ruídos',
];

const impactosMeioBiotico = [
  'Destruição de habitats e afugentamento da fauna',
  'Fragmentação de maciços florestais',
  'Aumento de população de vetores',
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

const zeeCamadas = [
  'Potencialidade social',
  'Vulnerabilidade natural',
  'Vulnerabilidade do solo à erosão',
  'Disponibilidade natural de água superficial',
  'Disponibilidade natural de água subterrânea',
  'Risco ambiental',
  'Qualidade ambiental',
  'Vulnerabilidade de decomposição de matéria orgânica',
  'Qualidade de água superficial',
  'Susceptibilidade à degradação estrutural do solo',
  'Integridade da flora',
  'Probabilidade de contaminação ambiental pelo uso do solo',
  'Nível de comprometimento dos recursos hídricos superficiais',
  'Erodibilidade',
  'Geologia (mapa de solo simplificado)',
];

function slugify(text: string) {
  return text.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
}

export function FormListagemCPlasticosImpactos({ form }: { form: any }) {
  const base = 'listagemC.plasticos';
  const trAbordouTodos = form.watch(`${base}.impactos.trAbordouTodos`);

  const { fields: municipiosZee, append: appendMunicipio, remove: removeMunicipio } = useFieldArray({
    control: form.control,
    name: `${base}.zeeSocioeconomico`,
  });

  return (
    <div className="space-y-6">
      <SectionCard title="50. Cronograma">
        <FormDescription>Apresentar cronograma executivo das etapas de implantação no Anexo LXII.</FormDescription>
        <TextField form={form} name={`${base}.cronograma.referenciaAnexo`} label="Referência / observações (Anexo LXII)" />
      </SectionCard>

      <SectionCard title="51. Meio físico – possíveis impactos ambientais">
        <CheckboxOptions
          form={form}
          name={`${base}.impactos.meioFisico`}
          options={impactosMeioFisico.map((i) => ({ id: slugify(i), label: i }))}
        />
        <TextField form={form} name={`${base}.impactos.meioFisicoOutros`} label="Outros impactos no meio físico" />
      </SectionCard>

      <SectionCard title="52. Meio biótico – possíveis impactos ambientais">
        <CheckboxOptions
          form={form}
          name={`${base}.impactos.meioBiotico`}
          options={impactosMeioBiotico.map((i) => ({ id: slugify(i), label: i }))}
        />
        <TextField form={form} name={`${base}.impactos.meioBioticoOutros`} label="Outros impactos no meio biótico" />
      </SectionCard>

      <SectionCard title="53. Meio socioeconômico – possíveis impactos ambientais">
        <CheckboxOptions
          form={form}
          name={`${base}.impactos.meioSocioeconomico`}
          options={impactosMeioSocioeconomico.map((i) => ({ id: slugify(i), label: i }))}
        />
        <TextField form={form} name={`${base}.impactos.meioSocioeconomicoOutros`} label="Outros impactos no meio socioeconômico" />
      </SectionCard>

      <SectionCard title="54. Outros impactos ambientais">
        <FormField
          control={form.control}
          name={`${base}.impactos.trAbordouTodos`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Este TR abordou todas as medidas mitigadoras implantadas ou previstas?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {trAbordouTodos === false && (
          <FormField
            control={form.control}
            name={`${base}.impactos.mitigacoesNaoAbordadas`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mitigações propostas para impactos negativos não abordados neste TR</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </SectionCard>

      <SectionCard title="55. Medidas mitigadoras e plano de gerenciamento ambiental">
        <FormDescription>Apresentar medidas mitigadoras, ações de controle e plano de monitoramento no Anexo LXIV.</FormDescription>
        <TextField form={form} name={`${base}.medidasMitigadoras.referenciaAnexo`} label="Referência / observações (Anexo LXIV)" />
      </SectionCard>

      <SectionCard title="56. Zoneamento ecológico-econômico (ZEE) – componente geofísico e biótico">
        <FormDescription>
          Se o ZEE indicar classes desfavoráveis (Muito Alta, Alta, Muito Precária ou Precária), apresentar
          justificativas no Anexo LXV.
        </FormDescription>
        {zeeCamadas.map((camada) => {
          const slug = slugify(camada);
          return (
            <div key={slug} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-2">
              <TextField form={form} name={`${base}.zeeGeofisico.${slug}.classificacao`} label={camada} />
              <NumField form={form} name={`${base}.zeeGeofisico.${slug}.percentual`} label="Distribuição (%)" />
            </div>
          );
        })}
      </SectionCard>

      <SectionCard title="57. Componente socioeconômico (ZEE)">
        <FormDescription>Caso o empreendimento ocupe mais municípios, acrescentar linhas necessárias.</FormDescription>
        {municipiosZee.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-md border p-3">
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeMunicipio(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover município
              </Button>
            </div>
            <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.municipio`} label="Município" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.ips`} label="IPS" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.populacao`} label="População" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.distribuicaoEspacial`} label="Distribuição espacial" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.razaoDependencia`} label="Razão de dependência" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.malhaRodoviaria`} label="Índice malha rodoviária" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.vaIndustria`} label="Índice VA indústria" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.vaServicos`} label="Índice VA serviços" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.vaAgropecuaria`} label="Índice VA agropecuária" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.exportacoes`} label="Índice exportações" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.doet`} label="Índice DOET" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.concentracaoFundiaria`} label="Concentração fundiária" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.agricultoresFamiliares`} label="Agricultores familiares" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.nivelTecnologico`} label="Nível tecnológico agropecuário" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.icmsEcologico`} label="ICMS ecológico" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.renda`} label="Índice renda" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.saude`} label="Índice saúde" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.educacao`} label="Índice educação" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.idhM`} label="IDH-M" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.habitacao`} label="Índice habitação" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.gestaoRural`} label="Gestão desenv. rural" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.capacidadeInstitucional`} label="Capacidade institucional" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.gestaoAmbiental`} label="Gestão ambiental" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.orgJuridicas`} label="Org. jurídicas" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.orgFiscalizacao`} label="Org. fiscalização e controle" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.orgEnsino`} label="Org. ensino superior e profissional" />
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
