'use client';

import { useFieldArray } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { BooleanRadio, CheckboxOptions, NumField, SectionCard, TextField } from './form-listagem-a-helpers';

const ocupacaoEntorno = [
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
  'Dispositivos de drenagem',
  'Redes de outras concessionárias',
  'Loteamentos / expansão urbana',
  'Centro de recreação (parques, clubes etc.)',
  'Rodovia ou ferrovia',
  'Recurso hídrico (lago, lagoa, córrego, rio, nascente)',
  'Outras',
];

const usosCorpoHidrico = [
  'Captação para uso no próprio empreendimento',
  'Captação para abastecimento público',
  'Captação para uso industrial (terceiros)',
  'Captação para irrigação (terceiros)',
  'Captação para piscicultura (terceiros)',
  'Lançamento de efluentes (terceiros)',
  'Lançamento de esgotos (terceiros)',
  'Barragem',
  'Outros usos',
];

function slugify(text: string) {
  return text.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase().slice(0, 48);
}

export function FormListagemCDomissanitariosModulo4({ form }: { form: any }) {
  const programaParceria = form.watch('listagemC.relacionamentoComunidade.desenvolvePrograma');
  const usosAnteriores = form.watch('listagemC.usosAnteriores.comUsosAnteriores');
  const indicamPassivos = form.watch('listagemC.usosAnteriores.indicamPassivos');
  const receptorEfluente = form.watch('listagemC.recursosHidricos.corpoReceptorEfluente');

  const { fields: nucleoPopulacionalFields, append: appendNucleo, remove: removeNucleo } = useFieldArray({
    control: form.control,
    name: 'listagemC.legislacaoMunicipal.nucleosPopulacionais',
  });
  const { fields: corposHidricos, append: appendCorpo, remove: removeCorpo } = useFieldArray({
    control: form.control,
    name: 'listagemC.recursosHidricos.corposSuperficiais',
  });

  return (
    <div className="space-y-6">
      <SectionCard title="16. Relacionamento com a comunidade (AI-MSE)">
        <CheckboxOptions
          form={form}
          name="listagemC.relacionamentoComunidade.situacao"
          options={[
            { id: 'nao_informou', label: 'Empresa ainda não informou a comunidade (apenas LP/LI)' },
            { id: 'sem_rejeicao', label: 'Comunidade não apresenta rejeição (apenas LP/LI)' },
            { id: 'com_rejeicao', label: 'Comunidade ou parte dela apresenta rejeição (apenas LP/LI)' },
            { id: 'operacao_sem_reclamacoes', label: 'Em operação e empresa desconhece reclamações' },
          ]}
        />
        <FormField
          control={form.control}
          name="listagemC.relacionamentoComunidade.registrosReclamacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Em operação: existem reclamações?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>Se sim, apresentar registro no Anexo XIX.</FormDescription>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="listagemC.relacionamentoComunidade.possuiTac"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Possui TAC firmado?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription>Se sim, informar instituição e apresentar Anexo XX.</FormDescription>
            </FormItem>
          )}
        />
        {form.watch('listagemC.relacionamentoComunidade.possuiTac') && (
          <TextField form={form} name="listagemC.relacionamentoComunidade.instituicaoTac" label="Instituição signatária do TAC" />
        )}
        <FormField
          control={form.control}
          name="listagemC.relacionamentoComunidade.outrasInformacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Outras informações sobre relacionamento com a comunidade</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="listagemC.relacionamentoComunidade.desenvolvePrograma"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Desenvolve programas socioeconômicos para a comunidade?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {programaParceria && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TextField form={form} name="listagemC.relacionamentoComunidade.nomePrograma" label="Nome do programa" />
            <TextField form={form} name="listagemC.relacionamentoComunidade.tempoPrograma" label="Prazo de implementação" />
          </div>
        )}
      </SectionCard>

      <SectionCard title="17. Tipo de ocupação da área de entorno">
        <FormDescription>Indicar distância aproximada (m) dos limites do terreno.</FormDescription>
        {ocupacaoEntorno.map((label) => {
          const slug = slugify(label);
          return (
            <div key={slug} className="mb-2 grid grid-cols-1 gap-2 rounded-md border p-2 md:grid-cols-3">
              <p className="text-sm md:col-span-2">{label}</p>
              <NumField form={form} name={`listagemC.ocupacaoEntorno.itens.${slug}.distanciaM`} label="Distância (m)" />
            </div>
          );
        })}
        <FormField
          control={form.control}
          name="listagemC.ocupacaoEntorno.observacoes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações (rodovia, ferrovia, recurso hídrico etc.)</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormDescription className="mt-4">Corpos hídricos superficiais na área de influência</FormDescription>
        {corposHidricos.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-3">
            <TextField form={form} name={`listagemC.recursosHidricos.corposSuperficiais.${index}.nome`} label="Nome do corpo hídrico" />
            <NumField form={form} name={`listagemC.recursosHidricos.corposSuperficiais.${index}.menorDistanciaM`} label="Menor distância (m)" />
            <div className="flex items-end justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeCorpo(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendCorpo({})}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar corpo hídrico
        </Button>
        <FormField
          control={form.control}
          name="listagemC.recursosHidricos.corpoReceptorEfluente"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Algum corpo hídrico receberá efluente industrial e/ou esgoto?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {receptorEfluente && (
          <TextField
            form={form}
            name="listagemC.recursosHidricos.receptoresDescricao"
            label="Nomes e classe de enquadramento (DN COPAM/CERH 01/2008)"
          />
        )}
        {usosCorpoHidrico.map((uso) => {
          const slug = slugify(uso);
          return (
            <div key={slug} className="grid grid-cols-1 gap-2 rounded-md border p-2 md:grid-cols-3">
              <p className="text-sm md:col-span-3">{uso}</p>
              <NumField form={form} name={`listagemC.recursosHidricos.usosCorpo.${slug}.montanteM`} label="A montante (m)" />
              <NumField form={form} name={`listagemC.recursosHidricos.usosCorpo.${slug}.jusanteM`} label="A jusante (m)" />
            </div>
          );
        })}
        <FormDescription>Apresentar planta georreferenciada do empreendimento no Anexo XXIV.</FormDescription>
        <TextField form={form} name="listagemC.domissanitarios.anexoPlantaGeorreferenciada" label="Referência planta (Anexo XXIV)" />
      </SectionCard>

      <SectionCard title="18. Caracterização frente à legislação municipal">
        <FormField
          control={form.control}
          name="listagemC.legislacaoMunicipal.temPlanoDiretor"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Município possui Plano Diretor ou Lei de Uso e Ocupação do Solo?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="listagemC.legislacaoMunicipal.interfereNucleosPopulacionais"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interfere com núcleos populacionais urbanos ou rurais?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {nucleoPopulacionalFields.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-5">
            <TextField form={form} name={`listagemC.legislacaoMunicipal.nucleosPopulacionais.${index}.nome`} label="Núcleo populacional" />
            <TextField form={form} name={`listagemC.legislacaoMunicipal.nucleosPopulacionais.${index}.localizacao`} label="Localização (urbano/rural)" />
            <TextField form={form} name={`listagemC.legislacaoMunicipal.nucleosPopulacionais.${index}.distanciaM`} label="Distância da rede (m)" />
            <TextField form={form} name={`listagemC.legislacaoMunicipal.nucleosPopulacionais.${index}.referencia`} label="Referência" className="md:col-span-2" />
            <div className="md:col-span-5 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeNucleo(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendNucleo({ nome: '', localizacao: '', distanciaM: '', referencia: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar núcleo populacional
        </Button>
        <FormField
          control={form.control}
          name="listagemC.legislacaoMunicipal.interferePatrimonio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interfere com exploração mineral, sítios arqueológicos ou patrimônio histórico/cultural?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch('listagemC.legislacaoMunicipal.interferePatrimonio') && (
          <FormField
            control={form.control}
            name="listagemC.legislacaoMunicipal.descricaoPatrimonio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrever interferência</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="listagemC.legislacaoMunicipal.interfereCavidades"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interfere com áreas de potencial existência de cavidades naturais?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch('listagemC.legislacaoMunicipal.interfereCavidades') && (
          <FormField
            control={form.control}
            name="listagemC.legislacaoMunicipal.descricaoCavidades"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrever interferência</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="listagemC.legislacaoMunicipal.interfereInfraestrutura"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Interfere com infraestrutura básica e social existente?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {form.watch('listagemC.legislacaoMunicipal.interfereInfraestrutura') && (
          <FormField
            control={form.control}
            name="listagemC.legislacaoMunicipal.descricaoInfraestrutura"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrever interferência</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </SectionCard>

      <SectionCard title="19. Usos anteriores do terreno">
        <FormField
          control={form.control}
          name="listagemC.usosAnteriores.comUsosAnteriores"
          render={({ field }) => (
            <FormItem>
              <FormLabel>O local foi submetido a usos antrópicos anteriores?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {usosAnteriores && (
          <>
            <FormField
              control={form.control}
              name="listagemC.usosAnteriores.indicamPassivos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Esses usos podem indicar passivos ambientais?</FormLabel>
                  <FormControl>
                    <BooleanRadio value={field.value} onChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="listagemC.usosAnteriores.descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrever usos anteriores{indicamPassivos ? ' e passivos' : ''}</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </>
        )}
      </SectionCard>

      <SectionCard title="20. Croqui para orientar o acesso">
        <FormDescription>Apresentar croqui de acesso no Anexo XXV.</FormDescription>
        <TextField form={form} name="listagemC.domissanitarios.anexoCroquiAcesso" label="Referência croqui (Anexo XXV)" />
      </SectionCard>

      <SectionCard title="21. Justificativas">
        <FormDescription>
          Anexos XXVI a XXIX – justificativas tecnológica, técnico/socioeconômica, ambiental e locacional.
        </FormDescription>
        <TextField form={form} name="listagemC.domissanitarios.anexoJustificativas" label="Referência justificativas (Anexos XXVI–XXIX)" />
      </SectionCard>

      <SectionCard title="22. Caracterização técnica">
        <FormDescription>
          A partir do item 24, apresentar as informações técnicas específicas da indústria de produtos domissanitários em
          regularização.
        </FormDescription>
      </SectionCard>

      <SectionCard title="23. Área do empreendimento">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NumField form={form} name="listagemC.domissanitarios.areas.areaTotalM2" label="Área total do terreno (m²)" />
          <NumField form={form} name="listagemC.domissanitarios.areas.areaUtilM2" label="Área útil (m²)" />
          <NumField form={form} name="listagemC.domissanitarios.areas.areaConstruidaM2" label="Área construída (m²)" />
        </div>
      </SectionCard>
    </div>
  );
}
