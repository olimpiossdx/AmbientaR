'use client';

import { useFieldArray } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { BooleanRadio, CheckboxOptions, NumField, SectionCard, TextField } from './form-listagem-a-helpers';

const diasSemana = ['2ª Feira', '3ª Feira', '4ª Feira', '5ª Feira', '6ª Feira', 'Sábado', 'Domingo'] as const;
const mesesAno = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'] as const;

const finalidadesAguaPlasticos = [
  'Água bruta captada de manancial',
  'Água de fornecimento externo (concessionária)',
  'Consumo uso doméstico',
  'Consumo uso industrial',
  'Lavagem de veículos',
  'Oficinas',
  'Utilidades (lavagens, limpezas, irrigação etc.)',
  'Geração de vapor',
  'Reposição de perdas/evaporação',
  'Recirculação/resfriamento',
  'Efluente líquido total gerado',
  'Efluente líquido industrial',
  'Esgoto doméstico',
  'Outras finalidades',
];

const parametrosEfluente = ['pH', 'Temperatura (°C)', 'Sólidos sedimentáveis', 'Sólidos em suspensão', 'DBO5', 'DQO', 'Óleos e graxas', 'Tensoativos', 'Metais'];

function OrigemFuncionarios({ form, basePath }: { form: any; basePath: string }) {
  const opcoes = [
    { id: 'proprio_municipio', label: 'Próprio município' },
    { id: 'outro_mg', label: 'Outro município de Minas Gerais' },
    { id: 'outros_estados', label: 'Outros estados' },
  ];
  return (
    <div className="space-y-2">
      {opcoes.map((op) => (
        <div key={op.id} className="flex items-center gap-2">
          <FormField
            control={form.control}
            name={`${basePath}.${op.id}.ativo`}
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">{op.label}</FormLabel>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`${basePath}.${op.id}.percentual`}
            render={({ field }) => (
              <FormItem className="w-24">
                <FormControl>
                  <Input type="number" placeholder="%" {...field} value={field.value ?? ''} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
      ))}
    </div>
  );
}

function slugify(text: string) {
  return text.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase().slice(0, 48);
}

export function FormListagemCPlasticosTecnico({ form }: { form: any }) {
  const base = 'listagemC.plasticos';
  const recirculaAgua = form.watch(`${base}.usoAgua.recirculaAgua`);
  const usaCaldeira = form.watch(`${base}.equipamentosCalor.usa`);
  const geraEnergia = form.watch(`${base}.energiaEletrica.geraPropria`);
  const postoVeiculos = form.watch(`${base}.abastecimentoVeiculos.possui`);
  const oficinaManutencao = form.watch(`${base}.oficinaManutencao.possui`);
  const lavadorVeiculos = form.watch(`${base}.lavadorVeiculos.possui`);
  const sistemaEte = form.watch(`${base}.efluentes.tratamentoEmOperacao`);
  const gestaoResiduos = form.watch(`${base}.residuos.gestaoImplementada`);
  const fontesPontuais = form.watch(`${base}.emissoes.fontesPontuais`);
  const controleEmissoes = form.watch(`${base}.emissoes.sistemaControle`);
  const fontesDifusas = form.watch(`${base}.emissoes.fontesDifusas`);
  const monitoramentoRuido = form.watch(`${base}.ruidos.monitoramentoRealizado`);

  const { fields: turnos, append: appendTurno, remove: removeTurno } = useFieldArray({
    control: form.control,
    name: `${base}.regimeOperacao.turnos`,
  });
  const { fields: materiasPrimas, append: appendMp, remove: removeMp } = useFieldArray({
    control: form.control,
    name: `${base}.materiasPrimas`,
  });
  const { fields: produtos, append: appendProduto, remove: removeProduto } = useFieldArray({
    control: form.control,
    name: `${base}.produtos`,
  });
  const { fields: equipamentosCalor, append: appendCalor, remove: removeCalor } = useFieldArray({
    control: form.control,
    name: `${base}.equipamentosCalor.itens`,
  });
  const { fields: equipamentos, append: appendEquip, remove: removeEquip } = useFieldArray({
    control: form.control,
    name: `${base}.equipamentosProcesso`,
  });
  const { fields: arComprimido, append: appendAr, remove: removeAr } = useFieldArray({
    control: form.control,
    name: `${base}.arComprimido`,
  });
  const { fields: residuos, append: appendResiduo, remove: removeResiduo } = useFieldArray({
    control: form.control,
    name: `${base}.residuos.caracterizacao`,
  });
  const { fields: fontesEmissao, append: appendFonte, remove: removeFonte } = useFieldArray({
    control: form.control,
    name: `${base}.emissoes.fontes`,
  });
  const { fields: controleEquip, append: appendControle, remove: removeControle } = useFieldArray({
    control: form.control,
    name: `${base}.emissoes.equipamentosControle`,
  });

  return (
    <div className="space-y-6">
      <SectionCard title="25. Recursos humanos">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { key: 'producao', label: 'Setor de produção' },
            { key: 'administrativo', label: 'Setor administrativo' },
            { key: 'outros', label: 'Outros setores' },
          ].map((setor) => (
            <div key={setor.key} className="rounded-md border p-3">
              <p className="mb-2 font-medium">{setor.label}</p>
              <NumField form={form} name={`${base}.recursosHumanos.${setor.key}.quantidade`} label="Nº de funcionários" />
              <p className="mb-1 mt-3 text-sm text-muted-foreground">Cidade de origem (%)</p>
              <OrigemFuncionarios form={form} basePath={`${base}.recursosHumanos.${setor.key}.origem`} />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="26. Regime de operação do empreendimento">
        {turnos.map((item, index) => (
          <div key={item.id} className="mb-3 grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-6">
            <TextField form={form} name={`${base}.regimeOperacao.turnos.${index}.setor`} label="Setor / turno" />
            <NumField form={form} name={`${base}.regimeOperacao.turnos.${index}.funcionariosTurno`} label="Nº funcionários/turno" />
            <TextField form={form} name={`${base}.regimeOperacao.turnos.${index}.horarioInicio`} label="Horário início" />
            <TextField form={form} name={`${base}.regimeOperacao.turnos.${index}.horarioFim`} label="Horário fim" />
            <TextField form={form} name={`${base}.regimeOperacao.turnos.${index}.pausaInicio`} label="Pausa início" />
            <TextField form={form} name={`${base}.regimeOperacao.turnos.${index}.pausaFim`} label="Pausa fim" />
            <div className="md:col-span-6 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeTurno(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover turno
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendTurno({ setor: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar turno
        </Button>
        <FormField
          control={form.control}
          name={`${base}.regimeOperacao.diasOperacao`}
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>Dias de operação</FormLabel>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {diasSemana.map((dia) => (
                  <FormItem key={dia} className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes(dia)}
                        onCheckedChange={(checked) =>
                          checked
                            ? field.onChange([...(field.value || []), dia])
                            : field.onChange((field.value || []).filter((d: string) => d !== dia))
                        }
                      />
                    </FormControl>
                    <FormLabel className="font-normal">{dia}</FormLabel>
                  </FormItem>
                ))}
              </div>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${base}.regimeOperacao.mesesOperacao`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meses de operação</FormLabel>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {mesesAno.map((mes) => (
                  <FormItem key={mes} className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value?.includes(mes)}
                        onCheckedChange={(checked) =>
                          checked
                            ? field.onChange([...(field.value || []), mes])
                            : field.onChange((field.value || []).filter((m: string) => m !== mes))
                        }
                      />
                    </FormControl>
                    <FormLabel className="font-normal">{mes}</FormLabel>
                  </FormItem>
                ))}
              </div>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title="27. Uso de madeira ou carvão vegetal">
        <FormField
          control={form.control}
          name={`${base}.madeiraCarvao.usaMadeiraCarvao`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Utiliza madeira ou carvão vegetal?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${base}.madeiraCarvao.certificadoIef`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Possui Certificado de Cadastro junto ao IEF?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormDescription>Matérias-primas e insumos (códigos de embalagem e armazenamento conforme legenda do TR).</FormDescription>
        {materiasPrimas.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-6">
            <TextField form={form} name={`${base}.materiasPrimas.${index}.nome`} label="Matéria-prima / insumo" />
            <TextField form={form} name={`${base}.materiasPrimas.${index}.codigoEmbalagem`} label="Cód. embalagem" />
            <TextField form={form} name={`${base}.materiasPrimas.${index}.codigoArmazenamento`} label="Cód. armazenamento" />
            <TextField form={form} name={`${base}.materiasPrimas.${index}.procedencia`} label="Procedência" />
            <NumField form={form} name={`${base}.materiasPrimas.${index}.consumoMaximo`} label="Consumo máx. (mês)" />
            <NumField form={form} name={`${base}.materiasPrimas.${index}.consumoMedio`} label="Consumo médio (mês)" />
            <div className="md:col-span-6 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeMp(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendMp({})}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar matéria-prima
        </Button>
      </SectionCard>

      <SectionCard title="28. Produto principal e produtos secundários">
        {produtos.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-4">
            <TextField form={form} name={`${base}.produtos.${index}.especificacao`} label="Especificação do produto" />
            <NumField form={form} name={`${base}.produtos.${index}.producaoMaxima`} label="Produção máx. (kg/mês)" />
            <NumField form={form} name={`${base}.produtos.${index}.producaoAtual`} label="Produção atual (kg/mês)" />
            <div className="flex items-end justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeProduto(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendProduto({})}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar produto
        </Button>
      </SectionCard>

      <SectionCard title="29. Equipamentos geradores de calor">
        <FormField
          control={form.control}
          name={`${base}.equipamentosCalor.usa`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Utiliza caldeiras, fornos ou similares?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {usaCaldeira &&
          equipamentosCalor.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-4">
              <TextField form={form} name={`${base}.equipamentosCalor.itens.${index}.descricao`} label="Nome/marca/ano/combustível" />
              <NumField form={form} name={`${base}.equipamentosCalor.itens.${index}.quantidade`} label="Quantidade" />
              <NumField form={form} name={`${base}.equipamentosCalor.itens.${index}.tempoOperacaoHDia`} label="Tempo médio (h/dia)" />
              <NumField form={form} name={`${base}.equipamentosCalor.itens.${index}.consumoCombustivel`} label="Consumo máx. combustível" />
              <NumField form={form} name={`${base}.equipamentosCalor.itens.${index}.capacidadeNominal`} label="Capacidade nominal" />
              <NumField form={form} name={`${base}.equipamentosCalor.itens.${index}.alturaChamineM`} label="Altura chaminé (m)" />
              <TextField form={form} name={`${base}.equipamentosCalor.itens.${index}.destinoCinzas`} label="Destino das cinzas" />
              <div className="flex items-end justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => removeCalor(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        {usaCaldeira && (
          <Button type="button" variant="outline" onClick={() => appendCalor({})}>
            <PlusCircle className="mr-2 h-4 w-4" />Adicionar equipamento de calor
          </Button>
        )}
      </SectionCard>

      <SectionCard title="30. Principais equipamentos do processo industrial">
        {equipamentos.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-5">
            <TextField form={form} name={`${base}.equipamentosProcesso.${index}.nome`} label="Equipamento" />
            <NumField form={form} name={`${base}.equipamentosProcesso.${index}.capacidadeKgMes`} label="Capacidade nominal (kg/mês)" />
            <NumField form={form} name={`${base}.equipamentosProcesso.${index}.potenciaMw`} label="Potência (MW)" />
            <NumField form={form} name={`${base}.equipamentosProcesso.${index}.quantidade`} label="Nº equipamentos" />
            <div className="flex items-end justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeEquip(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendEquip({})}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar equipamento
        </Button>
      </SectionCard>

      <SectionCard title="31 a 33. Processo, fluxogramas e layout">
        <FormDescription>
          Anexo XXXII – processo produtivo; Anexo XXXIII – fluxogramas; Anexo XXXIV – layout da instalação industrial.
        </FormDescription>
        <TextField form={form} name={`${base}.anexos.processo`} label="Referência processo (Anexo XXXII)" />
        <TextField form={form} name={`${base}.anexos.fluxograma`} label="Referência fluxogramas (Anexo XXXIII)" />
        <TextField form={form} name={`${base}.anexos.layout`} label="Referência layout (Anexo XXXIV)" />
      </SectionCard>

      <SectionCard title="34. Equipamentos para geração de energia elétrica">
        <FormField
          control={form.control}
          name={`${base}.energiaEletrica.geraPropria`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Possui geração própria de energia?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {geraEnergia && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <NumField form={form} name={`${base}.energiaEletrica.cogeracaoKw`} label="Cogeneração (kW)" />
            <NumField form={form} name={`${base}.energiaEletrica.grupoGeradorKw`} label="Grupo gerador (kW)" />
            <TextField form={form} name={`${base}.energiaEletrica.outrasFormas`} label="Outras formas" />
          </div>
        )}
        <FormDescription>Energia fornecida por terceiros</FormDescription>
        <TextField form={form} name={`${base}.energiaEletrica.fornecedor`} label="Empresa fornecedora" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <NumField form={form} name={`${base}.energiaEletrica.demandaContratadaKwhMes`} label="Demanda contratada (kWh/mês)" />
          <NumField form={form} name={`${base}.energiaEletrica.consumoMedioKwhMes`} label="Consumo mensal médio (kWh/mês)" />
        </div>
        <FormField
          control={form.control}
          name={`${base}.energiaEletrica.subestacao`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Possui subestação?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch(`${base}.energiaEletrica.subestacao`) && (
          <NumField form={form} name={`${base}.energiaEletrica.tensaoKv`} label="Tensão (kV)" />
        )}
      </SectionCard>

      <SectionCard title="35. Ar comprimido">
        {arComprimido.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-3">
            <TextField form={form} name={`${base}.arComprimido.${index}.equipamento`} label="Equipamento de geração" />
            <TextField form={form} name={`${base}.arComprimido.${index}.capacidade`} label="Capacidade nominal" />
            <div className="flex items-end justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeAr(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendAr({})}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar equipamento
        </Button>
      </SectionCard>

      <SectionCard title="36. Instalações de abastecimento e manutenção de veículos">
        <FormField
          control={form.control}
          name={`${base}.abastecimentoVeiculos.possui`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Possui posto de abastecimento?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {postoVeiculos && (
          <div className="space-y-3">
            <TextField form={form} name={`${base}.abastecimentoVeiculos.licencaAaf`} label="Nº licença/AAF (se licenciado)" />
            <TextField form={form} name={`${base}.abastecimentoVeiculos.processoCopam`} label="Processo COPAM (se em licenciamento)" />
            <TextField form={form} name={`${base}.abastecimentoVeiculos.anexoDescricao`} label="Referência Anexo XXXV (instalações existentes)" />
          </div>
        )}
        <FormField
          control={form.control}
          name={`${base}.oficinaManutencao.possui`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Possui oficina de manutenção de máquinas e/ou veículos?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>{oficinaManutencao ? 'Apresentar Anexo XXXVI.' : ''}</FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${base}.lavadorVeiculos.possui`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Possui lavador de veículos?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>{lavadorVeiculos ? 'Apresentar Anexo XXXVII.' : ''}</FormDescription>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title="37. Identificação e análise ambientais negativos da fase de instalação">
        <FormDescription>Apresentar conforme Anexo XXXVIII.</FormDescription>
        <TextField form={form} name={`${base}.impactosInstalacao.referenciaAnexo`} label="Referência / observações" />
      </SectionCard>

      <SectionCard title="38. Uso de água">
        <FormField
          control={form.control}
          name={`${base}.usoAgua.recirculaAgua`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recircula a água utilizada?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {recirculaAgua && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <NumField form={form} name={`${base}.usoAgua.volumeRecirculadoM3Mes`} label="Volume recirculado (m³/mês)" />
            <NumField form={form} name={`${base}.usoAgua.percentualRecirculado`} label="Porcentagem recirculada (%)" />
          </div>
        )}
        {finalidadesAguaPlasticos.map((finalidade) => {
          const slug = slugify(finalidade);
          return (
            <div key={slug} className="grid grid-cols-1 gap-2 rounded-md border p-2 md:grid-cols-3">
              <p className="text-sm md:col-span-3">{finalidade}</p>
              <NumField form={form} name={`${base}.usoAgua.finalidades.${slug}.consumoMaxDia`} label="Consumo máx. (m³/dia)" />
              <NumField form={form} name={`${base}.usoAgua.finalidades.${slug}.consumoMedDia`} label="Consumo médio (m³/dia)" />
            </div>
          );
        })}
      </SectionCard>

      <SectionCard title="39. Efluentes líquidos">
        <FormDescription>39.1 Efluentes sanitários</FormDescription>
        <NumField form={form} name={`${base}.efluentes.volumeSanitarioMaxM3Dia`} label="Volume máx. esgotos sanitários (m³/dia)" />
        <FormField
          control={form.control}
          name={`${base}.efluentes.tratamentoSanitarioExclusivo`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sistema exclusivo de tratamento sanitário em operação?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>Se sim, Anexo XXXIX.</FormDescription>
            </FormItem>
          )}
        />
        <FormDescription>39.2 Efluentes industriais</FormDescription>
        <TextField form={form} name={`${base}.efluentes.industrialTotalVazao`} label="Efluente industrial total – vazão (m³/dia)" />
        {parametrosEfluente.map((param) => {
          const slug = slugify(param);
          return (
            <div key={slug} className="grid grid-cols-1 gap-2 rounded-md border p-2 md:grid-cols-3">
              <p className="text-sm">{param}</p>
              <NumField form={form} name={`${base}.efluentes.parametros.${slug}.bruto`} label="Efluente bruto" />
              <NumField form={form} name={`${base}.efluentes.parametros.${slug}.tratado`} label="Efluente tratado" />
            </div>
          );
        })}
        <FormDescription>39.3 Tratamento de efluente líquido</FormDescription>
        <FormField
          control={form.control}
          name={`${base}.efluentes.tratamentoEmOperacao`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sistema de tratamento em operação?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>Se sim, Anexos XLI e XLII.</FormDescription>
            </FormItem>
          )}
        />
        {sistemaEte && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <NumField form={form} name={`${base}.efluentes.eteAreaM2`} label="Área da ETE (m²)" />
            <TextField form={form} name={`${base}.efluentes.eteTipoSolo`} label="Tipo de solo" />
            <TextField form={form} name={`${base}.efluentes.corpoReceptor`} label="Corpo receptor / classe" />
          </div>
        )}
        <FormDescription>Águas pluviais contaminadas</FormDescription>
        <FormField
          control={form.control}
          name={`${base}.efluentes.pluviaisContaminadas`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Possui drenagem/tratamento de águas pluviais contaminadas?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>Não: Anexo XLVI; Sim: Anexo XLVII.</FormDescription>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title="40. Resíduos sólidos">
        <FormField
          control={form.control}
          name={`${base}.residuos.gestaoImplementada`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Possui sistema de gerenciamento comprovado e implementado?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${base}.residuos.armazenamentoAdequado`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Possui local adequado para armazenamento temporário?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>Se sim, Anexo XLVIII.</FormDescription>
            </FormItem>
          )}
        />
        {gestaoResiduos &&
          residuos.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-6">
              <TextField form={form} name={`${base}.residuos.caracterizacao.${index}.pontoGeracao`} label="Ponto de geração" />
              <TextField form={form} name={`${base}.residuos.caracterizacao.${index}.nome`} label="Nome do resíduo" />
              <TextField form={form} name={`${base}.residuos.caracterizacao.${index}.classificacao`} label="Classificação NBR 10.004" />
              <NumField form={form} name={`${base}.residuos.caracterizacao.${index}.geradaKgMes`} label="Gerada (kg/mês)" />
              <NumField form={form} name={`${base}.residuos.caracterizacao.${index}.estocadaKgMes`} label="Estocada (kg/mês)" />
              <TextField form={form} name={`${base}.residuos.caracterizacao.${index}.destinacao`} label="Destinação final" />
              <div className="md:col-span-6 flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => removeResiduo(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        {gestaoResiduos && (
          <Button type="button" variant="outline" onClick={() => appendResiduo({})}>
            <PlusCircle className="mr-2 h-4 w-4" />Adicionar resíduo
          </Button>
        )}
        <TextField form={form} name={`${base}.residuos.anexoDisposicaoIndustria`} label="Referência Anexo XLIX (disposição na indústria)" />
      </SectionCard>

      <SectionCard title="41. Emissões atmosféricas">
        <FormField
          control={form.control}
          name={`${base}.emissoes.fontesPontuais`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Atividade implica fontes pontuais de emissão?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {fontesPontuais &&
          fontesEmissao.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-4">
              <TextField form={form} name={`${base}.emissoes.fontes.${index}.fonte`} label="Fonte" />
              <TextField form={form} name={`${base}.emissoes.fontes.${index}.combustivel`} label="Combustível" />
              <TextField form={form} name={`${base}.emissoes.fontes.${index}.poluentes`} label="Poluentes emitidos" />
              <div className="flex items-end justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => removeFonte(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        {fontesPontuais && (
          <Button type="button" variant="outline" onClick={() => appendFonte({})}>
            <PlusCircle className="mr-2 h-4 w-4" />Adicionar fonte
          </Button>
        )}
        <FormField
          control={form.control}
          name={`${base}.emissoes.substanciasOdodoras`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Equipamentos com substâncias odoríferas (DN COPAM 11/1986)?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>Apresentar Anexo LII (amostragem isocinética).</FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${base}.emissoes.sistemaControle`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sistema de controle de emissões atmosféricas em operação?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {controleEmissoes &&
          controleEquip.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-4">
              <TextField form={form} name={`${base}.emissoes.equipamentosControle.${index}.nome`} label="Equipamento (nome/marca/qtd)" />
              <NumField form={form} name={`${base}.emissoes.equipamentosControle.${index}.tempoOperacaoHDia`} label="Tempo médio (h/dia)" />
              <TextField form={form} name={`${base}.emissoes.equipamentosControle.${index}.capacidade`} label="Capacidade nominal" />
              <div className="flex items-end justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => removeControle(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        {controleEmissoes && (
          <Button type="button" variant="outline" onClick={() => appendControle({})}>
            <PlusCircle className="mr-2 h-4 w-4" />Adicionar equipamento de controle
          </Button>
        )}
        <FormField
          control={form.control}
          name={`${base}.emissoes.fontesDifusas`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Atividade implica fontes difusas de emissão?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>{fontesDifusas ? 'Elaborar texto para Anexo LIV.' : ''}</FormDescription>
            </FormItem>
          )}
        />
        {fontesDifusas && (
          <FormField
            control={form.control}
            name={`${base}.emissoes.fontesDifusasDescricao`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição das fontes difusas</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </SectionCard>

      <SectionCard title="42. Ruídos">
        <FormField
          control={form.control}
          name={`${base}.ruidos.fonteRuido`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Utiliza equipamentos fontes de ruído capazes de afetar saúde ou sossego público?</FormLabel>
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
              <FormLabel>Realizou monitoramento de ruído no entorno?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>{monitoramentoRuido ? 'Apresentar Anexo LV.' : ''}</FormDescription>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title="43. Avaliação das medidas de controle ambiental existentes">
        <FormDescription>Apresentar Anexos LVI e LVII.</FormDescription>
        <TextField form={form} name={`${base}.medidasControle.referenciaAnexoLvi`} label="Referência Anexo LVI (desempenho 6 meses)" />
        <TextField form={form} name={`${base}.medidasControle.referenciaAnexoLvii`} label="Referência Anexo LVII (outras medidas)" />
        <CheckboxOptions
          form={form}
          name={`${base}.medidasControle.projetosSustentabilidade`}
          options={[
            { id: 'eficiencia_insumos', label: 'Aumentar eficiência no uso de insumos ou recursos naturais' },
            { id: 'reduzir_efluentes', label: 'Evitar ou reduzir geração de efluentes, emissões ou resíduos' },
          ]}
        />
      </SectionCard>

      <SectionCard title="44 a 49. Emergência, passivos, paisagismo, educação e carga poluidora">
        <TextField form={form} name={`${base}.emergencia.referenciaRisco`} label="44 – Avaliação de risco de acidentes" />
        <FormField
          control={form.control}
          name={`${base}.emergencia.sistemaPrevencaoIncendio`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sistemas de prevenção e combate a incêndio implementados?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>Não: Anexo LIX; Sim: Anexo LX.</FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${base}.passivos.existe`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>45 – Possui passivos ambientais?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch(`${base}.passivos.existe`) && (
          <FormField
            control={form.control}
            name={`${base}.passivos.descricao`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrever passivos e alternativas de intervenção</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name={`${base}.paisagismo.cinturaoVerde`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>46 – Possui cinturão verde?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch(`${base}.paisagismo.cinturaoVerde`) && (
          <TextField form={form} name={`${base}.paisagismo.cinturaoVerdeDescricao`} label="Largura e espécies do cinturão verde" />
        )}
        <FormField
          control={form.control}
          name={`${base}.paisagismo.paisagismoInterno`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Possui paisagismo interno?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${base}.educacaoAmbiental.possuiPrograma`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>47 – Possui programa de educação ambiental?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${base}.melhoriasSignificativas`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>48 – Melhorias significativas no processo ou em outros aspectos</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormDescription>49 – Quadro resumo da carga poluidora atual</FormDescription>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <NumField form={form} name={`${base}.cargaPoluidora.esgotoSanitarioM3Dia`} label="Esgoto sanitário bruto (m³/dia)" />
          <NumField form={form} name={`${base}.cargaPoluidora.esgotoSanitarioDbo`} label="Carga orgânica esgoto (kg DBO5/dia)" />
          <NumField form={form} name={`${base}.cargaPoluidora.efluenteIndustrialM3Dia`} label="Efluente industrial bruto (m³/dia)" />
          <NumField form={form} name={`${base}.cargaPoluidora.efluenteIndustrialDqo`} label="Carga orgânica industrial (kg DQO/dia)" />
          <NumField form={form} name={`${base}.cargaPoluidora.materialParticulado`} label="Material particulado (kg MP/dia)" />
          <NumField form={form} name={`${base}.cargaPoluidora.dioxidoEnxofre`} label="Dióxido de enxofre (kg SO2/dia)" />
          <NumField form={form} name={`${base}.cargaPoluidora.residuoClasseI`} label="Resíduos Classe I (kg/dia)" />
          <NumField form={form} name={`${base}.cargaPoluidora.residuoClasseII`} label="Resíduos Classe II (kg/dia)" />
          <NumField form={form} name={`${base}.cargaPoluidora.residuoClasseIII`} label="Resíduos Classe III (kg/dia)" />
          <NumField form={form} name={`${base}.cargaPoluidora.energiaEletricaKwMes`} label="Energia elétrica (kW/mês)" />
        </div>
      </SectionCard>
    </div>
  );
}
