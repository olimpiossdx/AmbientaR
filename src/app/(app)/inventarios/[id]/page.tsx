import { redirect } from 'next/navigation';

type Props = { params: { id: string } };

export default function InventarioIdRedirectPage({ params }: Props) {
  redirect(`/coleta-campo/${params.id}`);
}
