import { Check } from 'lucide-react';
import { AmbientaRLogo } from './ambientar-logo';

const FEATURES = [
  'Licenças, outorgas, estudos e documentos ambientais centralizados',
  'Relatórios e propostas com apoio de IA',
  'Agenda, projetos e gestão para consultorias em MG',
  'PWA offline-first — sincroniza quando voltar à rede',
  'Propostas, contratos e fiscalização digital integrados',
] as const;

export function AuthHeroPanel() {
  return (
    <aside
      className="relative hidden min-h-screen flex-col justify-center overflow-hidden bg-gradient-to-br from-primary via-emerald-800 to-emerald-500 px-10 py-12 lg:flex xl:px-14"
      aria-label="Sobre o AmbientaR"
    >
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 max-w-lg space-y-8">
        <AmbientaRLogo size="lg" showWordmark variant="onDark" href="/" />

        <p className="max-w-[36ch] text-lg leading-relaxed text-emerald-50/95">
          Plataforma completa para consultorias ambientais em Minas Gerais —
          organize licenças, estudos, relatórios e a rotina da sua equipe em um
          só lugar.
        </p>

        <ul className="space-y-3.5">
          {FEATURES.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-3 text-[0.95rem] leading-snug text-emerald-50/90"
            >
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-300/25"
                aria-hidden
              >
                <Check className="h-3 w-3 text-emerald-100" strokeWidth={3} />
              </span>
              {feature}
            </li>
          ))}
        </ul>

        <p className="text-sm text-emerald-100/70">EcoGestão MG · Minas Gerais</p>
      </div>
    </aside>
  );
}
