'use client';

import { useFieldArray } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { BooleanRadio, CheckboxOptions, NumField, SectionCard, TextField } from './form-listagem-a-helpers';

const base = 'listagemB.ferroligas';

const impactosMeioFisico = [
  'Contaminação do ar',
  'Interferência com dispositivos de drenagem ou redes de concessionárias',
  'Compactação do solo',
  'Contaminação de águas superficiais por efluentes líquidos',
  'Erosão devido à exposição do solo',
  'Contaminação do solo por óleo, graxas e combustíveis',
  'Vazamento de combustíveis armazenados',
  'Trepidação',
  'Impermeabilização do solo',
  'Assoreamento de cursos d’água',
  'Contaminação por esgoto sanitário',
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
  'Risco de eutrofização',
  'Intervenção em APP',
];

const impactosMeioSocioeconomico = [
  'Risco iminente de acidentes (explosões e/ou incêndios)',
  'Dificuldade de relacionamento com a comunidade',
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

function MonitoramentoSection({
  form,
  path,
  titulo,
  anexoRef,
}: {
  form: any;
  path: string;
  titulo: string;
  anexoRef?: string;
}) {
  const realiza = form.watch(`${path}.realiza`);

  return (
    <div className="space-y-3 rounded-md border p-3">
      <p className="font-medium">{titulo}</p>
      <FormField
        control={form.control}
        name={`${path}.realiza`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Realiza monitoramento?</FormLabel>
            <FormControl>
              <BooleanRadio value={field.value} onChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
      {realiza && (
        <>
          <FormField
            control={form.control}
            name={`${path}.pontosCoordenadas`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pontos / corpos hídricos e coordenadas</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <TextField form={form} name={`${path}.frequencia`} label="Frequência de monitoramento" />
          <FormField
            control={form.control}
            name={`${path}.parametros`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parâmetros monitorados</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${path}.avaliacaoComprometimento`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avaliação do nível de comprometimento</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${path}.medidasCorretivas`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medidas corretivas para situações anormais</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        </>
      )}
      {anexoRef && <FormDescription>{anexoRef}</FormDescription>}
    </div>
  );
}

export function FormListagemBFerroligasImpactos({ form }: { form: any }) {
  const monitoramentoRuido = form.watch(`${base}.ruidos.monitoramentoRealizado`);
  const cinturaoVerde = form.watch(`${base}.cinturaoVerde.possui`);
  const paisagismoInterno = form.watch(`${base}.cinturaoVerde.paisagismoInterno`);
  const passivos = form.watch(`${base}.passivosAmbientais.existe`);
  const outrosAgentes = form.watch(`${base}.outrosAgentesImpactos.existe`);
  const trAbordouTodos = form.watch(`${base}.outrosImpactos.trAbordouTodos`);

  const { fields: municipiosZee, append: appendMunicipio, remove: removeMunicipio } = useFieldArray({
    control: form.control,
    name: `${base}.zeeSocioeconomico`,
  });

  return (
    <div className="space-y-6">
      <SectionCard title="43. Ruídos">
        <FormField
          control={form.control}
          name={`${base}.ruidos.fonteExterna`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                As atividades implicam fontes de ruído capazes de produzir, fora dos limites da propriedade, níveis
                prejudiciais à saúde ou à paz pública?
              </FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${base}.ruidos.monitoramentoRealizado`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Já realizou monitoramento de ruído no entorno?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {monitoramentoRuido && (
          <TextField form={form} name={`${base}.ruidos.referenciaAnexo`} label="Referência ao Anexo XXXII" />
        )}
      </SectionCard>

      <SectionCard title="44. Cinturão verde / paisagismo">
        <FormField
          control={form.control}
          name={`${base}.cinturaoVerde.possui`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Possui cinturão verde nos limites da propriedade?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {cinturaoVerde && (
          <>
            <NumField form={form} name={`${base}.cinturaoVerde.larguraM`} label="Largura (m)" />
            <TextField form={form} name={`${base}.cinturaoVerde.especies`} label="Espécies plantadas" />
          </>
        )}
        <FormField
          control={form.control}
          name={`${base}.cinturaoVerde.paisagismoInterno`}
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
          <TextField form={form} name={`${base}.cinturaoVerde.areasEspecies`} label="Áreas e espécies" />
        )}
      </SectionCard>

      <SectionCard title="45 a 47. Monitoramento ambiental">
        <MonitoramentoSection form={form} path={`${base}.monitoramento.aguaSuperficial`} titulo="45. Qualidade das águas superficiais" />
        <MonitoramentoSection form={form} path={`${base}.monitoramento.aguaSubterranea`} titulo="46. Qualidade das águas subterrâneas" />
        <MonitoramentoSection form={form} path={`${base}.monitoramento.qualidadeAr`} titulo="47. Qualidade do ar" />
      </SectionCard>

      <SectionCard title="48. Passivos ambientais">
        <FormField
          control={form.control}
          name={`${base}.passivosAmbientais.existe`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Existem passivos ambientais associados ao empreendimento?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {passivos && (
          <FormField
            control={form.control}
            name={`${base}.passivosAmbientais.descricao`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Passivos existentes e alternativas de intervenção</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </SectionCard>

      <SectionCard title="49. Possibilidades de acidentes com danos ambientais">
        <FormDescription>Apresentar descrição das hipóteses de acidentes no Anexo XXXIII.</FormDescription>
        <TextField form={form} name={`${base}.acidentesAmbientais.referenciaAnexo`} label="Referência / observações" />
      </SectionCard>

      <SectionCard title="50. Outros agentes causadores de impactos ambientais">
        <FormField
          control={form.control}
          name={`${base}.outrosAgentesImpactos.existe`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Há outros agentes causadores de impactos negativos não abordados nos itens 40 a 49?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {outrosAgentes && (
          <FormField
            control={form.control}
            name={`${base}.outrosAgentesImpactos.descricao`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrever agentes e impactos</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </SectionCard>

      <SectionCard title="51. Melhorias significativas">
        <FormField
          control={form.control}
          name={`${base}.melhoriasSignificativas.descricao`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Melhorias de processos com impactos ambientais positivos</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title="52. Cronograma de implantação">
        <FormDescription>Apresentar cronograma no Anexo XXXIV.</FormDescription>
        <TextField form={form} name={`${base}.cronogramaImplantacao.referenciaAnexo`} label="Referência / observações" />
      </SectionCard>

      <SectionCard title="53 a 55. Possíveis impactos ambientais (Módulo 5)">
        <FormDescription>Identificação e avaliação detalhada no Anexo XXXV; medidas mitigadoras no Anexo XXXVI.</FormDescription>
        <CheckboxOptions form={form} name={`${base}.impactos.meioFisico`} options={impactosMeioFisico.map((i) => ({ id: i, label: i }))} />
        <TextField form={form} name={`${base}.impactos.meioFisicoOutros`} label="Meio físico – outros" />
        <CheckboxOptions form={form} name={`${base}.impactos.meioBiotico`} options={impactosMeioBiotico.map((i) => ({ id: i, label: i }))} />
        <TextField form={form} name={`${base}.impactos.meioBioticoOutros`} label="Meio biótico – outros" />
        <CheckboxOptions form={form} name={`${base}.impactos.meioSocioeconomico`} options={impactosMeioSocioeconomico.map((i) => ({ id: i, label: i }))} />
        <TextField form={form} name={`${base}.impactos.meioSocioeconomicoOutros`} label="Meio socioeconômico – outros" />
      </SectionCard>

      <SectionCard title="56. Outros impactos não abordados no TR">
        <FormField
          control={form.control}
          name={`${base}.outrosImpactos.trAbordouTodos`}
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
            name={`${base}.outrosImpactos.descricao`}
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

      <SectionCard title="57. Medidas mitigadoras">
        <FormDescription>Apresentar medidas mitigadoras e ações de controle ambiental no Anexo XXXVI.</FormDescription>
        <TextField form={form} name={`${base}.medidasMitigadoras.referenciaAnexo`} label="Referência / observações" />
      </SectionCard>

      <SectionCard title="58. Componente geofísico e biótico (ZEE)">
        <FormDescription>
          Se o ZEE indicar classes desfavoráveis (Muito Alta, Alta, Muito Precária, Precária), apresentar justificativas no Anexo XXXVII.
        </FormDescription>
        {zeeGeofisico.map((camada) => {
          const slug = slugify(camada);
          return (
            <div key={slug} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-2">
              <TextField form={form} name={`${base}.zeeGeofisico.${slug}.classificacao`} label={camada} />
              <NumField form={form} name={`${base}.zeeGeofisico.${slug}.percentual`} label="Distribuição (%)" />
            </div>
          );
        })}
      </SectionCard>

      <SectionCard title="59. Componente socioeconômico (ZEE)">
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
