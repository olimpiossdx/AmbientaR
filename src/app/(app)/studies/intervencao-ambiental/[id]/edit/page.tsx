import { redirect } from 'next/navigation';

type Props = {
  params: { id: string };
};

/** Legado: edição PIA em `/studies/pia/[id]/edit`. */
export default function IntervencaoAmbientalEditRedirectPage({ params }: Props) {
  redirect(`/studies/pia/${params.id}/edit`);
}
