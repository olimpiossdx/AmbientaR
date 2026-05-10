'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, ArrowUp, ArrowDown, Trash2, CheckSquare, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  deleteFileAtStoragePath,
  storagePathFromDownloadUrl,
  uploadFileToStorage,
  sanitizeStorageFileName,
} from '@/lib/storage-upload';

type StoredPhoto = {
  id: string;
  name: string;
  url: string;
  /** Path no bucket; ausente em dados legados (URL local). */
  storagePath?: string;
};

type DisplayPhoto = StoredPhoto & {
  selected: boolean;
};

interface ProjectPhotosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  initialSelectedPhotoIds?: string[];
  initialPhotoOrder?: string[];
  onSaveSelection: (payload: { selectedPhotoIds: string[]; photoOrder: string[] }) => Promise<void>;
}

function applySavedOrderAndSelection(
  files: StoredPhoto[],
  selectedIds: string[] = [],
  orderedIds: string[] = []
): DisplayPhoto[] {
  const selectedSet = new Set(selectedIds);
  const fileMap = new Map(files.map((file) => [file.id, file]));

  const fromOrder = orderedIds
    .map((id) => fileMap.get(id))
    .filter((v): v is StoredPhoto => Boolean(v))
    .map((file) => ({ ...file, selected: selectedSet.has(file.id) }));

  const rest = files
    .filter((file) => !orderedIds.includes(file.id))
    .map((file) => ({ ...file, selected: selectedSet.has(file.id) }));

  return [...fromOrder, ...rest];
}

const PHOTOS_DOC = (firestore: import('firebase/firestore').Firestore, projectId: string) =>
  doc(firestore, 'inventoryProjectPhotos', projectId);

export function ProjectPhotosDialog({
  open,
  onOpenChange,
  projectId,
  initialSelectedPhotoIds,
  initialPhotoOrder,
  onSaveSelection,
}: ProjectPhotosDialogProps) {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [photos, setPhotos] = React.useState<DisplayPhoto[]>([]);
  const [activePhotoId, setActivePhotoId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [removingId, setRemovingId] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const activePhoto = React.useMemo(
    () => photos.find((photo) => photo.id === activePhotoId) ?? photos[0] ?? null,
    [photos, activePhotoId]
  );

  const selectedCount = React.useMemo(
    () => photos.reduce((acc, photo) => (photo.selected ? acc + 1 : acc), 0),
    [photos]
  );

  const loadPhotos = React.useCallback(async () => {
    if (!firestore) return;
    setIsLoading(true);
    try {
      const snap = await getDoc(PHOTOS_DOC(firestore, projectId));
      const list = (snap.data()?.photos as StoredPhoto[] | undefined) ?? [];
      const merged = applySavedOrderAndSelection(
        list,
        initialSelectedPhotoIds ?? [],
        initialPhotoOrder ?? []
      );
      setPhotos(merged);
      if (merged.length) setActivePhotoId((prev) => prev ?? merged[0].id);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar fotos',
        description: (error as Error).message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [initialPhotoOrder, initialSelectedPhotoIds, projectId, toast, firestore]);

  React.useEffect(() => {
    if (!open) return;
    void loadPhotos();
  }, [open, loadPhotos]);

  const togglePhoto = (id: string, selected: boolean) => {
    setPhotos((prev) => prev.map((photo) => (photo.id === id ? { ...photo, selected } : photo)));
  };

  const toggleSelectAll = () => {
    const shouldSelectAll = selectedCount !== photos.length;
    setPhotos((prev) => prev.map((photo) => ({ ...photo, selected: shouldSelectAll })));
  };

  const movePhoto = (id: string, direction: 'up' | 'down') => {
    setPhotos((prev) => {
      const index = prev.findIndex((photo) => photo.id === id);
      if (index < 0) return prev;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, item);
      return copy;
    });
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length || !firestore) return;

    setIsUploading(true);
    try {
      const refDoc = PHOTOS_DOC(firestore, projectId);
      const snap = await getDoc(refDoc);
      const current: StoredPhoto[] = (snap.data()?.photos as StoredPhoto[] | undefined) ?? [];
      const newItems: StoredPhoto[] = [];

      for (const file of files) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        const safe = sanitizeStorageFileName(file.name);
        const storagePath = `inventory-project-photos/${projectId}/${id}-${safe}`;
        const url = await uploadFileToStorage(file, storagePath);
        newItems.push({ id, name: file.name, url, storagePath });
      }

      const next = [...current, ...newItems];
      await setDoc(
        refDoc,
        { photos: next, updatedAt: serverTimestamp() },
        { merge: true }
      );

      await loadPhotos();
      toast({
        title: 'Fotos carregadas',
        description: `${files.length} arquivo(s) enviado(s) com sucesso.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro no upload',
        description: (error as Error).message,
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsUploading(false);
    }
  };

  const handleRemove = async (fileId: string) => {
    if (!firestore) return;
    setRemovingId(fileId);
    try {
      const refDoc = PHOTOS_DOC(firestore, projectId);
      const snap = await getDoc(refDoc);
      const list: StoredPhoto[] = (snap.data()?.photos as StoredPhoto[] | undefined) ?? [];
      const target = list.find((p) => p.id === fileId);
      const pathToDelete = target?.storagePath ?? (target?.url ? storagePathFromDownloadUrl(target.url) : null);
      if (pathToDelete) {
        try {
          await deleteFileAtStoragePath(pathToDelete);
        } catch {
          /* objeto pode já ter sido apagado */
        }
      }
      const next = list.filter((p) => p.id !== fileId);
      await setDoc(refDoc, { photos: next, updatedAt: serverTimestamp() }, { merge: true });
      setPhotos((prev) => prev.filter((photo) => photo.id !== fileId));
      setActivePhotoId((prev) => (prev === fileId ? null : prev));
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao remover foto',
        description: (error as Error).message,
      });
    } finally {
      setRemovingId(null);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const selectedPhotoIds = photos.filter((photo) => photo.selected).map((photo) => photo.id);
      const photoOrder = photos.map((photo) => photo.id);
      await onSaveSelection({ selectedPhotoIds, photoOrder });
      toast({
        title: 'Sequência salva',
        description: 'As fotos selecionadas e a ordem foram salvas para compor o estudo.',
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar seleção',
        description: (error as Error).message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-4 py-3 border-b">
          <DialogTitle>Fotos do Projeto</DialogTitle>
          <DialogDescription>
            Carregue imagens, visualize em miniatura e em tamanho maior, selecione as fotos e ajuste a sequência para compor o estudo.
            Armazenamento na nuvem (Firebase Storage).
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 py-3 border-b flex flex-wrap items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="max-w-sm"
            onChange={handleUpload}
            disabled={isUploading}
          />
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Carregar fotos
          </Button>
          <Button type="button" variant="secondary" onClick={toggleSelectAll} disabled={!photos.length}>
            {selectedCount === photos.length && photos.length > 0 ? (
              <CheckSquare className="h-4 w-4 mr-2" />
            ) : (
              <Square className="h-4 w-4 mr-2" />
            )}
            {selectedCount === photos.length && photos.length > 0 ? 'Desmarcar todas' : 'Selecionar todas'}
          </Button>
          <span className="text-sm text-muted-foreground ml-auto">
            {selectedCount} selecionada(s) de {photos.length}
          </span>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 border-r p-3">
            <div className="h-full border rounded-sm bg-muted/20 flex items-center justify-center">
              {activePhoto ? (
                <div className="relative h-full w-full">
                  <Image src={activePhoto.url} alt={activePhoto.name} fill className="object-contain p-2" />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma foto para visualizar.</p>
              )}
            </div>
          </div>

          <div className="p-3">
            <Label className="text-sm font-semibold">Miniaturas e sequência</Label>
            <ScrollArea className="h-[calc(90vh-250px)] mt-2 border rounded-sm">
              <div className="p-2 space-y-2">
                {isLoading && (
                  <div className="h-20 flex items-center justify-center text-muted-foreground text-sm">Carregando fotos...</div>
                )}

                {!isLoading && !photos.length && (
                  <div className="h-20 flex items-center justify-center text-muted-foreground text-sm">Nenhuma foto carregada.</div>
                )}

                {!isLoading &&
                  photos.map((photo, index) => (
                    <div
                      key={photo.id}
                      className={`border rounded-sm p-2 ${activePhoto?.id === photo.id ? 'border-primary' : 'border-border'}`}
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={photo.selected}
                          onCheckedChange={(checked) => togglePhoto(photo.id, Boolean(checked))}
                          className="mt-1"
                        />
                        <button
                          type="button"
                          onClick={() => setActivePhotoId(photo.id)}
                          className="relative h-14 w-20 overflow-hidden rounded-sm border bg-muted/20"
                        >
                          <Image src={photo.url} alt={photo.name} fill className="object-cover" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs truncate">{photo.name}</p>
                          <p className="text-[11px] text-muted-foreground">Posição {index + 1}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => movePhoto(photo.id, 'up')}>
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => movePhoto(photo.id, 'down')}>
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => void handleRemove(photo.id)}
                            disabled={removingId === photo.id}
                          >
                            {removingId === photo.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="px-4 py-3 border-t bg-muted/30">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Fechar
          </Button>
          <Button onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar seleção e sequência
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
