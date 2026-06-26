'use client';

import { useFieldArray } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { BooleanRadio, CheckboxOptions, NumField, SectionCard, TextField } from './form-listagem-a-helpers';
import { FormListagemARochasOrnamentaisAgendas } from './form-listagem-a-rochas-ornamentais-agendas';

const gruposFauna = ['Aves', 'Mamíferos', 'Peixes', 'Répteis', 'Anfíbios', 'Invertebrados'];

export function FormListagemARochasOrnamentaisComplemento({ form }: { form: any }) {
  const base = 'listagemA.rochasOrnamentais';
  const haEspeciesAmeacadas = form.watch(`${base}.fauna.especiesAmeacadas`);
  const haEspeciesEndemicas = form.watch(`${base}.fauna.especiesEndemicas`);

  const { fields: outrasAtividades, append: appendAtividade, remove: removeAtividade } = useFieldArray({
    control: form.control,
    name: `${base}.outrasAtividades`,
  });
  const { fields: especiesAmeacadas, append: appendAmeacada, remove: removeAmeacada } = useFieldArray({
    control: form.control,
    name: `${base}.fauna.listaAmeacadas`,
  });
  const { fields: especiesEndemicas, append: appendEndemica, remove: removeEndemica } = useFieldArray({
    control: form.control,
    name: `${base}.fauna.listaEndemicas`,
  });

  return (
    <div className="space-y-6">
      <FormListagemARochasOrnamentaisAgendas form={form} />

      <SectionCard title="12. Outras atividades não descritas (DN 74/04)">
        <FormDescription>
          Ex.: pilhas de estéril/rejeitos (A-05-04-5), estradas de transporte (A-05-06-3).
        </FormDescription>
        {outrasAtividades.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-5">
            <TextField form={form} name={`${base}.outrasAtividades.${index}.atividade`} label="Atividade" />
            <TextField form={form} name={`${base}.outrasAtividades.${index}.codigo`} label="Código DN-74/2004" />
            <TextField form={form} name={`${base}.outrasAtividades.${index}.unidade`} label="Unidade" />
            <TextField form={form} name={`${base}.outrasAtividades.${index}.quantidade`} label="Quantidade" />
            <TextField form={form} name={`${base}.outrasAtividades.${index}.inicio`} label="Início da atividade" />
            <div className="md:col-span-5 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeAtividade(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => appendAtividade({ atividade: '', codigo: '', unidade: '', quantidade: '', inicio: '' })}
        >
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar atividade
        </Button>
      </SectionCard>

      <SectionCard title="13. Dados do empreendimento conforme legislação municipal">
        <FormField
          control={form.control}
          name={`${base}.legislacaoMunicipal.temPlanoDiretor`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>O município possui Plano Diretor / Lei de Uso e Ocupação do Solo?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${base}.legislacaoMunicipal.concordanciaMunicipal`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Há concordância municipal com o empreendimento?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${base}.legislacaoMunicipal.vizinhoExtracaoMineral`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>A área é vizinha a outras áreas de extração mineral?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NumField form={form} name={`${base}.legislacaoMunicipal.distanciaNucleoM`} label="Distância ao núcleo populacional mais próximo (m)" />
          <TextField form={form} name={`${base}.legislacaoMunicipal.referenciaLocalizacao`} label="Referência de localização" />
        </div>
      </SectionCard>

      <SectionCard title="14. Capacidade de produção">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NumField form={form} name={`${base}.capacidadeProducao.movimentacaoBrutaRom`} label="Movimentação bruta (ROM)" />
          <NumField form={form} name={`${base}.capacidadeProducao.recuperacaoLavraPercent`} label="Recuperação na lavra (%)" />
          <TextField form={form} name={`${base}.capacidadeProducao.produtoPrincipal`} label="Produto(s) principal(is)" />
          <TextField form={form} name={`${base}.capacidadeProducao.subprodutos`} label="Subproduto(s)" />
          <NumField form={form} name={`${base}.capacidadeProducao.producaoLiquidaMensalT`} label="Produção líquida mensal (t)" />
          <NumField form={form} name={`${base}.capacidadeProducao.producaoLiquidaMensalM2`} label="Produção líquida mensal (m²)" />
          <NumField form={form} name={`${base}.capacidadeProducao.producaoLiquidaMensalM3`} label="Produção líquida mensal (m³)" />
          <NumField form={form} name={`${base}.capacidadeProducao.capacidadeNominalInstalada`} label="Capacidade nominal instalada" />
          <NumField form={form} name={`${base}.capacidadeProducao.percentualExtracao`} label="% de extração" />
          <NumField form={form} name={`${base}.capacidadeProducao.reservaMineralM3`} label="Reserva mineral (m³)" />
          <NumField form={form} name={`${base}.capacidadeProducao.reservaMineralT`} label="Reserva mineral (t)" />
          <NumField form={form} name={`${base}.capacidadeProducao.vidaUtilAnos`} label="Vida útil da jazida (anos)" />
          <NumField form={form} name={`${base}.capacidadeProducao.avancoAnualHa`} label="Avanço anual da lavra (ha)" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <NumField form={form} name={`${base}.capacidadeProducao.horasDia`} label="Horas/dia" />
          <NumField form={form} name={`${base}.capacidadeProducao.diasSemana`} label="Dias/semana" />
          <NumField form={form} name={`${base}.capacidadeProducao.numTurnos`} label="Nº de turnos" />
          <NumField form={form} name={`${base}.capacidadeProducao.funcionariosTurno`} label="Funcionários/turno" />
        </div>
      </SectionCard>

      <SectionCard title="15 e 16. Licenciamento mineral (DNPM) e área do empreendimento">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <TextField form={form} name={`${base}.licenciamentoMineral.titular`} label="Titular do processo" />
          <TextField form={form} name={`${base}.licenciamentoMineral.numeroProcesso`} label="Processo nº" />
          <TextField form={form} name={`${base}.licenciamentoMineral.substancias`} label="Substância(s) mineral(is)" />
          <NumField form={form} name={`${base}.licenciamentoMineral.areaConcedidaHa`} label="Área concedida (ha)" />
        </div>
        <FormField
          control={form.control}
          name={`${base}.licenciamentoMineral.titularProprietario`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>O titular é proprietário do terreno?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <TextField form={form} name={`${base}.licenciamentoMineral.situacaoLavra`} label="Situação atual da lavra (em atividade / paralisada / não iniciada)" />
        <FormField
          control={form.control}
          name={`${base}.licenciamentoMineral.direitosArrendados`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Direitos minerários arrendados?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${base}.licenciamentoMineral.fasesProcesso`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fase atual do processo e datas</FormLabel>
              <FormControl>
                <Textarea rows={3} placeholder="Pedido de pesquisa, autorização publicada, guia de utilização, licença de lavra, PAE..." {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <TextField form={form} name={`${base}.licenciamentoMineral.informacoesAdicionais`} label="Informações adicionais sobre o processo" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <NumField form={form} name={`${base}.areaEmpreendimento.totalPoligonalHa`} label="Área total poligonal (ha)" />
          <NumField form={form} name={`${base}.areaEmpreendimento.areaLavraHa`} label="Área da lavra (ha)" />
          <NumField form={form} name={`${base}.areaEmpreendimento.areaServidaoHa`} label="Área de servidão (ha)" />
          <NumField form={form} name={`${base}.areaEmpreendimento.areaConstruidaHa`} label="Área construída (ha)" />
          <NumField form={form} name={`${base}.areaEmpreendimento.percentualDegradada`} label="% área degradada" />
        </div>
        <FormField
          control={form.control}
          name={`${base}.areaEmpreendimento.necessitaPrad`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Existem áreas degradadas que necessitam PRAD?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormDescription>Apresentar planta de detalhe georreferenciada conforme anexo do TR.</FormDescription>
      </SectionCard>

      <SectionCard title="17. Fauna da área de influência direta">
        <CheckboxOptions
          form={form}
          name={`${base}.fauna.grupos`}
          options={gruposFauna.map((g) => ({ id: g, label: g }))}
        />
        <FormField
          control={form.control}
          name={`${base}.fauna.especiesAmeacadas`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Presença de espécies ameaçadas de extinção?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {haEspeciesAmeacadas &&
          especiesAmeacadas.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-3">
              <TextField form={form} name={`${base}.fauna.listaAmeacadas.${index}.nomeComum`} label="Nome comum" />
              <TextField form={form} name={`${base}.fauna.listaAmeacadas.${index}.nomeCientifico`} label="Nome científico" className="md:col-span-2" />
              <div className="md:col-span-3 flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => removeAmeacada(index)}>
                  <Trash2 className="mr-2 h-4 w-4" />Remover
                </Button>
              </div>
            </div>
          ))}
        {haEspeciesAmeacadas && (
          <Button type="button" variant="outline" onClick={() => appendAmeacada({ nomeComum: '', nomeCientifico: '' })}>
            <PlusCircle className="mr-2 h-4 w-4" />Adicionar espécie ameaçada
          </Button>
        )}
        <FormField
          control={form.control}
          name={`${base}.fauna.especiesEndemicas`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Presença de espécies endêmicas?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {haEspeciesEndemicas &&
          especiesEndemicas.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-3">
              <TextField form={form} name={`${base}.fauna.listaEndemicas.${index}.nomeComum`} label="Nome comum" />
              <TextField form={form} name={`${base}.fauna.listaEndemicas.${index}.nomeCientifico`} label="Nome científico" className="md:col-span-2" />
              <div className="md:col-span-3 flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => removeEndemica(index)}>
                  <Trash2 className="mr-2 h-4 w-4" />Remover
                </Button>
              </div>
            </div>
          ))}
        {haEspeciesEndemicas && (
          <Button type="button" variant="outline" onClick={() => appendEndemica({ nomeComum: '', nomeCientifico: '' })}>
            <PlusCircle className="mr-2 h-4 w-4" />Adicionar espécie endêmica
          </Button>
        )}
        <FormField
          control={form.control}
          name={`${base}.fauna.sitiosReproducao`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sítios de reprodução (aves, mamíferos, peixes, répteis, anfíbios, biospeleologia)</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name={`${base}.fauna.especiesNaoIdentificadas`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Presença de espécies não identificadas?</FormLabel>
                <FormControl>
                  <BooleanRadio value={field.value} onChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <TextField form={form} name={`${base}.fauna.generoNaoIdentificado`} label="Gênero (se aplicável)" />
          <FormField
            control={form.control}
            name={`${base}.fauna.morcegosHematofagos`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Presença de morcegos hematófagos?</FormLabel>
                <FormControl>
                  <BooleanRadio value={field.value} onChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          <TextField form={form} name={`${base}.fauna.especiesMorcegos`} label="Espécies de morcegos (se aplicável)" />
        </div>
      </SectionCard>
    </div>
  );
}
