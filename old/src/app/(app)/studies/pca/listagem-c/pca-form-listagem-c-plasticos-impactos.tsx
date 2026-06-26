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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';
import {
  BooleanRadio,
  CaracterizacaoEfluenteAntesDepois,
  DetalhesControleEmissoes,
  DisposicaoTemporariaResiduo,
  PcaCheckboxOptions,
  PcaNumField,
  PcaSectionCard,
  PcaSituacaoRegularizacao,
  PcaTabelaLinhasFixas,
  PcaTextField,
  PcaTextAreaField,
} from '../lib/pca-form-helpers';
import { PcaMedidasSection } from '../lib/pca-medidas-section';
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

export function PcaFormListagemCPlasticosImpactos({ form }: { form: any }) {
  const base = 'listagemC.plasticos';
  const trAbordouTodos = form.watch(`${base}.impactos.trAbordouTodos`);

  const { fields: municipiosZee, append: appendMunicipio, remove: removeMunicipio } = useFieldArray({
    control: form.control,
    name: `${base}.zeeSocioeconomico`,
  });

  return (
    <div className="space-y-6">
      <PcaSectionCard title="50. Cronograma">
        <FormDescription>Apresentar cronograma executivo das etapas de implantação no Anexo LXII.</FormDescription>
        <PcaTextField form={form} name={`${base}.cronograma.referenciaAnexo`} label="Referência / observações (Anexo LXII)" />
      </PcaSectionCard>

      <PcaSectionCard title="51. Meio físico – possíveis impactos ambientais">
        <PcaCheckboxOptions
          form={form}
          name={`${base}.impactos.meioFisico`}
          options={impactosMeioFisico.map((i) => ({ id: slugify(i), label: i }))}
        />
        <PcaTextField form={form} name={`${base}.impactos.meioFisicoOutros`} label="Outros impactos no meio físico" />
      </PcaSectionCard>

      <PcaSectionCard title="52. Meio biótico – possíveis impactos ambientais">
        <PcaCheckboxOptions
          form={form}
          name={`${base}.impactos.meioBiotico`}
          options={impactosMeioBiotico.map((i) => ({ id: slugify(i), label: i }))}
        />
        <PcaTextField form={form} name={`${base}.impactos.meioBioticoOutros`} label="Outros impactos no meio biótico" />
      </PcaSectionCard>

      <PcaSectionCard title="53. Meio socioeconômico – possíveis impactos ambientais">
        <PcaCheckboxOptions
          form={form}
          name={`${base}.impactos.meioSocioeconomico`}
          options={impactosMeioSocioeconomico.map((i) => ({ id: slugify(i), label: i }))}
        />
        <PcaTextField form={form} name={`${base}.impactos.meioSocioeconomicoOutros`} label="Outros impactos no meio socioeconômico" />
      </PcaSectionCard>

      <PcaSectionCard title="54. Outros impactos ambientais">
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
      </PcaSectionCard>

      <PcaSectionCard title="55. Medidas mitigadoras e plano de gerenciamento ambiental">
        <FormDescription>Apresentar medidas mitigadoras, ações de controle e plano de monitoramento no Anexo LXIV.</FormDescription>
        <PcaTextField form={form} name={`${base}.medidasMitigadoras.referenciaAnexo`} label="Referência / observações (Anexo LXIV)" />
      </PcaSectionCard>

      <PcaSectionCard title="56. Zoneamento ecológico-econômico (ZEE) – componente geofísico e biótico">
        <FormDescription>
          Se o ZEE indicar classes desfavoráveis (Muito Alta, Alta, Muito Precária ou Precária), apresentar
          justificativas no Anexo LXV.
        </FormDescription>
        {zeeCamadas.map((camada) => {
          const slug = slugify(camada);
          return (
            <div key={slug} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-2">
              <PcaTextField form={form} name={`${base}.zeeGeofisico.${slug}.classificacao`} label={camada} />
              <PcaNumField form={form} name={`${base}.zeeGeofisico.${slug}.percentual`} label="Distribuição (%)" />
            </div>
          );
        })}
      </PcaSectionCard>

      <PcaSectionCard title="57. Componente socioeconômico (ZEE)">
        <FormDescription>Caso o empreendimento ocupe mais municípios, acrescentar linhas necessárias.</FormDescription>
        {municipiosZee.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-md border p-3">
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeMunicipio(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover município
              </Button>
            </div>
            <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.municipio`} label="Município" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.ips`} label="IPS" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.populacao`} label="População" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.distribuicaoEspacial`} label="Distribuição espacial" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.razaoDependencia`} label="Razão de dependência" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.malhaRodoviaria`} label="Índice malha rodoviária" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.vaIndustria`} label="Índice VA indústria" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.vaServicos`} label="Índice VA serviços" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.vaAgropecuaria`} label="Índice VA agropecuária" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.exportacoes`} label="Índice exportações" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.doet`} label="Índice DOET" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.concentracaoFundiaria`} label="Concentração fundiária" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.agricultoresFamiliares`} label="Agricultores familiares" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.nivelTecnologico`} label="Nível tecnológico agropecuário" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.icmsEcologico`} label="ICMS ecológico" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.renda`} label="Índice renda" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.saude`} label="Índice saúde" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.educacao`} label="Índice educação" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.idhM`} label="IDH-M" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.habitacao`} label="Índice habitação" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.gestaoRural`} label="Gestão desenv. rural" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.capacidadeInstitucional`} label="Capacidade institucional" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.gestaoAmbiental`} label="Gestão ambiental" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.orgJuridicas`} label="Org. jurídicas" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.orgFiscalizacao`} label="Org. fiscalização e controle" />
              <PcaTextField form={form} name={`${base}.zeeSocioeconomico.${index}.orgEnsino`} label="Org. ensino superior e profissional" />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendMunicipio({ municipio: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar município
        </Button>
      </PcaSectionCard>
    </div>
  );
}
