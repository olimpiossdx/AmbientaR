'use client';

import * as React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { BrDateFormControl } from '@/components/form/br-date-input';
import { MaskedInput } from '@/components/ui/masked-input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type {
  Empreendedor,
  EnvironmentalCompany,
  Procuracao,
  Project,
  TechnicalResponsible,
} from '@/lib/types';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useRouter } from 'next/navigation';
import { filterProjectsByEmpreendedorId } from '@/lib/processos-form-order';
import { detectCpfCnpjKind } from '@/lib/cpf-cnpj';
import { DEFAULT_PROCURACAO_PODERES_TEXT } from '@/lib/procuracao/default-text';
import {
  buildContratadoFromCompany,
  buildResponsavelFromTechnical,
  formatTechnicalResponsibleAddress,
} from '@/lib/contract-contratada-intro';
import { formatPlatformCompanyAddress } from '@/lib/platform-company';
import { stripUndefinedDeep } from '@/lib/firestore-payload';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  empreendedorId: z.string().min(1, 'Selecione o empreendedor (outorgante).'),
  outorganteNome: z.string().min(1, 'Informe o nome do outorgante.'),
  outorganteCpfCnpj: z.string().min(11, 'Informe o CPF ou CNPJ do outorgante.'),
  outorganteAddress: z.string().optional(),
  outorganteMunicipio: z.string().optional(),
  outorganteUf: z.string().optional(),
  responsavelLegalNome: z.string().optional(),
  responsavelLegalCpf: z.string().optional(),
  responsavelLegalRg: z.string().optional(),
  responsavelLegalRgEmissor: z.string().optional(),
  responsavelLegalEndereco: z.string().optional(),
  companyId: z.string().min(1, 'Selecione a empresa outorgada.'),
  procuradorIds: z.array(z.string()).min(1, 'Selecione ao menos um procurador.'),
  projectIds: z.array(z.string()).min(1, 'Selecione ao menos um empreendimento.'),
  textoPoderes: z.string().min(20, 'Informe o texto dos poderes.'),
  dataDocumento: z.string().min(1, 'Informe a data do documento.'),
  localDocumento: z.string().min(1, 'Informe o local (cidade).'),
});

type FormValues = z.infer<typeof formSchema>;

type ProcuracaoFormProps = {
  currentItem?: Procuracao | null;
  onSuccess?: () => void;
};

function formatEmpreendedorAddress(e: Empreendedor): string {
  const parts = [
    e.address?.trim(),
    e.numero?.trim() ? `nº ${e.numero.trim()}` : undefined,
    e.bairro?.trim(),
    e.municipio?.trim() && e.uf?.trim()
      ? `${e.municipio.trim()}/${e.uf.trim()}`
      : e.municipio?.trim() || e.uf?.trim(),
    e.cep?.trim() ? `CEP ${e.cep.trim()}` : undefined,
  ].filter(Boolean);
  return parts.join(', ');
}

function procuracaoToFormValues(item: Procuracao): FormValues {
  return {
    empreendedorId: item.outorgante.empreendedorId,
    outorganteNome: item.outorgante.nome,
    outorganteCpfCnpj: item.outorgante.cpfCnpj,
    outorganteAddress: item.outorgante.address ?? '',
    outorganteMunicipio: item.outorgante.municipio ?? '',
    outorganteUf: item.outorgante.uf ?? '',
    responsavelLegalNome: item.outorgante.responsavelLegalNome ?? '',
    responsavelLegalCpf: item.outorgante.responsavelLegalCpf ?? '',
    responsavelLegalRg: item.outorgante.responsavelLegalRg ?? '',
    responsavelLegalRgEmissor: item.outorgante.responsavelLegalRgEmissor ?? '',
    responsavelLegalEndereco: item.outorgante.responsavelLegalEndereco ?? '',
    companyId: item.outorgado.companyId,
    procuradorIds: item.outorgado.procuradores.map((p) => p.responsibleId),
    projectIds: item.empreendimentos.map((e) => e.projectId),
    textoPoderes: item.textoPoderes,
    dataDocumento: item.dataDocumento?.slice(0, 10) ?? '',
    localDocumento: item.localDocumento ?? '',
  };
}

export function ProcuracaoForm({ currentItem = null, onSuccess }: ProcuracaoFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { firestore } = useFirebase();

  const empreendedoresQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'empreendedores') : null),
    [firestore],
  );
  const { data: empreendedores, isLoading: isLoadingEmpreendedores } =
    useCollection<Empreendedor>(empreendedoresQuery);

  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'projects') : null),
    [firestore],
  );
  const { data: projects, isLoading: isLoadingProjects } =
    useCollection<Project>(projectsQuery);

  const companiesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'environmentalCompanies') : null),
    [firestore],
  );
  const { data: companies, isLoading: isLoadingCompanies } =
    useCollection<EnvironmentalCompany>(companiesQuery);

  const responsiblesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'technicalResponsibles') : null),
    [firestore],
  );
  const { data: technicalResponsibles, isLoading: isLoadingResponsibles } =
    useCollection<TechnicalResponsible>(responsiblesQuery);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: currentItem
      ? procuracaoToFormValues(currentItem)
      : {
          empreendedorId: '',
          outorganteNome: '',
          outorganteCpfCnpj: '',
          outorganteAddress: '',
          outorganteMunicipio: '',
          outorganteUf: '',
          responsavelLegalNome: '',
          responsavelLegalCpf: '',
          responsavelLegalRg: '',
          responsavelLegalRgEmissor: '',
          responsavelLegalEndereco: '',
          companyId: '',
          procuradorIds: [],
          projectIds: [],
          textoPoderes: DEFAULT_PROCURACAO_PODERES_TEXT,
          dataDocumento: new Date().toISOString().slice(0, 10),
          localDocumento: '',
        },
  });

  const selectedEmpreendedorId = form.watch('empreendedorId');
  const selectedCompanyId = form.watch('companyId');
  const outorganteCpfCnpj = form.watch('outorganteCpfCnpj');
  const isPessoaJuridica = detectCpfCnpjKind(outorganteCpfCnpj) === 'cnpj';

  const filteredProjects = React.useMemo(
    () => filterProjectsByEmpreendedorId(projects, selectedEmpreendedorId),
    [projects, selectedEmpreendedorId],
  );

  const selectedCompany = React.useMemo(
    () => companies?.find((c) => c.id === selectedCompanyId),
    [companies, selectedCompanyId],
  );

  const applyEmpreendedorToForm = React.useCallback(
    (empreendedorId: string) => {
      const emp = empreendedores?.find((e) => e.id === empreendedorId);
      if (!emp) return;
      form.setValue('outorganteNome', emp.name ?? '');
      form.setValue('outorganteCpfCnpj', emp.cpfCnpj ?? '');
      form.setValue('outorganteAddress', formatEmpreendedorAddress(emp));
      form.setValue('outorganteMunicipio', emp.municipio ?? '');
      form.setValue('outorganteUf', emp.uf ?? '');
      if (!form.getValues('localDocumento') && emp.municipio) {
        form.setValue('localDocumento', emp.municipio);
      }
      const validProjectIds = filterProjectsByEmpreendedorId(projects, empreendedorId).map(
        (p) => p.id,
      );
      const currentIds = form.getValues('projectIds');
      form.setValue(
        'projectIds',
        currentIds.filter((id) => validProjectIds.includes(id)),
      );
    },
    [empreendedores, form, projects],
  );

  async function onSubmit(values: FormValues) {
    if (!firestore) return;
    setLoading(true);
    try {
      const company = companies?.find((c) => c.id === values.companyId);
      if (!company) {
        toast({
          variant: 'destructive',
          title: 'Empresa não encontrada',
          description: 'Selecione a empresa outorgada (consultoria).',
        });
        return;
      }

      const procuradores = values.procuradorIds
        .map((id) => {
          const rt = technicalResponsibles?.find((r) => r.id === id);
          if (!rt) return null;
          const snap = buildResponsavelFromTechnical(rt, id);
          return {
            responsibleId: id,
            name: snap.name,
            profession: snap.profession,
            cpf: snap.cpf,
            identidade: snap.identidade,
            emissor: snap.emissor,
            estadoCivil: snap.estadoCivil,
            nacionalidade: snap.nacionalidade,
            address: snap.address,
            municipio: snap.municipio,
            uf: snap.uf,
          };
        })
        .filter(Boolean) as Procuracao['outorgado']['procuradores'];

      const empreendimentos = values.projectIds
        .map((projectId) => {
          const project = projects?.find((p) => p.id === projectId);
          if (!project) return null;
          return {
            projectId,
            nome: (project.fantasyName || project.propertyName || '').trim(),
            municipio: project.municipio,
            uf: project.uf,
            cnpj: project.cnpj,
          };
        })
        .filter(Boolean) as Procuracao['empreendimentos'];

      const contratado = buildContratadoFromCompany(company);

      const payload: Omit<Procuracao, 'id'> = {
        status: currentItem?.status ?? 'Rascunho',
        outorgante: {
          empreendedorId: values.empreendedorId,
          nome: values.outorganteNome.trim(),
          cpfCnpj: values.outorganteCpfCnpj.trim(),
          address: values.outorganteAddress?.trim(),
          municipio: values.outorganteMunicipio?.trim(),
          uf: values.outorganteUf?.trim(),
          responsavelLegalNome: values.responsavelLegalNome?.trim(),
          responsavelLegalCpf: values.responsavelLegalCpf?.trim(),
          responsavelLegalRg: values.responsavelLegalRg?.trim(),
          responsavelLegalRgEmissor: values.responsavelLegalRgEmissor?.trim(),
          responsavelLegalEndereco: values.responsavelLegalEndereco?.trim(),
        },
        outorgado: {
          companyId: company.id,
          companyName: contratado.name,
          companyCnpj: contratado.cnpj || company.cnpj,
          companyAddress: contratado.address || formatPlatformCompanyAddress(company),
          procuradores,
        },
        textoPoderes: values.textoPoderes.trim(),
        empreendimentos,
        dataDocumento: values.dataDocumento,
        localDocumento: values.localDocumento.trim(),
        contractPdfUrl: currentItem?.contractPdfUrl,
        fileUrl: currentItem?.fileUrl,
        updatedAt: new Date().toISOString(),
      };

      const dataToSave = stripUndefinedDeep(payload);

      if (currentItem?.id) {
        await updateDoc(doc(firestore, 'procuracoes', currentItem.id), dataToSave);
        toast({ title: 'Procuração atualizada', description: 'Alterações salvas com sucesso.' });
      } else {
        await addDoc(collection(firestore, 'procuracoes'), {
          ...dataToSave,
          createdAt: new Date().toISOString(),
        });
        toast({
          title: 'Procuração salva',
          description: 'Rascunho registrado. Aprove na listagem para gerar o PDF para assinatura.',
        });
      }
      onSuccess?.();
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível gravar a procuração.',
      });
    } finally {
      setLoading(false);
    }
  }

  const toggleArrayValue = (
    fieldName: 'procuradorIds' | 'projectIds',
    value: string,
    checked: boolean,
  ) => {
    const current = form.getValues(fieldName);
    if (checked) {
      form.setValue(fieldName, [...current, value], { shouldValidate: true });
    } else {
      form.setValue(
        fieldName,
        current.filter((id) => id !== value),
        { shouldValidate: true },
      );
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Outorgante (empreendedor)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="empreendedorId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empreendedor</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      applyEmpreendedorToForm(value);
                    }}
                    value={field.value}
                    disabled={isLoadingEmpreendedores}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isLoadingEmpreendedores
                              ? 'Carregando...'
                              : 'Selecione o empreendedor'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {empreendedores?.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="outorganteCpfCnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF / CNPJ do outorgante</FormLabel>
                  <FormControl>
                    <MaskedInput mask="cpfCnpj" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="outorganteNome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome / razão social</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="outorganteAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço do outorgante</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="outorganteMunicipio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Município</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="outorganteUf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>UF</FormLabel>
                  <FormControl>
                    <Input maxLength={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {isPessoaJuridica && (
            <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
              <p className="text-sm font-medium">Responsável legal (pessoa jurídica)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="responsavelLegalNome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do responsável legal</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="responsavelLegalCpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF do responsável legal</FormLabel>
                      <FormControl>
                        <MaskedInput mask="cpf" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="responsavelLegalRg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RG</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="responsavelLegalRgEmissor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Órgão emissor (ex.: SSP MG)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="responsavelLegalEndereco"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço do responsável legal</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Outorgada (empresa consultoria)</h3>
          <FormField
            control={form.control}
            name="companyId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isLoadingCompanies}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          isLoadingCompanies ? 'Carregando...' : 'Selecione a empresa'
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {companies?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.fantasyName || c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCompany && (
                  <FormDescription>
                    {formatPlatformCompanyAddress(selectedCompany)}
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="procuradorIds"
            render={() => (
              <FormItem>
                <FormLabel>Procuradores (responsáveis técnicos)</FormLabel>
                <FormDescription>
                  Selecione quem será nomeado como outorgado na procuração.
                </FormDescription>
                <div className="rounded-md border divide-y max-h-48 overflow-y-auto">
                  {isLoadingResponsibles && (
                    <p className="p-3 text-sm text-muted-foreground">Carregando...</p>
                  )}
                  {!isLoadingResponsibles &&
                    technicalResponsibles?.map((rt) => (
                      <label
                        key={rt.id}
                        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={form.watch('procuradorIds').includes(rt.id)}
                          onCheckedChange={(checked) =>
                            toggleArrayValue('procuradorIds', rt.id, checked === true)
                          }
                        />
                        <span className="text-sm leading-snug">
                          <span className="font-medium">{rt.name}</span>
                          {rt.profession ? ` — ${rt.profession}` : ''}
                          {rt.cpf ? ` · CPF ${rt.cpf}` : ''}
                          {formatTechnicalResponsibleAddress(rt)
                            ? ` · ${formatTechnicalResponsibleAddress(rt)}`
                            : ''}
                        </span>
                      </label>
                    ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Empreendimentos representados</h3>
          {!selectedEmpreendedorId ? (
            <p className="text-sm text-muted-foreground">
              Selecione o empreendedor para listar os empreendimentos disponíveis.
            </p>
          ) : (
            <FormField
              control={form.control}
              name="projectIds"
              render={() => (
                <FormItem>
                  <FormLabel>Empreendimento(s)</FormLabel>
                  <div className="rounded-md border divide-y max-h-52 overflow-y-auto">
                    {isLoadingProjects && (
                      <p className="p-3 text-sm text-muted-foreground">Carregando...</p>
                    )}
                    {!isLoadingProjects && filteredProjects.length === 0 && (
                      <p className="p-3 text-sm text-muted-foreground">
                        Nenhum empreendimento vinculado a este empreendedor.
                      </p>
                    )}
                    {filteredProjects.map((project) => (
                      <label
                        key={project.id}
                        className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={form.watch('projectIds').includes(project.id)}
                          onCheckedChange={(checked) =>
                            toggleArrayValue('projectIds', project.id, checked === true)
                          }
                        />
                        <span className="text-sm">
                          <span className="font-medium">
                            {project.fantasyName || project.propertyName}
                          </span>
                          {project.municipio && project.uf
                            ? ` — ${project.municipio}/${project.uf}`
                            : ''}
                        </span>
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <Separator />

        <FormField
          control={form.control}
          name="textoPoderes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Texto dos poderes de representação</FormLabel>
              <FormDescription>
                Modelo base conforme documento da consultoria. A lista de empreendimentos é
                acrescentada automaticamente ao final.
              </FormDescription>
              <FormControl>
                <Textarea className="min-h-[200px] font-mono text-xs" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="localDocumento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Local (cidade da assinatura)</FormLabel>
                <FormControl>
                  <Input placeholder="Ex.: Unaí" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dataDocumento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data do documento</FormLabel>
                <BrDateFormControl value={field.value} onChange={field.onChange} />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar rascunho
          </Button>
        </div>
      </form>
    </Form>
  );
}
