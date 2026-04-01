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

export type DynamicFormValues = Record<string, unknown>;

interface DynamicStudyFormProps {
  schema: StudyFormSchema;
  defaultValues?: DynamicFormValues;
  studySlug: string;
  onSuccess?: (values: DynamicFormValues) => void | Promise<void>;
  submitLabel?: string;
  /** Se true, salva no Firestore (pradas/ptrfs); senão apenas chama onSuccess com valores */
  persist?: boolean;
  currentId?: string | null;
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

export function DynamicStudyForm({
  schema,
  defaultValues,
  studySlug,
  onSuccess,
  submitLabel = 'Salvar',
  persist = false,
  currentId = null,
}: DynamicStudyFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { firestore } = useFirebase();
  const clientsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'clients') : null),
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
  React.useEffect(() => {
    if (clientId && clients?.length) {
      const c = clients.find((x) => x.id === clientId);
      if (c) {
        form.setValue('requerente.nome', c.name);
        form.setValue('requerente.cpfCnpj', c.cpfCnpj ?? '');
      }
    }
  }, [clientId, clients, form]);
  React.useEffect(() => {
    if (projectId && projects?.length) {
      const p = projects.find((x) => x.id === projectId);
      if (p) {
        form.setValue('empreendimento.nome', (p.fantasyName || p.propertyName) ?? '');
        form.setValue('empreendimento.denominacao', p.propertyName ?? '');
        const carVal = typeof p.car === 'object' && p.car && 'receiptNumber' in p.car
          ? (p.car as { receiptNumber: string }).receiptNumber
          : (p as Record<string, unknown>).car as string | undefined;
        form.setValue('empreendimento.car', carVal ?? '');
        form.setValue('empreendimento.matricula', p.matricula ?? '');
      }
    }
  }, [projectId, projects, form]);

  const collectionName = studySlug === 'prada' ? 'pradas' : studySlug === 'ptrf' ? 'ptrfs' : null;

  async function handleSubmit(values: DynamicFormValues) {
    setLoading(true);
    try {
      if (persist && collectionName && firestore) {
        const { addDoc, updateDoc, doc } = await import('firebase/firestore');
        const payload = { ...values, status: 'Rascunho', updatedAt: new Date().toISOString() };
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {schema.sections.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            form={form}
            clients={clients ?? []}
            projects={projects ?? []}
          />
        ))}
        <div className="flex gap-2">
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
}: {
  section: Section;
  form: ReturnType<typeof useForm<DynamicFormValues>>;
  clients: Client[];
  projects: Project[];
}) {
  const isArray = section.type === 'array' && section.itemFields?.length;
  const fields = section.fields || section.itemFields || [];

  if (isArray) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{section.title}</CardTitle>
          {section.description && (
            <CardDescription>{section.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <ArraySection
            name={section.id}
            itemFields={section.itemFields!}
            form={form}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{section.title}</CardTitle>
        {section.description && (
          <CardDescription>{section.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => (
          <FieldRender
            key={field.id}
            field={field}
            namePrefix={section.id}
            form={form}
            clients={clients}
            projects={projects}
          />
        ))}
      </CardContent>
    </Card>
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
            <FormLabel>{field.label}</FormLabel>
            <Select
              value={(f.value as string) || ''}
              onValueChange={f.onChange}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cliente" />
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
            <FormLabel>{field.label}</FormLabel>
            <Select
              value={(f.value as string) || ''}
              onValueChange={f.onChange}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um empreendimento" />
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
            <FormLabel>{field.label}</FormLabel>
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
            <FormLabel>{field.label}</FormLabel>
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
            <FormLabel>{field.label}</FormLabel>
            <FormControl>
              <Input
                type="date"
                {...f}
                value={typeof f.value === 'string' ? f.value : ''}
                onChange={(e) => f.onChange(e.target.value)}
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
          <FormLabel>{field.label}</FormLabel>
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
  const { fields, append, remove } = useFieldArray({
    control,
    name,
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
