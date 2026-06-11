'use client';

import { useFieldArray } from 'react-hook-form';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import { BooleanRadio, CheckboxOptions, NumField, SectionCard, TextField, TabelaLinhasFixas } from './form-listagem-a-helpers';

const base = 'listagemA.rochasOrnamentais';

const finalidadesAgua = [
  'Lavagem de matéria-prima',
  'Lavagem de produto intermediário',
  'Lavagem de veículos',
  'Controle de emissões atmosféricas',
  'Lavagem de pisos e equipamentos',
  'Consumo humano',
  'Outras finalidades',
];

const tiposCorte = [
  { id: 'cunhas_metalicas', label: 'Perfuração para cunhas metálicas' },
  { id: 'mortero_expansivo', label: 'Perfuração para morteiro expansivo' },
  { id: 'explosivo', label: 'Perfuração para corte explosivo' },
  { id: 'fio_diamantado', label: 'Corte contínuo – fio diamantado' },
  { id: 'serra_circular', label: 'Corte contínuo – serras circulares' },
  { id: 'jet_flame', label: 'Jet flame' },
  { id: 'desmonte_manual', label: 'Desmonte manual' },
  { id: 'outros', label: 'Outros' },
];

const fontesRuido = [
  'Serras circulares',
  'Detonações',
  'Compressores',
  'Perfurações',
  'Beneficiamento',
  'Outros',
];

const tiposEfluente = [
  'Óleos e graxas',
  'Águas de lavagem',
  'Efluentes de corte contínuo',
  'Efluentes da unidade de beneficiamento',
  'Efluentes sanitários',
  'Outros',
];

const tiposResiduo = [
  'Papel / plástico / vidro',
  'Sucata metálica',
  'Pneus',
  'Contaminados com óleo',
  'Outros',
];

const impactosMeioFisico = [
  'Contaminação do solo',
  'Contaminação do ar',
  'Compactação do solo',
  'Contaminação de águas superficiais',
  'Erosão',
  'Derramamento de óleo/combustíveis',
  'Vazamento de combustíveis armazenados',
  'Impermeabilização do solo',
  'Assoreamento de cursos d’água',
  'Contaminação por esgoto',
  'Intervenção em nascentes',
  'Emissão de material particulado',
  'Emissões atmosféricas de equipamentos',
  'Ruído',
  'Alteração da paisagem',
];

const impactosMeioBiotico = [
  'Destruição de habitat e afugentamento da fauna',
  'Fragmentação florestal',
  'Aumento de vetores',
  'Risco de eutrofização',
  'Supressão de vegetação',
  'Intervenção em APP',
];

const impactosMeioSocioeconomico = [
  'Dificuldade de relacionamento com população local',
  'Risco à saúde',
  'Geração de empregos',
  'Arrecadação de impostos',
];

const zeeGeofisico = [
  'Potencialidade social',
  'Vulnerabilidade natural',
  'Vulnerabilidade de contaminação do solo',
  'Taxa de decomposição de matéria orgânica do solo',
  'Vulnerabilidade à erosão',
  'Risco ambiental',
  'Qualidade ambiental',
  'Qualidade da água superficial',
  'Vulnerabilidade associada à disponibilidade de água superficial',
  'Integridade fauna',
  'Integridade flora',
  'Exposição do solo',
];

export function FormListagemARochasOrnamentaisTecnico({ form }: { form: any }) {
  const usaExplosivos = form.watch(`${base}.processoProdutivo.usaExplosivos`);
  const haDetonacoes = form.watch(`${base}.emissoes.haveraDetonacoes`);
  const beneficiamentoSerraria = form.watch(`${base}.beneficiamento.haBeneficiamentoSerraria`);
  const { fields: equipamentos, append: appendEquip, remove: removeEquip } = useFieldArray({
    control: form.control,
    name: `${base}.equipamentos`,
  });
  const { fields: insumosBeneficiamento, append: appendInsumo, remove: removeInsumo } = useFieldArray({
    control: form.control,
    name: `${base}.insumosBeneficiamento`,
  });
  const { fields: municipiosZee, append: appendMunicipio, remove: removeMunicipio } = useFieldArray({
    control: form.control,
    name: `${base}.zeeSocioeconomico`,
  });

  return (
    <div className="space-y-6">
      <SectionCard title="18. Dados econômicos do empreendimento">
        <FormField
          control={form.control}
          name={`${base}.dadosEconomicos.investimentoAmbiental`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimativa de investimento ambiental?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <TextField form={form} name={`${base}.dadosEconomicos.tipoAplicacaoInvestimento`} label="Tipo de aplicação do investimento" />
          <NumField form={form} name={`${base}.dadosEconomicos.investimentoAmbientalRsAno`} label="Investimento ambiental (R$/ano)" />
          <NumField form={form} name={`${base}.dadosEconomicos.arrecadacaoCfemRsAno`} label="Arrecadação CFEM estimada (R$/ano)" />
          <NumField form={form} name={`${base}.dadosEconomicos.custoImplantacaoRsAno`} label="Custo estimado de implantação (R$/ano)" />
        </div>
      </SectionCard>

      <SectionCard title="19. Recursos humanos (setores)">
        <TabelaLinhasFixas
          form={form}
          basePath={`${base}.recursosHumanos`}
          linhas={[
            { id: 'producao', label: 'Setor de produção' },
            { id: 'administrativo', label: 'Setor administrativo' },
            { id: 'manutencao', label: 'Setor de manutenção' },
          ]}
          colunas={[
            { key: 'quantidade', label: 'Nº funcionários', type: 'number' },
            { key: 'pctMunicipio', label: '% município próprio' },
            { key: 'pctOutrosMg', label: '% outros MG' },
            { key: 'pctOutrosEstados', label: '% outros estados' },
          ]}
        />
      </SectionCard>

      <SectionCard title="20. Implantação de infra-estrutura">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <TextField form={form} name={`${base}.infraestrutura.acessosExtensao`} label="Acessos – extensão" />
          <TextField form={form} name={`${base}.infraestrutura.acessosTipoObra`} label="Tipo de obra" />
          <TextField form={form} name={`${base}.infraestrutura.acessosConservacao`} label="Estado de conservação" />
          <TextField form={form} name={`${base}.infraestrutura.acessosPavimentacao`} label="Tipo de pavimentação" />
        </div>
        <FormField
          control={form.control}
          name={`${base}.infraestrutura.descricaoAcessos`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Acessos e fluxo de produção – obras, impactos e controles</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${base}.infraestrutura.preparoAreas`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preparo das áreas de exploração e apoios</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${base}.infraestrutura.energiaEletrica`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Energia elétrica – fonte, rede e impactos</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <TextField form={form} name={`${base}.infraestrutura.fonteEnergia`} label="Fonte / concessionária" />
          <NumField form={form} name={`${base}.infraestrutura.consumoEnergiaMensal`} label="Consumo médio mensal" />
        </div>
        <FormField
          control={form.control}
          name={`${base}.infraestrutura.abastecimentoAgua`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Abastecimento de água – obras e impactos</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${base}.infraestrutura.edificacoes`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Construção das edificações (escritórios, oficinas, almoxarifado etc.)</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title="21. Uso de água">
        <FormDescription>Balanço hídrico – consumo por finalidade (m³/dia)</FormDescription>
        {finalidadesAgua.map((finalidade) => {
          const slug = finalidade.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
          return (
            <div key={slug} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-3">
              <p className="font-medium md:col-span-1">{finalidade}</p>
              <NumField form={form} name={`${base}.usoAgua.finalidades.${slug}.maximo`} label="Consumo máx. diário" />
              <NumField form={form} name={`${base}.usoAgua.finalidades.${slug}.medio`} label="Consumo méd. diário" />
            </div>
          );
        })}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NumField form={form} name={`${base}.usoAgua.volumeReuso`} label="Volume de reuso (m³/dia)" />
          <NumField form={form} name={`${base}.usoAgua.consumoTotalMaximo`} label="Consumo total máximo diário" />
          <NumField form={form} name={`${base}.usoAgua.consumoTotalMedio`} label="Consumo total médio diário" />
        </div>
      </SectionCard>

      <SectionCard title="22. Processo produtivo – estéril e rejeitos">
        <CheckboxOptions
          form={form}
          name={`${base}.processoProdutivo.desmonte`}
          options={[
            { id: 'manual', label: 'Desmonte manual' },
            { id: 'mecanico', label: 'Desmonte mecânico' },
          ]}
        />
        <TextField form={form} name={`${base}.processoProdutivo.ferramentasManuais`} label="Ferramentas manuais" />
        <TextField form={form} name={`${base}.processoProdutivo.maquinasEquipamentos`} label="Máquinas e equipamentos" />
        <FormField
          control={form.control}
          name={`${base}.processoProdutivo.usaExplosivos`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Uso de explosivos</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {usaExplosivos && (
          <TextField form={form} name={`${base}.processoProdutivo.planoFogo`} label="Tipos de explosivo e plano de fogo (Anexo 8)" />
        )}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NumField form={form} name={`${base}.processoProdutivo.capeamentoEspessuraM`} label="Capeamento – espessura (m)" />
          <NumField form={form} name={`${base}.processoProdutivo.capeamentoVolumeM3`} label="Capeamento – volume (m³)" />
          <TextField form={form} name={`${base}.processoProdutivo.capeamentoComposicao`} label="Capeamento – composição" />
        </div>
        <FormField
          control={form.control}
          name={`${base}.processoProdutivo.armazenamentoEsteril`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Armazenamento/disposição de estéril e rejeitos</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <NumField form={form} name={`${base}.processoProdutivo.pilhaVolumeFinalM3`} label="Pilha – volume final (m³)" />
          <NumField form={form} name={`${base}.processoProdutivo.pilhaAlturaM`} label="Altura total da pilha (m)" />
          <NumField form={form} name={`${base}.processoProdutivo.pilhaAreaM2`} label="Área final projetada (m²)" />
        </div>
        <FormField
          control={form.control}
          name={`${base}.processoProdutivo.usaAguaProcesso`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Utilização de água no processo?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title="23. Extração de rocha">
        <FormField
          control={form.control}
          name={`${base}.extracaoRocha.metodologia`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Metodologia de extração (bancadas, perfuração, equipamentos)</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <CheckboxOptions form={form} name={`${base}.extracaoRocha.tiposCorte`} options={tiposCorte} />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NumField form={form} name={`${base}.extracaoRocha.indiceRecuperacaoPercent`} label="Índice de recuperação na lavra (%)" />
          <NumField form={form} name={`${base}.extracaoRocha.rejeitosDiaM3`} label="Volume diário/mensal de rejeitos (m³)" />
        </div>
        {equipamentos.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
            <TextField form={form} name={`${base}.equipamentos.${index}.descricao`} label="Equipamento" />
            <TextField form={form} name={`${base}.equipamentos.${index}.tipo`} label="Tipo" />
            <TextField form={form} name={`${base}.equipamentos.${index}.quantidade`} label="Quantidade" />
            <TextField form={form} name={`${base}.equipamentos.${index}.capacidade`} label="Capacidade máxima" />
            <div className="md:col-span-4 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeEquip(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendEquip({ descricao: '', tipo: '', quantidade: '', capacidade: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar equipamento
        </Button>
        <FormField
          control={form.control}
          name={`${base}.explosivos.preparacao`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preparação dos explosivos / blaster / licença do Exército</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title="24. Beneficiamento">
        <FormField
          control={form.control}
          name={`${base}.beneficiamento.primarioAreasLavra`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Beneficiamento primário nas áreas de lavra?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NumField form={form} name={`${base}.beneficiamento.indiceRecuperacaoFinalPercent`} label="Índice final de recuperação (lavra + beneficiamento) %" />
          <NumField form={form} name={`${base}.beneficiamento.rejeitosMensaisM3`} label="Volume mensal de rejeitos (m³)" />
        </div>
        <FormField
          control={form.control}
          name={`${base}.beneficiamento.alternativasRejeito`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alternativas técnicas/econômicas para utilização de rejeitos</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${base}.beneficiamento.haBeneficiamentoSerraria`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Haverá beneficiamento (serrarias) no polígono minerário?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {beneficiamentoSerraria && (
          <>
            <FormField
              control={form.control}
              name={`${base}.beneficiamento.usaAguaBeneficiamento`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Utilização de água no beneficiamento?</FormLabel>
                  <FormControl>
                    <BooleanRadio value={field.value} onChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`${base}.beneficiamento.reaproveitamentoAgua`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reaproveitamento de água no beneficiamento?</FormLabel>
                  <FormControl>
                    <BooleanRadio value={field.value} onChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <TextField form={form} name={`${base}.beneficiamento.areaServidaoDnpm`} label="Em área de servidão DNPM?" />
          </>
        )}
      </SectionCard>

      <SectionCard title="25. Insumos utilizados no beneficiamento">
        {insumosBeneficiamento.map((item, index) => (
          <div key={item.id} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-6">
            <TextField form={form} name={`${base}.insumosBeneficiamento.${index}.descricao`} label="Descrição" />
            <TextField form={form} name={`${base}.insumosBeneficiamento.${index}.tipo`} label="Tipo" />
            <TextField form={form} name={`${base}.insumosBeneficiamento.${index}.consumoMensal`} label="Consumo mensal" />
            <TextField form={form} name={`${base}.insumosBeneficiamento.${index}.processo`} label="Processo" />
            <TextField form={form} name={`${base}.insumosBeneficiamento.${index}.fabricante`} label="Fabricante" />
            <TextField form={form} name={`${base}.insumosBeneficiamento.${index}.ondeUtilizado`} label="Onde é utilizado" />
            <div className="md:col-span-6 flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeInsumo(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          onClick={() => appendInsumo({ descricao: '', tipo: '', consumoMensal: '', processo: '', fabricante: '', ondeUtilizado: '' })}
        >
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar insumo
        </Button>
      </SectionCard>

      <SectionCard title="26. Caracterização das emissões">
        <FormDescription>Ruídos – fontes, periodicidade e intensidade (dB)</FormDescription>
        {fontesRuido.map((fonte) => {
          const slug = fonte.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
          return (
            <div key={slug} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
              <p className="font-medium">{fonte}</p>
              <TextField form={form} name={`${base}.emissoes.ruidos.${slug}.periodicidade`} label="Periodicidade" />
              <NumField form={form} name={`${base}.emissoes.ruidos.${slug}.intensidadeDb`} label="Intensidade (dB)" />
              <FormField
                control={form.control}
                name={`${base}.emissoes.ruidos.${slug}.incidencia`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Incidência?</FormLabel>
                    <FormControl>
                      <BooleanRadio value={field.value} onChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          );
        })}
        <FormField
          control={form.control}
          name={`${base}.emissoes.haveraDetonacoes`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Haverá detonações?</FormLabel>
              <FormControl>
                <BooleanRadio value={field.value} onChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />
        {haDetonacoes && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <TextField form={form} name={`${base}.emissoes.frequenciaDetonacoes`} label="Frequência das detonações" />
            <TextField form={form} name={`${base}.emissoes.horarioDetonacoes`} label="Horário fixo para detonações" />
          </div>
        )}
      </SectionCard>

      <SectionCard title="27. Efluentes líquidos">
        {tiposEfluente.map((tipo) => {
          const slug = tipo.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
          return (
            <div key={slug} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
              <p className="font-medium">{tipo}</p>
              <TextField form={form} name={`${base}.efluentes.${slug}.fontes`} label="Fontes geradoras" />
              <FormField
                control={form.control}
                name={`${base}.efluentes.${slug}.possuiTratamento`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sistema de tratamento?</FormLabel>
                    <FormControl>
                      <BooleanRadio value={field.value} onChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`${base}.efluentes.${slug}.monitoramento`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monitoramento?</FormLabel>
                    <FormControl>
                      <BooleanRadio value={field.value} onChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          );
        })}
        <CheckboxOptions
          form={form}
          name={`${base}.efluentes.destinoFinal`}
          options={[
            { id: 'solo', label: 'Lançamento no solo' },
            { id: 'corpo_hidrico', label: 'Lançamento em corpo d’água' },
          ]}
        />
        <TextField form={form} name={`${base}.efluentes.corpoHidricoIdentificacao`} label="Identificação do corpo hídrico receptor" />
      </SectionCard>

      <SectionCard title="28. Resíduos sólidos e material particulado">
        {tiposResiduo.map((tipo) => {
          const slug = tipo.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
          return (
            <div key={slug} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-4">
              <p className="font-medium">{tipo}</p>
              <TextField form={form} name={`${base}.residuosSolidos.${slug}.fontes`} label="Fontes geradoras" />
              <FormField
                control={form.control}
                name={`${base}.residuosSolidos.${slug}.empresaLicenciada`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destina para empresa licenciada?</FormLabel>
                    <FormControl>
                      <BooleanRadio value={field.value} onChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
              <TextField form={form} name={`${base}.residuosSolidos.${slug}.empresaReceptora`} label="Empresa receptora" />
            </div>
          );
        })}
        <FormDescription>Material particulado e gases – perfuração, detonação, transporte, beneficiamento, motores.</FormDescription>
        <TextField form={form} name={`${base}.emissoes.particuladoGases`} label="Fontes, sistemas de controle e tipologia" />
      </SectionCard>

      <SectionCard title="29. Caracterização geológica e geomorfológica">
        <FormField
          control={form.control}
          name={`${base}.geologiaGeomorfologia.descricao`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição geológica e geomorfológica da área e entorno</FormLabel>
              <FormControl>
                <Textarea rows={5} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title="30 a 32. Impactos visuais, decapeamento e socioeconômicos (Módulo 5)">
        <FormField
          control={form.control}
          name={`${base}.impactos.visuaisPaisagem`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>30. Impactos visuais, degradação do solo e da paisagem</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${base}.impactos.decapeamentoLavra`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>31. Decapeamento do estéril e lavra do minério</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`${base}.impactos.socioeconomicosDescricao`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>32. Impactos socioeconômicos</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </SectionCard>

      <SectionCard title="33 a 35. Quadro resumo de impactos (Módulo 6)">
        <CheckboxOptions form={form} name={`${base}.impactos.meioFisico`} options={impactosMeioFisico.map((i) => ({ id: i, label: i }))} />
        <TextField form={form} name={`${base}.impactos.meioFisicoOutros`} label="Meio físico – outros" />
        <CheckboxOptions form={form} name={`${base}.impactos.meioBiotico`} options={impactosMeioBiotico.map((i) => ({ id: i, label: i }))} />
        <TextField form={form} name={`${base}.impactos.meioBioticoOutros`} label="Meio biótico – outros" />
        <CheckboxOptions form={form} name={`${base}.impactos.meioSocioeconomico`} options={impactosMeioSocioeconomico.map((i) => ({ id: i, label: i }))} />
        <TextField form={form} name={`${base}.impactos.meioSocioeconomicoOutros`} label="Meio socioeconômico – outros" />
      </SectionCard>

      <SectionCard title="36. Componente geofísico e biótico (ZEE – Módulo 7)">
        {zeeGeofisico.map((camada) => {
          const slug = camada.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
          return (
            <div key={slug} className="grid grid-cols-1 gap-3 rounded-md border p-3 md:grid-cols-2">
              <TextField form={form} name={`${base}.zeeGeofisico.${slug}.classificacao`} label={camada} />
              <NumField form={form} name={`${base}.zeeGeofisico.${slug}.percentual`} label="Distribuição (%)" />
            </div>
          );
        })}
      </SectionCard>

      <SectionCard title="37. Componente socioeconômico (ZEE)">
        {municipiosZee.map((item, index) => (
          <div key={item.id} className="space-y-3 rounded-md border p-3">
            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={() => removeMunicipio(index)}>
                <Trash2 className="mr-2 h-4 w-4" />Remover município
              </Button>
            </div>
            <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.municipio`} label="Município" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.ips`} label="IPS" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.populacao`} label="População" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.renda`} label="Índice renda" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.idhM`} label="IDH-M" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.vaIndustria`} label="Índice VA indústria" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.vaServicos`} label="Índice VA serviços" />
              <TextField form={form} name={`${base}.zeeSocioeconomico.${index}.gestaoAmbiental`} label="Gestão ambiental" />
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => appendMunicipio({ municipio: '' })}>
          <PlusCircle className="mr-2 h-4 w-4" />Adicionar município
        </Button>
      </SectionCard>
    </div>
  );
}
