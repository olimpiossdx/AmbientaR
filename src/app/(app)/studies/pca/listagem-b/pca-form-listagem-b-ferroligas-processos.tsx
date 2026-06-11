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
const base = 'listagemB.ferroligas';

const finalidadesAgua = [
  'Água bruta captada de manancial',
  'Água de fornecimento externo (concessionária)',
  'Água total tratada',
  'Consumo uso doméstico',
  'Consumo uso industrial',
  'Consumo não industrial',
  'Lavagem de veículos',
  'Oficinas',
  'Utilidades (limpeza, irrigação etc.)',
  'Geração de vapor',
  'Reposição de perdas por evaporação',
  'Recirculação / tratamento',
  'Efluente líquido total (industrial + sanitário)',
  'Efluente industrial',
  'Esgoto doméstico',
  'Efluente tratado',
  'Efluente sem tratamento',
  'Consumo humano',
  'Outras finalidades',
  'Consumo diário total',
];

const ligasProduzidas = [
  { id: 'fe_si', label: 'Fe-Si', variantes: ['75%', '45%', 'Outro'] },
  { id: 'fe_mn', label: 'Fe-Mn', variantes: ['Alto carbono', 'Médio carbono', 'Baixo carbono'] },
  { id: 'fe_si_mn', label: 'Fe-Si-Mn', variantes: [] },
  { id: 'fe_cr', label: 'Fe-Cr', variantes: ['Alto carbono', 'Médio carbono', 'Baixo carbono'] },
  { id: 'fe_si_cr', label: 'Fe-Si-Cr', variantes: [] },
  { id: 'fe_ni', label: 'Fe-Ni', variantes: [] },
  { id: 'fe_p', label: 'Fe-P', variantes: [] },
  { id: 'fe_v', label: 'Fe-V', variantes: [] },
  { id: 'fe_mo', label: 'Fe-Mo', variantes: [] },
  { id: 'fe_ca_si', label: 'Fe-Ca-Si', variantes: [] },
  { id: 'fe_si_mg', label: 'Fe-Si-Mg', variantes: [] },
  { id: 'fe_si_zr', label: 'Fe-Si-Zr', variantes: [] },
  { id: 'fe_nb', label: 'Fe-Nb', variantes: [] },
  { id: 'fe_ti', label: 'Fe-Ti', variantes: [] },
  { id: 'si_metalico', label: 'Si metálico', variantes: [] },
  { id: 'inoculantes', label: 'Inoculantes para fundição', variantes: [] },
  { id: 'outras', label: 'Outras ligas', variantes: [] },
];

const etapasProcesso = [
  'Estocagem / preparação / aliagem / classificação das matérias-primas',
  'Processo de redução dos minérios (eletrotermia ou outros)',
  'Refino em panela refratária e metalurgia de panela',
  'Lingotamento e desmoldagem das ligas ferrosas',
  'Blendagem das ligas ferrosas',
  'Britagem das ligas ferrosas',
  'Peneiramento / classificação das ligas ferrosas',
  'Expedição das ligas ferrosas',
  'Outras etapas',
];

function slugify(text: string) {
  return text.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
}

export function PcaFormListagemBFerroligasProcessos({ form }: { form: any }) {
  const recirculaAgua = form.watch(`${base}.usoAgua.recircula`);
  const geraEnergiaPropria = form.watch(`${base}.energiaEletrica.geracaoPropria`);

  const { fields: fornos, append: appendForno, remove: removeForno } = useFieldArray({
    control: form.control,
    name: `${base}.fornosReducao`,
  });
  const { fields: compressores, append: appendCompressor, remove: removeCompressor } = useFieldArray({
    control: form.control,
    name: `${base}.arComprimido.equipamentos`,
  });

  return (
    <div className="space-y-6">
      <PcaSectionCard title="34. Uso de água">
        <FormField
          control={form.control}
          name={`${base}.usoAgua.recircula`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>O empreendimento recircula água utilizada?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {recirculaAgua && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PcaNumField form={form} name={`${base}.usoAgua.volumeRecirculadoM3Mes`} label="Volume recirculado (m³/mês)" />
            <PcaNumField form={form} name={`${base}.usoAgua.percentualRecirculado`} label="Percentual de água recirculada (%)" />
          </div>
        )}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Finalidade</TableHead>
                <TableHead>Consumo máx. diário (m³/dia)</TableHead>
                <TableHead>Consumo médio diário (m³/dia)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finalidadesAgua.map((f) => {
                const slug = slugify(f);
                return (
                  <TableRow key={slug}>
                    <TableCell className="font-medium">{f}</TableCell>
                    <TableCell>
                      <PcaNumField form={form} name={`${base}.usoAgua.consumo.${slug}.maximo`} label="" />
                    </TableCell>
                    <TableCell>
                      <PcaNumField form={form} name={`${base}.usoAgua.consumo.${slug}.medio`} label="" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </PcaSectionCard>

      <PcaSectionCard title="35.1 Processo de redução">
        <PcaCheckboxOptions
          form={form}
          name={`${base}.processoReducao.tipos`}
          options={[
            { id: 'carbotermico', label: 'Carbotérmico (carbotermia)' },
            { id: 'metalotermico_si', label: 'Metalotérmico – Si-silicotermia' },
            { id: 'metalotermico_al', label: 'Metalotérmico – Al-aluminotermia' },
            { id: 'metalotermico_mg', label: 'Metalotérmico – Mg-magnesiotermia' },
            { id: 'metalotermico_ca', label: 'Metalotérmico – Ca-calciotermia' },
            { id: 'metalotermico_outros', label: 'Outros processos de redução' },
          ]}
        />
        <FormField
          control={form.control}
          name={`${base}.processoReducao.substanciaMineral`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Substância mineral contendo o metal de interesse</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </PcaSectionCard>

      <PcaSectionCard title="35.2 Ligas ferrosas produzidas">
        {ligasProduzidas.map((liga) => (
          <div key={liga.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
            <p className="font-medium md:col-span-4">{liga.label}</p>
            {liga.variantes.length > 0 && (
              <PcaCheckboxOptions
                form={form}
                name={`${base}.ligasProduzidas.${liga.id}.variantes`}
                options={liga.variantes.map((v) => ({ id: v, label: v }))}
              />
            )}
            <PcaTextField form={form} name={`${base}.ligasProduzidas.${liga.id}.formaComercializacao`} label="Forma de comercialização (granulometria mm)" />
            <PcaNumField form={form} name={`${base}.ligasProduzidas.${liga.id}.producaoDiariaTon`} label="Produção diária (t/dia)" />
            {liga.id === 'outras' && (
              <PcaTextField form={form} name={`${base}.ligasProduzidas.${liga.id}.especificacao`} label="Especificar liga" className="md:col-span-2" />
            )}
          </div>
        ))}
      </PcaSectionCard>

      <PcaSectionCard title="35.3 Especificações dos fornos de redução">
        <FormDescription>
          Para cada forno: tipo, volume interno, consumo de energia e redutor, capacidade produtiva. Acrescentar linhas conforme necessário.
        </FormDescription>
        {fornos.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between">
              <p className="font-medium">Forno {index + 1}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => removeForno(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
            <PcaCheckboxOptions
              form={form}
              name={`${base}.fornosReducao.${index}.tipoForno`}
              options={[
                { id: 'eletrico_arco_submerso', label: 'Elétrico a arco submerso' },
                { id: 'outros', label: 'Outros tipos de fornos' },
              ]}
            />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <PcaTextField form={form} name={`${base}.fornosReducao.${index}.identificacao`} label="Identificação do forno" />
              <PcaNumField form={form} name={`${base}.fornosReducao.${index}.volumeInternoM3`} label="Volume interno (m³)" />
              <PcaNumField form={form} name={`${base}.fornosReducao.${index}.energiaKwhPorTon`} label="Energia elétrica (kWh/t)" />
              <PcaNumField form={form} name={`${base}.fornosReducao.${index}.redutorCarvaoKgPorTon`} label="Redutor – carvão vegetal (kg/t)" />
              <PcaNumField form={form} name={`${base}.fornosReducao.${index}.redutorCoqueKgPorTon`} label="Redutor – coque (kg/t)" />
              <PcaNumField form={form} name={`${base}.fornosReducao.${index}.redutorMetalKgPorTon`} label="Redutor – metal (kg/t)" />
              <PcaNumField form={form} name={`${base}.fornosReducao.${index}.capacidadeProdutivaTonDia`} label="Capacidade produtiva (t/dia)" />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendForno({})}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar forno
        </Button>
      </PcaSectionCard>

      <PcaSectionCard title="36. Fluxograma de produção">
        <FormDescription>
          Apresentar no Anexo XXX os fluxogramas e descrições detalhadas de cada etapa dos processos industriais.
        </FormDescription>
        <PcaTextField form={form} name={`${base}.fluxograma.referenciaAnexo`} label="Referência / observações ao anexo" />
      </PcaSectionCard>

      <PcaSectionCard title="37. Máquinas e equipamentos principais">
        {etapasProcesso.map((etapa) => {
          const slug = slugify(etapa);
          return (
            <div key={slug} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
              <p className="font-medium md:col-span-4">{etapa}</p>
              <PcaTextField form={form} name={`${base}.equipamentos.${slug}.maquina`} label="Máquina / equipamento" className="md:col-span-2" />
              <PcaNumField form={form} name={`${base}.equipamentos.${slug}.quantidade`} label="Quantidade" />
              <FormField
                control={form.control}
                name={`${base}.equipamentos.${slug}.caracteristicas`}
                render={({ field }) => (
                  <FormItem className="md:col-span-4">
                    <FormLabel>Características gerais</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          );
        })}
      </PcaSectionCard>

      <PcaSectionCard title="38. Equipamentos ou sistemas para geração de energia elétrica">
        <FormField
          control={form.control}
          name={`${base}.energiaEletrica.geracaoPropria`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Há geração de energia elétrica própria?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {geraEnergiaPropria && (
          <PcaCheckboxOptions
            form={form}
            name={`${base}.energiaEletrica.tiposGeracao`}
            options={[
              { id: 'cogeracao', label: 'Cogeração (kW)' },
              { id: 'grupo_gerador', label: 'Grupo gerador (kW)' },
              { id: 'outros', label: 'Outras formas' },
            ]}
          />
        )}
        <FormDescription>Energia fornecida por terceiros</FormDescription>
        <PcaCheckboxOptions
          form={form}
          name={`${base}.energiaEletrica.fornecimentoTerceiros`}
          options={[
            { id: 'total', label: 'Total' },
            { id: 'parcial', label: 'Em parte' },
          ]}
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <PcaTextField form={form} name={`${base}.energiaEletrica.empresaFornecedora`} label="Empresa fornecedora" />
          <PcaNumField form={form} name={`${base}.energiaEletrica.demandaContratadaKwhMes`} label="Demanda contratada (kWh/mês)" />
          <PcaNumField form={form} name={`${base}.energiaEletrica.consumoMedioKwhMes`} label="Consumo mensal médio (kWh/mês)" />
        </div>
        <FormField
          control={form.control}
          name={`${base}.energiaEletrica.possuiSubestacao`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subestação?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <PcaNumField form={form} name={`${base}.energiaEletrica.tensaoSubestacaoKv`} label="Tensão da subestação (kV)" />
      </PcaSectionCard>

      <PcaSectionCard title="39. Equipamentos de geração de ar comprimido">
        {compressores.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-3">
            <PcaTextField form={form} name={`${base}.arComprimido.equipamentos.${index}.descricao`} label="Descrição do equipamento" className="md:col-span-2" />
            <PcaNumField form={form} name={`${base}.arComprimido.equipamentos.${index}.capacidadeM3H`} label="Capacidade nominal (m³/h)" />
            <div className="md:col-span-3 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeCompressor(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendCompressor({})}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar equipamento
        </Button>
      </PcaSectionCard>
    </div>
  );
}
