import { redirect } from 'next/navigation';

/** Rota legada: mesma coleção que Empresa Responsável (`/responsible-company`). */
export default function EnvironmentalCompanyLegacyPage() {
  redirect('/responsible-company');
}
