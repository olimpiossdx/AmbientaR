
'use client';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCollection, useFirebase, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { Empreendedor, Project } from '@/lib/types';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { FirestorePermissionError } from '@/firebase/errors';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import {
  createInterventionChecklist,
  getChecklistStatusBadgeClass,
  getChecklistStatusLabel,
  IEF_INTERVENTION_REFERENCE_DOCS,
  INTERVENTION_SERVICE_LABEL,
  type InterventionChecklistItem,
} from '@/lib/intervention-checklist';
import { cleanEmptyValues, cn } from '@/lib/utils';
import { sanitizeStorageFileName, uploadFileToStorage } from '@/lib/storage-upload';
import {
  LicensingLocationalBlock,
  type LocationalAnalysisPayload,
} from '@/components/licensing/licensing-locational-block';

const services = [
  "Licenciamento ambiental",
  "Outorga",
  INTERVENTION_SERVICE_LABEL,
  "Reserva legal (Averbação, Compensação e/ou Relocação)",
  "Uso Insignificante"
];

type LicensingDoc = { id: string; label: string; checked: boolean; fileName?: string; fileUrl?: string };
type LicensingGrading = { porte: 'P' | 'M' | 'G'; potencial: 'P' | 'M' | 'G'; criterioLocacional: '0' | '1' | '2' };
type LicensingActivity = {
  id: string;
  codeGroup: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';
  subItem: string;
  description?: string;
  enterpriseSize?: number;
  sizeUnit?: 'ha' | 'm2' | 'un';
  autoPorte?: 'P' | 'M' | 'G';
  autoPotencial?: 'P' | 'M' | 'G';
};

const LICENSING_DOCS_TEMPLATE: Omit<LicensingDoc, 'checked' | 'fileName' | 'fileUrl'>[] = [
  { id: 'lic_req', label: 'Requerimento e FCE/FCEI' },
  { id: 'lic_doc_emp', label: 'Documentos do empreendedor (CPF/CNPJ e endereço)' },
  { id: 'lic_caract', label: 'Caracterização do empreendimento e atividade' },
  { id: 'lic_uso_solo', label: 'Comprovação de uso/ocupação do solo e zoneamento' },
  { id: 'lic_car_ambiental', label: 'CAR/regularidade ambiental da área (quando aplicável)' },
  { id: 'lic_art', label: 'ART e responsável técnico' },
  { id: 'lic_taxas', label: 'Comprovantes de taxas/emolumentos' },
  { id: 'lic_estudos', label: 'Estudos exigidos (RAS/PCA/RCA/EIA, conforme enquadramento)' },
];

const createLicensingDocs = (): LicensingDoc[] =>
  LICENSING_DOCS_TEMPLATE.map((doc) => ({ ...doc, checked: false }));

const LISTAGEM_CODES = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const;
const buildSubItems = (codeGroup: LicensingActivity['codeGroup']) =>
  Array.from({ length: 12 }, (_, idx) => `${codeGroup}-${String(idx + 1).padStart(2, '0')}`);
const createLicensingActivity = (): LicensingActivity => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  codeGroup: 'A',
  subItem: 'A-01',
  description: '',
  enterpriseSize: 0,
  sizeUnit: 'ha',
  autoPorte: 'P',
  autoPotencial: 'M',
});

const getAutoPorteFromSize = (size?: number): 'P' | 'M' | 'G' => {
  const value = Number(size || 0);
  if (value >= 1000) return 'G';
  if (value >= 100) return 'M';
  return 'P';
};

const getAutoPotencialFromCode = (codeGroup: LicensingActivity['codeGroup']): 'P' | 'M' | 'G' => {
  if (codeGroup === 'A' || codeGroup === 'B' || codeGroup === 'C') return 'G';
  if (codeGroup === 'D' || codeGroup === 'E' || codeGroup === 'F') return 'M';
  return 'P';
};

const classByMatrix: Record<'P' | 'M' | 'G', Record<'P' | 'M' | 'G', 1 | 3 | 4 | 5 | 6>> = {
  P: { P: 1, M: 1, G: 1 },
  M: { P: 1, M: 3, G: 5 },
  G: { P: 4, M: 5, G: 6 },
};

const getHighestRank = (value: 'P' | 'M' | 'G'): number => ({ P: 1, M: 2, G: 3 })[value];

const LicenciamentoCard = ({
  grading,
  activities,
  documents,
  uploadingDocId,
  onGradingChange,
  onActivityAdd,
  onActivityRemove,
  onActivityChange,
  onToggleDoc,
  onFileUpload,
  locationalSavedAnalysis,
  locationalManualLock,
  onLocationalManualLockChange,
  onLocationalSuggested,
}: {
  grading: LicensingGrading;
  activities: LicensingActivity[];
  documents: LicensingDoc[];
  uploadingDocId: string | null;
  onGradingChange: (next: Partial<LicensingGrading>) => void;
  onActivityAdd: () => void;
  onActivityRemove: (id: string) => void;
  onActivityChange: (id: string, next: Partial<LicensingActivity>) => void;
  onToggleDoc: (id: string, checked: boolean) => void;
  onFileUpload: (id: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  locationalSavedAnalysis: LocationalAnalysisPayload | null;
  locationalManualLock: boolean;
  onLocationalManualLockChange: (locked: boolean) => void;
  onLocationalSuggested: (payload: LocationalAnalysisPayload) => void;
}) => {
    const classe = classByMatrix[grading.porte][grading.potencial];
    const modalidade =
      classe <= 2
        ? 'LAS (Cadastro/RAS)'
        : classe <= 4
          ? grading.criterioLocacional === '2'
            ? 'LAC ou LAT (avaliar critério locacional)'
            : 'LAC'
          : 'LAT ou LAC2 (maior complexidade)';

    return (
      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Licenciamento Ambiental</CardTitle>
          <CardDescription>
            Fluxo organizado em Gradação do licenciamento (fase 1) e documentação (fase 2), considerando DN COPAM 217 e atualização da DN 258.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full" defaultValue={['item-1', 'item-2']}>
            <AccordionItem value="item-1">
              <AccordionTrigger>Fase 1 - Gradar Licenciamento</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <Label>Atividades da listagem (A-H)</Label>
                    <Button type="button" variant="outline" size="sm" onClick={onActivityAdd}>
                      Adicionar atividade
                    </Button>
                  </div>
                  {activities.map((activity, index) => (
                    <div key={activity.id} className="rounded-md border p-2 space-y-2">
                      <div className="text-xs text-muted-foreground">Atividade {index + 1}</div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Select
                          value={activity.codeGroup}
                          onValueChange={(value) =>
                            onActivityChange(activity.id, {
                              codeGroup: value as LicensingActivity['codeGroup'],
                              subItem: `${value}-01`,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Código (A-H)" />
                          </SelectTrigger>
                          <SelectContent>
                            {LISTAGEM_CODES.map((code) => (
                              <SelectItem key={code} value={code}>
                                Listagem {code}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select
                          value={activity.subItem}
                          onValueChange={(value) => onActivityChange(activity.id, { subItem: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Subitem" />
                          </SelectTrigger>
                          <SelectContent>
                            {buildSubItems(activity.codeGroup).map((sub) => (
                              <SelectItem key={sub} value={sub}>
                                {sub}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onActivityRemove(activity.id)}
                          disabled={activities.length <= 1}
                        >
                          Remover
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={activity.enterpriseSize ?? 0}
                          onChange={(event) =>
                            onActivityChange(activity.id, {
                              enterpriseSize: Number(event.target.value || 0),
                            })
                          }
                          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          placeholder="Tamanho do empreendimento"
                        />
                        <Select
                          value={activity.sizeUnit || 'ha'}
                          onValueChange={(value) => onActivityChange(activity.id, { sizeUnit: value as 'ha' | 'm2' | 'un' })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Unidade" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ha">ha</SelectItem>
                            <SelectItem value="m2">m²</SelectItem>
                            <SelectItem value="un">unidade</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline">Porte: {activity.autoPorte || 'P'}</Badge>
                          <Badge variant="outline">Potencial: {activity.autoPotencial || 'P'}</Badge>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={activity.description || ''}
                        onChange={(event) => onActivityChange(activity.id, { description: event.target.value })}
                        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                        placeholder="Descrição da atividade (opcional)"
                      />
                    </div>
                  ))}
                </div>
                <LicensingLocationalBlock
                  manualLock={locationalManualLock}
                  onManualLockChange={onLocationalManualLockChange}
                  savedAnalysis={locationalSavedAnalysis}
                  onSuggestedCriterio={onLocationalSuggested}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label>Porte (automático)</Label>
                    <div className="rounded-md border px-3 py-2 text-sm bg-muted/20">{grading.porte}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Potencial Poluidor (automático)</Label>
                    <div className="rounded-md border px-3 py-2 text-sm bg-muted/20">{grading.potencial}</div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lic-criterio-locacional">Critério Locacional</Label>
                    <Select value={grading.criterioLocacional} onValueChange={(value) => onGradingChange({ criterioLocacional: value as '0' | '1' | '2' })}>
                      <SelectTrigger id="lic-criterio-locacional">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0 - Sem critério</SelectItem>
                        <SelectItem value="1">1 - Médio</SelectItem>
                        <SelectItem value="2">2 - Alto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="mt-3 rounded-md border p-3 bg-muted/20">
                  <p className="text-sm">
                    Classe sugerida: <strong>{classe}</strong>
                  </p>
                  <p className="text-sm">
                    Modalidade sugerida: <strong>{modalidade}</strong>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Referência prática para triagem inicial. A confirmação final depende do enquadramento completo da atividade e critérios locacionais vigentes no SLA.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Fase 2 - Reunir Documentos</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div key={doc.id} className="rounded-md border p-2">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            id={doc.id}
                            checked={doc.checked}
                            onCheckedChange={(checked) => onToggleDoc(doc.id, !!checked)}
                          />
                          <Label htmlFor={doc.id} className="font-normal">
                            {doc.label}
                          </Label>
                        </div>
                        <input
                          type="file"
                          className="text-sm md:max-w-[320px]"
                          aria-label={`Carregar arquivo para ${doc.label}`}
                          onChange={(event) => onFileUpload(doc.id, event)}
                          disabled={uploadingDocId === doc.id}
                        />
                      </div>
                      {uploadingDocId === doc.id && <p className="text-xs text-muted-foreground mt-1">Enviando...</p>}
                      {doc.fileName && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Arquivo: {doc.fileName}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Fase 3 - Estudos Ambientais</AccordionTrigger>
              <AccordionContent>
                <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground text-sm">
                    Detalhar estudos por modalidade (RAS/PCA/RCA/EIA-RIMA).
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Fase 4 - Outros</AccordionTrigger>
              <AccordionContent>
                <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg">
                  <p className="text-muted-foreground text-sm">Outros campos e observações.</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    );
};

const OutorgaCard = () => (
  <Card>
    <CardHeader>
      <CardTitle>Detalhes da Outorga</CardTitle>
      <CardDescription>Preencha as informações específicas para a outorga de uso de água.</CardDescription>
    </CardHeader>
    <CardContent>
       <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">Campos do formulário de outorga aqui.</p>
      </div>
    </CardContent>
  </Card>
);

const ReservaLegalCard = () => (
    <Card>
        <CardHeader>
        <CardTitle>Detalhes da Reserva Legal</CardTitle>
        <CardDescription>Preencha as informações para o processo de reserva legal.</CardDescription>
        </CardHeader>
        <CardContent>
        <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Campos do formulário de reserva legal aqui.</p>
        </div>
        </CardContent>
    </Card>
);

const UsoInsignificanteCard = () => (
    <Card>
        <CardHeader>
        <CardTitle>Detalhes do Uso Insignificante</CardTitle>
        <CardDescription>Preencha as informações para o cadastro de uso insignificante.</CardDescription>
        </CardHeader>
        <CardContent>
        <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">Campos do formulário de uso insignificante aqui.</p>
        </div>
        </CardContent>
    </Card>
);


function NewRequestPageContent() {
    const router = useRouter();
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const [selectedEmpreendedor, setSelectedEmpreendedor] = React.useState('');
    const [selectedEmpreendimento, setSelectedEmpreendimento] = React.useState('');
    const [selectedServices, setSelectedServices] = React.useState<string[]>([]);
    const [interventionChecklist, setInterventionChecklist] = React.useState<InterventionChecklistItem[]>([]);
    const [uploadingChecklistItemId, setUploadingChecklistItemId] = React.useState<string | null>(null);
    const [licensingGrading, setLicensingGrading] = React.useState<LicensingGrading>({
        porte: 'P',
        potencial: 'P',
        criterioLocacional: '0',
    });
    const [licensingDocuments, setLicensingDocuments] = React.useState<LicensingDoc[]>(createLicensingDocs());
    const [licensingActivities, setLicensingActivities] = React.useState<LicensingActivity[]>([
        createLicensingActivity(),
    ]);
    const [uploadingLicensingDocId, setUploadingLicensingDocId] = React.useState<string | null>(null);
    const [licLocManual, setLicLocManual] = React.useState(false);
    const [licLocAnalysis, setLicLocAnalysis] = React.useState<LocationalAnalysisPayload | null>(null);
    const [loading, setLoading] = React.useState(false);

    const empreendedoresQuery = useMemoFirebase(() => firestore ? collection(firestore, 'empreendedores') : null, [firestore]);
    const { data: empreendedores, isLoading: isLoadingEmpreendedores } = useCollection<Empreendedor>(empreendedoresQuery);

    const projectsQuery = useMemoFirebase(() => firestore ? collection(firestore, 'projects') : null, [firestore]);
    const { data: allProjects, isLoading: isLoadingProjects } = useCollection<Project>(projectsQuery);

    const filteredProjects = React.useMemo(() => {
        if (!selectedEmpreendedor || !allProjects) return [];
        return allProjects.filter(p => p.empreendedorId === selectedEmpreendedor);
    }, [selectedEmpreendedor, allProjects]);
    
    React.useEffect(() => {
        setSelectedEmpreendimento('');
    }, [selectedEmpreendedor]);

    React.useEffect(() => {
        const hasInterventionService = selectedServices.includes(INTERVENTION_SERVICE_LABEL);
        if (hasInterventionService && interventionChecklist.length === 0) {
            setInterventionChecklist(createInterventionChecklist());
            return;
        }
        if (!hasInterventionService && interventionChecklist.length > 0) {
            setInterventionChecklist([]);
        }
    }, [selectedServices, interventionChecklist.length]);

    const updateChecklistStatus = (
        itemId: string,
        status: InterventionChecklistItem['status'],
    ) => {
        setInterventionChecklist((prev) =>
            prev.map((item) => (item.id === itemId ? { ...item, status } : item)),
        );
    };

    const handleChecklistFileUpload = async (
        itemId: string,
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const inputEl = event.currentTarget;
        const file = inputEl.files?.[0];
        inputEl.value = '';
        if (!file) return;
        const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png', 'webp'];
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        if (!allowedExtensions.includes(extension)) {
            toast({
                variant: 'destructive',
                title: 'Formato não permitido',
                description: 'Use PDF, Word, Excel ou imagem (JPG/PNG/WEBP).',
            });
            return;
        }

        try {
            setUploadingChecklistItemId(itemId);
            const safeName = sanitizeStorageFileName(file.name);
            const url = await uploadFileToStorage(
                file,
                `requests/intervencao/${Date.now()}-${itemId}-${safeName}`,
            );

            setInterventionChecklist((prev) =>
                prev.map((item) =>
                    item.id === itemId
                        ? {
                            ...item,
                            attachments: [
                                ...item.attachments,
                                { name: file.name, url, uploadedAt: new Date().toISOString() },
                            ],
                          }
                        : item,
                ),
            );
            toast({ title: 'Arquivo anexado', description: 'Checklist atualizado com sucesso.' });
        } catch {
            toast({
                variant: 'destructive',
                title: 'Falha no upload',
                description: 'Nao foi possivel anexar o arquivo deste item.',
            });
        } finally {
            setUploadingChecklistItemId(null);
        }
    };

    const handleServiceChange = (service: string) => {
        setSelectedServices(prev => 
            prev.includes(service) 
            ? prev.filter(s => s !== service) 
            : [...prev, service]
        );
    };

    const handleLicensingDocToggle = (id: string, checked: boolean) => {
        setLicensingDocuments((prev) => prev.map((doc) => (doc.id === id ? { ...doc, checked } : doc)));
    };
    const recomputeLicensingGrading = (activities: LicensingActivity[]) => {
        const porte = activities.reduce<'P' | 'M' | 'G'>((acc, activity) => {
            const next = getAutoPorteFromSize(activity.enterpriseSize);
            return getHighestRank(next) > getHighestRank(acc) ? next : acc;
        }, 'P');
        const potencial = activities.reduce<'P' | 'M' | 'G'>((acc, activity) => {
            const next = getAutoPotencialFromCode(activity.codeGroup);
            return getHighestRank(next) > getHighestRank(acc) ? next : acc;
        }, 'P');
        setLicensingGrading((prev) => ({ ...prev, porte, potencial }));
    };

    const handleLicensingActivityAdd = () => {
        setLicensingActivities((prev) => {
            const next = [...prev, createLicensingActivity()];
            recomputeLicensingGrading(next);
            return next;
        });
    };
    const handleLicensingActivityRemove = (id: string) => {
        setLicensingActivities((prev) => {
            const next = prev.length <= 1 ? prev : prev.filter((activity) => activity.id !== id);
            recomputeLicensingGrading(next);
            return next;
        });
    };
    const handleLocationalSuggested = React.useCallback(
        (payload: LocationalAnalysisPayload) => {
            setLicLocAnalysis(payload);
            if (!licLocManual) {
                setLicensingGrading((prev) => ({
                    ...prev,
                    criterioLocacional: payload.suggestedCriterio,
                }));
            }
        },
        [licLocManual],
    );

    const handleLicensingActivityChange = (id: string, next: Partial<LicensingActivity>) => {
        setLicensingActivities((prev) => {
            const updated = prev.map((activity) => {
                if (activity.id !== id) return activity;
                const merged = { ...activity, ...next };
                return {
                    ...merged,
                    autoPorte: getAutoPorteFromSize(merged.enterpriseSize),
                    autoPotencial: getAutoPotencialFromCode(merged.codeGroup),
                };
            });
            recomputeLicensingGrading(updated);
            return updated;
        });
    };

    const handleLicensingDocUpload = async (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
        const inputEl = event.currentTarget;
        const file = inputEl.files?.[0];
        inputEl.value = '';
        if (!file) return;
        try {
            setUploadingLicensingDocId(id);
            const safeName = sanitizeStorageFileName(file.name);
            const url = await uploadFileToStorage(file, `requests/licenciamento/${Date.now()}-${id}-${safeName}`);
            setLicensingDocuments((prev) =>
                prev.map((doc) => (doc.id === id ? { ...doc, fileName: file.name, fileUrl: url } : doc)),
            );
            toast({ title: 'Arquivo anexado', description: 'Documento de licenciamento atualizado.' });
        } catch {
            toast({ variant: 'destructive', title: 'Falha no upload', description: 'Não foi possível enviar o arquivo.' });
        } finally {
            setUploadingLicensingDocId(null);
        }
    };

    const isFormValid = selectedEmpreendedor && selectedEmpreendimento && selectedServices.length > 0;

    const handleCreateProcess = async () => {
        if (!isFormValid || !firestore) {
            toast({
                variant: 'destructive',
                title: 'Formulário incompleto',
                description: 'Por favor, preencha todos os campos para prosseguir.',
            });
            return;
        }

        setLoading(true);

        const newRequestData = {
            empreendedorId: selectedEmpreendedor,
            projectId: selectedEmpreendimento,
            services: selectedServices,
            status: 'Draft' as const,
            ...(selectedServices.includes(INTERVENTION_SERVICE_LABEL)
                ? { interventionChecklist }
                : {}),
            ...(selectedServices.includes('Licenciamento ambiental')
                ? {
                    licensingData: {
                        activities: licensingActivities.map((activity) => ({
                            ...activity,
                            autoPorte: getAutoPorteFromSize(activity.enterpriseSize),
                            autoPotencial: getAutoPotencialFromCode(activity.codeGroup),
                        })),
                        grading: {
                            ...licensingGrading,
                            classeSugerida:
                                classByMatrix[licensingGrading.porte][licensingGrading.potencial],
                            modalidadeSugerida:
                                (classByMatrix[licensingGrading.porte][licensingGrading.potencial] <= 2)
                                    ? 'LAS (Cadastro/RAS)'
                                    : (classByMatrix[licensingGrading.porte][licensingGrading.potencial] <= 4)
                                        ? (licensingGrading.criterioLocacional === '2'
                                            ? 'LAC ou LAT (avaliar critério locacional)'
                                            : 'LAC')
                                        : 'LAT ou LAC2 (maior complexidade)',
                        },
                        documents: licensingDocuments,
                        ...(licLocAnalysis ? { locationalAnalysis: licLocAnalysis } : {}),
                        criterioLocacionalManual: licLocManual,
                    },
                  }
                : {}),
        };

        const collectionRef = collection(firestore, 'requests');
        const cleaned = cleanEmptyValues(newRequestData);

        try {
            const docRef = await addDoc(collectionRef, {
                ...cleaned,
                createdAt: serverTimestamp(),
            });
            toast({
                title: 'Solicitação criada',
                description: 'Rascunho salvo. Continue o preenchimento na próxima tela.',
            });
            router.replace(`/requests/${docRef.id}/edit`);
        } catch (serverError: unknown) {
            console.error('Error creating request:', serverError);
            const message =
                serverError instanceof Error ? serverError.message : String(serverError);
            toast({
                variant: 'destructive',
                title: 'Não foi possível criar o processo',
                description: message,
            });
            const code =
                serverError && typeof serverError === 'object' && 'code' in serverError
                    ? String((serverError as { code?: string }).code)
                    : '';
            if (code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: 'requests',
                    operation: 'create',
                    requestResourceData: newRequestData,
                });
                errorEmitter.emit('permission-error', permissionError);
            }
        } finally {
            setLoading(false);
        }
    };
    
    const serviceCardMap: Record<string, React.ComponentType> = {
        "Outorga": OutorgaCard,
        "Reserva legal (Averbação, Compensação e/ou Relocação)": ReservaLegalCard,
        "Uso Insignificante": UsoInsignificanteCard
    };
    
    return (
        <div className="flex flex-col h-full">
            <PageHeader title="Nova Solicitação de Processo" />
            <main className="flex-1 overflow-auto p-4 md:p-6">
                <div className="max-w-4xl mx-auto space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Iniciar Novo Processo</CardTitle>
                            <CardDescription>Selecione o empreendedor, o empreendimento e os serviços requeridos para começar.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="empreendedor">Empreendedor</Label>
                                    <Select value={selectedEmpreendedor} onValueChange={setSelectedEmpreendedor} disabled={isLoadingEmpreendedores}>
                                        <SelectTrigger id="empreendedor">
                                            <SelectValue placeholder={isLoadingEmpreendedores ? "Carregando..." : "Selecione o empreendedor"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {empreendedores?.map(emp => (
                                                <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="empreendimento">Empreendimento</Label>
                                    <Select value={selectedEmpreendimento} onValueChange={setSelectedEmpreendimento} disabled={!selectedEmpreendedor || isLoadingProjects}>
                                        <SelectTrigger id="empreendimento">
                                            <SelectValue placeholder={!selectedEmpreendedor ? "Selecione um empreendedor primeiro" : "Selecione o empreendimento"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {filteredProjects.map(proj => (
                                                <SelectItem key={proj.id} value={proj.id}>{proj.propertyName}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2 pt-4">
                                <Label>Serviços Requeridos</Label>
                                <div className="space-y-2 rounded-md border p-4 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
                                    {services.map(service => (
                                        <div key={service} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={service} 
                                                checked={selectedServices.includes(service)}
                                                onCheckedChange={() => handleServiceChange(service)}
                                            />
                                            <Label htmlFor={service} className="font-normal cursor-pointer">{service}</Label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {selectedServices.length > 0 && (
                        <div className="space-y-6">
                            <Separator />
                            <h2 className="text-2xl font-semibold tracking-tight">Detalhes dos Serviços</h2>
                            {selectedServices.includes(INTERVENTION_SERVICE_LABEL) && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Detalhes da Intervenção Ambiental (AIA)</CardTitle>
                                        <CardDescription>
                                            Checklist de fases e documentos para o processo de AIA.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Accordion type="multiple" className="w-full">
                                            {Array.from(new Set(interventionChecklist.map((i) => i.phase))).map((phase) => (
                                                <AccordionItem key={phase} value={phase}>
                                                    <AccordionTrigger>{phase}</AccordionTrigger>
                                                    <AccordionContent>
                                                        <div className="space-y-2">
                                                            {interventionChecklist
                                                                .filter((item) => item.phase === phase)
                                                                .map((item) => (
                                                                    <div key={item.id} className="rounded-md border p-2">
                                                                        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                                                            <div className="flex items-start space-x-2">
                                                                                <Checkbox
                                                                                    id={item.id}
                                                                                    checked={item.status === 'completed'}
                                                                                    onCheckedChange={(checked) =>
                                                                                        updateChecklistStatus(
                                                                                            item.id,
                                                                                            checked ? 'completed' : 'not_started',
                                                                                        )
                                                                                    }
                                                                                />
                                                                                <div className="grid gap-1.5 leading-none">
                                                                                    <Label htmlFor={item.id} className="font-normal">
                                                                                        {item.title}
                                                                                    </Label>
                                                                                    <div className="flex items-center gap-2">
                                                                                        {!item.required && (
                                                                                            <Badge variant="outline">Opcional</Badge>
                                                                                        )}
                                                                                        <Badge
                                                                                            variant="outline"
                                                                                            className={cn(getChecklistStatusBadgeClass(item.status))}
                                                                                        >
                                                                                            {getChecklistStatusLabel(item.status)}
                                                                                        </Badge>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                            <div className="md:min-w-[250px]">
                                                                                <input
                                                                                    type="file"
                                                                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
                                                                                    aria-label={`Carregar arquivo para ${item.title}`}
                                                                                    onChange={(event) => handleChecklistFileUpload(item.id, event)}
                                                                                    disabled={uploadingChecklistItemId === item.id}
                                                                                    className="text-sm w-full"
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        {uploadingChecklistItemId === item.id && (
                                                                            <p className="text-xs text-muted-foreground mt-2">Enviando anexo...</p>
                                                                        )}
                                                                        {item.attachments.length > 0 && (
                                                                            <ul className="list-disc pl-5 text-xs text-muted-foreground mt-2">
                                                                                {item.attachments.map((att) => (
                                                                                    <li key={`${item.id}-${att.url}`}>
                                                                                        <a
                                                                                            href={att.url}
                                                                                            target="_blank"
                                                                                            rel="noopener noreferrer"
                                                                                            className="underline"
                                                                                        >
                                                                                            {att.name}
                                                                                        </a>
                                                                                    </li>
                                                                                ))}
                                                                            </ul>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium">Referências oficiais</Label>
                                            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                                                {IEF_INTERVENTION_REFERENCE_DOCS.map((doc) => (
                                                    <li key={doc.url}>
                                                        <a
                                                            href={doc.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="underline"
                                                        >
                                                            {doc.title} ({doc.type})
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                            {selectedServices.includes('Licenciamento ambiental') && (
                                <LicenciamentoCard
                                    grading={licensingGrading}
                                    activities={licensingActivities}
                                    documents={licensingDocuments}
                                    uploadingDocId={uploadingLicensingDocId}
                                    onGradingChange={(next) => setLicensingGrading((prev) => ({ ...prev, ...next }))}
                                    onActivityAdd={handleLicensingActivityAdd}
                                    onActivityRemove={handleLicensingActivityRemove}
                                    onActivityChange={handleLicensingActivityChange}
                                    onToggleDoc={handleLicensingDocToggle}
                                    onFileUpload={handleLicensingDocUpload}
                                    locationalSavedAnalysis={licLocAnalysis}
                                    locationalManualLock={licLocManual}
                                    onLocationalManualLockChange={setLicLocManual}
                                    onLocationalSuggested={handleLocationalSuggested}
                                />
                            )}
                            {selectedServices
                              .filter((service) => service !== INTERVENTION_SERVICE_LABEL && service !== 'Licenciamento ambiental')
                              .map(service => {
                                const ServiceCard = serviceCardMap[service];
                                return ServiceCard ? <ServiceCard key={service} /> : null;
                            })}
                        </div>
                    )}
                    
                    <div className="flex justify-end gap-4 mt-6">
                        <Button variant="outline" onClick={() => router.back()}>Cancelar</Button>
                        <Button onClick={handleCreateProcess} disabled={!isFormValid || loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Criar Processo
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default function NewRequestPage() {
    return (
        <React.Suspense fallback={<div>Carregando...</div>}>
            <NewRequestPageContent />
        </React.Suspense>
    );
}
