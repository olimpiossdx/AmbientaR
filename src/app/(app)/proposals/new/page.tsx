'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ProposalsNewRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/commercial-proposals/new');
  }, [router]);
  return (
    <div className="flex h-[40vh] items-center justify-center gap-2 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      Redirecionando…
    </div>
  );
}
