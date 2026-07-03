import { redirect } from 'next/navigation';

type Props = { params: { id: string; parcelaId: string } };

export default function InventarioParcelaRedirectPage({ params }: Props) {
  redirect(`/coleta-campo/${params.id}/parcelas/${params.parcelaId}`);
}
