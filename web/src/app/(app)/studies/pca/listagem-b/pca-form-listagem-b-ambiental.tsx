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
const equipamentosRefrigeracao = [
  'Forno elétrico de fusão',
  'Forno cubilot',
  'Sistema de recuperação/resfriamento de areia',
  'Calha vibratória de desmoldagem de peças',
  'Outros',
];

const equipamentosLavadorGases = [
  'Forno a óleo',
  'Forno cubilot',
  'Forno a gás',
  'Sistema de pintura de peças fundidas',
  'Sistema de tratamento químico superficial de peças fundidas',
  'Outros',
];

const opcoesRefrigeracao = [
  { id: 'torre_resfriamento', label: 'Torre de resfriamento (ventilador elétrico)' },
  { id: 'tanque_decantacao', label: 'Tanque de decantação' },
  { id: 'outros', label: 'Outros. Especificar' },
];

const opcoesDesaguamento = [
  { id: 'rede_industrial', label: 'Rede industrial' },
  { id: 'curso_dagua', label: "Curso d'água" },
  { id: 'rede_publica', label: 'Rede pública' },
  { id: 'recirculacao', label: 'Recirculação em circuito fechado' },
  { id: 'outros', label: 'Outros. Descrever' },
];

const opcoesLavadorGases = [
  { id: 'torre_spray', label: 'Lavador tipo torre de spray' },
  { id: 'venturi', label: 'Lavador tipo Venturi' },
  { id: 'outros', label: 'Outros. Especificar' },
];

const parametrosEfluenteLavadorAntes = [
  'Sólidos totais',
  'pH',
  'Amônia',
  'Cianetos',
  'Fenóis',
  'Ferro total',
  'Vazão do efluente',
];

const parametrosEfluenteLavadorDepois = [
  'Sólidos totais',
  'pH',
  'Amônia',
  'Cianetos',
  'Fenóis',
  'Ferro total',
  'Temperatura',
];

const parametrosEfluenteLiquidoAntes = [
  'Sólidos em suspensão',
  'Materiais sedimentáveis',
  'pH',
  'Ferro solúvel',
  'Cianetos',
  'Metais pesados',
  'Vazão do efluente',
];

const parametrosEfluenteLiquidoDepois = [
  'Sólidos em suspensão',
  'Materiais sedimentáveis',
  'pH',
  'Temperatura',
];

const parametrosEfluenteSanitarioAntes = [
  'Sólidos em suspensão',
  'Materiais sedimentáveis',
  'pH',
  'DBO',
  'Vazão do efluente',
];

const parametrosEfluenteSanitarioDepois = [
  'Sólidos em suspensão',
  'Materiais sedimentáveis',
  'pH',
  'DBO',
  'Vazão do efluente',
];

function TabelaRefrigeracao({ form }: { form: any }) {
  const usaRefrigeracao = form.watch('listagemB.efluentes.refrigeracao.utiliza');
  return (
    <PcaSectionCard title="46.1 Efluente de resfriamento / refrigeração industrial">
      <FormField
        control={form.control}
        name="listagemB.efluentes.refrigeracao.utiliza"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              O empreendimento faz uso de sistemas de refrigeração com água em fornos de fusão, recuperação de areia, calha vibratória e/ou outros?
            </FormLabel>
            <FormControl>
              <BooleanRadio value={field.value} onChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
      {usaRefrigeracao && (
        <div className="space-y-4">
          {equipamentosRefrigeracao.map((eq) => {
            const slug = eq.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
            return (
              <div key={slug} className="rounded-md border p-3">
                <p className="mb-2 font-medium">{eq}</p>
                <PcaCheckboxOptions form={form} name={`listagemB.efluentes.refrigeracao.${slug}.sistema`} options={opcoesRefrigeracao} />
                <PcaTextField form={form} name={`listagemB.efluentes.refrigeracao.${slug}.sistemaOutros`} label="Outros – especificar" />
                <PcaCheckboxOptions form={form} name={`listagemB.efluentes.refrigeracao.${slug}.desaguamento`} options={opcoesDesaguamento} />
                <PcaTextField form={form} name={`listagemB.efluentes.refrigeracao.${slug}.desaguamentoOutros`} label="Desaguamento – outros" />
              </div>
            );
          })}
        </div>
      )}
    </PcaSectionCard>
  );
}

function TabelaLavadorGases({ form }: { form: any }) {
  const usaLavador = form.watch('listagemB.efluentes.lavadorGases.utiliza');
  return (
    <PcaSectionCard title="46.2 Efluente de lavadores de gases (controle de emissões via úmida)">
      <FormField
        control={form.control}
        name="listagemB.efluentes.lavadorGases.utiliza"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Há utilização de sistema de lavagem de gases em fornos de fusão, pintura, tratamento químico superficial e/ou outros?
            </FormLabel>
            <FormControl>
              <BooleanRadio value={field.value} onChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
      {usaLavador && (
        <div className="space-y-4">
          {equipamentosLavadorGases.map((eq) => {
            const slug = eq.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
            return (
              <div key={slug} className="rounded-md border p-3">
                <p className="mb-2 font-medium">{eq}</p>
                <PcaCheckboxOptions form={form} name={`listagemB.efluentes.lavadorGases.${slug}.tipo`} options={opcoesLavadorGases} />
                <PcaCheckboxOptions form={form} name={`listagemB.efluentes.lavadorGases.${slug}.desaguamento`} options={opcoesDesaguamento} />
                <FormField
                  control={form.control}
                  name={`listagemB.efluentes.lavadorGases.${slug}.tratamentoEfluente`}
                  render={({ field }) => (
                    <FormItem className="mt-2">
                      <FormLabel>Sistema de tratamento dos efluentes líquidos?</FormLabel>
                      <FormControl>
                        <BooleanRadio value={field.value} onChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {form.watch(`listagemB.efluentes.lavadorGases.${slug}.tratamentoEfluente`) && (
                  <FormField
                    control={form.control}
                    name={`listagemB.efluentes.lavadorGases.${slug}.tratamentoDescricao`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrever processo de tratamento</FormLabel>
                        <FormControl>
                          <Textarea rows={2} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </PcaSectionCard>
  );
}

export function PcaFormListagemBAmbiental({ form }: { form: any }) {
  const geraEnergia = form.watch('listagemB.energia.geraEnergiaPropria');
  const haDepositoOleoso = form.watch('listagemB.efluentes.oleosos.haDeposito');
  const haMateriaisLiquidos = form.watch('listagemB.efluentes.materiaisLiquidos.existe');
  const haTratamentoQuimico = form.watch('listagemB.efluentes.quimicoSuperficial.existe');
  const haTratamentoLiquidos = form.watch('listagemB.efluentes.liquidos.haTratamento');
  const avaliouLiquidos = form.watch('listagemB.efluentes.liquidos.avaliou');
  const sanitariosTratados = form.watch('listagemB.efluentes.sanitarios.contemplados');
  const avaliouSanitarios = form.watch('listagemB.efluentes.sanitarios.avaliou');
  const haDrenagemPluvial = form.watch('listagemB.efluentes.pluviais.existeDrenagem');
  const tratamentoPluvial = form.watch('listagemB.efluentes.pluviais.temTratamento');
  const avaliouPluviais = form.watch('listagemB.efluentes.pluviais.avaliou');
  const utilizaMoldagemAreia = form.watch('listagemB.emissoes.moldagemAreia.utiliza');
  const utilizaJateamento = form.watch('listagemB.emissoes.jateamento.utiliza');
  const haPinturaEmissoes = form.watch('listagemB.emissoes.pintura.utiliza');
  const haTratamentoTermicoEmissoes = form.watch('listagemB.emissoes.tratamentoTermico.geraEmissoes');
  const utilizaMoldagemResiduo = form.watch('listagemB.residuos.areiaMoldagem.utiliza');
  const utilizaMachariaResiduo = form.watch('listagemB.residuos.areiaMacharia.utiliza');
  const utilizaControleUmido = form.watch('listagemB.residuos.controleUmido.utiliza');
  const haPassivo = form.watch('listagemB.passivosAmbientais.existePassivo');

  const { fields: equipamentosLavador, append: appendEquipLavador, remove: removeEquipLavador } = useFieldArray({
    control: form.control,
    name: 'listagemB.efluentes.tratamentoLavador.equipamentos',
  });
  const { fields: unidadesOleosas, append: appendUnidadeOleosa, remove: removeUnidadeOleosa } = useFieldArray({
    control: form.control,
    name: 'listagemB.efluentes.oleosos.unidades',
  });
  const { fields: depositosMateriais, append: appendDeposito, remove: removeDeposito } = useFieldArray({
    control: form.control,
    name: 'listagemB.efluentes.materiaisLiquidos.depositos',
  });
  const { fields: processosQuimicos, append: appendProcessoQuimico, remove: removeProcessoQuimico } = useFieldArray({
    control: form.control,
    name: 'listagemB.efluentes.quimicoSuperficial.processos',
  });
  const { fields: linhasMoldagem, append: appendLinhaMoldagem, remove: removeLinhaMoldagem } = useFieldArray({
    control: form.control,
    name: 'listagemB.emissoes.moldagemAreia.linhas',
  });
  const { fields: equipamentosJateamento, append: appendJateamento, remove: removeJateamento } = useFieldArray({
    control: form.control,
    name: 'listagemB.emissoes.jateamento.equipamentos',
  });
  const { fields: fornosFusao, append: appendForno, remove: removeForno } = useFieldArray({
    control: form.control,
    name: 'listagemB.emissoes.fusao.fornos',
  });
  const { fields: sistemasPintura, append: appendSistemaPintura, remove: removeSistemaPintura } = useFieldArray({
    control: form.control,
    name: 'listagemB.emissoes.pintura.sistemas',
  });
  const { fields: processosAreiaMoldagem, append: appendProcessoAreia, remove: removeProcessoAreia } = useFieldArray({
    control: form.control,
    name: 'listagemB.residuos.areiaMoldagem.processos',
  });
  const { fields: processosMacharia, append: appendProcessoMacharia, remove: removeProcessoMacharia } = useFieldArray({
    control: form.control,
    name: 'listagemB.residuos.areiaMacharia.processos',
  });
  const { fields: fornosEscoria, append: appendFornoEscoria, remove: removeFornoEscoria } = useFieldArray({
    control: form.control,
    name: 'listagemB.residuos.escoria.fornos',
  });
  const { fields: equipamentosResiduoUmido, append: appendEquipResiduo, remove: removeEquipResiduo } = useFieldArray({
    control: form.control,
    name: 'listagemB.residuos.controleUmido.equipamentos',
  });

  return (
    <div className="space-y-6">
      <PcaSectionCard title="45. Equipamentos ou sistemas para geração de energia elétrica">
        <FormField
          control={form.control}
          name="listagemB.energia.geraEnergiaPropria"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Há geração de energia elétrica própria no empreendimento?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {geraEnergia && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PcaNumField form={form} name="listagemB.energia.cogeracaoKw" label="Cogeração (kW)" />
            <PcaNumField form={form} name="listagemB.energia.grupoGeradorKw" label="Grupo gerador (kW)" />
            <PcaNumField form={form} name="listagemB.energia.outrasGeracaoKw" label="Outras formas in loco (kW)" />
            <PcaTextField form={form} name="listagemB.energia.outrasGeracaoEspecificar" label="Outras – especificar" />
          </div>
        )}
        <PcaCheckboxOptions
          form={form}
          name="listagemB.energia.usoTerceiros"
          options={[
            { id: 'total', label: 'Uso de energia fornecida por terceiros – total' },
            { id: 'parcial', label: 'Uso de energia fornecida por terceiros – em parte' },
          ]}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PcaTextField form={form} name="listagemB.energia.empresaFornecedora" label="Nome da empresa fornecedora" />
          <PcaNumField form={form} name="listagemB.energia.demandaContratadaKwhMes" label="Demanda contratada (kWh/mês)" />
          <PcaNumField form={form} name="listagemB.energia.consumoMedioKwhMes" label="Consumo mensal médio (kWh/mês)" />
        </div>
        <FormField
          control={form.control}
          name="listagemB.energia.possuiSubestacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subestação?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch('listagemB.energia.possuiSubestacao') && (
          <PcaNumField form={form} name="listagemB.energia.tensaoSubestacaoKv" label="Tensão (kV)" />
        )}
      </PcaSectionCard>

      <TabelaRefrigeracao form={form} />
      <TabelaLavadorGases form={form} />

      <PcaSectionCard title="Tratamento dos efluentes dos lavadores de gases">
        <FormDescription>Repetir para cada equipamento quando necessário.</FormDescription>
        {equipamentosLavador.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-md border p-3">
            <PcaTextField form={form} name={`listagemB.efluentes.tratamentoLavador.equipamentos.${index}.identificacao`} label={`Equipamento ${index + 1}`} />
            <FormField
              control={form.control}
              name={`listagemB.efluentes.tratamentoLavador.equipamentos.${index}.avaliouEfluente`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foi realizada avaliação do efluente do lavador de gases?</FormLabel>
                  <FormControl>
                    <BooleanRadio value={field.value} onChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            {form.watch(`listagemB.efluentes.tratamentoLavador.equipamentos.${index}.avaliouEfluente`) && (
              <CaracterizacaoEfluenteAntesDepois
                form={form}
                basePath={`listagemB.efluentes.tratamentoLavador.equipamentos.${index}.caracterizacao`}
                parametrosAntes={parametrosEfluenteLavadorAntes}
                parametrosDepois={parametrosEfluenteLavadorDepois}
              />
            )}
            <PcaCheckboxOptions
              form={form}
              name={`listagemB.efluentes.tratamentoLavador.equipamentos.${index}.decantacao`}
              options={[
                { id: 'metalico', label: 'Decantador metálico' },
                { id: 'alvenaria', label: 'Decantador de alvenaria' },
                { id: 'lagoas', label: 'Lagoas de decantação' },
                { id: 'outros', label: 'Outros decantadores' },
              ]}
            />
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <PcaNumField form={form} name={`listagemB.efluentes.tratamentoLavador.equipamentos.${index}.areaM2`} label="Área superfície (m²)" />
              <PcaNumField form={form} name={`listagemB.efluentes.tratamentoLavador.equipamentos.${index}.alturaUtilM`} label="Altura útil (m)" />
              <PcaNumField form={form} name={`listagemB.efluentes.tratamentoLavador.equipamentos.${index}.alturaTotalM`} label="Altura total (m)" />
              <PcaNumField form={form} name={`listagemB.efluentes.tratamentoLavador.equipamentos.${index}.tempoResidenciaH`} label="Tempo de residência (h)" />
            </div>
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeEquipLavador(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover equipamento
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendEquipLavador({ identificacao: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar equipamento (tratamento lavador)
        </Button>
      </PcaSectionCard>

      <PcaSectionCard title="46.3 Efluentes oleosos">
        <FormField
          control={form.control}
          name="listagemB.efluentes.oleosos.haDeposito"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Há depósito de materiais oleosos/graxas e/ou geração de efluentes oleosos (oficinas, manutenção, usinagem, tanques de óleo etc.)?
              </FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {haDepositoOleoso && (
          <>
            <FormField
              control={form.control}
              name="listagemB.efluentes.oleosos.setoresDescricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrever unidades/setores</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            {unidadesOleosas.map((item, index) => (
              <div key={item.id} className="space-y-3 rounded-md border p-3">
                <p className="font-medium">Unidade / setor {index + 1}</p>
                <FormField
                  control={form.control}
                  name={`listagemB.efluentes.oleosos.unidades.${index}.pisoImpermeabilizado`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Piso impermeabilizado?</FormLabel>
                      <FormControl>
                        <BooleanRadio value={field.value} onChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`listagemB.efluentes.oleosos.unidades.${index}.pisoDescricao`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aspectos construtivos do piso</FormLabel>
                      <FormControl>
                        <Textarea rows={2} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`listagemB.efluentes.oleosos.unidades.${index}.contencao`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sistema de contenção?</FormLabel>
                      <FormControl>
                        <BooleanRadio value={field.value} onChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <PcaCheckboxOptions
                  form={form}
                  name={`listagemB.efluentes.oleosos.unidades.${index}.tratamento`}
                  options={[
                    { id: 'caixa_areia', label: 'Caixa de areia' },
                    { id: 'csao', label: 'CSAO' },
                    { id: 'decantador', label: 'Decantador' },
                    { id: 'outros', label: 'Outros' },
                  ]}
                />
                <PcaCheckboxOptions
                  form={form}
                  name={`listagemB.efluentes.oleosos.unidades.${index}.destinoFinal`}
                  options={[
                    { id: 'rede_industrial', label: 'Rede industrial' },
                    { id: 'curso_dagua', label: "Curso d'água" },
                    { id: 'rede_publica', label: 'Rede pública' },
                    { id: 'reciclagem', label: 'Empresas de reciclagem (re-refino)' },
                    { id: 'outros', label: 'Outros' },
                  ]}
                />
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => removeUnidadeOleosa(index)}>
                    <Trash2 className="mr-2 h-4 w-4" />Remover unidade
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => appendUnidadeOleosa({})}>
              <PlusCircle className="mr-2 h-4 w-4" />Adicionar unidade/setor
            </Button>
          </>
        )}
      </PcaSectionCard>

      <PcaSectionCard title="46.4 Efluentes de derramamentos (materiais líquidos/pastosos)">
        <FormField
          control={form.control}
          name="listagemB.efluentes.materiaisLiquidos.existe"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Existe depósito/manuseio de materiais líquidos ou pastosos (resinas, catalisadores, tintas, querosene, álcool etc.), exceto óleos?
              </FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {haMateriaisLiquidos && (
          <>
            <FormField
              control={form.control}
              name="listagemB.efluentes.materiaisLiquidos.listaMateriais"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Listar materiais depositados/utilizados</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            {depositosMateriais.map((item, index) => (
              <div key={item.id} className="space-y-3 rounded-md border p-3">
                <p className="font-medium">Depósito/utilização {index + 1}</p>
                <FormField
                  control={form.control}
                  name={`listagemB.efluentes.materiaisLiquidos.depositos.${index}.pisoImpermeabilizado`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Piso impermeabilizado?</FormLabel>
                      <FormControl>
                        <BooleanRadio value={field.value} onChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`listagemB.efluentes.materiaisLiquidos.depositos.${index}.contencao`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sistema de contenção?</FormLabel>
                      <FormControl>
                        <BooleanRadio value={field.value} onChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <PcaCheckboxOptions
                  form={form}
                  name={`listagemB.efluentes.materiaisLiquidos.depositos.${index}.destinoFinal`}
                  options={[
                    { id: 'retorno_recipiente', label: 'Retorna ao recipiente/tanque para reutilização' },
                    { id: 'terceiros', label: 'Recolhido e enviado a terceiros' },
                    { id: 'rede_industrial', label: 'Rede industrial' },
                    { id: 'curso_dagua', label: "Curso d'água" },
                    { id: 'rede_publica', label: 'Rede pública' },
                    { id: 'outros', label: 'Outros' },
                  ]}
                />
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => removeDeposito(index)}>
                    <Trash2 className="mr-2 h-4 w-4" />Remover
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => appendDeposito({})}>
              <PlusCircle className="mr-2 h-4 w-4" />Adicionar depósito
            </Button>
          </>
        )}
      </PcaSectionCard>

      <PcaSectionCard title="46.5 Efluentes do tratamento químico superficial">
        <FormField
          control={form.control}
          name="listagemB.efluentes.quimicoSuperficial.existe"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Existe processo de tratamento químico superficial conforme item 44?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {haTratamentoQuimico && (
          <>
            {processosQuimicos.map((item, index) => (
              <div key={item.id} className="space-y-3 rounded-md border p-3">
                <p className="font-medium">Processo {index + 1}</p>
                <PcaTextField form={form} name={`listagemB.efluentes.quimicoSuperficial.processos.${index}.nome`} label="Processo" />
                <FormField
                  control={form.control}
                  name={`listagemB.efluentes.quimicoSuperficial.processos.${index}.pisoImpermeabilizado`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Piso impermeabilizado?</FormLabel>
                      <FormControl>
                        <BooleanRadio value={field.value} onChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <PcaCheckboxOptions
                  form={form}
                  name={`listagemB.efluentes.quimicoSuperficial.processos.${index}.destinoFinal`}
                  options={opcoesDesaguamento}
                />
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => removeProcessoQuimico(index)}>
                    <Trash2 className="mr-2 h-4 w-4" />Remover processo
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => appendProcessoQuimico({ nome: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" />Adicionar processo
            </Button>
          </>
        )}
      </PcaSectionCard>

      <PcaSectionCard title="Efluentes líquidos – tratamento geral">
        <FormField
          control={form.control}
          name="listagemB.efluentes.liquidos.haTratamento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Há sistema de tratamento dos efluentes líquidos antes do descarte?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {haTratamentoLiquidos && (
          <FormField
            control={form.control}
            name="listagemB.efluentes.liquidos.descricaoTratamento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrever sistema de tratamento</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="listagemB.efluentes.liquidos.avaliou"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Foi realizada avaliação dos efluentes líquidos?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {avaliouLiquidos && (
          <CaracterizacaoEfluenteAntesDepois
            form={form}
            basePath="listagemB.efluentes.liquidos.caracterizacao"
            parametrosAntes={parametrosEfluenteLiquidoAntes}
            parametrosDepois={parametrosEfluenteLiquidoDepois}
          />
        )}
      </PcaSectionCard>

      <PcaSectionCard title="46.6 Efluentes sanitários">
        <FormField
          control={form.control}
          name="listagemB.efluentes.sanitarios.contemplados"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Os efluentes sanitários são contemplados por sistema de tratamento?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {sanitariosTratados && (
          <>
            <PcaCheckboxOptions
              form={form}
              name="listagemB.efluentes.sanitarios.sistemaTratamento"
              options={[
                { id: 'fossa_filtro', label: 'Fossa séptica / filtro anaeróbio' },
                { id: 'reatores_aerobios', label: 'Reatores aeróbios' },
                { id: 'rede_publica_tratada', label: 'Rede pública com tratamento' },
                { id: 'outros', label: 'Outros' },
              ]}
            />
            <PcaCheckboxOptions
              form={form}
              name="listagemB.efluentes.sanitarios.destinoFinal"
              options={[
                { id: 'sumidouro', label: 'Sumidouro' },
                { id: 'curso_dagua', label: "Curso d'água" },
                { id: 'rede_publica', label: 'Rede pública' },
                { id: 'outros', label: 'Outros' },
              ]}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <PcaNumField form={form} name="listagemB.efluentes.sanitarios.usuariosDimensionados" label="Dimensionado para quantos usuários?" />
              <PcaNumField form={form} name="listagemB.efluentes.sanitarios.numEstacoes" label="Nº de estações de tratamento" />
            </div>
          </>
        )}
        <FormField
          control={form.control}
          name="listagemB.efluentes.sanitarios.avaliou"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Foi realizada avaliação dos efluentes sanitários?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {avaliouSanitarios && (
          <CaracterizacaoEfluenteAntesDepois
            form={form}
            basePath="listagemB.efluentes.sanitarios.caracterizacao"
            parametrosAntes={parametrosEfluenteSanitarioAntes}
            parametrosDepois={parametrosEfluenteSanitarioDepois}
          />
        )}
      </PcaSectionCard>

      <PcaSectionCard title="46.7 Águas pluviais">
        <FormField
          control={form.control}
          name="listagemB.efluentes.pluviais.existeDrenagem"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Existe sistema de drenagem de águas pluviais?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {haDrenagemPluvial && (
          <>
            <FormField
              control={form.control}
              name="listagemB.efluentes.pluviais.descricaoDrenagem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrever sistema de drenagem pluvial</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="listagemB.efluentes.pluviais.temTratamento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Existe tratamento das águas pluviais?</FormLabel>
                  <FormControl>
                    <BooleanRadio value={field.value} onChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            {tratamentoPluvial && (
              <FormField
                control={form.control}
                name="listagemB.efluentes.pluviais.descricaoTratamento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrever tratamento</FormLabel>
                    <FormControl>
                      <Textarea rows={2} {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
            <PcaCheckboxOptions
              form={form}
              name="listagemB.efluentes.pluviais.destinoFinal"
              options={opcoesDesaguamento}
            />
          </>
        )}
        <FormField
          control={form.control}
          name="listagemB.efluentes.pluviais.avaliou"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Foi realizada avaliação dos efluentes pluviais?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {avaliouPluviais && (
          <CaracterizacaoEfluenteAntesDepois
            form={form}
            basePath="listagemB.efluentes.pluviais.caracterizacao"
            parametrosAntes={['Sólidos em suspensão', 'Materiais sedimentáveis', 'pH', 'Vazão do efluente']}
            parametrosDepois={['Sólidos em suspensão', 'Materiais sedimentáveis', 'pH']}
          />
        )}
      </PcaSectionCard>

      <PcaSectionCard title="47. Efluentes atmosféricos">
        <FormField
          control={form.control}
          name="listagemB.emissoes.moldagemAreia.utiliza"
          render={({ field }) => (
            <FormItem>
              <FormLabel>47.1 – Utiliza sistema de moldagem em areia?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {utilizaMoldagemAreia && (
          <>
            {linhasMoldagem.map((item, index) => (
              <div key={item.id} className="space-y-3 rounded-md border p-3">
                <p className="font-medium">Linha de moldagem/desmoldagem {index + 1}</p>
                <FormField
                  control={form.control}
                  name={`listagemB.emissoes.moldagemAreia.linhas.${index}.controleParticulados`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Controle de emissões de particulados?</FormLabel>
                      <FormControl>
                        <BooleanRadio value={field.value} onChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <PcaCheckboxOptions
                  form={form}
                  name={`listagemB.emissoes.moldagemAreia.linhas.${index}.tipoControle`}
                  options={[
                    { id: 'filtro_mangas', label: 'Filtro de mangas' },
                    { id: 'outros', label: 'Outros' },
                  ]}
                />
                <DetalhesControleEmissoes form={form} basePath={`listagemB.emissoes.moldagemAreia.linhas.${index}.detalhes`} />
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => removeLinhaMoldagem(index)}>
                    <Trash2 className="mr-2 h-4 w-4" />Remover linha
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => appendLinhaMoldagem({})}>
              <PlusCircle className="mr-2 h-4 w-4" />Adicionar linha de moldagem
            </Button>
          </>
        )}

        <FormField
          control={form.control}
          name="listagemB.emissoes.jateamento.utiliza"
          render={({ field }) => (
            <FormItem>
              <FormLabel>47.2 – Utiliza jateamento com granalha?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {utilizaJateamento && (
          <>
            <PcaNumField form={form} name="listagemB.emissoes.jateamento.quantidadeEquipamentos" label="Quantidade de equipamentos" />
            {equipamentosJateamento.map((item, index) => (
              <div key={item.id} className="space-y-3 rounded-md border p-3">
                <p className="font-medium">Equipamento {index + 1}</p>
                <PcaCheckboxOptions
                  form={form}
                  name={`listagemB.emissoes.jateamento.equipamentos.${index}.material`}
                  options={[
                    { id: 'granalha_aco', label: 'Granalha de aço' },
                    { id: 'granalha_ff', label: 'Granalha de ferro fundido' },
                    { id: 'areia', label: 'Areia' },
                    { id: 'outros', label: 'Outros' },
                  ]}
                />
                <DetalhesControleEmissoes form={form} basePath={`listagemB.emissoes.jateamento.equipamentos.${index}.detalhes`} />
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => removeJateamento(index)}>
                    <Trash2 className="mr-2 h-4 w-4" />Remover
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => appendJateamento({})}>
              <PlusCircle className="mr-2 h-4 w-4" />Adicionar equipamento
            </Button>
          </>
        )}

        <p className="text-sm font-medium">47.3 – Emissões na fusão da carga metálica</p>
        {fornosFusao.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-md border p-3">
            <PcaTextField form={form} name={`listagemB.emissoes.fusao.fornos.${index}.identificacao`} label={`Forno de fusão ${index + 1}`} />
            <PcaCheckboxOptions
              form={form}
              name={`listagemB.emissoes.fusao.fornos.${index}.tipoControle`}
              options={[
                { id: 'venturi', label: 'Lavador Venturi' },
                { id: 'torre_spray', label: 'Torre de spray' },
                { id: 'cortina_agua', label: "Cortina d'água" },
                { id: 'precipitador', label: 'Precipitador eletrostático' },
                { id: 'filtro_mangas', label: 'Filtro de mangas' },
                { id: 'outros', label: 'Outros' },
              ]}
            />
            <DetalhesControleEmissoes form={form} basePath={`listagemB.emissoes.fusao.fornos.${index}.detalhes`} />
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeForno(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover forno
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendForno({ identificacao: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar forno de fusão
        </Button>

        <FormField
          control={form.control}
          name="listagemB.emissoes.pintura.utiliza"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>47.4 – Sistema de pintura com emissões atmosféricas?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {haPinturaEmissoes && (
          <>
            {sistemasPintura.map((item, index) => (
              <div key={item.id} className="space-y-3 rounded-md border p-3">
                <p className="font-medium">Sistema de pintura {index + 1}</p>
                <PcaCheckboxOptions
                  form={form}
                  name={`listagemB.emissoes.pintura.sistemas.${index}.tipo`}
                  options={[
                    { id: 'spray', label: 'Pistola de spray' },
                    { id: 'eletrolitico_po', label: 'Eletrolítica a pó' },
                    { id: 'outros', label: 'Outros' },
                  ]}
                />
                <FormField
                  control={form.control}
                  name={`listagemB.emissoes.pintura.sistemas.${index}.localConfinado`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Realizado em local confinado?</FormLabel>
                      <FormControl>
                        <BooleanRadio value={field.value} onChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DetalhesControleEmissoes form={form} basePath={`listagemB.emissoes.pintura.sistemas.${index}.detalhes`} />
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => removeSistemaPintura(index)}>
                    <Trash2 className="mr-2 h-4 w-4" />Remover sistema
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => appendSistemaPintura({})}>
              <PlusCircle className="mr-2 h-4 w-4" />Adicionar sistema de pintura
            </Button>
          </>
        )}

        <FormField
          control={form.control}
          name="listagemB.emissoes.tratamentoTermico.geraEmissoes"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>47.5 – Tratamento químico superficial/térmico gera emissões gasosas?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {haTratamentoTermicoEmissoes && (
          <PcaCheckboxOptions
            form={form}
            name="listagemB.emissoes.tratamentoTermico.sistemasControle"
            options={[
              { id: 'lavador_umido', label: 'Tratamento via úmida' },
              { id: 'filtro_mangas', label: 'Filtro de mangas' },
              { id: 'ciclone', label: 'Ciclone/multiciclones' },
              { id: 'outros', label: 'Outros' },
            ]}
          />
        )}

        <p className="mt-4 text-sm font-medium">47.6 – Vias internas e controle de poeiras</p>
        <PcaCheckboxOptions
          form={form}
          name="listagemB.emissoes.viasInternas.tipoVia"
          options={[
            { id: 'asfalto', label: 'Pavimentação asfáltica' },
            { id: 'calcamento', label: 'Calçamento' },
            { id: 'terra', label: 'Sem cobertura / estrada de terra' },
            { id: 'outros', label: 'Outros' },
          ]}
        />
        <PcaCheckboxOptions
          form={form}
          name="listagemB.emissoes.viasInternas.controlePoeira"
          options={[
            { id: 'caminhao_pipa', label: 'Aspersão via caminhão pipa' },
            { id: 'aspersores_fixos', label: 'Aspersores fixos' },
            { id: 'nao_aplicavel', label: 'Não aplicável' },
          ]}
        />
      </PcaSectionCard>

      <PcaSectionCard title="48. Resíduos sólidos">
        <FormField
          control={form.control}
          name="listagemB.residuos.areiaMoldagem.utiliza"
          render={({ field }) => (
            <FormItem>
              <FormLabel>48.1 – Utiliza moldagem em areia?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {utilizaMoldagemResiduo && (
          <>
            {processosAreiaMoldagem.map((item, index) => (
              <div key={item.id} className="space-y-3 rounded-md border p-3">
                <PcaTextField form={form} name={`listagemB.residuos.areiaMoldagem.processos.${index}.identificacao`} label="Processo/tipo de areia" />
                <PcaNumField form={form} name={`listagemB.residuos.areiaMoldagem.processos.${index}.quantidadeKgDia`} label="Areia descartada (Kg/dia)" />
                <PcaNumField form={form} name={`listagemB.residuos.areiaMoldagem.processos.${index}.percentual`} label="Percentual em relação à areia utilizada (%)" />
                <DisposicaoTemporariaResiduo form={form} basePath={`listagemB.residuos.areiaMoldagem.processos.${index}.disposicao`} />
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => removeProcessoAreia(index)}>
                    <Trash2 className="mr-2 h-4 w-4" />Remover
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => appendProcessoAreia({ identificacao: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" />Adicionar processo de moldagem
            </Button>
          </>
        )}

        <FormField
          control={form.control}
          name="listagemB.residuos.areiaMacharia.utiliza"
          render={({ field }) => (
            <FormItem>
              <FormLabel>48.2 – Utiliza macharia?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {utilizaMachariaResiduo && (
          <>
            {processosMacharia.map((item, index) => (
              <div key={item.id} className="space-y-3 rounded-md border p-3">
                <PcaTextField form={form} name={`listagemB.residuos.areiaMacharia.processos.${index}.identificacao`} label="Processo/tipo de areia de machos" />
                <PcaNumField form={form} name={`listagemB.residuos.areiaMacharia.processos.${index}.percentual`} label="Percentual descartado (%)" />
                <DisposicaoTemporariaResiduo form={form} basePath={`listagemB.residuos.areiaMacharia.processos.${index}.disposicao`} />
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => removeProcessoMacharia(index)}>
                    <Trash2 className="mr-2 h-4 w-4" />Remover
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => appendProcessoMacharia({ identificacao: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" />Adicionar processo de macharia
            </Button>
          </>
        )}

        <p className="font-medium">48.3 – Escória de fundição</p>
        {fornosEscoria.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-md border p-3">
            <PcaTextField form={form} name={`listagemB.residuos.escoria.fornos.${index}.identificacao`} label="Forno de fusão" />
            <PcaNumField form={form} name={`listagemB.residuos.escoria.fornos.${index}.quantidadeKgDia`} label="Escória gerada (Kg/dia)" />
            <PcaNumField form={form} name={`listagemB.residuos.escoria.fornos.${index}.percentual`} label="Percentual em relação ao metal fundido (%)" />
            <DisposicaoTemporariaResiduo form={form} basePath={`listagemB.residuos.escoria.fornos.${index}.disposicao`} />
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeFornoEscoria(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover forno
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendFornoEscoria({ identificacao: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar forno (escória)
        </Button>

        <FormField
          control={form.control}
          name="listagemB.residuos.controleUmido.utiliza"
          render={({ field }) => (
            <FormItem>
              <FormLabel>48.4 – Utiliza controle de emissões via úmida?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {utilizaControleUmido && (
          <>
            {equipamentosResiduoUmido.map((item, index) => (
              <div key={item.id} className="space-y-3 rounded-md border p-3">
                <PcaTextField form={form} name={`listagemB.residuos.controleUmido.equipamentos.${index}.identificacao`} label="Equipamento/setor" />
                <PcaNumField form={form} name={`listagemB.residuos.controleUmido.equipamentos.${index}.quantidadeKgMes`} label="Resíduo gerado (Kg/mês)" />
                <DisposicaoTemporariaResiduo form={form} basePath={`listagemB.residuos.controleUmido.equipamentos.${index}.disposicao`} />
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => removeEquipResiduo(index)}>
                    <Trash2 className="mr-2 h-4 w-4" />Remover
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => appendEquipResiduo({ identificacao: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" />Adicionar equipamento
            </Button>
          </>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <PcaNumField form={form} name="listagemB.residuos.sucata.quantidadeKgMes" label="48.5 – Sucata metálica (Kg/mês)" />
          <PcaNumField form={form} name="listagemB.residuos.sucata.percentual" label="Percentual em relação ao metal fundido (%)" />
          <DisposicaoTemporariaResiduo form={form} basePath="listagemB.residuos.sucata.disposicao" />
          <PcaTextField form={form} name="listagemB.residuos.sucata.comercializacao" label="Destinos em comercialização (T/mês)" className="md:col-span-2" />
        </div>

        <div className="space-y-3 rounded-md border p-3">
          <p className="font-medium">48.6 – Lixo doméstico</p>
          <PcaNumField form={form} name="listagemB.residuos.lixoDomestico.quantidadeKgMes" label="Quantidade (Kg/mês)" />
          <PcaCheckboxOptions
            form={form}
            name="listagemB.residuos.lixoDomestico.embalagem"
            options={[
              { id: 'sacos', label: 'Sacos plásticos' },
              { id: 'tambores', label: 'Tambores metálicos' },
              { id: 'cacambas', label: 'Caçambas metálicas' },
              { id: 'outros', label: 'Outros' },
            ]}
          />
          <FormField
            control={form.control}
            name="listagemB.residuos.lixoDomestico.coletaSeletiva"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Realiza coleta seletiva?</FormLabel>
                <FormControl>
                  <BooleanRadio value={field.value} onChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <PcaCheckboxOptions
            form={form}
            name="listagemB.residuos.lixoDomestico.destinoFinal"
            options={[
              { id: 'incinerado', label: 'Incinerado no empreendimento' },
              { id: 'coleta_publica', label: 'Coleta pública municipal' },
              { id: 'bota_fora', label: 'Terreno baldio / bota fora' },
              { id: 'outros', label: 'Outros' },
            ]}
          />
        </div>
      </PcaSectionCard>

      <PcaSectionCard title="49. Ruídos">
        <FormField
          control={form.control}
          name="listagemB.ruidos.fontePrejudicial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                O exercício das atividades implica uso de equipamento que constitua fonte de ruído prejudicial fora dos limites do terreno?
              </FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="listagemB.ruidos.monitoramentoRealizado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>A empresa já realizou monitoramento de ruídos no entorno?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </PcaSectionCard>

      <PcaSectionCard title="50. Cinturão verde / paisagismo">
        <FormField
          control={form.control}
          name="listagemB.cinturaoVerde.possui"
          render={({ field }) => (
            <FormItem>
              <FormLabel>A empresa possui cinturão verde nos limites da propriedade?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch('listagemB.cinturaoVerde.possui') && (
          <FormField
            control={form.control}
            name="listagemB.cinturaoVerde.descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Largura (m) e espécies plantadas</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="listagemB.cinturaoVerde.paisagismoInterno"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Possui paisagismo na área interna?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch('listagemB.cinturaoVerde.paisagismoInterno') && (
          <FormField
            control={form.control}
            name="listagemB.cinturaoVerde.paisagismoDescricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área/setores e espécies plantadas</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </PcaSectionCard>

      <PcaSectionCard title="51. Passivos ambientais">
        <FormField
          control={form.control}
          name="listagemB.passivosAmbientais.existePassivo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Há passivo ambiental associado ao empreendimento requerente?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {haPassivo && (
          <FormField
            control={form.control}
            name="listagemB.passivosAmbientais.descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Informar passivos existentes e alternativas de intervenção</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        <p className="text-sm text-muted-foreground">
          Atenção: em caso de aquisição de terreno ou instalação industrial em operação ou desativada, recomenda-se levantamento prévio de passivos ambientais.
        </p>
      </PcaSectionCard>
    </div>
  );
}
