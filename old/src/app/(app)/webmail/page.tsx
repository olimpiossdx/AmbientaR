import { redirect } from 'next/navigation';

/** Redireciona rota legada para o embed do menu (menu 12 — Webmail). */
const WEBMAIL_EXTERNAL_HREF =
  '/external?url=https%3A%2F%2Fconsultoriapimenta.com.br%3A2096%2F&title=Webmail';

export default function WebmailPage() {
  redirect(WEBMAIL_EXTERNAL_HREF);
}
