'use client';

import * as React from 'react';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

export function BooleanRadio({
  value,
  onChange,
}: {
  value: boolean | undefined;
  onChange: (next: boolean) => void;
}) {
  return (
    <RadioGroup
      onValueChange={(v) => onChange(v === 'true')}
      value={value === undefined ? undefined : String(value)}
      className="flex gap-4"
    >
      <FormItem className="flex items-center gap-2">
        <FormControl>
          <RadioGroupItem value="true" />
        </FormControl>
        <FormLabel className="font-normal">Sim</FormLabel>
      </FormItem>
      <FormItem className="flex items-center gap-2">
        <FormControl>
          <RadioGroupItem value="false" />
        </FormControl>
        <FormLabel className="font-normal">Não</FormLabel>
      </FormItem>
    </RadioGroup>
  );
}

export function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 rounded-md border p-4">
      <h3 className="text-lg font-medium">{title}</h3>
      {children}
    </div>
  );
}

export function CheckboxOptions({
  form,
  name,
  options,
}: {
  form: any;
  name: string;
  options: { id: string; label: string }[];
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {options.map((opt) => (
              <FormItem key={opt.id} className="flex items-start gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value?.includes(opt.id)}
                    onCheckedChange={(checked) =>
                      checked
                        ? field.onChange([...(field.value || []), opt.id])
                        : field.onChange(
                            (field.value || []).filter((v: string) => v !== opt.id),
                          )
                    }
                  />
                </FormControl>
                <FormLabel className="font-normal leading-snug">{opt.label}</FormLabel>
              </FormItem>
            ))}
          </div>
        </FormItem>
      )}
    />
  );
}

export function NumField({
  form,
  name,
  label,
  className,
}: {
  form: any;
  name: string;
  label: string;
  className?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input type="number" step="any" {...field} value={field.value ?? ''} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

export function TextField({
  form,
  name,
  label,
  className,
  placeholder,
  onBlur,
}: {
  form: any;
  name: string;
  label: string;
  className?: string;
  placeholder?: string;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              placeholder={placeholder}
              {...field}
              value={field.value ?? ''}
              onBlur={(e) => {
                field.onBlur();
                onBlur?.(e);
              }}
            />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

const tiposArmazenamentoResiduo = [
  { id: 'silos_metalicos', label: 'Silos metálicos (m³)' },
  { id: 'baias_concreto', label: 'Baias de concreto (m³)' },
  { id: 'area_aberta_impermeabilizado', label: 'Área aberta com piso impermeabilizado (m³)' },
  { id: 'area_aberta_in_natura', label: 'Área aberta com no solo in natura (m³)' },
  { id: 'area_coberta_impermeabilizado', label: 'Área coberta com piso impermeabilizado (m³)' },
  { id: 'area_coberta_in_natura', label: 'Área coberta com piso in natura (m³)' },
  { id: 'outros', label: 'Outros (m³). Especificar' },
];

const destinosFinaisResiduo = [
  { id: 'bota_fora', label: 'Bota fora / aterros não legalizados' },
  { id: 'aterro_legalizado', label: 'Aterros industriais legalizados' },
  { id: 'recuperacao_empresas', label: 'Recuperação em empresas especializadas e posterior retorno' },
  { id: 'industria_cimento', label: 'Indústria de cimento' },
  { id: 'reciclagem', label: 'Reciclagem – fabricação de outros produtos. Especificar' },
  { id: 'outros', label: 'Outros. Especificar' },
];

export function DisposicaoTemporariaResiduo({
  form,
  basePath,
}: {
  form: any;
  basePath: string;
}) {
  const possui = form.watch(`${basePath}.possuiDisposicaoTemporaria`);

  return (
    <>
      <FormField
        control={form.control}
        name={`${basePath}.possuiDisposicaoTemporaria`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Existe sistema de disposição temporária na área do empreendimento?</FormLabel>
            <FormControl>
              <BooleanRadio value={field.value} onChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />
      {possui && (
        <div className="space-y-4 rounded-md border p-3">
          <p className="text-sm font-medium">Tipos de armazenamento (informar volume em m³)</p>
          {tiposArmazenamentoResiduo.map((tipo) => (
            <NumField
              key={tipo.id}
              form={form}
              name={`${basePath}.armazenamento.${tipo.id}`}
              label={tipo.label}
            />
          ))}
          <CheckboxOptions form={form} name={`${basePath}.destinoFinal`} options={destinosFinaisResiduo} />
          <TextField
            form={form}
            name={`${basePath}.destinosQuantidadeTmes`}
            label="Identificar destinos e quantidade (T/mês)"
          />
          <CheckboxOptions
            form={form}
            name={`${basePath}.classificacaoAbnt`}
            options={[
              { id: 'classe_i', label: 'Classe I' },
              { id: 'classe_ii_a', label: 'Classe II A' },
              { id: 'classe_ii_b', label: 'Classe II B' },
            ]}
          />
          <TextField
            form={form}
            name={`${basePath}.composicaoQuimicaPercentual`}
            label="Composição química do resíduo (%)"
          />
        </div>
      )}
    </>
  );
}

export function CaracterizacaoEfluenteAntesDepois({
  form,
  basePath,
  parametrosAntes,
  parametrosDepois,
}: {
  form: any;
  basePath: string;
  parametrosAntes: string[];
  parametrosDepois: string[];
}) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="space-y-2 rounded-md border p-3">
        <p className="text-sm font-medium">Caracterização antes do tratamento</p>
        {parametrosAntes.map((p) => (
          <TextField
            key={p}
            form={form}
            name={`${basePath}.antes.${p.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase()}`}
            label={p}
          />
        ))}
      </div>
      <div className="space-y-2 rounded-md border p-3">
        <p className="text-sm font-medium">Caracterização após o tratamento</p>
        {parametrosDepois.map((p) => (
          <TextField
            key={p}
            form={form}
            name={`${basePath}.depois.${p.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase()}`}
            label={p}
          />
        ))}
      </div>
    </div>
  );
}

export function SituacaoRegularizacao({
  form,
  name,
  label,
}: {
  form: any;
  name: string;
  label: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <RadioGroup onValueChange={field.onChange} value={field.value} className="flex flex-wrap gap-4">
              {[
                { value: 'regularizada', label: 'Regularizada' },
                { value: 'em_analise', label: 'Em análise' },
                { value: 'nao_regularizada', label: 'Não regularizada' },
              ].map((opt) => (
                <FormItem key={opt.value} className="flex items-center gap-2">
                  <FormControl>
                    <RadioGroupItem value={opt.value} />
                  </FormControl>
                  <FormLabel className="font-normal">{opt.label}</FormLabel>
                </FormItem>
              ))}
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
}

export function TabelaLinhasFixas({
  form,
  basePath,
  linhas,
  colunas,
}: {
  form: any;
  basePath: string;
  linhas: { id: string; label: string }[];
  colunas: { key: string; label: string; type?: 'text' | 'number' }[];
}) {
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="p-2 text-left font-medium">Nome</th>
            {colunas.map((col) => (
              <th key={col.key} className="p-2 text-left font-medium">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha) => (
            <tr key={linha.id} className="border-b">
              <td className="p-2 align-top font-medium">{linha.label}</td>
              {colunas.map((col) => (
                <td key={col.key} className="p-2">
                  <FormField
                    control={form.control}
                    name={`${basePath}.${linha.id}.${col.key}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type={col.type === 'number' ? 'number' : 'text'}
                            step={col.type === 'number' ? 'any' : undefined}
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DetalhesControleEmissoes({ form, basePath }: { form: any; basePath: string }) {
  const campos = [
    { key: 'perdaCargaMmca', label: 'Perda de carga (mmca)' },
    { key: 'dimensoesM', label: 'Dimensões (m)' },
    { key: 'eficienciaControlePercent', label: 'Eficiência de controle (%)' },
    { key: 'potenciaVentiladorHp', label: 'Potência do ventilador (hp)' },
    { key: 'emissaoParticuladosMgNm3', label: 'Emissão de particulados (mg/Nm³)' },
    { key: 'vazaoGasNm3Min', label: 'Vazão de gás (Nm³/min)' },
  ];
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {campos.map((c) => (
        <TextField key={c.key} form={form} name={`${basePath}.${c.key}`} label={c.label} />
      ))}
      <FormField
        control={form.control}
        name={`${basePath}.outrosAspectos`}
        render={({ field }) => (
          <FormItem className="md:col-span-2">
            <FormLabel>Outros aspectos relevantes</FormLabel>
            <FormControl>
              <Textarea rows={3} {...field} />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
