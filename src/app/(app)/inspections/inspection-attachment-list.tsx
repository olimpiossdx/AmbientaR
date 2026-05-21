'use client';



import * as React from 'react';

import { Button } from '@/components/ui/button';

import {

  Dialog,

  DialogContent,

  DialogHeader,

  DialogTitle,

} from '@/components/ui/dialog';

import { Loader2, Paperclip, FileText, Trash2, Eye, ImageIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

import {

  attachmentKindLabel,

  inspectionAttachmentDisplayUrl,

  isImageAttachmentUrl,

  isPdfAttachmentUrl,

} from '@/lib/inspection-attachment-media';



type PreviewState = {

  url: string;

  title: string;

  isPdf: boolean;

};



type Props = {

  urls: string[];

  maxFiles: number;

  limitLabel: string;

  uploading: boolean;

  onFilesSelected: (e: React.ChangeEvent<HTMLInputElement>) => void;

  onRemove: (urlIndex: number) => void;

  attachButtonLabel?: string;

  className?: string;

};



export function InspectionAttachmentList({

  urls,

  maxFiles,

  limitLabel,

  uploading,

  onFilesSelected,

  onRemove,

  attachButtonLabel = 'Anexar evidência',

  className,

}: Props) {

  const inputRef = React.useRef<HTMLInputElement>(null);

  const count = urls?.length ?? 0;

  const [preview, setPreview] = React.useState<PreviewState | null>(null);



  const openPreview = (url: string, index: number) => {

    setPreview({

      url: inspectionAttachmentDisplayUrl(url),

      title: `Anexo ${index + 1} (${attachmentKindLabel(url)})`,

      isPdf: isPdfAttachmentUrl(url),

    });

  };



  return (

    <>

      <div className={cn('space-y-2', className)}>

        <input

          ref={inputRef}

          type="file"

          multiple

          className="hidden"

          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/heic,image/heif,application/pdf,.pdf,.heic,.heif"

          onChange={(e) => {

            onFilesSelected(e);

            e.target.value = '';

          }}

        />

        <Button

          type="button"

          variant="outline"

          className="w-full min-h-10"

          disabled={uploading || count >= maxFiles}

          onClick={() => inputRef.current?.click()}

        >

          <span className="inline-flex items-center justify-center gap-2">

            {uploading ? (

              <Loader2 className="h-4 w-4 animate-spin shrink-0" />

            ) : (

              <Paperclip className="h-4 w-4 shrink-0" />

            )}

            <span>{attachButtonLabel}</span>

          </span>

        </Button>

        <p className="text-xs text-muted-foreground">

          <span className="font-medium text-foreground">

            {count} de {maxFiles}

          </span>{' '}

          anexos · até {limitLabel} cada

        </p>



        {count > 0 ? (

          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">

            {urls.map((url, uidx) => {

              const kind = attachmentKindLabel(url);

              const displayUrl = inspectionAttachmentDisplayUrl(url);

              const isImg = isImageAttachmentUrl(url);

              const isPdf = isPdfAttachmentUrl(url);



              return (

                <li

                  key={`${url}-${uidx}`}

                  className="flex gap-2 rounded-lg border bg-background p-2 shadow-sm"

                >

                  <button

                    type="button"

                    className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border bg-muted flex items-center justify-center"

                    onClick={() => openPreview(url, uidx)}

                    aria-label={`Ver anexo ${uidx + 1}`}

                  >

                    {isImg ? (

                      // eslint-disable-next-line @next/next/no-img-element

                      <img

                        src={displayUrl}

                        alt=""

                        className="h-full w-full object-cover"

                      />

                    ) : isPdf ? (

                      <FileText className="h-8 w-8 text-destructive/80" />

                    ) : (

                      <ImageIcon className="h-8 w-8 text-muted-foreground" />

                    )}

                  </button>

                  <div className="min-w-0 flex-1 flex flex-col justify-center gap-1">

                    <p className="text-xs font-medium leading-tight">

                      Anexo {uidx + 1}{' '}

                      <span className="text-muted-foreground font-normal">

                        ({kind})

                      </span>

                    </p>

                    <div className="flex flex-wrap gap-1">

                      <Button

                        type="button"

                        variant="secondary"

                        size="sm"

                        className="h-8 px-2 text-xs"

                        onClick={() => openPreview(url, uidx)}

                      >

                        <span className="inline-flex items-center gap-1">

                          <Eye className="h-3.5 w-3.5" />

                          Ver

                        </span>

                      </Button>

                      <Button

                        type="button"

                        variant="ghost"

                        size="sm"

                        className="h-8 px-2 text-xs text-destructive hover:text-destructive"

                        onClick={() => onRemove(uidx)}

                      >

                        <span className="inline-flex items-center gap-1">

                          <Trash2 className="h-3.5 w-3.5" />

                          Remover

                        </span>

                      </Button>

                    </div>

                  </div>

                </li>

              );

            })}

          </ul>

        ) : (

          <p className="text-xs text-muted-foreground italic">

            Nenhum anexo carregado ainda.

          </p>

        )}

      </div>



      {preview ? (

        <Dialog open onOpenChange={(open) => !open && setPreview(null)}>

          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

            <DialogHeader>

              <DialogTitle className="text-base pr-8">{preview.title}</DialogTitle>

            </DialogHeader>

            <div className="flex-1 min-h-0 overflow-auto rounded-md border bg-muted/30 p-2">

              {preview.isPdf ? (

                <iframe

                  title="Pré-visualização PDF"

                  src={preview.url}

                  className="w-full min-h-[60vh] rounded bg-white"

                />

              ) : (

                <div className="flex justify-center p-2">

                  {/* eslint-disable-next-line @next/next/no-img-element */}

                  <img

                    src={preview.url}

                    alt="Pré-visualização do anexo"

                    className="max-h-[70vh] w-auto max-w-full object-contain rounded"

                  />

                </div>

              )}

            </div>

          </DialogContent>

        </Dialog>

      ) : null}

    </>

  );

}


