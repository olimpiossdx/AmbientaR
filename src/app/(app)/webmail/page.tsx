'use client';

import { PageHeader } from '@/components/page-header';

export default function WebmailPage() {
  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      <PageHeader title="Webmail" />
      <main className="min-h-0 min-w-0 flex-1 overflow-hidden p-0">
         <iframe 
            src="https://consultoriapimenta.com.br:2096/"
            className="h-[calc(100dvh-4rem)] min-h-[520px] w-full max-w-full border-0 md:h-full md:min-h-0"
            title="Webmail"
        ></iframe>
      </main>
    </div>
  );
}
