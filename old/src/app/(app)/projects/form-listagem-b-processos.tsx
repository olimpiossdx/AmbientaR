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
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';
import {
  BooleanRadio,
  CheckboxOptions,
  NumField,
  SectionCard,
  TextField,
} from './form-listagem-a-helpers';

const finalidadesAguaB = [
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

const segmentosLinhaProducao = [
  'Automotivo',
  'Aeronáutico',
  'Agrícola',
  'Eletrônico',
  'Saneamento',
  'Metal Mecânico',
  'Siderurgia/Mineração',
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

const ligasFerroFundido = [
  'Branco ligado – Low Chrome',
  'Branco ligado – High Chrome',
  'Branco ligado – Outras ligas',
  'Branco maleável',
  'Cinzento',
  'Mesclado',
  'Nodular comum',
  'Nodular especial',
];

const combustiveisFusao = [
  { id: 'coque', tipos: ['Cubilot', 'Cadinho'] },
  { id: 'eletrico_arco', tipos: ['Arco direto', 'Arco indireto'] },
  { id: 'eletrico_inducao', tipos: ['Cadinho', 'Canal'] },
  { id: 'eletrico_resistencia', tipos: ['Resistência externa', 'Resistência interna'] },
  { id: 'oleo', tipos: ['Rotativo', 'Com cadinho'] },
  { id: 'gas', tipos: ['Rotativo', 'Com cadinho', 'Tipo Bessemer', 'Outros fornos a gás'] },
];

function MaquinasSetor({
  form,
  basePath,
  titulo,
}: {
  form: any;
  basePath: string;
  titulo: string;
}) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: basePath });
  return (
    <SectionCard title={titulo}>
      {fields.map((item, index) => (
        <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
          <TextField form={form} name={`${basePath}.${index}.maquina`} label="Máquina" />
          <NumField form={form} name={`${basePath}.${index}.quantidade`} label="Quantidade" />
          <TextField
            form={form}
            name={`${basePath}.${index}.caracteristicas`}
            label="Características da máquina"
            className="md:col-span-2"
          />
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
    </SectionCard>
  );
}

export function FormListagemBProcessos({ form }: { form: any }) {
  const recirculaAgua = form.watch('listagemB.usoAguaFundicao.recirculaAgua');
  const { fields: linhasProducao, append: appendLinha, remove: removeLinha } = useFieldArray({
    control: form.control,
    name: 'listagemB.linhaProducao.itens',
  });

  return (
    <div className="space-y-6">
      <SectionCard title="33. Uso de água">
        <FormField
          control={form.control}
          name="listagemB.usoAguaFundicao.recirculaAgua"
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
            <NumField form={form} name="listagemB.usoAguaFundicao.volumeRecirculadoM3Mes" label="Volume recirculado (m³/mês)" />
            <NumField form={form} name="listagemB.usoAguaFundicao.percentualRecirculado" label="Porcentagem de água recirculada (%)" />
          </div>
        )}
        <FormDescription>Consumo por finalidade (m³/dia) — consumo diário máximo e médio</FormDescription>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Finalidade</TableHead>
              <TableHead>Consumo diário máximo</TableHead>
              <TableHead>Consumo diário médio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {finalidadesAguaB.map((finalidade) => {
              const slug = finalidade.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
              return (
                <TableRow key={slug}>
                  <TableCell className="font-medium">{finalidade}</TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`listagemB.usoAguaFundicao.finalidades.${slug}.maximo`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="number" step="any" {...field} value={field.value ?? ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`listagemB.usoAguaFundicao.finalidades.${slug}.medio`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="number" step="any" {...field} value={field.value ?? ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow>
              <TableCell className="font-semibold">Consumo total diário</TableCell>
              <TableCell>
                <NumField form={form} name="listagemB.usoAguaFundicao.consumoTotalMaximo" label="" />
              </TableCell>
              <TableCell>
                <NumField form={form} name="listagemB.usoAguaFundicao.consumoTotalMedio" label="" />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </SectionCard>

      <SectionCard title="34. Linha de produção do empreendimento">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Segmento</TableHead>
              <TableHead>Ferro fundido</TableHead>
              <TableHead>Aço</TableHead>
              <TableHead>Descrição do produto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {segmentosLinhaProducao.map((segmento) => {
              const slug = segmento.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
              return (
                <TableRow key={slug}>
                  <TableCell className="font-medium">{segmento}</TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`listagemB.linhaProducao.segmentos.${slug}.ferroFundido`}
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <input type="checkbox" className="h-4 w-4" checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`listagemB.linhaProducao.segmentos.${slug}.aco`}
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2">
                          <FormControl>
                            <input type="checkbox" className="h-4 w-4" checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`listagemB.linhaProducao.segmentos.${slug}.descricaoProduto`}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} value={field.value ?? ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {linhasProducao.map((item, index) => (
          <div key={item.id} className="mt-3 grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-3">
            <TextField form={form} name={`listagemB.linhaProducao.itens.${index}.segmento`} label="Segmento (outros)" />
            <TextField form={form} name={`listagemB.linhaProducao.itens.${index}.produto`} label="Produto" className="md:col-span-2" />
            <div className="md:col-span-3 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeLinha(index)}><Trash2 className="mr-2 h-4 w-4" />Remover</Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" className="mt-2" onClick={() => appendLinha({ segmento: '', produto: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar linha de produção
        </Button>
      </SectionCard>

      <SectionCard title="35. Produção diária">
        <CheckboxOptions
          form={form}
          name="listagemB.producaoDiaria.cargaMetalica"
          options={[
            { id: 'liquida', label: 'Carga líquida' },
            { id: 'solida', label: 'Carga sólida' },
            { id: 'mista', label: 'Carga mista' },
          ]}
        />
        <p className="text-sm font-medium">Ligas produzidas – ferro fundido</p>
        <CheckboxOptions
          form={form}
          name="listagemB.producaoDiaria.ligasFerroFundido"
          options={ligasFerroFundido.map((l) => ({ id: l, label: l }))}
        />
        <CheckboxOptions
          form={form}
          name="listagemB.producaoDiaria.ligasAco"
          options={[
            { id: 'aco_carbono', label: 'Aço carbono' },
            { id: 'aco_ligado', label: 'Aço ligado' },
          ]}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <NumField form={form} name="listagemB.producaoDiaria.pesoMinimoKg" label="Peso unitário mínimo (Kg)" />
          <NumField form={form} name="listagemB.producaoDiaria.pesoIdealKg" label="Peso unitário ideal (Kg)" />
          <NumField form={form} name="listagemB.producaoDiaria.pesoMaximoKg" label="Peso unitário máximo (Kg)" />
          <NumField form={form} name="listagemB.producaoDiaria.producaoDiariaPecasKg" label="Produção diária peças acabadas (Kg)" />
        </div>
      </SectionCard>

      <SectionCard title="36. Processo de fusão">
        {combustiveisFusao.map((comb) => (
          <div key={comb.id} className="space-y-2 rounded-md border p-3">
            <p className="font-medium capitalize">{comb.id.replace(/_/g, ' ')}</p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
              <CheckboxOptions
                form={form}
                name={`listagemB.fusao.${comb.id}.tiposForno`}
                options={comb.tipos.map((t) => ({ id: t, label: t }))}
              />
              <NumField form={form} name={`listagemB.fusao.${comb.id}.numFornos`} label="Nº de fornos" />
              <FormField
                control={form.control}
                name={`listagemB.fusao.${comb.id}.ferroFundido`}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <input type="checkbox" className="h-4 w-4" checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} />
                    </FormControl>
                    <FormLabel>Ferro fundido</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`listagemB.fusao.${comb.id}.aco`}
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <input type="checkbox" className="h-4 w-4" checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} />
                    </FormControl>
                    <FormLabel>Aço</FormLabel>
                  </FormItem>
                )}
              />
              <NumField form={form} name={`listagemB.fusao.${comb.id}.capacidadeTh`} label="Capacidade (T/h)" />
            </div>
          </div>
        ))}
        <TextField form={form} name="listagemB.fusao.outrosCombustiveis" label="Outros combustíveis – especificar" />
      </SectionCard>

      <SectionCard title="37. Modelagem">
        <p className="text-sm text-muted-foreground">Ferramental por material</p>
        {['ferroFundido', 'aco'].map((material) => (
          <div key={material} className="rounded-md border p-3">
            <p className="mb-2 font-medium">{material === 'ferroFundido' ? 'Ferro fundido' : 'Aço'}</p>
            <CheckboxOptions
              form={form}
              name={`listagemB.modelagem.${material}.ferramental`}
              options={[
                { id: 'propria', label: 'Modelagem própria' },
                { id: 'terceirizada', label: 'Modelagem terceirizada' },
              ]}
            />
          </div>
        ))}
      </SectionCard>

      <SectionCard title="38. Processo de macharia">
        <CheckboxOptions
          form={form}
          name="listagemB.macharia.processos"
          options={[
            { id: 'shell', label: 'Shell' },
            { id: 'cold_box', label: 'Cold box' },
            { id: 'hot_box', label: 'Hot box' },
            { id: 'no_bake', label: 'No bake' },
            { id: 'silicato_co2', label: 'Silicato – CO2' },
            { id: 'outros', label: 'Outros' },
          ]}
        />
        <TextField form={form} name="listagemB.macharia.processosOutros" label="Outros – descrever" />
        {['ferroFundido', 'aco'].map((material) => (
          <div key={material} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
            <p className="font-medium md:col-span-4">{material === 'ferroFundido' ? 'Ferro fundido' : 'Aço'}</p>
            <CheckboxOptions
              form={form}
              name={`listagemB.macharia.${material}.fabricacao`}
              options={[
                { id: 'manual', label: 'Manual' },
                { id: 'mecanizado', label: 'Mecanizado' },
                { id: 'automatizado', label: 'Automatizado' },
              ]}
            />
            <TextField form={form} name={`listagemB.macharia.${material}.modeloMaquina`} label="Modelo/tipo de máquina" />
            <NumField form={form} name={`listagemB.macharia.${material}.numMaquinas`} label="Nº de máquinas" />
            <NumField form={form} name={`listagemB.macharia.${material}.produtividadeMachosH`} label="Produtividade machos/h" />
          </div>
        ))}
      </SectionCard>

      <SectionCard title="39. Processo de moldagem">
        <CheckboxOptions
          form={form}
          name="listagemB.moldagem.tiposAreia"
          options={[
            { id: 'areia_verde', label: 'Areia sílico-argilosa sintética (areia verde)' },
            { id: 'shell_molding', label: 'Shell molding' },
            { id: 'areia_seca', label: 'Areia seca ou molde estufado' },
            { id: 'silicato_sodio', label: 'Areia silicato de sódio – CO2' },
            { id: 'areia_cimento', label: 'Areia cimento' },
            { id: 'areia_resina', label: 'Areia com resina' },
            { id: 'cera_perdida', label: 'Fundição de precisão (cera perdida)' },
            { id: 'coquilha', label: 'Fundição permanente / coquilha' },
            { id: 'sob_pressao', label: 'Fundição sob pressão' },
            { id: 'continua', label: 'Fundição contínua' },
            { id: 'outros', label: 'Outros' },
          ]}
        />
        <TextField form={form} name="listagemB.moldagem.tiposOutros" label="Outros – descrever" />
        {['ferroFundido', 'aco'].map((material) => (
          <div key={material} className="space-y-3 rounded-md border p-3">
            <p className="font-medium">{material === 'ferroFundido' ? 'Ferro fundido' : 'Aço'}</p>
            <CheckboxOptions
              form={form}
              name={`listagemB.moldagem.${material}.fabricacao`}
              options={[
                { id: 'manual', label: 'Manual' },
                { id: 'mecanizado', label: 'Mecanizado' },
                { id: 'automatizado', label: 'Automatizado' },
              ]}
            />
            <CheckboxOptions
              form={form}
              name={`listagemB.moldagem.${material}.vazamento`}
              options={[
                { id: 'gravidade', label: 'Por gravidade' },
                { id: 'centrifugacao', label: 'Centrifugação' },
                { id: 'vacuo', label: 'A vácuo' },
              ]}
            />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <TextField form={form} name={`listagemB.moldagem.${material}.modeloMaquina`} label="Modelo/tipo de máquina" />
              <NumField form={form} name={`listagemB.moldagem.${material}.numMaquinas`} label="Nº de máquinas" />
              <NumField form={form} name={`listagemB.moldagem.${material}.produtividadeMoldesH`} label="Produtividade moldes/h" />
            </div>
          </div>
        ))}
      </SectionCard>

      <SectionCard title="40. Tratamento térmico das peças fundidas">
        <CheckboxOptions
          form={form}
          name="listagemB.tratamentoTermico.tratamentos"
          options={[
            { id: 'recozimento', label: 'Recozimento' },
            { id: 'normalizacao', label: 'Normalização' },
            { id: 'tempera', label: 'Têmpera' },
            { id: 'revenimento', label: 'Revenimento' },
            { id: 'alivio_tensoes', label: 'Alívio de tensões' },
            { id: 'envelhecimento', label: 'Envelhecimento' },
            { id: 'banho_sal', label: 'Banho de sal (cianetos)' },
            { id: 'cementacao', label: 'Cementação' },
            { id: 'nitretacao', label: 'Nitretação' },
            { id: 'carbonitretacao', label: 'Carbonitretação' },
            { id: 'tempera_superficial_chama', label: 'Têmpera superficial por chama' },
            { id: 'tempera_superficial_inducao', label: 'Têmpera superficial por indução' },
            { id: 'outros', label: 'Outros' },
          ]}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FormField
            control={form.control}
            name="listagemB.tratamentoTermico.fofo"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl><input type="checkbox" className="h-4 w-4" checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} /></FormControl>
                <FormLabel>Fofo</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="listagemB.tratamentoTermico.aco"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl><input type="checkbox" className="h-4 w-4" checked={Boolean(field.value)} onChange={(e) => field.onChange(e.target.checked)} /></FormControl>
                <FormLabel>Aço</FormLabel>
              </FormItem>
            )}
          />
          <CheckboxOptions
            form={form}
            name="listagemB.tratamentoTermico.combustivelForno"
            options={[
              { id: 'gas', label: 'Gás' },
              { id: 'eletrico', label: 'Elétrico' },
              { id: 'oleo', label: 'Óleo' },
            ]}
          />
        </div>
        <TextField form={form} name="listagemB.tratamentoTermico.outros" label="Outros – especificar" />
      </SectionCard>

      <MaquinasSetor form={form} basePath="listagemB.acabamento.maquinas" titulo="41. Setor de acabamento das peças fundidas" />
      <MaquinasSetor form={form} basePath="listagemB.usinagem.maquinas" titulo="42. Setor de usinagem" />

      <SectionCard title="43. Processo de pintura das peças fundidas">
        <FormDescription>Caso haja pintura, preencher o quadro abaixo.</FormDescription>
        {['primer', 'epoxi', 'verniz', 'outros'].map((tipo) => (
          <div key={tipo} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-3">
            <p className="font-medium capitalize">{tipo === 'outros' ? 'Outros' : tipo}</p>
            <CheckboxOptions
              form={form}
              name={`listagemB.pintura.${tipo}.metodos`}
              options={[
                { id: 'imersao', label: 'Por imersão' },
                { id: 'spray', label: 'Pistolas de spray' },
                { id: 'eletrolitico_po', label: 'Eletrolítica a pó' },
                { id: 'pincel', label: 'Pincel/trincha' },
                { id: 'outros', label: 'Outros' },
              ]}
            />
            <NumField form={form} name={`listagemB.pintura.${tipo}.consumoMensalL`} label="Consumo mensal (L)" />
          </div>
        ))}
      </SectionCard>

      <SectionCard title="44. Tratamento químico superficial das peças fundidas">
        <FormDescription>Caso haja tratamento químico superficial, preencher o quadro abaixo.</FormDescription>
        <CheckboxOptions
          form={form}
          name="listagemB.tratamentoQuimico.zincagem"
          options={[
            { id: 'alcalina', label: 'Zincagem alcalina' },
            { id: 'cromatizacao_verde', label: 'Com cromatização verde oliva' },
            { id: 'cromatizacao_amarela', label: 'Cromatização amarela (bicromatização)' },
            { id: 'cromatizacao_amarelo_trivalente', label: 'Cromatização amarelo trivalente' },
            { id: 'cromatizacao_azul', label: 'Cromatização azul trivalente' },
            { id: 'cromatizacao_branca', label: 'Cromatização branca' },
            { id: 'cromatizacao_preto', label: 'Cromatização preto' },
            { id: 'selantes', label: 'Com selantes' },
            { id: 'passivacao_incolor', label: 'Passivação incolor' },
            { id: 'outros', label: 'Outros' },
          ]}
        />
        <CheckboxOptions
          form={form}
          name="listagemB.tratamentoQuimico.metodos"
          options={[
            { id: 'imersao_quente', label: 'Por imersão a quente (galvanização a fogo)' },
            { id: 'eletrolitico', label: 'Eletrolítico (galvanização a frio)' },
            { id: 'aspersao_termica', label: 'Aspersão térmica (metalização)' },
            { id: 'outros', label: 'Outros' },
          ]}
        />
        <CheckboxOptions
          form={form}
          name="listagemB.tratamentoQuimico.outrosTratamentos"
          options={[
            { id: 'fosfatizacao', label: 'Fosfatização' },
            { id: 'cromagem', label: 'Cromagem' },
            { id: 'cobreamento', label: 'Cobreamento' },
            { id: 'niquelagem', label: 'Niquelagem' },
            { id: 'oxidacao', label: 'Oxidação' },
            { id: 'oleamento', label: 'Oleamento' },
            { id: 'decapagem', label: 'Decapagem' },
            { id: 'desidrogenizacao', label: 'Desidrogenização' },
          ]}
        />
        <NumField form={form} name="listagemB.tratamentoQuimico.volumeMensalKg" label="Volume mensal de peças tratadas (Kg)" />
      </SectionCard>
    </div>
  );
}
