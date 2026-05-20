import { redirect } from 'next/navigation';

/** Raiz do monitoramento: o menu aponta para manual/telemetric; evita página placeholder órfã. */
export default function MonitoringPage() {
  redirect('/monitoring/manual');
}
