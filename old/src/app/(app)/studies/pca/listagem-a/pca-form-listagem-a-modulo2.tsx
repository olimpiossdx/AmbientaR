'use client';



import * as React from 'react';

import { useFieldArray } from 'react-hook-form';

import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';

import { Input } from '@/components/ui/input';

import { Textarea } from '@/components/ui/textarea';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { Checkbox } from '@/components/ui/checkbox';

import { Button } from '@/components/ui/button';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { PlusCircle, Trash2 } from 'lucide-react';

import type { UseFormReturn } from 'react-hook-form';

import type { PcaListagemAFormValues } from './pca-listagem-a-schema';

import {

  PcaBooleanRadio,

  PcaCheckboxOptions,

  PcaNumField,

  PcaSectionCard,

  PcaTabelaLinhasFixas,

  PcaTextField,

  PcaTextAreaField,

  PcaSituacaoRegularizacao,

} from './pca-form-listagem-a-helpers';



const biomas = ['Cerrado', 'Mata Atlântica', 'Outro'] as const;

const diasSemana = ['2a Feira', '3a Feira', '4a Feira', '5a Feira', '6a Feira', 'Sábado', 'Domingo'] as const;

const mesesAno = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'] as const;



export function PcaFormListagemAModulo2({ form }: { form: UseFormReturn<any> }) {

  const isAmpliacao = form.watch('listagemA.regularizacaoAmbiental.ampliacaoEmpreendimentoLicenciado');



  const { fields: atividadePrincipalFields, append: appendAtividadePrincipal, remove: removeAtividadePrincipal } =

    useFieldArray({ control: form.control, name: 'listagemA.atividadesPrincipal' as never });

  const { fields: outrasAtividadesFields, append: appendOutrasAtividades, remove: removeOutrasAtividades } =

    useFieldArray({ control: form.control, name: 'listagemA.outrasAtividades' as never });

  const { fields: nucleoPopulacionalFields, append: appendNucleoPopulacional, remove: removeNucleoPopulacional } =

    useFieldArray({ control: form.control, name: 'listagemA.legislacaoMunicipal.nucleosPopulacionais' as never });

  const { fields: ocupacaoEntornoFields, append: appendOcupacaoEntorno, remove: removeOcupacaoEntorno } =

    useFieldArray({ control: form.control, name: 'listagemA.ocupacaoEntorno.ocorrencias' as never });

  const { fields: recursosHidricosFields, append: appendRecursosHidricos, remove: removeRecursosHidricos } =

    useFieldArray({ control: form.control, name: 'listagemA.recursosHidricos.intervencoes' as never });

  const { fields: turnosFields, append: appendTurno, remove: removeTurno } =

    useFieldArray({ control: form.control, name: 'listagemA.regimeOperacao.turnos' as never });

  const { fields: faseProcessoMineralFields, append: appendFaseProcessoMineral, remove: removeFaseProcessoMineral } =

    useFieldArray({ control: form.control, name: 'listagemA.licenciamentoMineral.fasesProcesso' as never });



  return (

    <div className="space-y-6">

      <div className="space-y-4 rounded-md border p-4">
        <h3 className="text-lg font-medium">6. Atividades do Empreendimento conforme DN 217/17</h3>
        {atividadePrincipalFields.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-5">
            <FormField control={form.control} name={`listagemA.atividadesPrincipal.${index}.atividade`} render={({ field }) => (<FormItem><FormLabel>Atividade principal</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.atividadesPrincipal.${index}.codigo`} render={({ field }) => (<FormItem><FormLabel>Código DN-217/2017</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.atividadesPrincipal.${index}.parametroUnidade`} render={({ field }) => (<FormItem><FormLabel>Parâmetro/Unidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.atividadesPrincipal.${index}.quantidade`} render={({ field }) => (<FormItem><FormLabel>Quantidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.atividadesPrincipal.${index}.inicioAtividade`} render={({ field }) => (<FormItem><FormLabel>Início da atividade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <div className="md:col-span-5 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeAtividadePrincipal(index)}><Trash2 className="mr-2 h-4 w-4" />Remover</Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendAtividadePrincipal({ atividade: '', codigo: '', parametroUnidade: '', quantidade: '', inicioAtividade: '' })}><PlusCircle className="mr-2 h-4 w-4" />Adicionar atividade principal</Button>
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <h3 className="text-lg font-medium">7. Outras Atividades no Empreendimento</h3>
        {outrasAtividadesFields.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-5">
            <FormField control={form.control} name={`listagemA.outrasAtividades.${index}.atividade`} render={({ field }) => (<FormItem><FormLabel>Especificar atividades</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.outrasAtividades.${index}.codigo`} render={({ field }) => (<FormItem><FormLabel>Código DN-217/2017</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.outrasAtividades.${index}.parametroUnidade`} render={({ field }) => (<FormItem><FormLabel>Parâmetro/Unidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.outrasAtividades.${index}.quantidade`} render={({ field }) => (<FormItem><FormLabel>Quantidade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.outrasAtividades.${index}.inicioAtividade`} render={({ field }) => (<FormItem><FormLabel>Início da atividade</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <div className="md:col-span-5 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeOutrasAtividades(index)}><Trash2 className="mr-2 h-4 w-4" />Remover</Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendOutrasAtividades({ atividade: '', codigo: '', parametroUnidade: '', quantidade: '', inicioAtividade: '' })}><PlusCircle className="mr-2 h-4 w-4" />Adicionar outra atividade</Button>
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <h3 className="text-lg font-medium">8. Fase da Regularização Ambiental</h3>
        <FormField
          control={form.control}
          name="listagemA.regularizacaoAmbiental.fase"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Situação do empreendimento</FormLabel>
              <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 gap-2">
                {['LP', 'LI', 'LIC', 'LP+LI', 'LO', 'LOC'].map((fase) => (
                  <FormItem key={fase} className="flex items-center gap-2">
                    <FormControl><RadioGroupItem value={fase} /></FormControl>
                    <FormLabel className="font-normal">Fase de licença {fase}</FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormItem>
          )}
        />
        <PcaTextField form={form} name="listagemA.regularizacaoAmbiental.classe" label="Classe" />
        <PcaBooleanRadio form={form} name="listagemA.regularizacaoAmbiental.ampliacaoEmpreendimentoLicenciado" label="Trata-se de licença para ampliação/modificação de empreendimento já licenciado?" />
        {isAmpliacao && (
          <div className="grid grid-cols-1 gap-4 rounded-md border p-3 md:grid-cols-2">
            <PcaTextField form={form} name="listagemA.regularizacaoAmbiental.processoUltimaLicenca" label="Nº do processo da última licença" />
            <PcaTextField form={form} name="listagemA.regularizacaoAmbiental.capacidadeAntes" label="Capacidade antes (t/dia)" />
            <PcaTextField form={form} name="listagemA.regularizacaoAmbiental.capacidadeDepois" label="Capacidade prevista após ampliação (t/dia)" />
            <PcaTextField form={form} name="listagemA.regularizacaoAmbiental.empregadosAntes" label="Empregados antes" />
            <PcaTextField form={form} name="listagemA.regularizacaoAmbiental.empregadosDepois" label="Empregados previstos após ampliação" />
            <PcaTextField form={form} name="listagemA.regularizacaoAmbiental.areaUtilAntes" label="Área útil antes (ha)" />
            <PcaTextField form={form} name="listagemA.regularizacaoAmbiental.areaUtilDepois" label="Área útil prevista após ampliação (ha)" />
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <h3 className="text-lg font-medium">9. Restrições Locacionais</h3>
        <FormField
          control={form.control}
          name="locationalRestrictions.biome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bioma predominante</FormLabel>
              <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4">
                {biomas.map((bioma) => (
                  <FormItem key={bioma} className="flex items-center gap-2">
                    <FormControl><RadioGroupItem value={bioma} /></FormControl>
                    <FormLabel className="font-normal">{bioma}</FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormItem>
          )}
        />
        <PcaTextAreaField form={form} name="listagemA.restricoesLocacionais.descricaoRemanescenteVegetacao" label="Remanescente de formações vegetais nativas" />
        <PcaBooleanRadio form={form} name="locationalRestrictions.inKarstArea" label="Localiza-se em área cárstica?" />
        <PcaBooleanRadio form={form} name="locationalRestrictions.inFluvialLacustrineArea" label="Localiza-se em área fluvial/lacustre?" />
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <h3 className="text-lg font-medium">10. Unidades de Conservação</h3>
        <FormField
          control={form.control}
          name="conservationUnit.isInConservationUnit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Está em UC, zona de amortecimento ou faixa de 3 km?</FormLabel>
              <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4">
                <FormItem className="flex items-center gap-2"><FormControl><RadioGroupItem value="Sim" /></FormControl><FormLabel className="font-normal">Sim</FormLabel></FormItem>
                <FormItem className="flex items-center gap-2"><FormControl><RadioGroupItem value="Não" /></FormControl><FormLabel className="font-normal">Não</FormLabel></FormItem>
              </RadioGroup>
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PcaTextField form={form} name="conservationUnit.distance" label="Distância" />
          <PcaTextField form={form} name="conservationUnit.ucName" label="Nome da UC" />
          <PcaTextField form={form} name="conservationUnit.jurisdiction" label="Jurisdição" />
        </div>
        <PcaTextField form={form} name="conservationUnit.managementCategory" label="Categoria da UC" />
        <PcaTextField form={form} name="conservationUnit.managingBody" label="Informar o órgão gestor" />
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <h3 className="text-lg font-medium">11 e 12. Reserva Legal e APP</h3>
        <FormField
          control={form.control}
          name="legalReserve.status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reserva legal regularizada?</FormLabel>
              <FormControl>
                <RadioGroup onValueChange={field.onChange} value={field.value} className="grid grid-cols-1 gap-2">
                  <FormItem className="flex items-center gap-2"><FormControl><RadioGroupItem value="NAO_ZONA_RURAL" /></FormControl><FormLabel className="font-normal">Não localizado em zona rural</FormLabel></FormItem>
                  <FormItem className="flex items-center gap-2"><FormControl><RadioGroupItem value="NAO_EM_DEMARCACAO" /></FormControl><FormLabel className="font-normal">Não, em demarcação</FormLabel></FormItem>
                  <FormItem className="flex items-center gap-2"><FormControl><RadioGroupItem value="TERMO_COMPROMISSO" /></FormControl><FormLabel className="font-normal">Não, com termo de compromisso</FormLabel></FormItem>
                  <FormItem className="flex items-center gap-2"><FormControl><RadioGroupItem value="DEMARCADA_AGUARDANDO" /></FormControl><FormLabel className="font-normal">Não, demarcada aguardando averbação</FormLabel></FormItem>
                  <FormItem className="flex items-center gap-2"><FormControl><RadioGroupItem value="AVERBADA" /></FormControl><FormLabel className="font-normal">Sim, averbada</FormLabel></FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
        <PcaBooleanRadio form={form} name="listagemA.app.existeApp" label="Existe APP no terreno?" />
        {form.watch('listagemA.app.existeApp') && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <PcaTextField form={form} name="listagemA.app.areaHa" label="Quantificação da área APP (ha)" />
            <FormField control={form.control} name="listagemA.app.situacaoCobertura" render={({ field }) => (<FormItem><FormLabel>Situação da cobertura vegetal</FormLabel><FormControl><Input placeholder="Preservada / protegida / outra" {...field} /></FormControl></FormItem>)} />
          </div>
        )}
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <h3 className="text-lg font-medium">14. Intervenção em Recursos Hídricos</h3>
        {recursosHidricosFields.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-6">
            <FormField control={form.control} name={`listagemA.recursosHidricos.intervencoes.${index}.tipo`} render={({ field }) => (<FormItem><FormLabel>Tipo de intervenção</FormLabel><FormControl><Input placeholder="Poço tubular / captação etc." {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.recursosHidricos.intervencoes.${index}.volume`} render={({ field }) => (<FormItem><FormLabel>Volume (m3/mês)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.recursosHidricos.intervencoes.${index}.outorgada`} render={({ field }) => (<FormItem><FormLabel>Outorgada?</FormLabel><FormControl><Input placeholder="Sim/Não" {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.recursosHidricos.intervencoes.${index}.orgao`} render={({ field }) => (<FormItem><FormLabel>Órgão</FormLabel><FormControl><Input placeholder="IGAM/ANA" {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.recursosHidricos.intervencoes.${index}.portaria`} render={({ field }) => (<FormItem><FormLabel>Portaria Nº</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.recursosHidricos.intervencoes.${index}.processo`} render={({ field }) => (<FormItem><FormLabel>Processo Nº</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <div className="md:col-span-6 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeRecursosHidricos(index)}><Trash2 className="mr-2 h-4 w-4" />Remover</Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendRecursosHidricos({ tipo: '', volume: '', outorgada: '', orgao: '', portaria: '', processo: '' })}><PlusCircle className="mr-2 h-4 w-4" />Adicionar intervenção hídrica</Button>
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <h3 className="text-lg font-medium">15 e 16. Legislação Municipal e Ocupação do Entorno</h3>
        <PcaBooleanRadio form={form} name="listagemA.legislacaoMunicipal.temPlanoDiretor" label="Município tem Plano Diretor / Lei de Uso e Ocupação do Solo?" />
        <PcaBooleanRadio form={form} name="listagemA.legislacaoMunicipal.interfereNucleosPopulacionais" label="Interfere com núcleos populacionais?" />
        {nucleoPopulacionalFields.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-5">
            <FormField control={form.control} name={`listagemA.legislacaoMunicipal.nucleosPopulacionais.${index}.nome`} render={({ field }) => (<FormItem><FormLabel>Núcleo populacional</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.legislacaoMunicipal.nucleosPopulacionais.${index}.localizacao`} render={({ field }) => (<FormItem><FormLabel>Localização</FormLabel><FormControl><Input placeholder="Urbano/Rural" {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.legislacaoMunicipal.nucleosPopulacionais.${index}.distanciaM`} render={({ field }) => (<FormItem><FormLabel>Distância da rede (m)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.legislacaoMunicipal.nucleosPopulacionais.${index}.referencia`} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Referência</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <div className="md:col-span-5 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeNucleoPopulacional(index)}><Trash2 className="mr-2 h-4 w-4" />Remover</Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendNucleoPopulacional({ nome: '', localizacao: '', distanciaM: '', referencia: '' })}><PlusCircle className="mr-2 h-4 w-4" />Adicionar núcleo populacional</Button>

        {ocupacaoEntornoFields.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-3">
            <FormField control={form.control} name={`listagemA.ocupacaoEntorno.ocorrencias.${index}.ocorrencia`} render={({ field }) => (<FormItem><FormLabel>Ocorrência</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.ocupacaoEntorno.ocorrencias.${index}.distanciaM`} render={({ field }) => (<FormItem><FormLabel>Distância (m)</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <div className="flex items-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeOcupacaoEntorno(index)}><Trash2 className="mr-2 h-4 w-4" />Remover</Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendOcupacaoEntorno({ ocorrencia: '', distanciaM: '' })}><PlusCircle className="mr-2 h-4 w-4" />Adicionar ocorrência do entorno</Button>
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <h3 className="text-lg font-medium">21 e 22. Recursos Humanos e Regime de Operação</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PcaTextField form={form} name="listagemA.recursosHumanos.producao.quantidade" label="Funcionários - Produção" />
          <PcaTextField form={form} name="listagemA.recursosHumanos.administrativo.quantidade" label="Funcionários - Administrativo" />
          <PcaTextField form={form} name="listagemA.recursosHumanos.outrosSetores.quantidade" label="Funcionários - Outros setores" />
        </div>

        {turnosFields.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-6">
            <FormField control={form.control} name={`listagemA.regimeOperacao.turnos.${index}.setor`} render={({ field }) => (<FormItem><FormLabel>Setor</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.regimeOperacao.turnos.${index}.funcionariosTurno`} render={({ field }) => (<FormItem><FormLabel>Nº funcionários/turno</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.regimeOperacao.turnos.${index}.horarioInicio`} render={({ field }) => (<FormItem><FormLabel>Início</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.regimeOperacao.turnos.${index}.horarioFim`} render={({ field }) => (<FormItem><FormLabel>Fim</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.regimeOperacao.turnos.${index}.pausaInicio`} render={({ field }) => (<FormItem><FormLabel>Pausa início</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.regimeOperacao.turnos.${index}.pausaFim`} render={({ field }) => (<FormItem><FormLabel>Pausa fim</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <div className="md:col-span-6 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeTurno(index)}><Trash2 className="mr-2 h-4 w-4" />Remover</Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendTurno({ setor: '', funcionariosTurno: '', horarioInicio: '', horarioFim: '', pausaInicio: '', pausaFim: '' })}><PlusCircle className="mr-2 h-4 w-4" />Adicionar turno</Button>

        <FormField
          control={form.control}
          name="listagemA.regimeOperacao.diasOperacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dias de operação</FormLabel>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {diasSemana.map((dia) => (
                  <FormItem key={dia} className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={(Array.isArray(field.value) ? field.value : []).includes(dia)}
                        onCheckedChange={(checked) =>
                          checked
                            ? field.onChange([...(field.value || []), dia])
                            : field.onChange((field.value || []).filter((item: string) => item !== dia))
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
          name="listagemA.regimeOperacao.mesesOperacao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Meses de operação</FormLabel>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {mesesAno.map((mes) => (
                  <FormItem key={mes} className="flex items-center gap-2">
                    <FormControl>
                      <Checkbox
                        checked={(Array.isArray(field.value) ? field.value : []).includes(mes)}
                        onCheckedChange={(checked) =>
                          checked
                            ? field.onChange([...(field.value || []), mes])
                            : field.onChange((field.value || []).filter((item: string) => item !== mes))
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
      </div>

      <div className="space-y-4 rounded-md border p-4">
        <h3 className="text-lg font-medium">24 e 25. Licenciamento Mineral (DNPM) e Área do Empreendimento</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <PcaTextField form={form} name="listagemA.licenciamentoMineral.titularProcesso" label="Titular do processo" />
          <PcaTextField form={form} name="listagemA.licenciamentoMineral.numeroProcesso" label="Processo Nº" />
          <PcaTextField form={form} name="listagemA.licenciamentoMineral.substanciasMinerais" label="Substâncias minerais" />
          <PcaTextField form={form} name="listagemA.licenciamentoMineral.areaConcedidaHa" label="Área concedida (ha)" />
        </div>
        <FormField control={form.control} name="listagemA.licenciamentoMineral.situacaoLavra" render={({ field }) => (<FormItem><FormLabel>Situação atual da lavra</FormLabel><FormControl><Input placeholder="Em atividade / paralisada / não iniciada" {...field} /></FormControl></FormItem>)} />
        <PcaBooleanRadio form={form} name="listagemA.licenciamentoMineral.direitosArrendados" label="Direitos minerários arrendados?" />

        {faseProcessoMineralFields.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-3">
            <FormField control={form.control} name={`listagemA.licenciamentoMineral.fasesProcesso.${index}.fase`} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>Fase atual do processo</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <FormField control={form.control} name={`listagemA.licenciamentoMineral.fasesProcesso.${index}.data`} render={({ field }) => (<FormItem><FormLabel>Data</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
            <div className="md:col-span-3 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeFaseProcessoMineral(index)}><Trash2 className="mr-2 h-4 w-4" />Remover</Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendFaseProcessoMineral({ fase: '', data: '' })}><PlusCircle className="mr-2 h-4 w-4" />Adicionar fase do processo mineral</Button>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <PcaTextField form={form} name="listagemA.areaEmpreendimento.areaTotalPoligonalHa" label="Área total da poligonal (ha)" />
          <PcaTextField form={form} name="listagemA.areaEmpreendimento.areaLavraHa" label="Área da lavra (ha)" />
          <PcaTextField form={form} name="listagemA.areaEmpreendimento.areaServidaoHa" label="Área de servidão (ha)" />
          <PcaTextField form={form} name="listagemA.areaEmpreendimento.areaConstruidaHa" label="Área construída (ha)" />
          <PcaTextField form={form} name="listagemA.areaEmpreendimento.percentualAreaDegradada" label="% área degradada em relação à área total da poligonal DNPM" />
        </div>
      </div>

    </div>

  );

}

