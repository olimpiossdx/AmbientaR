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
const base = 'listagemB.naoFerrosos';

const finalidadesAguaNf = [
  'Água bruta captada de manancial',
  'Água de fornecimento externo (concessionária)',
  'Água total (captada mais fornecida)',
  'Água tratada / Consumo total',
  'Consumo uso doméstico',
  'Consumo uso industrial',
  'Consumo não industrial',
  'Lavagem de veículos',
  'Oficinas',
  'Utilidades (lavagens, limpezas, irrigação, etc.)',
  'Geração de vapor',
  'Reposição de perdas/evaporação',
  'Recirculação/resfriamento (total recirculado)',
  'Efluente líquido total gerado (industrial + sanitário)',
  'Efluente líquido industrial',
  'Esgoto doméstico',
  'Efluente tratado',
  'Efluente sem tratamento',
  'Consumo humano (sanitários, refeitório etc.)',
  'Outras finalidades',
];

const segmentosMercado = [
  'Automotivo',
  'Aeronáutico',
  'Agrícola',
  'Eletrônico',
  'Saneamento',
  'Metal Mecânico',
  'Siderurgia / Mineração',
  'Linha de decoração',
  'Linha doméstica',
  'Linha esportiva',
  'Móveis',
  'Energia',
  'Linha Hidráulica',
  'Compressores',
  'Bombas',
  'Outros',
];

const ligasProducaoDiaria = [
  { grupo: 'Ligas de Cobre', itens: ['Cu-Sn (Bronze)', 'Cu-Zn (Latão)', 'Cu-Al (Cupro-alumínio)', 'Outras ligas de Cu'] },
  { grupo: 'Ligas de Alumínio', itens: ['Al-Si', 'Al-Cu', 'Al-Mg', 'Al-Zn', 'Outras ligas de Al'] },
  { grupo: 'Ligas de Zinco', itens: ['Zn-Al ZAMAK', 'Zn-Al ILZRO-12', 'Zn-Al-Cu KAYEM'] },
  { grupo: 'Ligas de Magnésio', itens: ['Mg-Al-Zn', 'Mg-Zr-Zn'] },
  {
    grupo: 'Outras ligas não ferrosas',
    itens: ['Níquel e ligas', 'Titânio e ligas', 'Cobre eletrolítico fundido', 'Metal branco (Sn/Pb)', 'Outras ligas'],
  },
];

const combustiveisFusaoNf = [
  { id: 'coque', tipos: ['Cadinho estacionário', 'Cadinho basculante'] },
  { id: 'eletrico_inducao', tipos: ['Cadinho estacionário', 'Cadinho basculante', 'Canal'] },
  { id: 'eletrico_resistencia', tipos: ['Resistência externa', 'Resistência interna'] },
  { id: 'oleo', tipos: ['Rotativo', 'Com cadinho estacionário', 'Com cadinho basculante'] },
  {
    id: 'gas',
    tipos: ['GLP', 'Natural', 'Com cadinho rotativo', 'Com cadinho estacionário', 'Com cadinho basculante', 'Reverberos', 'Outros fornos a gás'],
  },
];

function slugify(text: string) {
  return text.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
}

function TabelaLinhaProducaoLigas({
  form,
  titulo,
  pathPrefix,
  colunas,
}: {
  form: any;
  titulo: string;
  pathPrefix: string;
  colunas: { id: string; label: string }[];
}) {
  return (
    <PcaSectionCard title={titulo}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Segmento</TableHead>
              {colunas.map((col) => (
                <TableHead key={col.id} className="min-w-[140px]">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {segmentosMercado.map((segmento) => {
              const segSlug = slugify(segmento);
              return (
                <TableRow key={segSlug}>
                  <TableCell className="font-medium">{segmento}</TableCell>
                  {colunas.map((col) => (
                    <TableCell key={col.id}>
                      <FormField
                        control={form.control}
                        name={`${pathPrefix}.${segSlug}.${col.id}`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Descrição do produto" {...field} value={field.value ?? ''} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <PcaTextField form={form} name={`${pathPrefix}.outrosSegmentos`} label="Outros segmentos (especificar)" />
    </PcaSectionCard>
  );
}

function MaquinasSetor({ form, basePath, titulo }: { form: any; basePath: string; titulo: string }) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: basePath });
  return (
    <PcaSectionCard title={titulo}>
      {fields.map((item, index) => (
        <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
          <PcaTextField form={form} name={`${basePath}.${index}.maquina`} label="Máquina" />
          <PcaNumField form={form} name={`${basePath}.${index}.quantidade`} label="Quantidade" />
          <PcaTextField form={form} name={`${basePath}.${index}.caracteristicas`} label="Características" className="md:col-span-2" />
          <div className="md:col-span-4 flex justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => remove(index)}>
              <Trash2 className="mr-2 h-4 w-4" />Remover
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => append({ maquina: '', quantidade: '', caracteristicas: '' })}>
        <PlusCircle className="mr-2 h-4 w-4" />Adicionar máquina
      </Button>
    </PcaSectionCard>
  );
}

export function PcaFormListagemBNaoFerrososProcessos({ form }: { form: any }) {
  const recirculaAgua = form.watch(`${base}.usoAgua.recirculaAgua`);
  const { fields: linhasModelagem, append: appendModelagem, remove: removeModelagem } = useFieldArray({
    control: form.control,
    name: `${base}.modelagem.ligas`,
  });

  return (
    <div className="space-y-6">
      <PcaSectionCard title="33. Uso de água">
        <FormField
          control={form.control}
          name={`${base}.usoAgua.recirculaAgua`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>O empreendimento recircula a água utilizada?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {recirculaAgua && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PcaNumField form={form} name={`${base}.usoAgua.volumeRecirculadoM3Mes`} label="Volume recirculado (m³/mês)" />
            <PcaNumField form={form} name={`${base}.usoAgua.percentualRecirculado`} label="Porcentagem de água recirculada (%)" />
          </div>
        )}
        <FormDescription>Consumo por finalidade (m³/dia)</FormDescription>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Finalidade</TableHead>
              <TableHead>Consumo diário máximo</TableHead>
              <TableHead>Consumo diário médio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {finalidadesAguaNf.map((finalidade) => {
              const slug = slugify(finalidade);
              return (
                <TableRow key={slug}>
                  <TableCell className="font-medium">{finalidade}</TableCell>
                  <TableCell>
                    <PcaNumField form={form} name={`${base}.usoAgua.finalidades.${slug}.maximo`} label="" />
                  </TableCell>
                  <TableCell>
                    <PcaNumField form={form} name={`${base}.usoAgua.finalidades.${slug}.medio`} label="" />
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell className="font-semibold">Consumo total diário</TableCell>
              <TableCell>
                <PcaNumField form={form} name={`${base}.usoAgua.consumoTotalMaximo`} label="" />
              </TableCell>
              <TableCell>
                <PcaNumField form={form} name={`${base}.usoAgua.consumoTotalMedio`} label="" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </PcaSectionCard>

      <TabelaLinhaProducaoLigas
        form={form}
        titulo="34.1 Linha de produção – ligas de cobre (Cu)"
        pathPrefix={`${base}.linhaProducao.cobre`}
        colunas={[
          { id: 'cu_sn', label: 'Cu-Sn (Bronze)' },
          { id: 'cu_zn', label: 'Cu-Zn (Latão)' },
          { id: 'cu_al', label: 'Cu-Al' },
          { id: 'cu_outras', label: 'Outras ligas de Cu' },
        ]}
      />
      <TabelaLinhaProducaoLigas
        form={form}
        titulo="34.2 Linha de produção – ligas de alumínio (Al)"
        pathPrefix={`${base}.linhaProducao.aluminio`}
        colunas={[
          { id: 'al_si', label: 'Al-Si' },
          { id: 'al_cu', label: 'Al-Cu' },
          { id: 'al_mg', label: 'Al-Mg' },
          { id: 'al_zn', label: 'Al-Zn' },
          { id: 'al_outras', label: 'Outras ligas de Al' },
        ]}
      />
      <TabelaLinhaProducaoLigas
        form={form}
        titulo="34.3 Linha de produção – ligas de zinco (Zn)"
        pathPrefix={`${base}.linhaProducao.zinco`}
        colunas={[
          { id: 'zn_zamak', label: 'Zn-Al ZAMAK' },
          { id: 'zn_ilzro', label: 'Zn-Al ILZRO-12' },
          { id: 'zn_kayem', label: 'Zn-Al-Cu KAYEM' },
          { id: 'zn_outras', label: 'Outras ligas de Zn' },
        ]}
      />
      <TabelaLinhaProducaoLigas
        form={form}
        titulo="34.4 Linha de produção – ligas de magnésio (Mg)"
        pathPrefix={`${base}.linhaProducao.magnesio`}
        colunas={[
          { id: 'mg_al_zn', label: 'Mg-Al-Zn' },
          { id: 'mg_zr_zn', label: 'Mg-Zr-Zn' },
          { id: 'mg_outras', label: 'Outras ligas de Mg' },
        ]}
      />
      <TabelaLinhaProducaoLigas
        form={form}
        titulo="34.5 Linha de produção – outras ligas de metais não ferrosos"
        pathPrefix={`${base}.linhaProducao.outras`}
        colunas={[
          { id: 'ni_ligas', label: 'Níquel e ligas' },
          { id: 'ti_ligas', label: 'Titânio e ligas' },
          { id: 'cu_eletrolitico', label: 'Cu eletrolítico fundido' },
          { id: 'metal_branco_sn', label: 'Metal branco – Sn' },
          { id: 'metal_branco_pb', label: 'Metal branco – Pb' },
          { id: 'outras_ligas', label: 'Outras ligas' },
        ]}
      />

      <PcaSectionCard title="35. Produção diária">
        {ligasProducaoDiaria.map((grupo) => (
          <div key={grupo.grupo} className="space-y-3 rounded-md border p-3">
            <p className="font-medium">{grupo.grupo}</p>
            {grupo.itens.map((liga) => {
              const ligaSlug = slugify(liga);
              return (
                <div key={ligaSlug} className="grid grid-cols-1 gap-3 md:grid-cols-5">
                  <p className="text-sm md:col-span-5">{liga}</p>
                  <FormField
                    control={form.control}
                    name={`${base}.producaoDiaria.${ligaSlug}.produz`}
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2 md:col-span-5">
                        <FormControl>
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={Boolean(field.value)}
                            onChange={(e) => field.onChange(e.target.checked)}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Liga produzida</FormLabel>
                      </FormItem>
                    )}
                  />
                  <PcaNumField form={form} name={`${base}.producaoDiaria.${ligaSlug}.pesoMinimoKg`} label="Peso mín. (Kg)" />
                  <PcaNumField form={form} name={`${base}.producaoDiaria.${ligaSlug}.pesoIdealKg`} label="Peso ideal (Kg)" />
                  <PcaNumField form={form} name={`${base}.producaoDiaria.${ligaSlug}.pesoMaximoKg`} label="Peso máx. (Kg)" />
                  <PcaNumField form={form} name={`${base}.producaoDiaria.${ligaSlug}.producaoDiariaKg`} label="Produção diária (Kg)" />
                </div>
              );
            })}
          </div>
        ))}
      </PcaSectionCard>

      <PcaSectionCard title="36. Processo de fusão – tipo de fornos">
        {combustiveisFusaoNf.map((comb) => (
          <div key={comb.id} className="space-y-2 rounded-md border p-3">
            <p className="font-medium capitalize">{comb.id.replace(/_/g, ' ')}</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <PcaCheckboxOptions
                form={form}
                name={`${base}.fusao.${comb.id}.tiposForno`}
                options={comb.tipos.map((t) => ({ id: t, label: t }))}
              />
              <PcaNumField form={form} name={`${base}.fusao.${comb.id}.numFornos`} label="Nº de fornos" />
              <PcaTextField form={form} name={`${base}.fusao.${comb.id}.ligaProduzida`} label="Liga metálica produzida" />
              <PcaNumField form={form} name={`${base}.fusao.${comb.id}.capacidadeTh`} label="Capacidade (T/h)" />
            </div>
          </div>
        ))}
        <PcaTextField form={form} name={`${base}.fusao.outrosCombustiveis`} label="Outros combustíveis – especificar" />
      </PcaSectionCard>

      <PcaSectionCard title="37. Modelagem">
        <FormDescription>Ferramental por liga produzida</FormDescription>
        {linhasModelagem.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-3">
            <PcaTextField form={form} name={`${base}.modelagem.ligas.${index}.liga`} label="Liga produzida" />
            <PcaCheckboxOptions
              form={form}
              name={`${base}.modelagem.ligas.${index}.ferramental`}
              options={[
                { id: 'propria', label: 'Modelagem própria' },
                { id: 'terceirizada', label: 'Modelagem terceirizada' },
              ]}
            />
            <div className="flex items-end justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeModelagem(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendModelagem({ liga: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar liga (modelagem)
        </Button>
      </PcaSectionCard>

      <PcaSectionCard title="38. Processo de macharia">
        <PcaCheckboxOptions
          form={form}
          name={`${base}.macharia.processos`}
          options={[
            { id: 'shell', label: 'Shell' },
            { id: 'cold_box', label: 'Cold box' },
            { id: 'hot_box', label: 'Hot box' },
            { id: 'no_bake', label: 'No bake' },
            { id: 'silicato_co2', label: 'Silicato – CO2' },
            { id: 'outros', label: 'Outros' },
          ]}
        />
        <PcaTextField form={form} name={`${base}.macharia.processosOutros`} label="Outros – descrever" />
        <PcaTextField form={form} name={`${base}.macharia.liga`} label="Liga produzida" />
        <PcaCheckboxOptions
          form={form}
          name={`${base}.macharia.fabricacao`}
          options={[
            { id: 'manual', label: 'Manual' },
            { id: 'mecanizado', label: 'Mecanizado' },
            { id: 'automatizado', label: 'Automatizado' },
          ]}
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <PcaTextField form={form} name={`${base}.macharia.modeloMaquina`} label="Modelo/tipo de máquina" />
          <PcaNumField form={form} name={`${base}.macharia.numMaquinas`} label="Nº de máquinas" />
          <PcaNumField form={form} name={`${base}.macharia.produtividadeMachosH`} label="Produtividade machos/h" />
        </div>
      </PcaSectionCard>

      <PcaSectionCard title="39. Processo de moldagem">
        <PcaCheckboxOptions
          form={form}
          name={`${base}.moldagem.tipos`}
          options={[
            { id: 'areia_verde', label: 'Areia sílico-argilosa sintética (areia verde)' },
            { id: 'shell_molding', label: 'Shell molding' },
            { id: 'areia_seca', label: 'Areia seca ou molde estufado' },
            { id: 'silicato_sodio', label: 'Areia silicato de sódio – CO2' },
            { id: 'areia_cimento', label: 'Areia cimento' },
            { id: 'areia_resina', label: 'Areia com resina' },
            { id: 'cera_perdida', label: 'Fundição de precisão (cera perdida)' },
            { id: 'coquilha', label: 'Fundição permanente / coquilha' },
            { id: 'sob_pressao', label: 'Fundição sob pressão convencional' },
            { id: 'baixa_pressao', label: 'Fundição sob baixa pressão' },
            { id: 'continua', label: 'Fundição contínua' },
            { id: 'squeeze', label: 'Fundição por compressão (squeeze)' },
            { id: 'semi_solido', label: 'Fundição em semi-sólido' },
            { id: 'outros', label: 'Outros' },
          ]}
        />
        <PcaTextField form={form} name={`${base}.moldagem.tiposOutros`} label="Outros – descrever" />
        <PcaTextField form={form} name={`${base}.moldagem.liga`} label="Liga produzida" />
        <PcaCheckboxOptions
          form={form}
          name={`${base}.moldagem.fabricacao`}
          options={[
            { id: 'manual', label: 'Manual' },
            { id: 'mecanizado', label: 'Mecanizado' },
            { id: 'automatizado', label: 'Automatizado' },
          ]}
        />
        <PcaCheckboxOptions
          form={form}
          name={`${base}.moldagem.vazamento`}
          options={[
            { id: 'gravidade', label: 'Por gravidade' },
            { id: 'centrifugacao', label: 'Centrifugação' },
            { id: 'vacuo', label: 'A vácuo' },
            { id: 'compressao', label: 'Compressão' },
          ]}
        />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <PcaTextField form={form} name={`${base}.moldagem.modeloMaquina`} label="Modelo/tipo de máquina" />
          <PcaNumField form={form} name={`${base}.moldagem.numMaquinas`} label="Nº de máquinas" />
          <PcaNumField form={form} name={`${base}.moldagem.produtividadeMoldesH`} label="Produtividade moldes/h" />
        </div>
      </PcaSectionCard>

      <PcaSectionCard title="40. Tratamento térmico das peças fundidas de metais não ferrosos">
        <PcaCheckboxOptions
          form={form}
          name={`${base}.tratamentoTermico.tratamentos`}
          options={[
            { id: 'recozimento_baixa', label: 'Recozimento a baixa temperatura' },
            { id: 'recozimento_homogeneizacao', label: 'Recozimento para homogeneização e recristalização' },
            { id: 'solubilizacao', label: 'Solubilização' },
            { id: 'precipitacao', label: 'Precipitação' },
            { id: 'tempera', label: 'Têmpera' },
            { id: 'revenimento', label: 'Revenimento' },
            { id: 'envelhecimento', label: 'Envelhecimento' },
            { id: 'encruamento', label: 'Encruamento' },
            { id: 'outros', label: 'Outros' },
          ]}
        />
        <PcaTextField form={form} name={`${base}.tratamentoTermico.ligas`} label="Ligas tratadas" />
        <PcaCheckboxOptions
          form={form}
          name={`${base}.tratamentoTermico.combustivelForno`}
          options={[
            { id: 'gas', label: 'Gás' },
            { id: 'eletrico', label: 'Elétrico' },
            { id: 'oleo', label: 'Óleo' },
          ]}
        />
        <PcaTextField form={form} name={`${base}.tratamentoTermico.outros`} label="Outros – especificar" />
      </PcaSectionCard>

      <MaquinasSetor form={form} basePath={`${base}.acabamento.maquinas`} titulo="41. Setor de acabamento das peças fundidas" />
      <MaquinasSetor form={form} basePath={`${base}.usinagem.maquinas`} titulo="42. Setor de usinagem" />

      <PcaSectionCard title="43. Processo de pintura das peças fundidas">
        {['primer', 'epoxi', 'verniz', 'outros'].map((tipo) => (
          <div key={tipo} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-3">
            <p className="font-medium capitalize">{tipo === 'outros' ? 'Outros' : tipo}</p>
            <PcaCheckboxOptions
              form={form}
              name={`${base}.pintura.${tipo}.metodos`}
              options={[
                { id: 'imersao', label: 'Por imersão' },
                { id: 'spray', label: 'Pistolas de spray' },
                { id: 'eletrostatico_po', label: 'Eletrostática a pó' },
                { id: 'pincel', label: 'Pincel/trincha' },
                { id: 'outros', label: 'Outros' },
              ]}
            />
            <PcaNumField form={form} name={`${base}.pintura.${tipo}.consumoMensalL`} label="Consumo mensal (L)" />
          </div>
        ))}
      </PcaSectionCard>

      <PcaSectionCard title="44. Tratamento químico superficial / galvanotécnico">
        <PcaTextField form={form} name={`${base}.tratamentoQuimico.ligas`} label="Ligas submetidas ao tratamento" />
        <PcaCheckboxOptions
          form={form}
          name={`${base}.tratamentoQuimico.tipos`}
          options={[
            { id: 'zincagem', label: 'Zincagem' },
            { id: 'fosfatizacao', label: 'Fosfatização' },
            { id: 'cromagem', label: 'Cromagem' },
            { id: 'cobreamento', label: 'Cobreamento' },
            { id: 'niquelagem', label: 'Niquelagem' },
            { id: 'anodizacao', label: 'Anodização' },
            { id: 'galvanoplastia', label: 'Galvanoplastia' },
            { id: 'outros', label: 'Outros' },
          ]}
        />
        <PcaCheckboxOptions
          form={form}
          name={`${base}.tratamentoQuimico.metodos`}
          options={[
            { id: 'imersao_quente', label: 'Por imersão a quente' },
            { id: 'eletrolitico', label: 'Eletrolítico' },
            { id: 'aspersao_termica', label: 'Aspersão térmica (metalização)' },
            { id: 'outros', label: 'Outros' },
          ]}
        />
        <PcaNumField form={form} name={`${base}.tratamentoQuimico.volumeMensalKg`} label="Volume mensal de peças tratadas (Kg)" />
        <FormField
          control={form.control}
          name={`${base}.tratamentoQuimico.observacoes`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações / detalhamento dos banhos químicos</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </PcaSectionCard>
    </div>
  );
}
