import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidade — AmbientaR",
  description:
    "Política de privacidade, cookies e publicidade do portal AmbientaR.",
};

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background/80 px-4 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-primary">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-emerald-400 text-primary-foreground">
              <Leaf className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold text-foreground">AmbientaR</span>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">Voltar ao login</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8 prose prose-sm dark:prose-invert">
        <h1>Política de Privacidade e Cookies</h1>
        <p className="text-muted-foreground text-sm">
          Última atualização: junho de 2026. Documento informativo alinhado ao
          contrato de cadastro da Plataforma AmbientaR.
        </p>

        <h2>1. Quem somos</h2>
        <p>
          A Plataforma AmbientaR (EcoGestão MG) é operada pela consultoria
          contratada indicada no cadastro e no contrato de assinatura. O
          tratamento de dados pessoais observa a Lei Geral de Proteção de Dados
          (LGPD — Lei nº 13.709/2018).
        </p>

        <h2>2. Dados que coletamos</h2>
        <ul>
          <li>Dados cadastrais: nome, e-mail, telefone, CPF/CNPJ.</li>
          <li>
            Dados de uso: páginas acessadas, preferências, notificações e
            registros ambientais inseridos pelo titular.
          </li>
          <li>
            Dados técnicos: identificadores de sessão, tipo de dispositivo e
            logs de segurança.
          </li>
        </ul>

        <h2>3. Finalidades</h2>
        <ul>
          <li>Prestação do serviço de gestão ambiental no portal.</li>
          <li>Autenticação, suporte e cumprimento de obrigações legais.</li>
          <li>
            Comunicações comerciais e ofertas de upgrade, quando autorizadas no
            contrato ou opt-in do plano.
          </li>
          <li>
            No <strong>plano gratuito</strong>, exibição de publicidade de
            terceiros para financiar o acesso sem cobrança direta ao titular.
          </li>
        </ul>

        <h2>4. Cookies e tecnologias similares</h2>
        <p>
          Utilizamos cookies <strong>essenciais</strong> para manter sua sessão,
          preferências de interface e funcionamento do aplicativo (PWA).
        </p>
        <p>
          No plano gratuito, com seu consentimento, podemos utilizar cookies de{" "}
          <strong>publicidade e medição</strong> de parceiros, em especial o{" "}
          <strong>Google AdSense</strong>, que pode definir cookies próprios para
          veiculação, limitação de frequência e relatórios agregados. As práticas
          do Google estão descritas em{" "}
          <a
            href="https://policies.google.com/technologies/ads"
            target="_blank"
            rel="noopener noreferrer"
          >
            Políticas de publicidade do Google
          </a>{" "}
          e{" "}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Política de Privacidade do Google
          </a>
          .
        </p>
        <p>
          Você pode aceitar ou recusar cookies de publicidade no banner exibido no
          aplicativo. A recusa mantém o acesso ao plano gratuito, porém sem
          carregamento de anúncios personalizados de terceiros.
        </p>

        <h2>5. Publicidade (Google AdSense)</h2>
        <p>
          A versão gratuita do portal pode exibir anúncios em áreas periféricas
          (rodapé ou barras laterais), sem sobreposição a formulários ambientais
          críticos, conforme cláusula 9.5 do contrato. A CONTRATADA não endossa
          produtos ou serviços anunciados por terceiros.
        </p>
        <p>
          Ao migrar para <strong>plano pago</strong>, a publicidade de terceiros
          é suprimida automaticamente. Se a assinatura anual vencer sem
          renovação, o perfil retorna aos limites do plano gratuito e a
          publicidade pode ser reativada.
        </p>

        <h2>6. Seus direitos</h2>
        <p>
          Você pode solicitar confirmação de tratamento, correção, informações
          sobre compartilhamento e revogação de consentimentos facultativos,
          mediante contato com o suporte indicado no aplicativo. Direitos
          irrenunciáveis previstos em lei permanecem preservados.
        </p>

        <h2>7. Contato</h2>
        <p>
          Dúvidas sobre privacidade: utilize o canal de suporte da consultoria ou
          o e-mail informado no cadastro e no contrato de assinatura da
          plataforma.
        </p>
      </main>
    </div>
  );
}
