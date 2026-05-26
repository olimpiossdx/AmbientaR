'use client';

import * as React from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import {
  BooleanRadio,
  CheckboxOptions,
  NumField,
  SectionCard,
  TextField,
} from './form-listagem-a-helpers';

const outrasAtividadesPadrao = [
  { atividade: 'Armazenamento de produtos agrotóxicos', codigo: 'G-06-01-8', unidade: 'ha' },
  { atividade: 'Abastecimento de veículos', codigo: 'F-06-01-7', unidade: 'Capacidade de armazenamento' },
];

const ocupacaoEntornoTipos = [
  { id: 'lavouras_pastagens', label: 'Lavouras ou pastagens' },
  { id: 'residencias', label: 'Residências' },
  { id: 'comercio', label: 'Comércio' },
  { id: 'industrias', label: 'Indústrias' },
  { id: 'escolas', label: 'Escolas' },
  { id: 'hospitais', label: 'Hospitais ou centros de saúde' },
  { id: 'agropecuarias', label: 'Instalações agropecuárias (especificar)' },
  { id: 'recurso_hidrico', label: "Recurso hídrico – lago, lagoa, córrego ou rio (especificar)" },
  { id: 'outras', label: 'Outras (especificar)' },
];

const usosAguaCorpo = [
  { id: 'abastecimento_publico', label: 'Captação para abastecimento público' },
  { id: 'esgoto_sanitario', label: 'Lançamento de esgoto sanitário' },
  { id: 'efluentes_industriais', label: 'Lançamento de efluentes industriais' },
  { id: 'irrigacao', label: 'Captação para irrigação' },
  { id: 'dessedentacao', label: 'Dessedentação de animais' },
  { id: 'piscicultura', label: 'Piscicultura' },
  { id: 'barragem', label: 'Barragem (especificar finalidade)' },
  { id: 'outros', label: 'Outros (especificar)' },
];

const fontesAgua = [
  { id: 'poco_tubular', label: 'Poço tubular' },
  { id: 'nascente', label: 'Nascente' },
  { id: 'rios', label: "Rios, córregos, etc. (citar o nome)" },
  { id: 'lagos', label: 'Lagos, represas, etc. (citar o nome)' },
  { id: 'rede_publica', label: 'Rede pública (concessionária)' },
  { id: 'outros', label: 'Outros (especificar)' },
];

const finalidadesAguaD = [
  { id: 'lavagem_mp', label: 'Lavagem matérias-primas' },
  { id: 'lavagem_intermediarios', label: 'Lavagem de produtos intermediários' },
  { id: 'incorporacao', label: 'Incorporação ao produto' },
  { id: 'lavagem_pisos', label: 'Lavagem de pisos e equipamentos' },
  { id: 'resfriamento', label: 'Resfriamento e refrigeração' },
  { id: 'vapor', label: 'Produção de vapor' },
  { id: 'consumo_humano', label: 'Consumo humano (sanitários, refeitório etc.)' },
  { id: 'outros', label: 'Outros (especificar)' },
];

function TabelaEquipamento({
  form,
  title,
  basePath,
  colunaExtra,
}: {
  form: any;
  title: string;
  basePath: string;
  colunaExtra: string;
}) {
  const { fields, append, remove } = useFieldArray({ control: form.control, name: basePath });
  return (
    <div className="space-y-2">
      <p className="font-medium">{title}</p>
      {fields.map((item, index) => (
        <div key={item.id} className="grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-6">
          <NumField form={form} name={`${basePath}.${index}.quantidade`} label="Quantidade" />
          <TextField form={form} name={`${basePath}.${index}.marca`} label="Marca" />
          <TextField form={form} name={`${basePath}.${index}.modelo`} label="Modelo" />
          <TextField form={form} name={`${basePath}.${index}.anoFabricacao`} label="Ano de fabricação" />
          <TextField form={form} name={`${basePath}.${index}.capacidade`} label={colunaExtra} />
          <div className="flex items-end justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => remove(index)}>
              <Trash2 className="mr-2 h-4 w-4" />Remover
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => append({})}>
        <PlusCircle className="mr-2 h-4 w-4" />Adicionar linha
      </Button>
    </div>
  );
}

export function FormListagemDModulo4({ form }: { form: any }) {
  const { fields: outrasFields, append: appendOutra, remove: removeOutra } = useFieldArray({
    control: form.control,
    name: 'listagemD.outrasAtividades',
  });
  const { fields: materiasFields, append: appendMateria, remove: removeMateria } = useFieldArray({
    control: form.control,
    name: 'listagemD.materiasPrimas.linhas',
  });
  const { fields: produtosFields, append: appendProduto, remove: removeProduto } = useFieldArray({
    control: form.control,
    name: 'listagemD.produtos.linhas',
  });
  const { fields: subprodutosFields, append: appendSub, remove: removeSub } = useFieldArray({
    control: form.control,
    name: 'listagemD.subprodutos.linhas',
  });

  const areaSemUsos = form.watch('listagemD.usosAnteriores.areaSemUsosAnteriores');

  React.useEffect(() => {
    if (outrasFields.length === 0) {
      outrasAtividadesPadrao.forEach((row) =>
        appendOutra({ ...row, quantidade: '', inicioAtividade: '' })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- pré-preencher linhas padrão uma vez
  }, []);

  return (
    <div className="space-y-6">
      <SectionCard title="Módulo 4 – Caracterização do empreendimento e entorno">
        <FormDescription>
          RCA – Fabricação de aguardente de cana-de-açúcar. Códigos de atividade conforme DN COPAM 217/17.
        </FormDescription>
      </SectionCard>

      <SectionCard title="12. Outras atividades não descritas">
        {outrasFields.map((item, index) => (
          <div key={item.id} className="mb-3 grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-5">
            <TextField form={form} name={`listagemD.outrasAtividades.${index}.atividade`} label="Atividade" />
            <TextField form={form} name={`listagemD.outrasAtividades.${index}.codigo`} label="Código DN 217/17" />
            <TextField form={form} name={`listagemD.outrasAtividades.${index}.unidade`} label="Unidade" />
            <TextField form={form} name={`listagemD.outrasAtividades.${index}.quantidade`} label="Quantidade" />
            <TextField form={form} name={`listagemD.outrasAtividades.${index}.inicioAtividade`} label="Início da atividade" />
            <div className="md:col-span-5 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeOutra(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => appendOutra({ atividade: '', codigo: '', unidade: '', quantidade: '', inicioAtividade: '' })}
        >
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar atividade
        </Button>
      </SectionCard>

      <SectionCard title="13. Trabalhadores / empregados / funcionários">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NumField form={form} name="listagemD.trabalhadores.duranteSafra" label="Durante a safra" />
          <NumField form={form} name="listagemD.trabalhadores.foraSafra" label="Fora de safra" />
          <TextField form={form} name="listagemD.trabalhadores.periodoSafra" label="Período da safra" />
        </div>
      </SectionCard>

      <SectionCard title="14. Área do empreendimento">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NumField form={form} name="listagemD.areaEmpreendimento.areaTotalHa" label="Área total do terreno (ha)" />
          <NumField form={form} name="listagemD.areaEmpreendimento.areaUtilHa" label="Área útil do empreendimento (ha)" />
          <NumField form={form} name="listagemD.areaEmpreendimento.areaPlantioCanaHa" label="Área de plantio de cana própria (ha)" />
          <NumField form={form} name="listagemD.areaEmpreendimento.areaConstruidaHa" label="Área construída (ha)" />
          <NumField form={form} name="listagemD.areaEmpreendimento.areaAmpliacaoM2" label="Área a construir na ampliação (m²)" />
        </div>
        <FormField
          control={form.control}
          name="listagemD.areaEmpreendimento.plantioCanaLicenciado"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>A área própria de plantio de cana está licenciada?</FormLabel>
              <FormControl>
                <Input placeholder="Possui licenças / requerimento FOB / não se aplica" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <TextField form={form} name="listagemD.areaEmpreendimento.numerosLicencasPlantio" label="Nº licenças ou FOB (se aplicável)" />
      </SectionCard>

      <SectionCard title="15. Regime de operação">
        {['fabricacaoCachaca', 'envase'].map((key) => (
          <div key={key} className="mb-4 rounded-md border p-3">
            <p className="mb-2 font-medium">{key === 'fabricacaoCachaca' ? 'Fabricação de cachaça' : 'Envase'}</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <NumField form={form} name={`listagemD.regimeOperacao.${key}.turnos`} label="Nº de turnos" />
              <NumField form={form} name={`listagemD.regimeOperacao.${key}.horasTurno`} label="Horas/turno" />
              <NumField form={form} name={`listagemD.regimeOperacao.${key}.diasSemana`} label="Dias/semana" />
              <NumField form={form} name={`listagemD.regimeOperacao.${key}.mesesAno`} label="Meses/ano" />
            </div>
          </div>
        ))}
      </SectionCard>

      <SectionCard title="16. Capacidade nominal instalada">
        {[
          { id: 'processamentoCana', label: 'Processamento de cana', ud: 't/dia', ua: 't/ano' },
          { id: 'producaoCachaca', label: 'Produção de cachaça', ud: 'L/dia', ua: 'L/ano' },
          { id: 'envase', label: 'Envase', ud: 'L/dia', ua: 'L/ano' },
          { id: 'producaoAlcool', label: 'Produção de álcool', ud: 'L/dia', ua: 'L/ano' },
          { id: 'producaoMelaco', label: 'Produção de melaço', ud: 'L/dia', ua: 'L/ano' },
          { id: 'producaoRapadura', label: 'Produção de rapadura', ud: 'Kg/dia', ua: 't/ano' },
        ].map((row) => (
          <div key={row.id} className="mb-3 grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-3">
            <p className="font-medium md:col-span-3">{row.label}</p>
            <NumField form={form} name={`listagemD.capacidadeInstalada.${row.id}.diario`} label={row.ud} />
            <NumField form={form} name={`listagemD.capacidadeInstalada.${row.id}.anual`} label={row.ua} />
          </div>
        ))}
        <p className="text-sm text-muted-foreground">Percentual médio de utilização (somente LO corretiva):</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <NumField form={form} name="listagemD.capacidadeInstalada.utilizacaoCachacaPct" label="Produção de cachaça (%)" />
          <NumField form={form} name="listagemD.capacidadeInstalada.utilizacaoEnvasePct" label="Envase (%)" />
        </div>
      </SectionCard>

      <SectionCard title="17. Tipo de ocupação da área de entorno">
        <div className="space-y-2">
          {ocupacaoEntornoTipos.map((tipo) => (
            <div key={tipo.id} className="grid grid-cols-1 gap-2 rounded-md border p-2 md:grid-cols-3">
              <p className="text-sm md:col-span-2">{tipo.label}</p>
              <NumField form={form} name={`listagemD.ocupacaoEntorno.${tipo.id}.distanciaM`} label="Distância (m)" />
            </div>
          ))}
        </div>
        <FormField
          control={form.control}
          name="listagemD.ocupacaoEntorno.observacoes"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>Especificar recurso hídrico e outras ocorrências</FormLabel>
              <FormControl><Textarea {...field} /></FormControl>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title="18. Recursos hídricos">
        <TextField
          form={form}
          name="listagemD.recursosHidricos.corpoReceptorEfluentes"
          label="Nome do corpo hídrico que recebe os efluentes líquidos"
        />
        <CheckboxOptions
          form={form}
          name="listagemD.recursosHidricos.classesCorpo"
          options={[
            { id: 'especial', label: 'Classe especial' },
            { id: '1', label: 'Classe 1' },
            { id: '2', label: 'Classe 2' },
            { id: '3', label: 'Classe 3' },
            { id: '4', label: 'Classe 4' },
          ]}
        />
        <p className="mt-4 text-sm font-medium">Principais usos da água do corpo hídrico</p>
        {usosAguaCorpo.map((uso) => (
          <div key={uso.id} className="mt-2 grid grid-cols-1 gap-2 rounded-md border p-2 md:grid-cols-3">
            <p className="text-sm">{uso.label}</p>
            <FormField
              control={form.control}
              name={`listagemD.recursosHidricos.usos.${uso.id}.montante`}
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl><Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="font-normal">A montante</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`listagemD.recursosHidricos.usos.${uso.id}.jusante`}
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl><Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} /></FormControl>
                  <FormLabel className="font-normal">A jusante</FormLabel>
                </FormItem>
              )}
            />
          </div>
        ))}
        <FormField
          control={form.control}
          name="listagemD.recursosHidricos.observacoesUsos"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>Observações pertinentes à tabela</FormLabel>
              <FormControl><Textarea {...field} /></FormControl>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title="19. Usos anteriores do terreno">
        <FormField
          control={form.control}
          name="listagemD.usosAnteriores.areaSemUsosAnteriores"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O local trata-se de área sem usos anteriores?</FormLabel>
              <FormControl><BooleanRadio value={field.value} onChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
        {areaSemUsos === false && (
          <FormField
            control={form.control}
            name="listagemD.usosAnteriores.descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Usos anteriores</FormLabel>
                <FormControl><Textarea {...field} /></FormControl>
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="listagemD.usosAnteriores.indicamPassivos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Esses usos podem indicar passivos ambientais?</FormLabel>
              <FormControl><BooleanRadio value={field.value} onChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title="20. Matérias-primas e insumos">
        {materiasFields.map((item, index) => (
          <div key={item.id} className="mb-3 grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-3">
            <TextField form={form} name={`listagemD.materiasPrimas.linhas.${index}.nome`} label="Nome técnico/comercial" />
            <TextField form={form} name={`listagemD.materiasPrimas.linhas.${index}.embalagem`} label="Tipo de embalagem" />
            <TextField form={form} name={`listagemD.materiasPrimas.linhas.${index}.armazenamento`} label="Local de armazenamento" />
            <NumField form={form} name={`listagemD.materiasPrimas.linhas.${index}.consumoMax`} label="Consumo mensal máximo" />
            <NumField form={form} name={`listagemD.materiasPrimas.linhas.${index}.consumoMedio`} label="Consumo mensal médio" />
            <div className="flex items-end justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeMateria(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendMateria({})}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar matéria-prima
        </Button>
        <NumField
          form={form}
          name="listagemD.materiasPrimas.percentualCanaTerceiros"
          label="% médio de cana adquirida de terceiros (por safra)"
        />
      </SectionCard>

      <SectionCard title="21. Forma de armazenamento">
        <FormDescription>Detalhar no anexo capacidade, prevenção de incêndio e controle de vazamentos.</FormDescription>
        <FormField
          control={form.control}
          name="listagemD.armazenamento.resumo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Resumo / referência aos anexos</FormLabel>
              <FormControl><Textarea {...field} /></FormControl>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title="22. Produtos">
        {produtosFields.map((item, index) => (
          <div key={item.id} className="mb-2 flex gap-2">
            <TextField form={form} name={`listagemD.produtos.linhas.${index}.nome`} label="Nome comercial" />
            <Button type="button" variant="outline" size="sm" onClick={() => removeProduto(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendProduto({ nome: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar produto
        </Button>
      </SectionCard>

      <SectionCard title="23. Subprodutos">
        {subprodutosFields.map((item, index) => (
          <div key={item.id} className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
            <TextField form={form} name={`listagemD.subprodutos.linhas.${index}.nome`} label="Subproduto" />
            <NumField form={form} name={`listagemD.subprodutos.linhas.${index}.producaoAnualL`} label="Produção anual média (L/ano)" />
            <Button type="button" variant="outline" size="sm" onClick={() => removeSub(index)}>
              <Trash2 className="mr-2 h-4 w-4" />Remover
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendSub({})}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar subproduto
        </Button>
      </SectionCard>

      <SectionCard title="24. Equipamentos do processo industrial">
        <TabelaEquipamento form={form} title="Moenda" basePath="listagemD.equipamentos.moendas" colunaExtra="Capacidade de moagem" />
        <TabelaEquipamento form={form} title="Filtros" basePath="listagemD.equipamentos.filtros" colunaExtra="Material de enchimento" />
        <TabelaEquipamento form={form} title="Envasadoras" basePath="listagemD.equipamentos.envasadoras" colunaExtra="Capacidade de envase (L/h)" />
        <TabelaEquipamento
          form={form}
          title="Decantadores / tanques / dornas / tonéis / destiladores"
          basePath="listagemD.equipamentos.decantadores"
          colunaExtra="Capacidade"
        />
        <TabelaEquipamento form={form} title="Outros equipamentos" basePath="listagemD.equipamentos.outros" colunaExtra="Capacidade nominal" />
      </SectionCard>

      <SectionCard title="25. Layout">
        <FormDescription>Apresentar em anexo o layout das instalações em escala adequada.</FormDescription>
      </SectionCard>

      <SectionCard title="26. Insumos principais – água">
        <p className="text-sm font-medium">Fontes de água</p>
        {fontesAgua.map((f) => (
          <div key={f.id} className="mb-2 grid grid-cols-1 gap-2 rounded-md border p-2 md:grid-cols-4">
            <p className="text-sm md:col-span-2">{f.label}</p>
            <NumField form={form} name={`listagemD.insumos.agua.fontes.${f.id}.consumoMax`} label="Consumo máx. (m³/mês)" />
            <NumField form={form} name={`listagemD.insumos.agua.fontes.${f.id}.consumoMedio`} label="Consumo médio" />
            <TextField form={form} name={`listagemD.insumos.agua.fontes.${f.id}.detalhe`} label="Nome / especificação" />
          </div>
        ))}
        <p className="mt-4 text-sm font-medium">Finalidade do consumo</p>
        {finalidadesAguaD.map((fin) => (
          <div key={fin.id} className="mb-2 grid grid-cols-1 gap-2 rounded-md border p-2 md:grid-cols-4">
            <p className="text-sm md:col-span-2">{fin.label}</p>
            <NumField form={form} name={`listagemD.insumos.agua.finalidades.${fin.id}.maxima`} label="Qtd. máxima (m³/mês)" />
            <NumField form={form} name={`listagemD.insumos.agua.finalidades.${fin.id}.media`} label="Qtd. média" />
            <TextField form={form} name={`listagemD.insumos.agua.finalidades.${fin.id}.origem`} label="Origem" />
          </div>
        ))}
        <FormField
          control={form.control}
          name="listagemD.insumos.agua.possuiEta"
          render={({ field }) => (
            <FormItem className="mt-4">
              <FormLabel>Possui sistema de tratamento de água para consumo?</FormLabel>
              <FormControl><BooleanRadio value={field.value} onChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
      </SectionCard>
    </div>
  );
}
