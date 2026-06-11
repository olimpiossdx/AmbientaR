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
const ocupacaoEntornoE = [
  'Lavouras ou pastagens',
  'Residências',
  'Comércio',
  'Indústrias',
  'Escolas',
  'Hospitais ou centros de saúde',
  'Instalações agropecuárias',
  'Área com atividades de mineração',
  'Posto de combustível',
  'Depósito de GLP',
  'Vias públicas e passeios',
  'Interferência com drenagem',
  'Interferência com redes de concessionárias',
  'Loteamentos / expansão urbana',
  'Centro de recreação',
  'Rodovia ou ferrovia',
  'Recurso hídrico (lago, lagoa, córrego, rio, nascente)',
  'Outras',
];

const finalidadesAguaE = [
  'Consumo uso doméstico',
  'Consumo uso industrial',
  'Lavagem de veículos',
  'Oficinas',
  'Utilidades',
  'Geração de vapor',
  'Testes hidrostáticos',
  'Consumo humano',
  'Outras finalidades',
];

const tipologiasEfluente = [
  'Óleos e graxas',
  'Águas servidas',
  'Efluentes sanitários',
  'Efluentes de testes hidrostáticos',
  'Outros',
];

const tipologiasResiduo = [
  'Restos de tubos',
  'Embalagens diversas',
  'Sucatas metálicas',
  'Pneus',
  'Resíduos contaminados com óleos',
  'Outros',
];

const tipologiasEmissao = [
  'Válvulas de controle ao longo dos dutos',
  'Transporte (caminhões-tanque)',
  'Carregamento',
  'Motores a combustão',
  'Outros',
];

export function PcaFormListagemEModulo4({ form }: { form: any }) {
  const { fields: nucleos, append: appendNucleo, remove: removeNucleo } = useFieldArray({
    control: form.control,
    name: 'listagemE.legislacaoMunicipal.nucleosPopulacionais',
  });
  const { fields: produtos, append: appendProduto, remove: removeProduto } = useFieldArray({
    control: form.control,
    name: 'listagemE.caracterizacaoTecnica.produtos',
  });

  return (
    <div className="space-y-6">
      <PcaSectionCard title="Módulo 4 – Caracterização do empreendimento e entorno">
        <FormDescription>Itens 15 a 42 do RCA – dutos e gasodutos.</FormDescription>
      </PcaSectionCard>

      <PcaSectionCard title="15. Caracterização frente à legislação municipal">
        <FormField
          control={form.control}
          name="listagemE.legislacaoMunicipal.temPlanoDiretor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Município tem Plano Diretor / LUOS?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="listagemE.legislacaoMunicipal.interfereNucleos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interfere com núcleos populacionais?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {nucleos.map((item, index) => (
          <div key={item.id} className="mb-2 grid grid-cols-1 gap-2 rounded-md border p-3 md:grid-cols-4">
            <PcaTextField form={form} name={`listagemE.legislacaoMunicipal.nucleosPopulacionais.${index}.nome`} label="Núcleo" />
            <PcaTextField form={form} name={`listagemE.legislacaoMunicipal.nucleosPopulacionais.${index}.localizacao`} label="Urbano/Rural" />
            <PcaNumField form={form} name={`listagemE.legislacaoMunicipal.nucleosPopulacionais.${index}.distanciaM`} label="Distância (m)" />
            <PcaTextField form={form} name={`listagemE.legislacaoMunicipal.nucleosPopulacionais.${index}.referencia`} label="Referência" />
            <Button type="button" variant="outline" size="sm" onClick={() => removeNucleo(index)}>
              <Trash2 className="mr-2 h-4 w-4" />Remover
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendNucleo({})}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar núcleo
        </Button>
        <FormField
          control={form.control}
          name="listagemE.legislacaoMunicipal.interferencias"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interferências (mineração, patrimônio, cavidades, infraestrutura)</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormDescription>Planta georreferenciada: Anexo XIX.</FormDescription>
      </PcaSectionCard>

      <PcaSectionCard title="16. Tipo de ocupação da área de entorno">
        {ocupacaoEntornoE.map((label) => (
          <div key={label} className="mb-2 grid grid-cols-1 gap-2 rounded-md border p-2 md:grid-cols-3">
            <p className="text-sm md:col-span-2">{label}</p>
            <PcaNumField
              form={form}
              name={`listagemE.ocupacaoEntorno.${label.replace(/\s+/g, '_').slice(0, 40)}.distanciaM`}
              label="Distância (m)"
            />
          </div>
        ))}
        <FormField
          control={form.control}
          name="listagemE.ocupacaoEntorno.observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações / especificações</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </PcaSectionCard>

      <PcaSectionCard title="17. Usos anteriores do terreno">
        <FormField
          control={form.control}
          name="listagemE.usosAnteriores.comUsosAnteriores"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Área com usos anteriores antrópicos?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="listagemE.usosAnteriores.indicamPassivos"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Podem indicar passivos ambientais?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="listagemE.usosAnteriores.descricao"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </PcaSectionCard>

      <PcaSectionCard title="18–19. Acesso e justificativas">
        <FormDescription>Croqui de acesso: Anexo XXIII. Justificativas: Anexos XXIV a XXVII.</FormDescription>
        <PcaTextField form={form} name="listagemE.justificativas.resumo" label="Referência / resumo dos anexos" />
      </PcaSectionCard>

      <PcaSectionCard title="20. Caracterização técnica – dutos">
        {produtos.map((item, index) => (
          <div key={item.id} className="mb-2 grid grid-cols-1 gap-2 md:grid-cols-2">
            <PcaTextField form={form} name={`listagemE.caracterizacaoTecnica.produtos.${index}.nome`} label="Substância" />
            <PcaNumField form={form} name={`listagemE.caracterizacaoTecnica.produtos.${index}.volume`} label="Volume (×10³ m³/dia)" />
            <Button type="button" variant="outline" size="sm" onClick={() => removeProduto(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendProduto({})}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar produto
        </Button>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <PcaNumField form={form} name="listagemE.caracterizacaoTecnica.vazaoNormal" label="Vazão normal (×10⁶ m³/dia)" />
          <PcaNumField form={form} name="listagemE.caracterizacaoTecnica.vazaoMaxima" label="Vazão máxima" />
          <PcaNumField form={form} name="listagemE.caracterizacaoTecnica.pressaoOperacao" label="Pressão operação (kgf/cm²)" />
          <PcaNumField form={form} name="listagemE.caracterizacaoTecnica.vidaUtilAnos" label="Vida útil (anos)" />
          <PcaNumField form={form} name="listagemE.caracterizacaoTecnica.coberturaMinimaM" label="Cobertura mínima tubulação (m)" />
        </div>
        <PcaTextField form={form} name="listagemE.caracterizacaoTecnica.linhaTronco" label="Linha tronco (diâmetro, extensão, material, montagem)" />
        <PcaTextField form={form} name="listagemE.caracterizacaoTecnica.linhaLateral" label="Linha lateral" />
        <PcaTextField form={form} name="listagemE.caracterizacaoTecnica.ramais" label="Ramais" />
        <FormDescription>Detalhamento: Anexos XXVIII e XXIX.</FormDescription>
      </PcaSectionCard>

      <PcaSectionCard title="21–24. Dados econômicos, RH, regime e infraestrutura">
        <FormField
          control={form.control}
          name="listagemE.dadosEconomicos.investimentoAmbiental"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimativa de investimentos na área ambiental?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <PcaNumField form={form} name="listagemE.dadosEconomicos.custoInstalacaoAnual" label="Custo instalação (R$/ano)" />
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <PcaNumField form={form} name="listagemE.recursosHumanos.producao" label="Funcionários – produção" />
          <PcaNumField form={form} name="listagemE.recursosHumanos.administrativo" label="Administrativo" />
          <PcaNumField form={form} name="listagemE.recursosHumanos.outros" label="Outros setores" />
        </div>
        <PcaTextField form={form} name="listagemE.regimeOperacao.resumo" label="Regime de operação (turnos, dias, meses)" />
        <PcaTextField form={form} name="listagemE.infraestrutura.viasAcesso" label="Vias de acesso e obras" />
        <FormField
          control={form.control}
          name="listagemE.infraestrutura.possuiEnergia"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Possui energia elétrica?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <PcaTextField form={form} name="listagemE.infraestrutura.energiaDetalhes" label="Fonte / concessionária / obras de interligação" />
      </PcaSectionCard>

      <PcaSectionCard title="25. Processo produtivo">
        <FormField
          control={form.control}
          name="listagemE.processoProdutivo.descricao"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea placeholder="Processo, monitoramento, integridade de tubos..." {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormDescription>Análise de risco: Anexo XXX.</FormDescription>
      </PcaSectionCard>

      <PcaSectionCard title="26. Uso de água">
        <FormField
          control={form.control}
          name="listagemE.usoAgua.recircula"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Recircula água utilizada?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {finalidadesAguaE.map((fin) => (
          <div key={fin} className="mb-2 grid grid-cols-1 gap-2 rounded-md border p-2 md:grid-cols-3">
            <p className="text-sm">{fin}</p>
            <PcaNumField
              form={form}
              name={`listagemE.usoAgua.finalidades.${fin.replace(/\s+/g, '_').slice(0, 30)}.maximo`}
              label="Consumo máx. (m³/dia)"
            />
            <PcaNumField
              form={form}
              name={`listagemE.usoAgua.finalidades.${fin.replace(/\s+/g, '_').slice(0, 30)}.medio`}
              label="Consumo médio (m³/dia)"
            />
          </div>
        ))}
      </PcaSectionCard>

      <PcaSectionCard title="27. Efluentes líquidos">
        {tipologiasEfluente.map((tipo) => (
          <div key={tipo} className="mb-3 rounded-md border p-3">
            <p className="mb-2 font-medium">{tipo}</p>
            <PcaTextField
              form={form}
              name={`listagemE.efluentes.${tipo.replace(/\s+/g, '_')}.fontes`}
              label="Fontes geradoras"
            />
            <FormField
              control={form.control}
              name={`listagemE.efluentes.${tipo.replace(/\s+/g, '_')}.tratamento`}
              render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl>
                    <Checkbox checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel className="font-normal">Possui/possuirá tratamento</FormLabel>
                </FormItem>
              )}
            />
          </div>
        ))}
        <PcaTextField form={form} name="listagemE.efluentes.lancamentoFinal" label="Lançamento final (solo / corpo dágua)" />
      </PcaSectionCard>

      <PcaSectionCard title="28. Resíduos sólidos">
        {tipologiasResiduo.map((tipo) => (
          <div key={tipo} className="mb-3 rounded-md border p-3">
            <p className="mb-2 font-medium">{tipo}</p>
            <PcaTextField
              form={form}
              name={`listagemE.residuos.${tipo.replace(/\s+/g, '_')}.fontes`}
              label="Fontes"
            />
            <PcaTextField
              form={form}
              name={`listagemE.residuos.${tipo.replace(/\s+/g, '_')}.empresaReceptora`}
              label="Empresa receptora licenciada"
            />
          </div>
        ))}
      </PcaSectionCard>

      <PcaSectionCard title="29. Emissões atmosféricas">
        {tipologiasEmissao.map((tipo) => (
          <div key={tipo} className="mb-3 rounded-md border p-3">
            <p className="mb-2 font-medium">{tipo}</p>
            <PcaTextField
              form={form}
              name={`listagemE.emissoes.${tipo.replace(/\s+/g, '_')}.fontes`}
              label="Fontes"
            />
            <PcaTextField
              form={form}
              name={`listagemE.emissoes.${tipo.replace(/\s+/g, '_')}.controle`}
              label="Sistema de controle"
            />
          </div>
        ))}
      </PcaSectionCard>

      <PcaSectionCard title="30–35. Caracterização municipal, anexos e comunidade">
        <PcaTextField form={form} name="listagemE.caracterizacaoMunicipio.resumo" label="Caracterização do município (resumo)" />
        <FormDescription>Anexos XXXI a XXXVIII conforme itens 31–38 do formulário.</FormDescription>
        <FormField
          control={form.control}
          name="listagemE.comunidade.relacionamento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relacionamento com a comunidade (AI-MSE)</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </PcaSectionCard>

      <PcaSectionCard title="36–41. Meio físico, biótico e antrópico">
        <FormDescription>Dados detalhados nos Anexos XXXIX a XLV.</FormDescription>
        <PcaTextField form={form} name="listagemE.meioFisico.resumo" label="Recursos hídricos / clima / geologia (resumo)" />
        <PcaTextField form={form} name="listagemE.meioBiotico.flora" label="Flora (resumo / anexo XLII)" />
        <PcaTextField form={form} name="listagemE.meioBiotico.fauna" label="Fauna (resumo / anexo XLIII)" />
        <FormField
          control={form.control}
          name="listagemE.meioAntropico.populacaoRemocao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Há população a ser removida?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </PcaSectionCard>

      <PcaSectionCard title="42. Passivos ambientais">
        <FormField
          control={form.control}
          name="listagemE.passivosAmbientais.existe"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Existem passivos ambientais associados?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="listagemE.passivosAmbientais.descricao"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </PcaSectionCard>
    </div>
  );
}
