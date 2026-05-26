'use client';

import * as React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import type { StudyFormSchema, Section, Field } from '@/lib/study-form-schema';
import { useCollection, useMemoFirebase, useFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import type { Empreendedor as Client, Project } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { filterProjectsByEmpreendedorId } from '@/lib/processos-form-order';
import { LISTAGEM_SHORT_BY_CODE } from '@/lib/listagem-activities';

export type DynamicFormValues = Record<string, unknown>;

interface DynamicStudyFormProps {
  schema: StudyFormSchema;
  defaultValues?: DynamicFormValues;
  studySlug: string;
  onSuccess?: (values: DynamicFormValues) => void | Promise<void>;
  submitLabel?: string;
  /** Se true, salva no Firestore; senão apenas chama onSuccess com valores */
  persist?: boolean;
  currentId?: string | null;
  /** Quando o empreendimento muda, informa a listagem (activity) do cadastro */
  onProjectActivityChange?: (activity: string | null) => void;
}

function normalizeKey(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function collectSchemaFieldPaths(schema: StudyFormSchema): string[] {
  const paths: string[] = [];
  for (const section of schema.sections) {
    const fields = section.fields || section.itemFields || [];
    for (const field of fields) {
      if (section.type === 'object' || section.fields) {
        paths.push(`${section.id}.${field.id}`);
      } else {
        paths.push(`${section.id}.${field.id}`);
      }
    }
  }
  return paths;
}

function countFilledFields(values: DynamicFormValues, paths: string[]): number {
  let filled = 0;
  for (const path of paths) {
    const parts = path.split('.');
    let cur: unknown = values;
    for (const p of parts) {
      if (cur == null || typeof cur !== 'object') {
        cur = undefined;
        break;
      }
      cur = (cur as Record<string, unknown>)[p];
    }
    if (cur !== undefined && cur !== null && cur !== '') {
      if (typeof cur === 'boolean' || typeof cur === 'number') filled += 1;
      else if (typeof cur === 'string' && cur.trim()) filled += 1;
      else if (Array.isArray(cur) && cur.length > 0) filled += 1;
    }
  }
  return filled;
}

function defaultOpenSections(schema: StudyFormSchema): string[] {
  const ids = schema.sections.map((s) => s.id);
  const preferred = ['requerente', 'empreendimento', 'responsavelTecnico'];
  const open = preferred.filter((p) => ids.some((id) => id.toLowerCase().includes(p.toLowerCase())));
  if (open.length < 2 && ids[0]) open.push(ids[0]);
  return open.slice(0, 3);
}

function getListagemCode(activity?: string): string {
  if (!activity) return '';
  const normalized = activity
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const match = normalized.match(/\blistagem\s+([a-h])\b/);
  return match?.[1]?.toUpperCase() ?? '';
}

function buildDefaultValuesFromSchema(schema: StudyFormSchema): DynamicFormValues {
  const out: DynamicFormValues = {};
  for (const sec of schema.sections) {
    if (sec.type === 'array') {
      out[sec.id] = [];
    } else if (sec.type === 'object' || sec.fields) {
      out[sec.id] = {};
      const fields = sec.fields || sec.itemFields || [];
      for (const f of fields) {
        (out[sec.id] as Record<string, unknown>)[f.id] =
          f.type === 'number' ? undefined : f.type === 'boolean' ? false : '';
      }
    }
  }
  return out;
}

function mergeDefaults(schema: StudyFormSchema, initial?: DynamicFormValues): DynamicFormValues {
  const base = buildDefaultValuesFromSchema(schema);
  if (!initial) return base;
  function merge(a: DynamicFormValues, b: DynamicFormValues): DynamicFormValues {
    const r = { ...a };
    for (const k of Object.keys(b)) {
      if (b[k] !== undefined && b[k] !== null) {
        if (
          typeof b[k] === 'object' &&
          !Array.isArray(b[k]) &&
          typeof a[k] === 'object' &&
          a[k] !== null &&
          !Array.isArray(a[k])
        ) {
          r[k] = merge((a[k] as DynamicFormValues) || {}, b[k] as DynamicFormValues);
        } else {
          r[k] = b[k];
        }
      }
    }
    return r;
  }
  return merge(base, initial);
}

const FIRESTORE_COLLECTION_BY_SLUG: Record<string, string | null> = {
  prada: 'pradas',
  ptrf: 'ptrfs',
  rca: 'rcas',
  pca: 'pcas',
  'eia-rima': 'eiaRimas',
  'las-ras': 'lasRas',
  reanalise: 'reanalises',
};

export function DynamicStudyForm({
  schema,
  defaultValues,
  studySlug,
  onSuccess,
  submitLabel = 'Salvar',
  persist = false,
  currentId = null,
  onProjectActivityChange,
}: DynamicStudyFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { firestore } = useFirebase();
  const clientsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'empreendedores') : null),
    [firestore]
  );
  const { data: clients } = useCollection<Client>(clientsQuery);
  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'projects') : null),
    [firestore]
  );
  const { data: projects } = useCollection<Project>(projectsQuery);

  const merged = React.useMemo(
    () => mergeDefaults(schema, defaultValues),
    [schema, defaultValues]
  );

  const form = useForm<DynamicFormValues>({
    defaultValues: merged,
  });

  const clientId = form.watch('requerente.clientId');
  const projectId = form.watch('empreendimento.projectId');
  const schemaFieldPaths = React.useMemo(() => collectSchemaFieldPaths(schema), [schema]);
  const formValues = form.watch();
  const fillProgress = React.useMemo(() => {
    if (schemaFieldPaths.length === 0) return 0;
    return Math.round(
      (countFilledFields(formValues, schemaFieldPaths) / schemaFieldPaths.length) * 100,
    );
  }, [formValues, schemaFieldPaths]);

  const projectsForSelect = React.useMemo(
    () => filterProjectsByEmpreendedorId(projects, clientId as string | undefined),
    [projects, clientId],
  );

  React.useEffect(() => {
    const pid = form.getValues('empreendimento.projectId') as string | undefined;
    if (pid && projectsForSelect.length > 0 && !projectsForSelect.some((p) => p.id === pid)) {
      form.setValue('empreendimento.projectId' as never, '' as never);
    }
  }, [clientId, projectsForSelect, form]);

  React.useEffect(() => {
    if (clientId && clients?.length) {
      const c = clients.find((x) => x.id === clientId);
      if (c) {
        form.setValue('requerente.nome' as any, c.name);
        form.setValue('requerente.cpfCnpj' as any, c.cpfCnpj ?? '');
      }
    }
  }, [clientId, clients, form]);
  React.useEffect(() => {
    if (projectId && projects?.length) {
      const p = projects.find((x) => x.id === projectId);
      if (p) {
        onProjectActivityChange?.(p.activity ?? null);
        const listagemCode = getListagemCode(p.activity);
        form.setValue('empreendimento.nome' as any, (p.fantasyName || p.propertyName) ?? '');
        form.setValue('empreendimento.denominacao' as any, p.propertyName ?? '');
        const carVal = typeof p.car === 'object' && p.car && 'receiptNumber' in p.car
          ? (p.car as { receiptNumber: string }).receiptNumber
          : (p as Record<string, unknown>).car as string | undefined;
        form.setValue('empreendimento.car' as any, carVal ?? '');
        form.setValue('empreendimento.matricula' as any, p.matricula ?? '');

        const autoByFieldId: Record<string, string | undefined> = {
          nome: (p.fantasyName || p.propertyName) ?? '',
          denominacao: p.propertyName ?? '',
          atividade: p.activity ?? '',
          activity: p.activity ?? '',
          listagem: p.activity ?? '',
          listagemcodigo: listagemCode,
          cnpj: p.cnpj ?? '',
          endereco: p.address ?? '',
          address: p.address ?? '',
          municipio: p.municipio ?? '',
          uf: p.uf ?? '',
          cep: p.cep ?? '',
          inscricaoestadual: p.inscricaoEstadual ?? '',
          inscricaomunicipal: p.inscricaoMunicipal ?? '',
          matricula: p.matricula ?? '',
          comarca: p.comarca ?? '',
          distrito: p.district ?? '',
          zona: p.zoneType ?? '',
        };

        for (const pathName of schemaFieldPaths) {
          const fieldId = normalizeKey(pathName.split('.').pop() || '');
          const mappedValue = autoByFieldId[fieldId];
          if (mappedValue == null || mappedValue === '') continue;
          const current = form.getValues(pathName as any);
          if (current == null || current === '') {
            form.setValue(pathName as any, mappedValue);
          }
        }
      }
    } else {
      onProjectActivityChange?.(null);
    }
  }, [projectId, projects, form, schemaFieldPaths, onProjectActivityChange]);

  const collectionName = FIRESTORE_COLLECTION_BY_SLUG[studySlug] ?? null;

  async function handleSubmit(values: DynamicFormValues) {
    setLoading(true);
    try {
      if (persist && collectionName && firestore) {
        const { addDoc, updateDoc, doc } = await import('firebase/firestore');
        const payload = {
          ...values,
          status: 'Rascunho',
          formSource: 'dynamic',
          updatedAt: new Date().toISOString(),
        };
        if (currentId) {
          await updateDoc(doc(firestore, collectionName, currentId), payload);
        } else {
          await addDoc(collection(firestore, collectionName), {
            ...payload,
            createdAt: new Date().toISOString(),
          });
        }
      }
      await onSuccess?.(values);
    } finally {
      setLoading(false);
    }
  }

  const openSections = React.useMemo(() => defaultOpenSections(schema), [schema]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Progresso do preenchimento</p>
            <span className="text-sm text-muted-foreground">{fillProgress}%</span>
          </div>
          <Progress value={fillProgress} className="h-2" />
          {schema.listagemCode && (
            <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
              Listagem{' '}
              <Badge variant="outline" className="font-mono">
                {schema.listagemCode}
              </Badge>
              {LISTAGEM_SHORT_BY_CODE[schema.listagemCode] && (
                <span>{LISTAGEM_SHORT_BY_CODE[schema.listagemCode]}</span>
              )}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Comece por empreendedor e empreendimento; as demais seções seguem a estrutura do
            termo de referência.
          </p>
        </div>

        <Accordion type="multiple" defaultValue={openSections} className="space-y-2">
          {schema.sections.map((section) => (
            <SectionBlock
              key={section.id}
              section={section}
              form={form}
              clients={clients ?? []}
              projects={projectsForSelect}
              allProjects={projects ?? []}
            />
          ))}
        </Accordion>

        <div className="sticky bottom-0 z-10 flex gap-2 border-t bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function SectionBlock({
  section,
  form,
  clients,
  projects,
  allProjects,
}: {
  section: Section;
  form: ReturnType<typeof useForm<DynamicFormValues>>;
  clients: Client[];
  projects: Project[];
  allProjects: Project[];
}) {
  const isArray = section.type === 'array' && section.itemFields?.length;
  const fields = section.fields || section.itemFields || [];
  const projectList =
    section.id === 'empreendimento' ? projects : allProjects;

  if (isArray) {
    return (
      <AccordionItem value={section.id} className="rounded-lg border px-4">
        <AccordionTrigger className="text-left hover:no-underline py-4">
          <span>
            <span className="font-semibold">{section.title}</span>
            {section.description && (
              <span className="mt-1 block text-xs font-normal text-muted-foreground">
                {section.description}
              </span>
            )}
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <ArraySection name={section.id} itemFields={section.itemFields!} form={form} />
        </AccordionContent>
      </AccordionItem>
    );
  }

  return (
    <AccordionItem value={section.id} className="rounded-lg border px-4">
      <AccordionTrigger className="text-left hover:no-underline py-4">
        <span>
          <span className="font-semibold">{section.title}</span>
          {section.description && (
            <span className="mt-1 block text-xs font-normal text-muted-foreground line-clamp-2">
              {section.description}
            </span>
          )}
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
          {fields.map((field) => (
            <div
              key={field.id}
              className={cn(field.uiWidth !== 'half' && 'md:col-span-2')}
            >
              <FieldRender
                field={field}
                namePrefix={section.id}
                form={form}
                clients={clients}
                projects={projectList}
              />
            </div>
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

function FieldRender({
  field,
  namePrefix,
  form,
  clients,
  projects,
}: {
  field: Field;
  namePrefix: string;
  form: ReturnType<typeof useForm<DynamicFormValues>>;
  clients: Client[];
  projects: Project[];
}) {
  const name = namePrefix.includes('.') ? `${namePrefix}.${field.id}` : `${namePrefix}.${field.id}`;

  if (field.type === 'select' && field.optionsSource === 'clients') {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field: f }) => (
          <FormItem>
            <FormLabel>
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </FormLabel>
            <Select
              value={(f.value as string) || ''}
              onValueChange={f.onChange}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o empreendedor" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.hint && <FormDescription>{field.hint}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  if (field.type === 'select' && field.optionsSource === 'projects') {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field: f }) => (
          <FormItem>
            <FormLabel>
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </FormLabel>
            <Select
              value={(f.value as string) || ''}
              onValueChange={f.onChange}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      projects.length === 0
                        ? 'Selecione o empreendedor primeiro'
                        : 'Selecione o empreendimento'
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.fantasyName || p.propertyName || p.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.hint && <FormDescription>{field.hint}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  if (field.type === 'text') {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field: f }) => (
          <FormItem>
            <FormLabel>
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </FormLabel>
            <FormControl>
              <Textarea
                {...f}
                value={f.value as string}
                placeholder={field.placeholder}
                rows={4}
              />
            </FormControl>
            {field.hint && <FormDescription>{field.hint}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  if (field.type === 'number') {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field: f }) => (
          <FormItem>
            <FormLabel>
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                {...f}
                value={f.value as number | undefined}
                onChange={(e) => f.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                placeholder={field.placeholder}
              />
            </FormControl>
            {field.hint && <FormDescription>{field.hint}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  if (field.type === 'date') {
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field: f }) => (
          <FormItem>
            <FormLabel>
              {field.label}
              {field.required && <span className="text-destructive ml-0.5">*</span>}
            </FormLabel>
            <FormControl>
              <BrDateFormControl
                value={typeof f.value === 'string' ? f.value : ''}
                onChange={f.onChange}
                onBlur={f.onBlur}
                placeholder={field.placeholder}
              />
            </FormControl>
            {field.hint && <FormDescription>{field.hint}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field: f }) => (
        <FormItem>
          <FormLabel>
            {field.label}
            {field.required && <span className="text-destructive ml-0.5">*</span>}
          </FormLabel>
          <FormControl>
            <Input
              {...f}
              value={(f.value as string) ?? ''}
              placeholder={field.placeholder}
            />
          </FormControl>
          {field.hint && <FormDescription>{field.hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function ArraySection({
  name,
  itemFields,
  form,
}: {
  name: string;
  itemFields: Field[];
  form: ReturnType<typeof useForm<DynamicFormValues>>;
}) {
  const { control } = form;
  const { fields, append, remove } = useFieldArray<any>({
    control,
    name: name as any,
  });

  const defaultItem = React.useMemo(() => {
    const o: Record<string, unknown> = {};
    for (const f of itemFields) {
      o[f.id] = f.type === 'number' ? undefined : '';
    }
    return o;
  }, [itemFields]);

  return (
    <div className="space-y-4">
      {fields.map((item, index) => (
        <Card key={item.id}>
          <CardContent className="pt-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Item {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            {itemFields.map((field) => (
              <FieldRender
                key={field.id}
                field={field}
                namePrefix={`${name}.${index}`}
                form={form}
                clients={[]}
                projects={[]}
              />
            ))}
          </CardContent>
        </Card>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append(defaultItem)}
      >
        <PlusCircle className="h-4 w-4 mr-1" />
        Adicionar
      </Button>
    </div>
  );
}
