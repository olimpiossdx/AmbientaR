'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, doc, updateDoc } from 'firebase/firestore';
import type { Client, Project } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FileText, Upload, Map as MapIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { FirestorePermissionError } from '@/firebase/errors';

export default function CarPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const [clientId, setClientId] = React.useState('');
  const [projectId, setProjectId] = React.useState('');
  const [receiptNumber, setReceiptNumber] = React.useState('');
  const [pdfUrl, setPdfUrl] = React.useState('');
  const [shpUrl, setShpUrl] = React.useState('');
  const [uploadingPdf, setUploadingPdf] = React.useState(false);
  const [uploadingShp, setUploadingShp] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const clientsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'clients') : null),
    [firestore],
  );
  const projectsQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'projects') : null),
    [firestore],
  );

  const { data: clients, isLoading: loadingClients } = useCollection<Client>(clientsQuery);
  const { data: projects, isLoading: loadingProjects } = useCollection<Project>(projectsQuery);

  const clientsMap = React.useMemo(
    () => new Map(clients?.map((c) => [c.id, c]) ?? []),
    [clients],
  );

  const projectsWithCar = React.useMemo(
    () => (projects ?? []).filter((p) => !!p.car),
    [projects],
  );

  const handlePdfChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !firestore) return;

    if (file.type !== 'application/pdf') {
      toast({
        variant: 'destructive',
        title: 'Tipo de arquivo inválido',
        description: 'Envie um arquivo em PDF para o recibo do CAR.',
      });
      return;
    }

    try {
      setUploadingPdf(true);
      const storage = getStorage();
      const storageRef = ref(storage, `car/${Date.now()}-${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(uploadResult.ref);
      setPdfUrl(url);
      toast({ title: 'Recibo enviado', description: 'O PDF foi carregado com sucesso.' });
    } catch (error) {
      console.error('Erro ao enviar PDF do CAR:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no upload',
        description: 'Não foi possível enviar o PDF do CAR.',
      });
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleShpChange: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !firestore) return;

    try {
      setUploadingShp(true);
      const storage = getStorage();
      const storageRef = ref(storage, `car-shp/${Date.now()}-${file.name}`);
      const uploadResult = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(uploadResult.ref);
      setShpUrl(url);
      toast({ title: 'Arquivo de geometria enviado', description: 'O arquivo SHP/ZIP foi carregado.' });
    } catch (error) {
      console.error('Erro ao enviar SHP do CAR:', error);
      toast({
        variant: 'destructive',
        title: 'Erro no upload',
        description: 'Não foi possível enviar o arquivo de geometria.',
      });
    } finally {
      setUploadingShp(false);
    }
  };

  const handleSave = async () => {
    if (!firestore || !user) {
      toast({ variant: 'destructive', title: 'Erro de autenticação.' });
      return;
    }
    if (!projectId) {
      toast({ variant: 'destructive', title: 'Selecione o empreendimento (fazenda).' });
      return;
    }
    if (!receiptNumber.trim()) {
      toast({ variant: 'destructive', title: 'Informe o número do recibo do CAR.' });
      return;
    }
    if (!pdfUrl) {
      toast({
        variant: 'destructive',
        title: 'Envie o PDF do CAR.',
        description: 'O recibo em PDF é obrigatório para salvar o registro.',
      });
      return;
    }

    setSaving(true);
    const projectRef = doc(firestore, 'projects', projectId);

    const carData = {
      clientId: clientId || undefined,
      receiptNumber: receiptNumber.trim(),
      pdfUrl,
      shpUrl: shpUrl || undefined,
    };

    try {
      await updateDoc(projectRef, { car: carData });
      toast({
        title: 'CAR salvo com sucesso',
        description: 'O cadastro ambiental rural foi vinculado ao empreendimento.',
      });
      setReceiptNumber('');
      setPdfUrl('');
      setShpUrl('');
    } catch (error: any) {
      console.error('Erro ao salvar CAR no projeto:', error);
      const permissionError = new FirestorePermissionError({
        path: projectRef.path,
        operation: 'update',
        requestResourceData: { car: carData },
      });
      errorEmitter.emit('permission-error', permissionError);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Verifique suas permissões de escrita para empreendimentos.',
      });
    } finally {
      setSaving(false);
    }
  };

  const isLoading = loadingClients || loadingProjects;

  return (
    <div className="flex flex-col h-full">
      <PageHeader title="Cadastro Ambiental Rural (CAR)" />
      <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Vincular CAR a Empreendimento</CardTitle>
            <CardDescription>
              Suba o recibo do CAR em PDF e o arquivo de geometria (SHP/ZIP), vinculando ao cliente e à fazenda.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-64" />
              </div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Cliente (opcional)</Label>
                    <Select
                      value={clientId}
                      onValueChange={setClientId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cliente proprietário" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} — {c.cpfCnpj}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Empreendimento / Fazenda</Label>
                    <Select
                      value={projectId}
                      onValueChange={setProjectId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o empreendimento" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects?.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.propertyName} {p.municipio ? `— ${p.municipio}/${p.uf}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Número do Recibo do CAR</Label>
                    <Input
                      value={receiptNumber}
                      onChange={(e) => setReceiptNumber(e.target.value)}
                      placeholder="Ex: MG-1234-5678-9012"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Recibo / Documento em PDF</Label>
                    <Input
                      type="file"
                      accept="application/pdf"
                      onChange={handlePdfChange}
                      disabled={uploadingPdf}
                    />
                    {uploadingPdf && (
                      <p className="text-xs text-muted-foreground">Enviando PDF do CAR...</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Arquivo de Geometria (SHP ou ZIP)</Label>
                  <Input
                    type="file"
                    accept=".zip,.shp"
                    onChange={handleShpChange}
                    disabled={uploadingShp}
                  />
                  {uploadingShp && (
                    <p className="text-xs text-muted-foreground">Enviando arquivo de geometria...</p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={saving || uploadingPdf || uploadingShp}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar CAR'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registros de CAR por Empreendimento</CardTitle>
            <CardDescription>
              Consulte rapidamente quais fazendas já possuem CAR vinculado, com acesso aos arquivos enviados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Empreendimento</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Nº Recibo CAR</TableHead>
                    <TableHead className="text-right">Anexos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingProjects && (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  )}
                  {!loadingProjects && projectsWithCar.map((p) => {
                    const car = p.car!;
                    const client = car.clientId ? clientsMap.get(car.clientId) : undefined;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">
                          {p.propertyName} {p.municipio ? `— ${p.municipio}/${p.uf}` : ''}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {client ? `${client.name} — ${client.cpfCnpj}` : 'Não vinculado'}
                        </TableCell>
                        <TableCell>{car.receiptNumber}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {car.pdfUrl && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button asChild variant="ghost" size="icon">
                                    <a href={car.pdfUrl} target="_blank" rel="noopener noreferrer">
                                      <FileText className="h-4 w-4" />
                                      <span className="sr-only">Ver recibo PDF</span>
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Abrir recibo em PDF</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                            {car.shpUrl && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button asChild variant="ghost" size="icon">
                                    <a href={car.shpUrl} target="_blank" rel="noopener noreferrer">
                                      <MapIcon className="h-4 w-4" />
                                      <span className="sr-only">Baixar geometria</span>
                                    </a>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Baixar arquivo SHP/ZIP</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {!loadingProjects && projectsWithCar.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        Nenhum empreendimento possui CAR vinculado ainda.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TooltipProvider>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

