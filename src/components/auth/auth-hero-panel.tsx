import { Check } from 'lucide-react';
import { AmbientaRLogo } from './ambientar-logo';

const FEATURES = [
  'Licenças, outorgas e documentos do seu empreendimento em um só lugar',
  'Prazos e alertas para não perder renovações nem exigências ambientais',
  'Acompanhe processos com sua consultoria ou equipe interna em tempo real',
  'Relatórios e propostas com apoio de IA quando precisar',
  'Funciona offline no campo — sincroniza quando voltar à rede',
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

        <p className="max-w-[38ch] text-lg leading-relaxed text-emerald-50/95">
          Para empresas, empreendedores e quem precisa cumprir exigências
          ambientais em Minas Gerais — organize licenças, prazos, estudos e
          documentos do seu negócio com clareza e segurança.
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
