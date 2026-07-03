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

const atividadesSecundarias = [
  { id: 'borracharia', label: 'Borracharia' },
  { id: 'venda_glp', label: 'Venda de botijões de GLP' },
  { id: 'estoque_glp', label: 'Estoque de botijões de GLP' },
  { id: 'lanchonete', label: 'Lanchonete' },
  { id: 'loja_conveniencia', label: 'Loja de conveniência' },
  { id: 'restaurante', label: 'Restaurante' },
  { id: 'hotel', label: 'Hotel' },
  { id: 'bar', label: 'Bar' },
  { id: 'estacionamento_caminhoes', label: 'Estacionamento de caminhões' },
  { id: 'gnv', label: 'Abastecimento de GNV' },
  { id: 'lavagem_veiculos', label: 'Lavagem de veículos' },
  { id: 'troca_oleo', label: 'Troca de óleo' },
];

const combustiveisVolume = ['Gasolina', 'Álcool', 'Diesel', 'Querosene', 'GNV'];

const pisosAreas = [
  'Área de abastecimento',
  'Área de troca de óleo',
  'Área de descarga',
  'Área de lavagem',
  'Outros',
];

const entorno100m = [
  'Rua com galeria de drenagem de águas',
  'Rua com galeria de esgotos ou de serviços',
  'Esgotamento sanitário em fossas (área urbana)',
  'Edifício multifamiliar até 4 andares (sem garagem subterrânea)',
  'Edifício multifamiliar até 4 andares (com garagem subterrânea)',
  'Edifício multifamiliar com mais de 4 andares (garagem subterrânea)',
  'Favela em cota igual ou inferior',
  'Edifícios comerciais com mais de 4 andares',
  'Garagem ou túnel no subsolo',
  'Poço de água para consumo doméstico',
  'Hospital',
  'Metrô / transporte ferroviário de superfície',
  'Atividades industriais de risco (NB-16)',
  'Água do subsolo para consumo público',
];

const sistemasControle = [
  'Controle de estoques',
  'Monitoramento intersticial automático',
  'Poços de monitoramento de águas subterrâneas',
  'Poços de monitoramento de vapor',
  'Válvula de retenção junto às bombas',
  'Proteção contra derramamento',
  'Câmara de acesso à boca de visita do tanque',
  'Contenção sob unidade abastecedora',
  'Canaleta de contenção da cobertura',
  'Caixa separadora água/óleo (CSAO)',
  'Proteção contra transbordamento',
  'Descarga selada',
  'Câmara de contenção de descarga',
  'Alarme de transbordamento',
  'Outros',
];

const residuosPosto = [
  'Embalagens de óleo lubrificante',
  'Filtros de óleo',
  'Outras embalagens',
  'Resíduos de borracharia',
  'Areia e lodo de separadores',
  'Outros resíduos',
];

export function FormListagemFModulo4({ form }: { form: any }) {
  const { fields: tanques, append: appendTanque, remove: removeTanque } = useFieldArray({
    control: form.control,
    name: 'listagemF.tanques.linhas',
  });
  const { fields: bombas, append: appendBomba, remove: removeBomba } = useFieldArray({
    control: form.control,
    name: 'listagemF.bombas.linhas',
  });
  const { fields: residuos, append: appendResiduo, remove: removeResiduo } = useFieldArray({
    control: form.control,
    name: 'listagemF.residuos.linhas',
  });

  React.useEffect(() => {
    if (residuos.length === 0) {
      residuosPosto.forEach((nome) => appendResiduo({ nome, classe: '', geracaoKgMes: '', destino: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- linhas padrão uma vez
  }, []);

  return (
    <div className="space-y-6">
      <SectionCard title="Módulo 4 – Caracterização do empreendimento e entorno">
        <FormDescription>Itens 13 a 30 do RCA – posto de combustível.</FormDescription>
      </SectionCard>

      <SectionCard title="13. Registro ANP">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField form={form} name="listagemF.anp.registro" label="Registro na ANP" />
          <TextField form={form} name="listagemF.anp.registroAnterior" label="Reg. anterior ANP" />
        </div>
      </SectionCard>

      <SectionCard title="14. Atividades secundárias">
        <CheckboxOptions form={form} name="listagemF.atividadesSecundarias" options={atividadesSecundarias} />
        <NumField form={form} name="listagemF.lavagem.mediaVeiculosDia" label="Média lavagem veículos/dia" />
        <FormField
          control={form.control}
          name="listagemF.trocaOleo.caixaSeparadora"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Troca de óleo – possui caixa separadora água/óleo?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <TextField form={form} name="listagemF.trocaOleo.destinoOleo" label="Destino final do óleo coletado" />
      </SectionCard>

      <SectionCard title="15. Volume de combustível movimentado/mês (L)">
        {combustiveisVolume.map((tipo) => (
          <NumField
            key={tipo}
            form={form}
            name={`listagemF.volumeCombustivel.${tipo.replace(/\s+/g, '_')}`}
            label={tipo}
          />
        ))}
      </SectionCard>

      <SectionCard title="16. Trabalhadores">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NumField form={form} name="listagemF.trabalhadores.fixos" label="Funcionários fixos" />
          <NumField form={form} name="listagemF.trabalhadores.temporarios" label="Temporários" />
          <NumField form={form} name="listagemF.trabalhadores.terceirizados" label="Terceirizados" />
        </div>
      </SectionCard>

      <SectionCard title="17. Distribuidora(s) / fornecedora(s)">
        <TextField form={form} name="listagemF.distribuidora.resumo" label="Dados da distribuidora (razão social, CNPJ, endereço, contato)" />
      </SectionCard>

      <SectionCard title="18. Proprietário dos equipamentos e sistemas">
        <TextField form={form} name="listagemF.proprietarioEquipamentos.resumo" label="Proprietário(s) dos tanques e sistemas" />
      </SectionCard>

      <SectionCard title="19. Área do empreendimento">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NumField form={form} name="listagemF.area.totalM2" label="Área total do terreno (m²)" />
          <NumField form={form} name="listagemF.area.construidaM2" label="Área construída (m²)" />
        </div>
      </SectionCard>

      <SectionCard title="20. Ambiente entorno (raio 100 m)">
        {entorno100m.map((item) => (
          <FormField
            key={item}
            control={form.control}
            name={`listagemF.entorno100m.${item.slice(0, 40).replace(/\s+/g, '_')}`}
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="font-normal">{item}</FormLabel>
              </FormItem>
            )}
          />
        ))}
      </SectionCard>

      <SectionCard title="21. Pisos">
        {pisosAreas.map((area) => (
          <TextField
            key={area}
            form={form}
            name={`listagemF.pisos.${area.replace(/\s+/g, '_')}`}
            label={area}
          />
        ))}
      </SectionCard>

      <SectionCard title="22. Tanques subterrâneos">
        {tanques.map((item, index) => (
          <div key={item.id} className="mb-3 grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-4">
            <TextField form={form} name={`listagemF.tanques.linhas.${index}.numero`} label="Tanque nº" />
            <TextField form={form} name={`listagemF.tanques.linhas.${index}.combustivel`} label="Combustível (G/A/D...)" />
            <NumField form={form} name={`listagemF.tanques.linhas.${index}.volumeL`} label="Volume (L)" />
            <TextField form={form} name={`listagemF.tanques.linhas.${index}.anoInstalacao`} label="Ano instalação" />
            <TextField form={form} name={`listagemF.tanques.linhas.${index}.testeEstanque`} label="Teste estanque (mm/aaaa)" />
            <TextField form={form} name={`listagemF.tanques.linhas.${index}.emOperacao`} label="Em operação (S/N)" />
            <Button type="button" variant="outline" size="sm" onClick={() => removeTanque(index)}>
              <Trash2 className="mr-2 h-4 w-4" />Remover
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendTanque({})}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar tanque
        </Button>
      </SectionCard>

      <SectionCard title="23. Bombas">
        {bombas.map((item, index) => (
          <div key={item.id} className="mb-3 grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-4">
            <TextField form={form} name={`listagemF.bombas.linhas.${index}.numero`} label="Bomba nº" />
            <TextField form={form} name={`listagemF.bombas.linhas.${index}.tanque`} label="Tanque ligado" />
            <TextField form={form} name={`listagemF.bombas.linhas.${index}.materialLinha`} label="Material da linha" />
            <TextField form={form} name={`listagemF.bombas.linhas.${index}.dataInstalacao`} label="Data instalação linha" />
            <Button type="button" variant="outline" size="sm" onClick={() => removeBomba(index)}>
              <Trash2 className="mr-2 h-4 w-4" />Remover
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendBomba({})}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar bomba
        </Button>
      </SectionCard>

      <SectionCard title="24. Equipamentos e sistemas de controle">
        {sistemasControle.map((sistema) => (
          <div key={sistema} className="mb-2 grid grid-cols-1 gap-2 rounded-md border p-2 md:grid-cols-3">
            <p className="text-sm md:col-span-1">{sistema}</p>
            <FormField
              control={form.control}
              name={`listagemF.sistemasControle.${sistema.slice(0, 30).replace(/\s+/g, '_')}.manual`}
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">Manual / Sim</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`listagemF.sistemasControle.${sistema.slice(0, 30).replace(/\s+/g, '_')}.automatico`}
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">Automático / Não</FormLabel>
                </FormItem>
              )}
            />
          </div>
        ))}
      </SectionCard>

      <SectionCard title="25. Proteção do sistema de armazenamento">
        <FormField
          control={form.control}
          name="listagemF.protecaoArmazenamento.tanquesSubstituidos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Já foram substituídos tanques?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="listagemF.protecaoArmazenamento.pocosMonitoramento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Existem poços de monitoramento de águas subterrâneas?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <TextField
          form={form}
          name="listagemF.protecaoArmazenamento.metodosDeteccaoVazamento"
          label="Métodos de detecção de vazamentos"
        />
        <FormField
          control={form.control}
          name="listagemF.protecaoArmazenamento.protecaoCatodica"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proteção catódica?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <TextField
          form={form}
          name="listagemF.protecaoArmazenamento.manutencaoCatodica"
          label="Frequência e data da última manutenção (proteção catódica)"
        />
      </SectionCard>

      <SectionCard title="26. Balanço hídrico (média 6 meses ou previsto)">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <NumField form={form} name="listagemF.balancoHidrico.consumoTotal" label="Água consumida total (m³)" />
          <NumField form={form} name="listagemF.balancoHidrico.consumoHumano" label="Consumo humano (m³)" />
          <NumField form={form} name="listagemF.balancoHidrico.lavagemVeiculos" label="Lavagem veículos (m³)" />
          <NumField form={form} name="listagemF.balancoHidrico.efluenteSanitario" label="Efluente sanitário (m³)" />
          <NumField form={form} name="listagemF.balancoHidrico.efluenteCsao" label="Efluente para CSAO (m³)" />
        </div>
      </SectionCard>

      <SectionCard title="27. Efluentes domésticos/sanitários">
        <CheckboxOptions
          form={form}
          name="listagemF.efluentesSanitarios.destino"
          options={[
            { id: 'rede_publica', label: 'Rede pública' },
            { id: 'corpo_agua_sem_tratamento', label: 'Corpo dágua sem tratamento (PCA)' },
            { id: 'tratado_local', label: 'Tratado no local' },
          ]}
        />
        <TextField form={form} name="listagemF.efluentesSanitarios.corpoReceptor" label="Corpo receptor / local de lançamento" />
      </SectionCard>

      <SectionCard title="28. Lançamento de efluentes industriais">
        <TextField form={form} name="listagemF.efluentesIndustriais.lavagemVeiculos" label="Lavagem de veículos – destino/sistema" />
        <TextField form={form} name="listagemF.efluentesIndustriais.areaAbastecimento" label="Área abastecimento / óleo – destino/sistema" />
      </SectionCard>

      <SectionCard title="29. Resíduos sólidos">
        {residuos.map((item, index) => (
          <div key={item.id} className="mb-3 grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-3">
            <TextField form={form} name={`listagemF.residuos.linhas.${index}.nome`} label="Resíduo" />
            <TextField form={form} name={`listagemF.residuos.linhas.${index}.classe`} label="Classe NBR 10.004" />
            <NumField form={form} name={`listagemF.residuos.linhas.${index}.geracaoKgMes`} label="Geração (kg/mês)" />
            <TextField form={form} name={`listagemF.residuos.linhas.${index}.destino`} label="Destino final" />
            <Button type="button" variant="outline" size="sm" onClick={() => removeResiduo(index)}>
              <Trash2 className="mr-2 h-4 w-4" />Remover
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => appendResiduo({ nome: '', classe: '', geracaoKgMes: '', destino: '' })}
        >
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar resíduo
        </Button>
      </SectionCard>

      <SectionCard title="30. Ruídos">
        <FormField
          control={form.control}
          name="listagemF.ruidos.equipamentoRuidoso"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Equipamentos geram ruído fora dos limites da propriedade?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </SectionCard>
    </div>
  );
}
