
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { BrDateFormControl } from '@/components/form/br-date-input';
import { useToast } from '@/hooks/use-toast';
import type { ManualMonitoringLog } from '@/lib/types';
import type { WaterPermit, TelemetryReading } from '@/lib/types';
import { useFirebase, errorEmitter } from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { collection, doc, addDoc, updateDoc } from 'firebase/firestore';
import { DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { calculateWaterCompliance, mapManualLogToTelemetryReading } from "@/lib/water-compliance-engine";

const formSchema = z.object({
  logDate: z.date({ required_error: 'A data é obrigatória.' }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:mm)."),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato de hora inválido (HH:mm)."),
  flowRateLps: z.coerce.number().positive('A vazão deve ser um número positivo.'),
  flowRateM3h: z.coerce.number().positive('A vazão deve ser um número positivo.'),
  horimeterStart: z.coerce.number().nonnegative('O horímetro deve ser um número não negativo.'),
  horimeterEnd: z.coerce.number().nonnegative('O horímetro deve ser um número não negativo.'),
}).refine(data => data.horimeterEnd >= data.horimeterStart, {
    message: 'O horímetro final deve ser maior ou igual ao inicial.',
    path: ['horimeterEnd'],
});

type FormValues = z.infer<typeof formSchema>;

interface MonitoringFormProps {
  currentItem?: ManualMonitoringLog | null;
  outorgaId: string;
  pontoId: string;
  permit?: WaterPermit | null;
  existingReadings?: TelemetryReading[];
  onSuccess?: () => void;
}

export function MonitoringForm({
  currentItem,
  outorgaId,
  pontoId,
  permit,
  existingReadings = [],
  onSuccess,
}: MonitoringFormProps) {
  const [loading, setLoading] = React.useState(false);
  const { toast } = useToast();
  const { firestore, user } = useFirebase();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      logDate: currentItem ? new Date(currentItem.logDate) : new Date(),
      startTime: currentItem?.startTime || '',
      endTime: currentItem?.endTime || '',
      flowRateLps: currentItem?.flowRateLps || 0,
      flowRateM3h: currentItem?.flowRateM3h || 0,
      horimeterStart: currentItem?.horimeterStart || 0,
      horimeterEnd: currentItem?.horimeterEnd || 0,
    },
  });
  const watchedValues = form.watch();

  const compliancePreview = React.useMemo(() => {
    if (!permit) return null;
    const simulated: ManualMonitoringLog = {
      id: currentItem?.id || "preview",
      outorgaId,
      pontoId,
      logDate: watchedValues.logDate ? watchedValues.logDate.toISOString() : new Date().toISOString(),
      startTime: watchedValues.startTime || "00:00",
      endTime: watchedValues.endTime || "00:00",
      flowRateLps: Number(watchedValues.flowRateLps || 0),
      flowRateM3h: Number(watchedValues.flowRateM3h || 0),
      horimeterStart: Number(watchedValues.horimeterStart || 0),
      horimeterEnd: Number(watchedValues.horimeterEnd || 0),
      userId: user?.uid || "",
      createdAt: null as any,
    };
    return calculateWaterCompliance(
      [...existingReadings, mapManualLogToTelemetryReading(simulated)],
      permit,
      watchedValues.logDate || new Date(),
    );
  }, [permit, currentItem, outorgaId, pontoId, watchedValues, existingReadings, user?.uid]);

  async function onSubmit(values: FormValues) {
    setLoading(true);

    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Erro de autenticação.' });
      setLoading(false);
      return;
    }
    
    const dataToSave = {
        ...values,
        logDate: values.logDate.toISOString(),
        outorgaId,
        pontoId,
        userId: user.uid,
    };

    if (currentItem) {
      const docRef = doc(firestore, 'manualMonitoringLogs', currentItem.id);
      updateDoc(docRef, dataToSave)
        .then(() => {
          toast({ title: 'Lançamento atualizado!', description: 'O registro foi salvo com sucesso.' });
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({ path: docRef.path, operation: 'update', requestResourceData: dataToSave });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    } else {
      const collectionRef = collection(firestore, 'manualMonitoringLogs');
      addDoc(collectionRef, dataToSave)
        .then(() => {
          toast({ title: 'Lançamento criado!', description: `O registro para ${format(values.logDate, "PPP", { locale: ptBR })} foi criado.` });
          form.reset();
          onSuccess?.();
        })
        .catch(async (serverError) => {
          const permissionError = new FirestorePermissionError({ path: collectionRef.path, operation: 'create', requestResourceData: dataToSave });
          errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => setLoading(false));
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{currentItem ? 'Editar Lançamento' : 'Novo Lançamento de Monitoramento'}</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="h-full flex flex-col overflow-hidden">
          <div className="form-scroll-body space-y-4">
          <FormField
              control={form.control}
              name="logDate"
              render={({ field }) => (
                  <FormItem className="flex flex-col">
                  <FormLabel>Data do Lançamento</FormLabel>
                  <FormControl>
                    <BrDateFormControl
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      asDate
                    />
                  </FormControl>
                  <FormMessage />
                  </FormItem>
              )}
          />
          <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="startTime" render={({ field }) => (<FormItem><FormLabel>Hora que ligou</FormLabel><FormControl><Input placeholder="HH:mm" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="endTime" render={({ field }) => (<FormItem><FormLabel>Hora que desligou</FormLabel><FormControl><Input placeholder="HH:mm" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
           <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="horimeterStart" render={({ field }) => (<FormItem><FormLabel>Horímetro Início</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="horimeterEnd" render={({ field }) => (<FormItem><FormLabel>Horímetro Fim</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
           <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="flowRateLps" render={({ field }) => (<FormItem><FormLabel>Vazão (L/s)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="flowRateM3h" render={({ field }) => (<FormItem><FormLabel>Vazão (m³/h)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
          </div>
          {compliancePreview && (
            <div className={cn("rounded-lg border p-3", compliancePreview.isExceeded ? "border-red-400 bg-red-50" : "border-green-400 bg-green-50")}>
              <p className="text-sm font-medium mb-1 flex items-center gap-2">
                {compliancePreview.isExceeded ? (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                )}
                Análise de impacto do lançamento
              </p>
              <p className="text-sm">
                Uso estimado no mês: <strong>{compliancePreview.usagePercentage.toFixed(2)}%</strong>
              </p>
              {compliancePreview.alerts.slice(0, 3).map((alert, idx) => (
                <p key={`${alert.type}-${idx}`} className="text-xs text-red-700 mt-1">
                  - {alert.message}
                </p>
              ))}
            </div>
          )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onSuccess}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
