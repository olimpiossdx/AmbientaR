import { Link } from "@tanstack/react-router";
import { Leaf } from "lucide-react";

export function PrivacyPolicyPage() {
 return (
  <div className="min-h-screen bg-white text-slate-900">
   <header className="border-b border-slate-200 bg-white/90 px-4 py-4 backdrop-blur sm:px-8">
    <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
     <div className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white">
       <Leaf className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="text-lg font-bold">AmbientaR</span>
     </div>
     <Link to="/login" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">
      Voltar ao login
     </Link>
    </div>
   </header>

   <main className="mx-auto max-w-3xl space-y-6 px-4 py-8 text-sm leading-7 sm:px-8">
    <div>
     <h1 className="text-3xl font-bold">Política de Privacidade e Cookies</h1>
     <p className="mt-2 text-slate-500">Última atualização: junho de 2026.</p>
    </div>

    <section><h2 className="text-xl font-semibold">1. Quem somos</h2><p>A Plataforma AmbientaR (EcoGestão MG) é operada pela consultoria indicada no cadastro e no contrato de assinatura. O tratamento de dados pessoais observa a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).</p></section>
    <section><h2 className="text-xl font-semibold">2. Dados que coletamos</h2><ul className="list-disc pl-5"><li>Dados cadastrais, como nome, e-mail, telefone e CPF/CNPJ.</li><li>Dados de uso, preferências, notificações e registros ambientais.</li><li>Identificadores de sessão, tipo de dispositivo e logs de segurança.</li></ul></section>
    <section><h2 className="text-xl font-semibold">3. Finalidades</h2><ul className="list-disc pl-5"><li>Prestação do serviço de gestão ambiental.</li><li>Autenticação, suporte e cumprimento de obrigações legais.</li><li>Comunicações autorizadas e, no plano gratuito, publicidade de terceiros.</li></ul></section>
    <section><h2 className="text-xl font-semibold">4. Cookies</h2><p>Cookies essenciais mantêm a sessão, preferências e funcionamento do aplicativo. Cookies de publicidade e medição dependem de consentimento. Consulte também as <a className="text-emerald-700 underline" href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer">políticas de publicidade</a> e a <a className="text-emerald-700 underline" href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">política de privacidade do Google</a>.</p></section>
    <section><h2 className="text-xl font-semibold">5. Publicidade</h2><p>O plano gratuito pode exibir anúncios em áreas periféricas, sem sobrepor formulários críticos. Planos pagos não exibem publicidade de terceiros.</p></section>
    <section><h2 className="text-xl font-semibold">6. Seus direitos</h2><p>O titular pode solicitar confirmação, correção, informações sobre compartilhamento e revogação de consentimentos facultativos pelos canais de suporte informados no aplicativo.</p></section>
    <section><h2 className="text-xl font-semibold">7. Contato</h2><p>Dúvidas sobre privacidade devem ser encaminhadas ao canal de suporte ou ao e-mail informado no cadastro e no contrato de assinatura.</p></section>
   </main>
  </div>
 );
}
