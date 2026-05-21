'use client';



import * as React from 'react';

import { useFormContext } from 'react-hook-form';

import {

  FormControl,

  FormField,

  FormItem,

  FormLabel,

  FormMessage,

} from '@/components/ui/form';

import { Textarea } from '@/components/ui/textarea';

import {

  Select,

  SelectContent,

  SelectItem,

  SelectTrigger,

  SelectValue,

} from '@/components/ui/select';

import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

import {

  CHECKLIST_STATUS_LABELS,

  type ChecklistItemStatus,

} from '@/lib/field-inspection-checklist';

import { InspectionAttachmentList } from './inspection-attachment-list';



const STATUSES: ChecklistItemStatus[] = [

  'conforme',

  'nao_conforme',

  'nao_aplicavel',

  'nao_verificado',

];



type Props = {

  index: number;

  label: string;

  maxImages: number;

  limitLabel: string;

  uploading: boolean;

  onAttach: (
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
    onUrlsChange: (urls: string[]) => void,
    currentUrls: string[],
  ) => void;

};



export function InspectionChecklistItem({

  index,

  label,

  maxImages,

  limitLabel,

  uploading,

  onAttach,

}: Props) {

  const form = useFormContext();

  const status = form.watch(`checklistResponses.${index}.status`) as ChecklistItemStatus;

  const showNc = status === 'nao_conforme';



  return (

    <div className="rounded-lg border bg-card p-3 sm:p-4 space-y-3 shadow-sm">

      <p className="text-sm font-medium leading-snug pr-1">{label}</p>



      <FormField

        control={form.control}

        name={`checklistResponses.${index}.status`}

        render={({ field }) => (

          <FormItem>

            <FormLabel className="sr-only">Situação</FormLabel>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">

              {STATUSES.map((s) => (

                <Button

                  key={s}

                  type="button"

                  variant={field.value === s ? 'default' : 'outline'}

                  size="sm"

                  className={cn(

                    'h-10 min-h-10 text-xs sm:text-sm whitespace-normal text-center leading-tight px-2',

                  )}

                  onClick={() => field.onChange(s)}

                >

                  {CHECKLIST_STATUS_LABELS[s]}

                </Button>

              ))}

            </div>

            <FormMessage />

          </FormItem>

        )}

      />



      {showNc ? (

        <div className="space-y-3 rounded-md border border-destructive/20 bg-destructive/5 p-3">

          <FormField

            control={form.control}

            name={`checklistResponses.${index}.criticality`}

            render={({ field }) => (

              <FormItem>

                <FormLabel>Criticidade</FormLabel>

                <Select onValueChange={field.onChange} value={field.value || 'Média'}>

                  <FormControl>

                    <SelectTrigger className="h-10">

                      <SelectValue placeholder="Nível" />

                    </SelectTrigger>

                  </FormControl>

                  <SelectContent>

                    {['Baixa', 'Média', 'Alta', 'Urgente'].map((level) => (

                      <SelectItem key={level} value={level}>

                        {level}

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

            name={`checklistResponses.${index}.observations`}

            render={({ field }) => (

              <FormItem>

                <FormLabel>Observação do item</FormLabel>

                <FormControl>

                  <Textarea className="min-h-[3.5rem] resize-y" {...field} />

                </FormControl>

              </FormItem>

            )}

          />



          <FormField
            control={form.control}
            name={`checklistResponses.${index}.imageUrls`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fotos / anexos</FormLabel>
                <InspectionAttachmentList
                  urls={field.value ?? []}
                  maxFiles={maxImages}
                  limitLabel={limitLabel}
                  uploading={uploading}
                  onFilesSelected={(e) =>
                    onAttach(index, e, field.onChange, field.value ?? [])
                  }
                  onRemove={(uidx) => {
                    const cur = [...(field.value ?? [])];
                    cur.splice(uidx, 1);
                    field.onChange(cur);
                  }}
                />
              </FormItem>
            )}
          />

        </div>

      ) : null}

    </div>

  );

}

