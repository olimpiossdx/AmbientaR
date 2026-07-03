import { redirect } from 'next/navigation';

type Props = {
  searchParams?: Record<string, string | string[] | undefined>;
};

/** Legado: intervenção ambiental unificada em PIA. */
export default function IntervencaoAmbientalNewRedirectPage({ searchParams }: Props) {
  const params = new URLSearchParams();
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (typeof value === 'string') params.set(key, value);
      else if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    }
  }
  const query = params.toString();
  redirect(query ? `/studies/pia/new?${query}` : '/studies/pia/new');
}
