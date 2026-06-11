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
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Trash2 } from 'lucide-react';
import {
  BooleanRadio,
  CheckboxOptions,
  NumField,
  SectionCard,
  TabelaLinhasFixas,
  TextField,
} from './form-listagem-a-helpers';

const diasSemana = ['2a Feira', '3a Feira', '4a Feira', '5a Feira', '6a Feira', 'Sábado', 'Domingo'] as const;
const mesesAno = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'] as const;

const finalidadesAguaC = [
  'Consumo uso doméstico',
  'Consumo uso industrial',
  'Lavagem de veículos',
  'Oficinas',
  'Utilidades (limpeza de pisos e equipamentos, etc.)',
  'Uso não industrial',
  'Geração de vapor',
  'Reposição de perdas/evaporação',
  'Testes hidrostáticos',
  'Sistema de controle de emissões atmosféricas',
  'Consumo humano (sanitários, refeitório etc.)',
  'Outras finalidades',
];

const etapasTratamentoAgua = [
  { id: 'coagulacao', label: 'Coagulação' },
  { id: 'floculacao', label: 'Floculação' },
  { id: 'decantacao', label: 'Decantação' },
  { id: 'sedimentacao', label: 'Sedimentação' },
  { id: 'filtracao_lenta', label: 'Filtração lenta' },
  { id: 'filtracao_rapida', label: 'Filtração rápida' },
  { id: 'desinfecao_cloro', label: 'Desinfecção – adição de cloro' },
  { id: 'desinfecao_ozonio', label: 'Desinfecção – adição de ozônio' },
  { id: 'desinfecao_carvao', label: 'Desinfecção – carvão ativado' },
  { id: 'retrolavagem', label: 'Retrolavagem' },
  { id: 'correcao_ph', label: 'Correção de pH' },
  { id: 'outros', label: 'Outros' },
];

const equipamentosOutros = [
  { id: 'misturador_fechado', label: 'Misturador fechado' },
  { id: 'extrusora', label: 'Extrusora' },
  { id: 'prensa', label: 'Prensa' },
  { id: 'balanca', label: 'Balança' },
  { id: 'resfriador', label: 'Resfriador' },
  { id: 'schiller', label: 'Schiller' },
  { id: 'moega', label: 'Moega' },
  { id: 'silo', label: 'Silo' },
  { id: 'esteira', label: 'Esteira' },
  { id: 'caldeira', label: 'Caldeira' },
  { id: 'esmeril', label: 'Esmeril' },
  { id: 'autoclave', label: 'Autoclave' },
  { id: 'chicote_escareacao', label: 'Chicote de escareação' },
  { id: 'calibrador_pneu', label: 'Calibrador de pneu' },
  { id: 'maquina_vulcanizar', label: 'Máquina de vulcanizar' },
  { id: 'outros', label: 'Outros' },
];

const materiasPrimas = [
  { id: 'negro_fumo', label: 'Negro de fumo' },
  { id: 'antioxidante', label: 'Antioxidante' },
  { id: 'agente_vulcanizacao', label: 'Agente de vulcanização' },
  { id: 'enxofre', label: 'Enxofre' },
  { id: 'borracha', label: 'Borracha' },
  { id: 'acido_estearico', label: 'Ácido esteárico' },
  { id: 'acelerador', label: 'Acelerador' },
  { id: 'oleo_aromatico', label: 'Óleo aromático' },
  { id: 'oleo_parafinico', label: 'Óleo parafínico' },
  { id: 'oxido_zinco', label: 'Óxido de zinco' },
  { id: 'resina', label: 'Resina' },
  { id: 'oleo_diesel', label: 'Óleo diesel' },
  { id: 'cola', label: 'Cola' },
  { id: 'camara_ar', label: 'Câmara de ar' },
  { id: 'sacos_ar', label: 'Sacos de ar' },
  { id: 'banda_premoldada', label: 'Banda pré-moldada' },
  { id: 'machoes', label: 'Machões' },
  { id: 'outros', label: 'Outros' },
];

const produtosFabricados = [
  { id: 'bandas_rodagem', label: 'Bandas de rodagem' },
  { id: 'anel_borracha', label: 'Anel de borracha pré-moldado' },
  { id: 'banda_plana', label: 'Banda plana' },
  { id: 'borracha_ligacao', label: 'Borracha de ligação' },
  { id: 'cola_produto', label: 'Cola' },
  { id: 'camelback', label: 'Camelback' },
  { id: 'pneus_recauchutados', label: 'Pneus recauchutados' },
  { id: 'pneus', label: 'Pneus' },
  { id: 'outros', label: 'Outros' },
];

const residuosSolidosC = [
  { id: 'lodo_eta', label: 'Lodo da ETA' },
  { id: 'lodo_ete', label: 'Lodo da ETE' },
  { id: 'embalagens_nao_reciclaveis', label: 'Embalagens e materiais não recicláveis' },
  { id: 'embalagens_reciclaveis', label: 'Embalagens e materiais recicláveis' },
  { id: 'lixo_domestico', label: 'Lixo doméstico' },
  { id: 'cinzas_caldeira', label: 'Cinzas ou fuligem da caldeira' },
  { id: 'epi', label: 'Equipamentos de proteção individual' },
  { id: 'produto_nao_conforme', label: 'Produto não conforme' },
  { id: 'residuos_laboratorio', label: 'Resíduos do laboratório' },
  { id: 'oleo_usado', label: 'Óleo usado' },
  { id: 'materiais_contaminados_oleo', label: 'Materiais contaminados com óleo' },
  { id: 'rebarbas', label: 'Rebarbas' },
  { id: 'raspas_borracha', label: 'Raspas de borracha' },
  { id: 'outros', label: 'Outros' },
];

const equipamentosPapel = [
  { id: 'digestor', label: 'Digestor' },
  { id: 'prensa', label: 'Prensa' },
  { id: 'evaporador', label: 'Evaporador' },
  { id: 'moega', label: 'Moega' },
  { id: 'pulper', label: 'Pulper' },
  { id: 'mandril', label: 'Mandril' },
  { id: 'cortadeira', label: 'Cortadeira' },
  { id: 'empacotadeira', label: 'Empacotadeira' },
  { id: 'paletizadora', label: 'Paletizadora' },
  { id: 'enfardadora', label: 'Enfardadora' },
  { id: 'tanque', label: 'Tanque' },
  { id: 'outros', label: 'Outros' },
];

const materiasPrimasPapel = [
  { id: 'madeira', label: 'Madeira' },
  { id: 'celulose', label: 'Celulose' },
  { id: 'papel_reciclado', label: 'Papel reciclado' },
  { id: 'palha', label: 'Palha' },
  { id: 'bagaco', label: 'Bagaço' },
  { id: 'cana', label: 'Cana' },
  { id: 'sisal', label: 'Sisal' },
  { id: 'linho', label: 'Linho' },
  { id: 'juta', label: 'Juta' },
  { id: 'cloro', label: 'Cloro' },
  { id: 'cola_sintetica', label: 'Cola sintética' },
  { id: 'hidroxido_sodio', label: 'Hidróxido de sódio' },
  { id: 'hidrossulfito_sodio', label: 'Hidrossulfito de sódio' },
  { id: 'sulfato_sodio', label: 'Sulfato de sódio' },
  { id: 'carbonato_calcio', label: 'Carbonato de cálcio' },
  { id: 'dioxido_cloro', label: 'Dióxido de cloro' },
  { id: 'peroxidos', label: 'Peróxidos' },
  { id: 'ozonio', label: 'Ozônio' },
  { id: 'combustivel', label: 'Combustível' },
  { id: 'outros', label: 'Outros' },
];

const produtosPapel = [
  { id: 'papel_acido', label: 'Papel ácido' },
  { id: 'papel_alcalino', label: 'Papel alcalino' },
  { id: 'papel_jornal', label: 'Papel jornal' },
  { id: 'glinter', label: 'Glinter' },
  { id: 'cartolina', label: 'Cartolina' },
  { id: 'papel_cartao', label: 'Papel cartão' },
  { id: 'papelao', label: 'Papelão' },
  { id: 'celulose_produto', label: 'Celulose' },
  { id: 'papel_higienico', label: 'Papel higiênico' },
  { id: 'papel_sulfite', label: 'Papel sulfite' },
  { id: 'outros', label: 'Outros' },
];

const equipamentosDomissanitarios = [
  { id: 'ensacadeira', label: 'Ensacadeira' },
  { id: 'refiladeira', label: 'Refiladeira' },
  { id: 'aglutinador', label: 'Aglutinador' },
  { id: 'balanca', label: 'Balança' },
  { id: 'envasadeira', label: 'Envasadeira' },
  { id: 'extrusora', label: 'Extrusora' },
  { id: 'fechamento_caixas', label: 'Fechamento de caixas' },
  { id: 'maquina_solda', label: 'Máquina de solda' },
  { id: 'maquina_tampar', label: 'Máquina de tampar garrafas' },
  { id: 'moinho', label: 'Moinho' },
  { id: 'moldadeira', label: 'Moldadeira' },
  { id: 'reator', label: 'Reator' },
  { id: 'sopradeira', label: 'Sopradeira' },
  { id: 'cortadeira', label: 'Cortadeira' },
  { id: 'rotuladeira', label: 'Rotuladeira' },
  { id: 'tanques', label: 'Tanques' },
  { id: 'outros', label: 'Outros' },
];

const materiasPrimasDomissanitarios = [
  { id: 'hipoclorito_sodio', label: 'Hipoclorito de sódio' },
  { id: 'soda_caustica', label: 'Soda cáustica' },
  { id: 'essencias', label: 'Essências' },
  { id: 'calcario', label: 'Calcário' },
  { id: 'barrilha', label: 'Barrilha' },
  { id: 'bicarbonato_sodio', label: 'Bicarbonato de sódio' },
  { id: 'acido_borico', label: 'Ácido bórico' },
  { id: 'lauril_sulfato', label: 'Lauril sulfato de sódio' },
  { id: 'alcool_etilico', label: 'Álcool etílico' },
  { id: 'metilparabeno', label: 'Metilparabeno' },
  { id: 'silicato_sodio', label: 'Silicato de sódio' },
  { id: 'eter', label: 'Éter' },
  { id: 'formol', label: 'Formol' },
  { id: 'polietileno', label: 'Polietileno' },
  { id: 'caixas_papelao', label: 'Caixas de papelão' },
  { id: 'outros', label: 'Outros' },
];

const produtosDomissanitarios = [
  { id: 'agua_sanitaria', label: 'Água sanitária' },
  { id: 'alvejante', label: 'Alvejante' },
  { id: 'saponaceo', label: 'Saponáceo' },
  { id: 'detergente', label: 'Detergente' },
  { id: 'cera', label: 'Cera' },
  { id: 'desinfetante', label: 'Desinfetante' },
  { id: 'creme_dental', label: 'Creme dental' },
  { id: 'inseticida', label: 'Inseticida' },
  { id: 'amaciantes', label: 'Amaciantes' },
  { id: 'agua_oxigenada', label: 'Água oxigenada' },
  { id: 'sabonete', label: 'Sabonete' },
  { id: 'vaselina', label: 'Vaselina' },
  { id: 'glicerina', label: 'Glicerina' },
  { id: 'embalagens', label: 'Embalagens' },
  { id: 'outros', label: 'Outros' },
];

const residuosDomissanitarios = [
  { id: 'lodo_eta', label: 'Lodo da ETA' },
  { id: 'lodo_ete', label: 'Lodo da ETE' },
  { id: 'embalagens_nao_reciclaveis', label: 'Embalagens e materiais não recicláveis' },
  { id: 'embalagens_reciclaveis', label: 'Embalagens e materiais recicláveis' },
  { id: 'lixo_domestico', label: 'Lixo doméstico' },
  { id: 'cinzas_caldeira', label: 'Cinzas ou fuligem da caldeira' },
  { id: 'epi', label: 'Equipamentos de proteção individual usados' },
  { id: 'produto_nao_conforme', label: 'Produto não conforme' },
  { id: 'residuos_laboratorio', label: 'Resíduos do laboratório' },
  { id: 'oleo_usado', label: 'Óleo usado' },
  { id: 'materiais_contaminados_oleo', label: 'Materiais contaminados com óleo' },
  { id: 'outros', label: 'Outros' },
];

const residuosPapel = [
  { id: 'lodo_eta', label: 'Lodo da ETA' },
  { id: 'lodo_ete', label: 'Lodo da ETE' },
  { id: 'embalagens_nao_reciclaveis', label: 'Embalagens e materiais não recicláveis' },
  { id: 'embalagens_reciclaveis', label: 'Embalagens e materiais recicláveis' },
  { id: 'lixo_domestico', label: 'Lixo doméstico' },
  { id: 'cinzas_caldeira', label: 'Cinzas ou fuligem da caldeira' },
  { id: 'epi', label: 'Equipamentos de proteção individual' },
  { id: 'produto_nao_conforme', label: 'Produto não conforme' },
  { id: 'residuos_laboratorio', label: 'Resíduos do laboratório' },
  { id: 'oleo_usado', label: 'Óleo usado' },
  { id: 'materiais_contaminados_oleo', label: 'Materiais contaminados com óleo' },
  { id: 'licor_negro_concentrado', label: 'Licor negro concentrado' },
  { id: 'outros', label: 'Outros' },
];

const parametrosEfluenteIndustrial = [
  'pH',
  'Condutividade elétrica',
  'Temperatura',
  'Materiais sedimentáveis',
  'Óleos e graxas minerais',
  'Óleos e graxas vegetais/animal',
  'DBO',
  'DQO',
  'Substâncias tensoativas (LAS)',
];

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

export function FormListagemCTecnico({
  form,
  variant = 'borracha',
}: {
  form: any;
  variant?: 'borracha' | 'papel' | 'domissanitarios';
}) {
  const isPapel = variant === 'papel';
  const isDomissanitarios = variant === 'domissanitarios';
  const isTrExtended = isPapel || isDomissanitarios;
  const item = (n: number, suffix?: string) => `${isTrExtended ? n + 1 : n}${suffix ? `.${suffix}` : ''}`;
  const equipamentosLista = isPapel
    ? equipamentosPapel
    : isDomissanitarios
      ? equipamentosDomissanitarios
      : equipamentosOutros;
  const materiasLista = isPapel
    ? materiasPrimasPapel
    : isDomissanitarios
      ? materiasPrimasDomissanitarios
      : materiasPrimas;
  const produtosLista = isPapel
    ? produtosPapel
    : isDomissanitarios
      ? produtosDomissanitarios
      : produtosFabricados;
  const residuosLista = isPapel
    ? residuosPapel
    : isDomissanitarios
      ? residuosDomissanitarios
      : residuosSolidosC;
  const setoresRh = isPapel
    ? [
        { key: 'producao', label: 'Setor de produção' },
        { key: 'administrativo', label: 'Setor administrativo' },
        { key: 'terceirizados', label: 'Terceirizados' },
      ]
    : [
        { key: 'producao', label: 'Setor de produção' },
        { key: 'administrativo', label: 'Setor administrativo' },
        { key: 'outros', label: 'Outros setores' },
      ];
  const recirculaAgua = form.watch('listagemC.usoAgua.recirculaAgua');
  const trataAgua = form.watch('listagemC.tratamentoAgua.trataAgua');
  const geraEfluenteIndustrial = form.watch('listagemC.efluentesIndustriais.gera');
  const haPassivo = form.watch('listagemC.passivosAmbientais.existePassivo');
  const possuiCaldeira = form.watch('listagemC.equipamentosApoio.caldeira.ativa');
  const combustivelCaldeira = form.watch('listagemC.equipamentosApoio.caldeira.combustivel');
  const possuiPosto = form.watch('listagemC.equipamentosApoio.postoAbastecimento.ativa');
  const fontesPontuais = form.watch('listagemC.emissoesAtmosfericas.fontesPontuais');
  const substanciasOdoriferas = form.watch('listagemC.emissoesAtmosfericas.substanciasOdoriferas');
  const controleEmissoes = form.watch('listagemC.emissoesAtmosfericas.sistemaControle');
  const fontesDifusas = form.watch('listagemC.emissoesAtmosfericas.fontesDifusas');

  const { fields: fontesEmissao, append: appendFonte, remove: removeFonte } = useFieldArray({
    control: form.control,
    name: 'listagemC.emissoesAtmosfericas.fontes',
  });
  const { fields: controleEquip, append: appendControle, remove: removeControle } = useFieldArray({
    control: form.control,
    name: 'listagemC.emissoesAtmosfericas.equipamentosControle',
  });

  const { fields: turnosFields, append: appendTurno, remove: removeTurno } = useFieldArray({
    control: form.control,
    name: 'listagemC.regimeOperacao.turnos',
  });
  const { fields: pontosSanitarios, append: appendPontoSanitario, remove: removePontoSanitario } = useFieldArray({
    control: form.control,
    name: 'listagemC.efluentesSanitarios.pontos',
  });
  const { fields: pontosIndustriais, append: appendPontoIndustrial, remove: removePontoIndustrial } = useFieldArray({
    control: form.control,
    name: 'listagemC.efluentesIndustriais.pontos',
  });
  const { fields: outrosEquipamentos, append: appendOutroEquip, remove: removeOutroEquip } = useFieldArray({
    control: form.control,
    name: 'listagemC.equipamentosOutros.linhasExtras',
  });
  const { fields: outrosResiduos, append: appendResiduo, remove: removeResiduo } = useFieldArray({
    control: form.control,
    name: 'listagemC.residuosSolidos.linhasExtras',
  });

  return (
    <div className="space-y-6">
      {!isTrExtended && (
      <SectionCard title="21. Caracterização técnica do empreendimento">
        <FormDescription>
          A partir deste item, apresentar as informações técnicas específicas da atividade de indústria de borracha em regularização.
        </FormDescription>
      </SectionCard>
      )}

      {!isTrExtended && (
      <SectionCard title="22. Área do empreendimento">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NumField form={form} name="listagemC.areaEmpreendimento.areaTotalM2" label="Área total do terreno (m²)" />
          <NumField form={form} name="listagemC.areaEmpreendimento.areaUtilM2" label="Área útil (m²)" />
          <NumField form={form} name="listagemC.areaEmpreendimento.areaConstruidaM2" label="Área construída (m²)" />
        </div>
      </SectionCard>
      )}

      <SectionCard title={`${item(23)}. Recursos humanos`}>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {setoresRh.map((setor) => (
            <div key={setor.key} className="rounded-md border p-3">
              <p className="mb-2 font-medium">{setor.label}</p>
              <NumField form={form} name={`listagemC.recursosHumanos.${setor.key}.quantidade`} label="Nº de funcionários" />
              <p className="mb-1 mt-3 text-sm text-muted-foreground">Cidade de origem (%)</p>
              <OrigemFuncionarios form={form} basePath={`listagemC.recursosHumanos.${setor.key}.origem`} />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={`${item(24)}. Regime de operação do empreendimento`}>
        {turnosFields.map((item, index) => (
          <div key={item.id} className="mb-3 grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-6">
            <TextField form={form} name={`listagemC.regimeOperacao.turnos.${index}.setor`} label="Setor" />
            <NumField form={form} name={`listagemC.regimeOperacao.turnos.${index}.funcionariosTurno`} label="Nº funcionários/turno" />
            <TextField form={form} name={`listagemC.regimeOperacao.turnos.${index}.horarioInicio`} label="Horário início" />
            <TextField form={form} name={`listagemC.regimeOperacao.turnos.${index}.horarioFim`} label="Horário fim" />
            <TextField form={form} name={`listagemC.regimeOperacao.turnos.${index}.pausaInicio`} label="Pausa início" />
            <TextField form={form} name={`listagemC.regimeOperacao.turnos.${index}.pausaFim`} label="Pausa fim" />
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
          name="listagemC.regimeOperacao.diasOperacao"
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
          name="listagemC.regimeOperacao.mesesOperacao"
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

      <SectionCard title={`${item(25)}. Equipamentos e sistemas de apoio ao processo produtivo`}>
        <FormField
          control={form.control}
          name="listagemC.equipamentosApoio.resfriamento.ativa"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>Sistema de resfriamento ou refrigeração</FormLabel>
            </FormItem>
          )}
        />
        {form.watch('listagemC.equipamentosApoio.resfriamento.ativa') && (
          <div className="mb-4 grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-2">
            <NumField form={form} name="listagemC.equipamentosApoio.resfriamento.capacidadeKcalH" label="Capacidade nominal (kcal/h)" />
            <TextField form={form} name="listagemC.equipamentosApoio.resfriamento.fluido" label="Fluido refrigerante" />
            <NumField form={form} name="listagemC.equipamentosApoio.resfriamento.volumeFluidoM3" label="Volume de fluido no sistema (m³)" />
            <NumField form={form} name="listagemC.equipamentosApoio.resfriamento.volumeDescartadoM3Ano" label="Volume descartado (m³/ano)" />
            <NumField form={form} name="listagemC.equipamentosApoio.resfriamento.volumeReposicaoM3Ano" label="Volume de reposição (m³/ano)" />
          </div>
        )}

        <FormField
          control={form.control}
          name="listagemC.equipamentosApoio.compressor.ativa"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>Compressor de ar</FormLabel>
            </FormItem>
          )}
        />
        {form.watch('listagemC.equipamentosApoio.compressor.ativa') && (
          <div className="mb-4 grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-2">
            <NumField form={form} name="listagemC.equipamentosApoio.compressor.capacidadeM3H" label="Capacidade nominal (m³/h)" />
            <NumField form={form} name="listagemC.equipamentosApoio.compressor.purgaLDia" label="Água de purga (l/dia)" />
          </div>
        )}

        <FormField
          control={form.control}
          name="listagemC.equipamentosApoio.caldeira.ativa"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>Caldeira</FormLabel>
            </FormItem>
          )}
        />
        {possuiCaldeira && (
          <div className="mb-4 space-y-3 rounded-md border p-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <NumField form={form} name="listagemC.equipamentosApoio.caldeira.tempoOperacaoHDia" label="Tempo médio de operação (h/dia)" />
              <NumField form={form} name="listagemC.equipamentosApoio.caldeira.capacidadeVaporKgH" label="Capacidade de vapor (kg/h)" />
              <NumField form={form} name="listagemC.equipamentosApoio.caldeira.concentracaoArPercent" label="Concentração de ar na combustão (%)" />
              <NumField form={form} name="listagemC.equipamentosApoio.caldeira.purgaLDia" label="Água de purga (l/dia)" />
              <NumField form={form} name="listagemC.equipamentosApoio.caldeira.alturaChamineM" label="Altura da chaminé (m)" />
            </div>
            <CheckboxOptions
              form={form}
              name="listagemC.equipamentosApoio.caldeira.combustivel"
              options={[
                { id: 'madeira', label: 'Madeira' },
                { id: 'oleo', label: 'Óleo' },
                ...(isPapel ? [{ id: 'licor_negro', label: 'Resíduo da evaporação do licor negro' }] : []),
                { id: 'outro', label: 'Outro combustível' },
              ]}
            />
            {combustivelCaldeira?.includes('madeira') && (
              <div className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-2">
                <NumField form={form} name="listagemC.equipamentosApoio.caldeira.madeiraVolumeM3Mes" label="Volume madeira (m³/mês)" />
                <CheckboxOptions
                  form={form}
                  name="listagemC.equipamentosApoio.caldeira.madeiraOrigem"
                  options={[
                    { id: 'floresta_nativa', label: 'Floresta nativa' },
                    { id: 'reflorestamento', label: 'Reflorestamento' },
                  ]}
                />
                <FormField
                  control={form.control}
                  name="listagemC.equipamentosApoio.caldeira.madeiraCertificadoIef"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certificado IEF?</FormLabel>
                      <FormControl>
                        <BooleanRadio value={field.value} onChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <TextField form={form} name="listagemC.equipamentosApoio.caldeira.madeiraNumeroIef" label="Nº certificado IEF" />
              </div>
            )}
            {combustivelCaldeira?.includes('licor_negro') && isPapel && (
              <NumField form={form} name="listagemC.equipamentosApoio.caldeira.licorNegroVolumeM3Mes" label="Volume licor negro (m³/mês)" />
            )}
            {combustivelCaldeira?.includes('oleo') && (
              <div className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-2">
                <CheckboxOptions
                  form={form}
                  name="listagemC.equipamentosApoio.caldeira.oleoTipos"
                  options={[
                    { id: 'bpf_1a', label: 'BPF 1A' },
                    { id: 'bpf_2a', label: 'BPF 2A' },
                    { id: 'diesel', label: 'Diesel' },
                    { id: 'biodiesel', label: 'Biodiesel' },
                    { id: 'xisto', label: 'Xisto' },
                  ]}
                />
                <NumField form={form} name="listagemC.equipamentosApoio.caldeira.oleoVolumeM3Mes" label="Volume óleo (m³/mês)" />
                <NumField form={form} name="listagemC.equipamentosApoio.caldeira.oleoTanqueM3" label="Volume tanque (m³)" />
                <FormField
                  control={form.control}
                  name="listagemC.equipamentosApoio.caldeira.oleoBaciaContencao"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Tanque com bacia de contenção (NBR 17505/2007)?</FormLabel>
                      <FormControl>
                        <BooleanRadio value={field.value} onChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}
            <TextField form={form} name="listagemC.equipamentosApoio.caldeira.combustivelDetalhes" label="Outros detalhes de combustível e armazenamento" />
          </div>
        )}

        <FormField
          control={form.control}
          name="listagemC.equipamentosApoio.postoAbastecimento.ativa"
          render={({ field }) => (
            <FormItem className="flex items-center gap-2">
              <FormControl>
                <Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} />
              </FormControl>
              <FormLabel>Posto de abastecimento de veículo</FormLabel>
            </FormItem>
          )}
        />
        {possuiPosto && (
          <div className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-2">
            <NumField form={form} name="listagemC.equipamentosApoio.postoAbastecimento.capacidadeM3" label="Capacidade de armazenamento (m³)" />
            <FormField
              control={form.control}
              name="listagemC.equipamentosApoio.postoAbastecimento.cumpreDn108"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cumpre integralmente a DN 108/2007?</FormLabel>
                  <FormControl>
                    <BooleanRadio value={field.value} onChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        )}
      </SectionCard>

      <SectionCard
        title={
          isDomissanitarios
            ? `${item(25)}. Outros equipamentos ou sistemas utilizados`
            : `${item(25, '1')} Outros equipamentos ou sistemas utilizados`
        }
      >
        <TabelaLinhasFixas
          form={form}
          basePath="listagemC.equipamentosOutros.itens"
          linhas={equipamentosLista}
          colunas={[
            { key: 'descricao', label: 'Descrição' },
            { key: 'capacidadeMaxima', label: 'Capacidade máxima de produção' },
            { key: 'tempoOperacaoHDia', label: 'Tempo médio (h/dia)', type: 'number' },
            { key: 'nivelRuidoDba', label: 'Nível de ruído (dBA)', type: 'number' },
            { key: 'quantidade', label: 'Quantidade', type: 'number' },
          ]}
        />
        {outrosEquipamentos.map((item, index) => (
          <div key={item.id} className="mt-2 grid grid-cols-1 gap-2 rounded-md border p-2 md:grid-cols-6">
            <TextField form={form} name={`listagemC.equipamentosOutros.linhasExtras.${index}.nome`} label="Equipamento" />
            <TextField form={form} name={`listagemC.equipamentosOutros.linhasExtras.${index}.descricao`} label="Descrição" />
            <NumField form={form} name={`listagemC.equipamentosOutros.linhasExtras.${index}.capacidadeMaxima`} label="Capacidade" />
            <NumField form={form} name={`listagemC.equipamentosOutros.linhasExtras.${index}.tempoOperacaoHDia`} label="h/dia" />
            <NumField form={form} name={`listagemC.equipamentosOutros.linhasExtras.${index}.nivelRuidoDba`} label="dBA" />
            <div className="flex items-end justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeOutroEquip(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" className="mt-2" onClick={() => appendOutroEquip({ nome: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar equipamento
        </Button>
      </SectionCard>

      <SectionCard
        title={
          isDomissanitarios
            ? `${item(25, '1')}. Relação de matérias-primas e insumos`
            : `${item(26)}. Relação de matérias-primas e insumos`
        }
      >
        <TabelaLinhasFixas
          form={form}
          basePath="listagemC.materiasPrimas.itens"
          linhas={materiasLista}
          colunas={[
            { key: 'identificacaoTecnica', label: 'Identificação técnica' },
            { key: 'tipoEmbalagem', label: 'Tipo de embalagem' },
            { key: 'localArmazenamento', label: 'Local de armazenamento' },
            { key: 'consumoMaximo', label: 'Consumo mensal máximo', type: 'number' },
            { key: 'consumoMedio', label: 'Consumo mensal médio', type: 'number' },
          ]}
        />
      </SectionCard>

      <SectionCard title={`${item(27)}. Produtos fabricados e/ou processados`}>
        <TabelaLinhasFixas
          form={form}
          basePath="listagemC.produtos.itens"
          linhas={produtosLista}
          colunas={[
            { key: 'descricao', label: 'Descrição' },
            { key: 'localArmazenamento', label: 'Local de armazenamento' },
            { key: 'producaoMaxima', label: 'Produção mensal máxima', type: 'number' },
            { key: 'producaoMedia', label: 'Produção mensal média', type: 'number' },
          ]}
        />
      </SectionCard>

      <SectionCard title={`${item(28)}. Fluxograma do processo`}>
        <FormDescription>
          Apresentar no Anexo {isPapel ? 'XXXI' : 'XXX'} o fluxograma com entradas de matérias-primas, reagentes, insumos,
          água e saídas de efluentes líquidos, emissões atmosféricas e resíduos.
        </FormDescription>
        <TextField form={form} name="listagemC.fluxograma.referenciaAnexo" label="Referência / observações ao anexo" />
      </SectionCard>

      <SectionCard title={`${item(29)}. Uso de água`}>
        <FormField
          control={form.control}
          name="listagemC.usoAgua.recirculaAgua"
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
            <NumField form={form} name="listagemC.usoAgua.volumeRecirculadoM3Mes" label="Volume recirculado (m³/mês)" />
            <NumField form={form} name="listagemC.usoAgua.percentualRecirculada" label="Porcentagem recirculada (%)" />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Finalidade</TableHead>
              <TableHead>{isPapel ? 'Consumo mensal máximo (m³/mês)' : 'Consumo diário máximo (m³/dia)'}</TableHead>
              <TableHead>{isPapel ? 'Consumo mensal médio (m³/mês)' : 'Consumo diário médio (m³/dia)'}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {finalidadesAguaC.map((finalidade) => {
              const slug = finalidade.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
              return (
                <TableRow key={slug}>
                  <TableCell className="font-medium">{finalidade}</TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name={`listagemC.usoAgua.finalidades.${slug}.maximo`}
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
                      name={`listagemC.usoAgua.finalidades.${slug}.medio`}
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
          </TableBody>
        </Table>
        <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
          <NumField
            form={form}
            name="listagemC.usoAgua.consumoTotalMaximo"
            label={isPapel ? 'Consumo total mensal máximo (m³/mês)' : 'Consumo total diário máximo (m³/dia)'}
          />
          <NumField
            form={form}
            name="listagemC.usoAgua.consumoTotalMedio"
            label={isPapel ? 'Consumo total mensal médio (m³/mês)' : 'Consumo total diário médio (m³/dia)'}
          />
        </div>
      </SectionCard>

      <SectionCard title={`${item(30)}. Tratamento de água`}>
        <FormField
          control={form.control}
          name="listagemC.tratamentoAgua.trataAgua"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O empreendimento trata água?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {trataAgua && (
          <>
            <NumField form={form} name="listagemC.tratamentoAgua.quantidadeM3Mes" label="Quantidade tratada (m³/mês)" />
            <CheckboxOptions form={form} name="listagemC.tratamentoAgua.etapas" options={etapasTratamentoAgua} />
            <TextField form={form} name="listagemC.tratamentoAgua.etapasOutros" label="Outras etapas – especificar" />
          </>
        )}
      </SectionCard>

      <SectionCard title={`${item(31)}. Efluentes sanitários`}>
        <NumField form={form} name="listagemC.efluentesSanitarios.volumeM3Dia" label="Volume gerado (m³/dia)" />
        <NumField form={form} name="listagemC.efluentesSanitarios.numSistemas" label="Quantidade de sistemas de tratamento" />
        {pontosSanitarios.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
            <TextField form={form} name={`listagemC.efluentesSanitarios.pontos.${index}.identificacao`} label="Identificação" />
            <TextField form={form} name={`listagemC.efluentesSanitarios.pontos.${index}.descricao`} label="Descrição" className="md:col-span-2" />
            <NumField form={form} name={`listagemC.efluentesSanitarios.pontos.${index}.volumeM3Dia`} label="Volume (m³/dia)" />
            <div className="md:col-span-4 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removePontoSanitario(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendPontoSanitario({ identificacao: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar ponto sanitário
        </Button>
        <CheckboxOptions
          form={form}
          name="listagemC.efluentesSanitarios.etapas"
          options={[
            { id: 'fossa_septica', label: 'Fossa séptica' },
            { id: 'filtro_anaerobico', label: 'Filtro anaeróbico' },
            { id: 'outros', label: 'Outros' },
          ]}
        />
        <FormField
          control={form.control}
          name="listagemC.efluentesSanitarios.tratamentoConjuntoIndustrial"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tratamento feito em conjunto com efluente industrial?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title={`${item(32)}. Efluentes industriais`}>
        <FormField
          control={form.control}
          name="listagemC.efluentesIndustriais.gera"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O empreendimento gera efluente industrial?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {geraEfluenteIndustrial && (
          <>
            <NumField form={form} name="listagemC.efluentesIndustriais.numSistemas" label="Quantidade de sistemas de tratamento" />
            {pontosIndustriais.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
                <TextField form={form} name={`listagemC.efluentesIndustriais.pontos.${index}.identificacao`} label="Identificação" />
                <TextField form={form} name={`listagemC.efluentesIndustriais.pontos.${index}.descricao`} label="Descrição" className="md:col-span-2" />
                <NumField form={form} name={`listagemC.efluentesIndustriais.pontos.${index}.volumeM3Dia`} label="Volume (m³/dia)" />
                <div className="md:col-span-4 flex justify-end">
                  <Button type="button" variant="outline" size="sm" onClick={() => removePontoIndustrial(index)}>
                    <Trash2 className="mr-2 h-4 w-4" />Remover
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => appendPontoIndustrial({ identificacao: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" />Adicionar efluente industrial
            </Button>
            <p className="text-sm font-medium">Características do efluente bruto (antes do tratamento)</p>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {parametrosEfluenteIndustrial.map((param) => {
                const slug = param.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
                return (
                  <div key={slug} className="grid grid-cols-2 gap-2 rounded border p-2">
                    <span className="text-sm">{param}</span>
                    <TextField form={form} name={`listagemC.efluentesIndustriais.caracteristicas.${slug}.minimo`} label="Mín." />
                    <TextField form={form} name={`listagemC.efluentesIndustriais.caracteristicas.${slug}.maximo`} label="Máx." />
                  </div>
                );
              })}
            </div>
            <p className="text-sm font-medium">32.1 – Etapas previstas para tratamento</p>
            <CheckboxOptions
              form={form}
              name="listagemC.efluentesIndustriais.etapasPreliminar"
              options={[
                { id: 'retencao', label: 'Tanque de retenção' },
                { id: 'homogeneizacao', label: 'Tanque de homogeneização' },
                { id: 'correcao_ph', label: 'Tanque de correção de pH' },
                { id: 'abrandamento', label: 'Tanque de abrandamento' },
              ]}
            />
            <CheckboxOptions
              form={form}
              name="listagemC.efluentesIndustriais.etapasPrimario"
              options={[
                { id: 'floculacao', label: 'Floculação' },
                { id: 'flotacao', label: 'Flotação' },
                { id: 'sedimentacao', label: 'Sedimentação' },
                { id: 'decantacao', label: 'Decantação' },
              ]}
            />
          </>
        )}
      </SectionCard>

      <SectionCard title={`${item(32, '2')} Destino final dos efluentes`}>
        <p className="text-sm font-medium">Industrial</p>
        <TextField form={form} name="listagemC.destinoEfluentes.industrial.corpoHidrico" label="Corpo hídrico (se aplicável)" />
        <CheckboxOptions
          form={form}
          name="listagemC.destinoEfluentes.industrial.classeEnquadramento"
          options={[
            { id: 'especial', label: 'Classe especial' },
            { id: '1', label: 'Classe 1' },
            { id: '2', label: 'Classe 2' },
            { id: '3', label: 'Classe 3' },
            { id: '4', label: 'Classe 4' },
          ]}
        />
        <CheckboxOptions
          form={form}
          name="listagemC.destinoEfluentes.industrial.opcoes"
          options={[
            { id: 'rede_publica', label: 'Descarte em rede pública' },
            { id: 'fertirrigacao', label: 'Fertirrigação' },
            { id: 'lagoa_infiltracao', label: 'Lagoa de infiltração' },
            { id: 'outro', label: 'Outro' },
          ]}
        />
        <p className="mt-4 text-sm font-medium">Sanitário</p>
        <CheckboxOptions
          form={form}
          name="listagemC.destinoEfluentes.sanitario.opcoes"
          options={[
            { id: 'sumidouro', label: 'Sumidouro' },
            { id: 'rede_publica', label: 'Rede pública' },
            { id: 'conjunto_industrial', label: 'Tratamento conjunto com industrial' },
            { id: 'fertirrigacao', label: 'Fertirrigação' },
            { id: 'outro', label: 'Outro' },
          ]}
        />
        <CheckboxOptions
          form={form}
          name="listagemC.destinoEfluentes.purgas"
          options={[
            { id: 'reutilizacao', label: 'Reutilização no processo' },
            { id: 'irrigacao', label: 'Irrigação de jardins' },
            { id: 'outro', label: 'Outro' },
          ]}
        />
        <p className="mt-4 text-sm font-medium">Lavagem de pisos e equipamentos</p>
        <CheckboxOptions
          form={form}
          name="listagemC.destinoEfluentes.lavagemPisos"
          options={[
            { id: 'reutilizacao', label: 'Reutilização no processo' },
            { id: 'tratamento_conjunto', label: 'Tratamento conjunto com efluente industrial' },
            { id: 'outro', label: 'Outro' },
          ]}
        />
        {isPapel && (
          <>
            <p className="mt-4 text-sm font-medium">Licor negro</p>
            <CheckboxOptions
              form={form}
              name="listagemC.destinoEfluentes.licorNegro"
              options={[
                { id: 'nao_gera', label: 'Não gera' },
                { id: 'evaporacao', label: 'Evaporação' },
                { id: 'recuperacao', label: 'Recuperação' },
                { id: 'outro', label: 'Outro' },
              ]}
            />
          </>
        )}
        <FormField
          control={form.control}
          name="listagemC.destinoEfluentes.municipioTrataEsgoto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O município possui tratamento de esgotos sanitários?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <NumField form={form} name="listagemC.destinoEfluentes.percentualEsgotoTratado" label="Percentual de esgoto tratado (%)" />
      </SectionCard>

      {isPapel && (
        <SectionCard title={`${item(35)}. Emissões atmosféricas`}>
          <FormField
            control={form.control}
            name="listagemC.emissoesAtmosfericas.fontesPontuais"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Existem fontes pontuais de emissão atmosférica?</FormLabel>
                <FormControl>
                  <BooleanRadio value={field.value} onChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
          {fontesPontuais &&
            fontesEmissao.map((item, index) => (
              <div key={item.id} className="grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-4">
                <TextField form={form} name={`listagemC.emissoesAtmosfericas.fontes.${index}.fonte`} label="Fonte" />
                <TextField form={form} name={`listagemC.emissoesAtmosfericas.fontes.${index}.combustivel`} label="Combustível" />
                <TextField form={form} name={`listagemC.emissoesAtmosfericas.fontes.${index}.poluentes`} label="Poluentes emitidos" />
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
            name="listagemC.emissoesAtmosfericas.substanciasOdoriferas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Equipamentos com substâncias odoríferas (DN COPAM 11/1986)?</FormLabel>
                <FormControl>
                  <BooleanRadio value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormDescription>Apresentar Anexo XXXVII (amostragem isocinética).</FormDescription>
              </FormItem>
            )}
          />
          {substanciasOdoriferas && (
            <FormField
              control={form.control}
              name="listagemC.emissoesAtmosfericas.descricaoOdoriferas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição das substâncias odoríferas</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          )}
          <FormField
            control={form.control}
            name="listagemC.emissoesAtmosfericas.sistemaControle"
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
                <TextField form={form} name={`listagemC.emissoesAtmosfericas.equipamentosControle.${index}.nome`} label="Equipamento" />
                <NumField form={form} name={`listagemC.emissoesAtmosfericas.equipamentosControle.${index}.tempoOperacaoHDia`} label="Tempo médio (h/dia)" />
                <TextField form={form} name={`listagemC.emissoesAtmosfericas.equipamentosControle.${index}.capacidade`} label="Capacidade nominal" />
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
            name="listagemC.emissoesAtmosfericas.fontesDifusas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Existem fontes difusas de emissão atmosférica?</FormLabel>
                <FormControl>
                  <BooleanRadio value={field.value} onChange={field.onChange} />
                </FormControl>
                <FormDescription>{fontesDifusas ? 'Apresentar Anexo XXXIII.' : ''}</FormDescription>
              </FormItem>
            )}
          />
        </SectionCard>
      )}

      <SectionCard
        title={`${isPapel ? item(35, '1') : isDomissanitarios ? item(33) : '33'}. Tratamento do efluente atmosférico`}
      >
        {isPapel ? (
          <>
            <CheckboxOptions
              form={form}
              name="listagemC.emissoesAtmosfericas.fornoRecuperacaoLicor"
              options={[
                { id: 'lavador_gases', label: 'Forno de recuperação do licor – lavador de gases' },
                { id: 'outros', label: 'Forno de recuperação – outros' },
              ]}
            />
            <CheckboxOptions
              form={form}
              name="listagemC.emissoesAtmosfericas.caldeira"
              options={[
                { id: 'ciclone', label: 'Caldeira – ciclone' },
                { id: 'lavador_gases', label: 'Caldeira – lavador de gases' },
                { id: 'outros_caldeira', label: 'Caldeira – outros' },
              ]}
            />
            <CheckboxOptions
              form={form}
              name="listagemC.emissoesAtmosfericas.digestores"
              options={[
                { id: 'pos_queimador', label: 'Digestores – pós-queimador' },
                { id: 'outros', label: 'Digestores – outros' },
              ]}
            />
          </>
        ) : isDomissanitarios ? (
          <>
            <CheckboxOptions
              form={form}
              name="listagemC.emissoesAtmosfericas.capela"
              options={[
                { id: 'lavador_gases', label: 'Capela – lavador de gases' },
                { id: 'nao_trata_limites', label: 'Capela – não trata (não ultrapassa limites de emissão)' },
                { id: 'outros_capela', label: 'Capela – outros' },
              ]}
            />
            <CheckboxOptions
              form={form}
              name="listagemC.emissoesAtmosfericas.caldeira"
              options={[
                { id: 'ciclone', label: 'Caldeira – ciclone' },
                { id: 'lavador_gases', label: 'Caldeira – lavador de gases' },
                { id: 'outros_caldeira', label: 'Caldeira – outros' },
              ]}
            />
            <CheckboxOptions
              form={form}
              name="listagemC.emissoesAtmosfericas.reatores"
              options={[
                { id: 'ciclone', label: 'Reatores – ciclone' },
                { id: 'lavador_gases', label: 'Reatores – lavador de gases' },
                { id: 'outros_reatores', label: 'Reatores – outros' },
              ]}
            />
            <CheckboxOptions
              form={form}
              name="listagemC.emissoesAtmosfericas.tanqueArmazenamento"
              options={[
                { id: 'ciclone', label: 'Tanque de armazenamento – ciclone' },
                { id: 'lavador_gases', label: 'Tanque de armazenamento – lavador de gases' },
                { id: 'outros_tanque', label: 'Tanque de armazenamento – outros' },
              ]}
            />
          </>
        ) : (
          <>
            <CheckboxOptions
              form={form}
              name="listagemC.emissoesAtmosfericas.descarregamentoNegroFumo"
              options={[
                { id: 'filtro_mangas', label: 'Descarregamento negro de fumo – filtro de mangas' },
                { id: 'ciclone', label: 'Descarregamento negro de fumo – ciclone' },
                { id: 'outros_nf', label: 'Descarregamento – outros' },
              ]}
            />
            <CheckboxOptions
              form={form}
              name="listagemC.emissoesAtmosfericas.caldeira"
              options={[
                { id: 'ciclone', label: 'Caldeira – ciclone' },
                { id: 'lavador_gases', label: 'Caldeira – lavador de gases' },
                { id: 'outros_caldeira', label: 'Caldeira – outros' },
              ]}
            />
          </>
        )}
      </SectionCard>

      <SectionCard
        title={`${isPapel ? item(35) : isDomissanitarios ? item(34) : '34'}. Subprodutos e/ou resíduos sólidos`}
      >
        <TabelaLinhasFixas
          form={form}
          basePath="listagemC.residuosSolidos.itens"
          linhas={residuosLista}
          colunas={[
            { key: 'equipamentoGerador', label: 'Equipamento/operação geradora' },
            { key: 'classeResiduo', label: 'Classe do resíduo' },
            { key: 'taxaMaximaGeracao', label: 'Taxa mensal máxima' },
            { key: 'formaAcondicionamento', label: 'Forma de acondicionamento' },
            { key: 'localAcondicionamento', label: 'Local de acondicionamento' },
          ]}
        />
        {outrosResiduos.map((item, index) => (
          <div key={item.id} className="mt-2 grid grid-cols-1 gap-2 rounded-md border p-2 md:grid-cols-5">
            <TextField form={form} name={`listagemC.residuosSolidos.linhasExtras.${index}.nome`} label="Resíduo" />
            <TextField form={form} name={`listagemC.residuosSolidos.linhasExtras.${index}.equipamentoGerador`} label="Gerador" />
            <TextField form={form} name={`listagemC.residuosSolidos.linhasExtras.${index}.classeResiduo`} label="Classe" />
            <TextField form={form} name={`listagemC.residuosSolidos.linhasExtras.${index}.taxaMaximaGeracao`} label="Taxa máx." />
            <div className="flex items-end justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeResiduo(index)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" className="mt-2" onClick={() => appendResiduo({ nome: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar resíduo
        </Button>
      </SectionCard>

      {!isTrExtended && (
      <SectionCard title="35. Documentação junto ao Corpo de Bombeiros">
        <FormField
          control={form.control}
          name="listagemC.corpoBombeiros.projetoAprovado"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O projeto de combate a incêndio já foi aprovado pelo corpo de bombeiros?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>
                Se não, anexar protocolo (Anexo XXXIII). Se sim, anexar laudo de conformidade (Anexo XXXIV).
              </FormDescription>
            </FormItem>
          )}
        />
      </SectionCard>
      )}

      {!isTrExtended && (
      <SectionCard title="36. Passivos ambientais">
        <FormField
          control={form.control}
          name="listagemC.passivosAmbientais.existePassivo"
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
            name="listagemC.passivosAmbientais.descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Informar passivos existentes</FormLabel>
                <FormControl>
                  <Textarea rows={4} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        <p className="text-sm text-muted-foreground">
          Atenção: em aquisição de terreno ou instalação industrial, recomenda-se levantamento prévio de passivos ambientais.
        </p>
      </SectionCard>
      )}
    </div>
  );
}
