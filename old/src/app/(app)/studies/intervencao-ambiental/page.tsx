import { redirect } from 'next/navigation';

/** Formulários PIA usam esta rota; listagem oficial está em Estudos → PIA. */
export default function IntervencaoAmbientalIndexPage() {
  redirect('/studies/pia');
}
