'use client';

import { useCallback } from 'react';
import { useToast } from './use-toast';
import { useFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { inferMimeTypeFromFileName } from '@/lib/file-mime';
import { clearBrandingPdfCache } from '@/lib/branding-pdf';

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

type BrandingField = 'headerImageUrl' | 'footerImageUrl' | 'watermarkImageUrl';

export function useUploadBrandingImage() {
  const { toast } = useToast();
  const { firestore, auth } = useFirebase();

  const upload = useCallback(
    async (file: File, fieldName: BrandingField): Promise<UploadResult> => {
      try {
        if (!firestore || !auth?.currentUser) {
          const msg = 'Sessão inválida para upload de branding.';
          toast({
            variant: 'destructive',
            title: 'Erro no upload',
            description: msg,
          });
          return { success: false, error: msg };
        }

        const storage = getStorage();
        const safeName = file.name.replace(/[^\w.\-]/g, '_');
        // storage.rules: match /branding/{userId}/{allPaths=**} — o 1.º segmento após branding tem de ser o uid.
        const filePath = `branding/${auth.currentUser.uid}/${fieldName}/${Date.now()}-${safeName}`;
        const storageRef = ref(storage, filePath);
        const contentType =
          (file.type && file.type.trim()) ||
          inferMimeTypeFromFileName(file.name) ||
          "application/octet-stream";
        await uploadBytes(storageRef, file, { contentType });
        const url = await getDownloadURL(storageRef);

        await setDoc(
          doc(firestore, 'companySettings', 'branding'),
          { [fieldName]: url },
          { merge: true }
        );

        clearBrandingPdfCache();

        return { success: true, url };
      } catch (error: any) {
        const message = error?.message || 'Falha ao enviar arquivo.';
        toast({
          variant: 'destructive',
          title: 'Erro no upload',
          description: message,
        });
        return { success: false, error: message };
      }
    },
    [toast, firestore, auth]
  );

  return { upload };
}
