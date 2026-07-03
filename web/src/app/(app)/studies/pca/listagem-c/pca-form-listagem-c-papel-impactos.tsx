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
  'Interferência com dispositivos de drenagem ou redes de concessionárias',
  'Compactação do solo',
  'Contaminação de águas superficiais por efluentes de processo',
  'Contaminação de águas superficiais por efluentes sanitários',
  'Erosão devido à exposição do solo',
  'Contaminação do solo por óleo, graxas e combustíveis',
  'Trepidação',
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
  'Vulnerabilidade à compactação do solo',
  'Integridade da flora',
  'Probabilidade de contaminação ambiental pelo uso do solo',
  'Nível de comprometimento dos recursos hídricos superficiais',
  'Erodibilidade',
  'Geologia (mapa simplificado de solos)',
];

function slugify(text: string) {
  return text.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
}

export function PcaFormListagemCPapelImpactos({ form }: { form: any }) {
  const trAbordouTodos = form.watch('listagemC.papel.outrosImpactos.trAbordouTodos');
  const haPassivo = form.watch('listagemC.papel.passivos.existe');
  const cinturaoVerde = form.watch('listagemC.papel.paisagismo.cinturaoVerde');
  const paisagismoInterno = form.watch('listagemC.papel.paisagismo.interno');

  const { fields: municipiosZee, append: appendMunicipio, remove: removeMunicipio } = useFieldArray({
    control: form.control,
    name: 'listagemC.papel.zeeSocioeconomico',
  });

  return (
    <div className="space-y-6">
      <PcaSectionCard title="37. Documentação junto ao Corpo de Bombeiros">
        <FormField
          control={form.control}
          name="listagemC.papel.corpoBombeiros.projetoAprovado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O projeto de combate a incêndio já foi aprovado pelo corpo de bombeiros?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>Não: Anexo XXXIX (protocolo). Sim: Anexo XXXVIII (laudo de conformidade).</FormDescription>
            </FormItem>
          )}
        />
      </PcaSectionCard>

      <PcaSectionCard title="38. Cinturão verde / paisagismo">
        <FormField
          control={form.control}
          name="listagemC.papel.paisagismo.cinturaoVerde"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Possui cinturão verde nos limites do terreno?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {cinturaoVerde && (
          <PcaTextField form={form} name="listagemC.papel.paisagismo.cinturaoVerdeDescricao" label="Largura (m) e espécies plantadas" />
        )}
        <FormField
          control={form.control}
          name="listagemC.papel.paisagismo.interno"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Possui paisagismo na área interna?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {paisagismoInterno && (
          <PcaTextField form={form} name="listagemC.papel.paisagismo.internoDescricao" label="Áreas/setores e espécies plantadas" />
        )}
      </PcaSectionCard>

      <PcaSectionCard title="39. Passivos ambientais">
        <FormField
          control={form.control}
          name="listagemC.papel.passivos.existe"
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
            name="listagemC.papel.passivos.descricao"
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
      </PcaSectionCard>

      <PcaSectionCard title="40. Cronograma de implantação">
        <FormDescription>Apresentar cronograma no Anexo XL.</FormDescription>
        <PcaTextField form={form} name="listagemC.papel.cronograma.referenciaAnexo" label="Referência / observações" />
      </PcaSectionCard>

      <PcaSectionCard title="41 a 43. Possíveis impactos ambientais (Módulo 5)">
        <FormDescription>Identificação e avaliação detalhada no Anexo XLI.</FormDescription>
        <PcaCheckboxOptions
          form={form}
          name="listagemC.papel.impactos.meioFisico"
          options={impactosMeioFisico.map((i) => ({ id: slugify(i), label: i }))}
        />
        <PcaTextField form={form} name="listagemC.papel.impactos.meioFisicoOutros" label="Meio físico – outros" />
        <PcaCheckboxOptions
          form={form}
          name="listagemC.papel.impactos.meioBiotico"
          options={impactosMeioBiotico.map((i) => ({ id: slugify(i), label: i }))}
        />
        <PcaTextField form={form} name="listagemC.papel.impactos.meioBioticoOutros" label="Meio biótico – outros" />
        <PcaCheckboxOptions
          form={form}
          name="listagemC.papel.impactos.meioSocioeconomico"
          options={impactosMeioSocioeconomico.map((i) => ({ id: slugify(i), label: i }))}
        />
        <PcaTextField form={form} name="listagemC.papel.impactos.meioSocioeconomicoOutros" label="Meio socioeconômico – outros" />
      </PcaSectionCard>

      <PcaSectionCard title="44. Outros agentes causadores de impactos ambientais">
        <FormField
          control={form.control}
          name="listagemC.papel.outrosImpactos.trAbordouTodos"
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
            name="listagemC.papel.outrosImpactos.descricao"
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
      </PcaSectionCard>

      <PcaSectionCard title="45. Medidas mitigadoras e plano de gerenciamento ambiental">
        <FormDescription>Apresentar medidas mitigadoras no Anexo XLII.</FormDescription>
        <PcaTextField form={form} name="listagemC.papel.medidasMitigadoras.referenciaAnexo" label="Referência / observações" />
      </PcaSectionCard>

      <PcaSectionCard title="46. Componente geofísico e biótico (ZEE)">
        <FormDescription>
          Se o ZEE indicar classes desfavoráveis, apresentar justificativas no Anexo XLIII.
        </FormDescription>
        {zeeGeofisico.map((camada) => {
          const slug = slugify(camada);
          return (
            <div key={slug} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-2">
              <PcaTextField form={form} name={`listagemC.papel.zeeGeofisico.${slug}.classificacao`} label={camada} />
              <PcaNumField form={form} name={`listagemC.papel.zeeGeofisico.${slug}.percentual`} label="Distribuição (%)" />
            </div>
          );
        })}
      </PcaSectionCard>

      <PcaSectionCard title="47. Componente socioeconômico (ZEE)">
        {municipiosZee.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-md border p-3">
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeMunicipio(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover município
              </Button>
            </div>
            <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.municipio`} label="Município" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.ips`} label="IPS" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.populacao`} label="População" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.distribuicaoEspacial`} label="Distribuição espacial" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.razaoDependencia`} label="Razão de dependência" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.malhaRodoviaria`} label="Índice malha rodoviária" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.vaIndustria`} label="Índice VA indústria" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.vaServicos`} label="Índice VA serviços" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.vaAgropecuaria`} label="Índice VA agropecuária" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.exportacoes`} label="Índice exportações" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.doet`} label="Índice DOET" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.concentracaoFundiaria`} label="Concentração fundiária" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.agricultoresFamiliares`} label="Agricultores familiares" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.nivelTecnologico`} label="Nível tecnológico agropecuário" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.icmsEcologico`} label="ICMS ecológico" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.renda`} label="Índice renda" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.saude`} label="Índice saúde" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.educacao`} label="Índice educação" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.idhM`} label="IDH-M" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.habitacao`} label="Índice habitação" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.gestaoRural`} label="Gestão desenv. rural" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.capacidadeInstitucional`} label="Capacidade institucional" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.gestaoAmbiental`} label="Gestão ambiental" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.orgJuridicas`} label="Org. jurídicas" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.orgFiscalizacao`} label="Org. fiscalização e controle" />
              <PcaTextField form={form} name={`listagemC.papel.zeeSocioeconomico.${index}.orgEnsino`} label="Org. ensino superior e profissional" />
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
