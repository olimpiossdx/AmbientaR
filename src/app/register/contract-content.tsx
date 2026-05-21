import type { ClientPackage, PlatformContractPublic } from "@/lib/types";
import { formatContratadaIntro } from "@/lib/platform-company";

function isGratuito(pkg: ClientPackage | undefined): boolean {
  return pkg === "gratuito";
}

function isBasico(pkg: ClientPackage | undefined): boolean {
  return pkg === "basico";
}

function isPlanoPagoComOptInMarketing(pkg: ClientPackage | undefined): boolean {
  return (
    pkg === "intermediario" || pkg === "avancado" || pkg === "completo"
  );
}

/**
 * Contrato exibido no cadastro. Texto meramente orientativo — revisão por advogado é recomendada.
 */
export function RegisterContractContent({
  packageId,
  platformCompany,
}: {
  packageId: ClientPackage | undefined;
  /** Empresa ativa (Cadastro → Empresas); se ausente, usa texto padrão. */
  platformCompany?: PlatformContractPublic | null;
}) {
  const gratuito = isGratuito(packageId);
  const basico = isBasico(packageId);
  const optInMarketing = isPlanoPagoComOptInMarketing(packageId);

  return (
    <div
      className="font-sans text-[11px] leading-relaxed text-foreground/85 sm:text-xs"
      style={{
        paddingTop: "0.75rem",
        paddingBottom: "0.75rem",
        paddingLeft: "0.5rem",
        paddingRight: "0.5rem",
        textAlign: "justify",
      }}
    >
      <h2 className="text-sm font-bold text-center mb-3 uppercase tracking-tight">
        Termos de Uso, Política Contratual e Contrato de Licença de Uso de
        Software e Serviços (SaaS)
      </h2>

      <p className="mb-2">
        <strong>CONTRATADA:</strong> {formatContratadaIntro(platformCompany)}
      </p>
      <p className="mb-3">
        <strong>CONTRATANTE / USUÁRIO:</strong> pessoa física ou jurídica que
        realiza cadastro e utiliza a plataforma denominada{" "}
        <strong>AmbientaR</strong> (&quot;Plataforma&quot;), doravante
        &quot;CONTRATANTE&quot; ou &quot;USUÁRIO&quot;.
      </p>
      <p className="mb-3 text-[10px] text-muted-foreground italic">
        Ao aceitar eletronicamente este instrumento, o CONTRATANTE declara ter
        lido, compreendido e anuído integralmente às cláusulas abaixo, inclusive
        quanto ao tratamento de dados nos termos da Lei nº 13.709/2018 (LGPD) e
        legislação consumerista aplicável.
      </p>

      <h3 className="font-bold mt-3 mb-1">
        CLÁUSULA 1ª — DO OBJETO E NATUREZA DOS SERVIÇOS
      </h3>
      <p className="mb-2">
        1.1. O presente instrumento regula o acesso e uso da Plataforma
        AmbientaR, em modelo de prestação de serviços de tecnologia (SaaS —
        Software as a Service), conforme o plano contratado ou selecionado no
        ato do cadastro.
      </p>
      <p className="mb-2">
        1.2. A Plataforma destina-se a apoiar a gestão de informações ambientais
        e correlatas, sem substituir parecer técnico, licenças, obrigações
        legais ou deveres do CONTRATANTE perante terceiros ou poder público.
      </p>
      <p className="mb-3">
        1.3. Eventuais funcionalidades experimentais, em beta ou com uso de
        inteligência artificial são fornecidas em caráter acessório, sem garantia
        de resultado, precisão absoluta ou adequação a caso concreto; o
        CONTRATANTE deve validar criticamente qualquer saída gerada.
      </p>

      <h3 className="font-bold mt-3 mb-1">
        CLÁUSULA 2ª — DO CADASTRO, VERACIDADE E CREDENCIAIS
      </h3>
      <p className="mb-2">
        2.1. O CONTRATANTE obriga-se a fornecer dados cadastrais verdadeiros,
        completos e atualizados, responsabilizando-se civil e criminalmente por
        informações falsas ou fraudulentas.
      </p>
      <p className="mb-2">
        2.2. O login e a senha são pessoais e intransferíveis. Todo uso da conta
        após autenticação será presumido de boa-fé como sendo do CONTRATANTE,
        que arcará com os danos decorrentes de negligência na guarda das
        credenciais.
      </p>
      <p className="mb-3">
        2.3. A CONTRATADA poderá suspender ou encerrar o acesso em caso de
        suspeita de fraude, violação deste contrato ou ordem de autoridade
        competente, sem prejuízo de medidas legais cabíveis.
      </p>

      <h3 className="font-bold mt-3 mb-1">
        CLÁUSULA 3ª — DA PROPRIEDADE INTELECTUAL E LICENÇA DE USO
      </h3>
      <p className="mb-2">
        3.1. A Plataforma, marcas, layout, código, documentação e demais
        conteúdos fornecidos pela CONTRATADA permanecem de titularidade exclusiva
        da CONTRATADA ou de licenciantes, sendo concedida ao CONTRATANTE apenas
        licença de uso não exclusiva, intransferível, revogável e limitada ao
        período de vigência do plano, estritamente para fins internos de gestão
        do próprio CONTRATANTE.
      </p>
      <p className="mb-2">
        3.2. É vedado copiar, fazer engenharia reversa, decodificar, alugar,
        sublicenciar, revender, disponibilizar a terceiros ou criar obra
        derivada da Plataforma, salvo autorização expressa e escrita da
        CONTRATADA.
      </p>
      <p className="mb-3">
        3.3. O CONTRATANTE mantém a titularidade dos dados e documentos por ele
        inseridos, concedendo à CONTRATADA licença necessária para hospedar,
        processar, exibir e fazer backup desses conteúdos para execução do
        serviço.
      </p>

      <h3 className="font-bold mt-3 mb-1">
        CLÁUSULA 4ª — DA DISPONIBILIDADE, EVOLUÇÃO E SUPORTE
      </h3>
      <p className="mb-2">
        4.1. A CONTRATADA envidará esforços para manter a Plataforma disponível,
        sem garantir acesso ininterrupto ou livre de falhas, indisponibilidades,
        manutenções programadas, caso fortuito ou força maior.
      </p>
      <p className="mb-2">
        4.2. A CONTRATADA poderá alterar funcionalidades, interface, planos e
        preços, comunicando alterações relevantes por meios razoáveis (ex.:
        aviso na Plataforma ou por e-mail), observada a legislação aplicável.
      </p>
      <p className="mb-3">
        4.3. O escopo de suporte técnico segue o plano contratado; planos
        gratuitos ou de menor valor podem ter suporte limitado ou apenas por
        canais eletrônicos.
      </p>

      <h3 className="font-bold mt-3 mb-1">
        CLÁUSULA 5ª — DA LIMITAÇÃO DE RESPONSABILIDADE
      </h3>
      <p className="mb-2">
        5.1. Na máxima extensão permitida pela legislação brasileira vigente, a
        responsabilidade total da CONTRATADA por quaisquer danos diretos
        comprovadamente decorrentes do uso da Plataforma fica limitada, em
        qualquer período de doze (12) meses, ao montante efetivamente pago pelo
        CONTRATANTE à CONTRATADA nesse período em razão do plano contratado; nos
        planos gratuitos ou sem cobrança no período, o limite será de até cinco
        (5) salários mínimos vigentes à data do fato, salvo disposição legal
        imperativa em contrário.
      </p>
      <p className="mb-2">
        5.2. Ficam expressamente excluídas, na medida em que a lei admitir, a
        responsabilidade por lucros cessantes, perda de dados por culpa
        exclusiva do CONTRATANTE ou de terceiros, danos indiretos, incidentais,
        especiais ou punitivos, salvo comprovação de dolo ou culpa grave da
        CONTRATADA.
      </p>
      <p className="mb-2">
        5.3. A CONTRATADA não se responsabiliza por decisões administrativas,
        judiciais, autuações, multas ou exigências de órgãos ambientais ou
        fiscalizadores, nem pela adequação das informações inseridas pelo
        CONTRATANTE à legislação específica de cada empreendimento.
      </p>
      <p className="mb-2">
        5.4. Integrações com terceiros (hospedagem, APIs, meios de pagamento,
        inteligência artificial, geoprocessamento, etc.) observam os termos desses
        fornecedores; falhas alheias à esfera de controle razoável da CONTRATADA
        não lhe serão imputadas.
      </p>
      <p className="mb-2">
        5.5. O CONTRATANTE reconhece que módulos de IA (incluindo análises de
        área, assistentes e relatórios automatizados) podem conter imprecisões e
        não constituem parecer técnico, licença, autorização ou despacho de órgão
        público.
      </p>
      <p className="mb-3">
        5.6. A CONTRATADA não garante recuperação integral de dados após
        exclusão pelo CONTRATANTE, falha de conexão, uso indevido ou
        inadimplência; recomenda-se cópia de segurança pelos documentos
        relevantes.
      </p>

      <h3 className="font-bold mt-3 mb-1">
        CLÁUSULA 6ª — DA INDENIZAÇÃO PELO CONTRATANTE
      </h3>
      <p className="mb-3">
        6.1. O CONTRATANTE obriga-se a indenizar, defender e isentar a
        CONTRATADA, seus sócios, administradores, prepostos e parceiros, de
        reclamações, demandas, custas e honorários advocatícios decorrentes de:
        (a) uso indevido da Plataforma; (b) violação deste contrato ou de
        direitos de terceiros; (c) conteúdo ou dados inseridos pelo
        CONTRATANTE; (d) descumprimento de obrigações legais ou regulatórias
        atinentes à sua atividade.
      </p>

      <h3 className="font-bold mt-3 mb-1">
        CLÁUSULA 7ª — DA VIGÊNCIA, RESCISÃO E CONSEQUÊNCIAS
      </h3>
      <p className="mb-2">
        7.1. A vigência do acesso segue o plano contratado, política de
        assinatura anual da Plataforma e eventuais confirmações de pagamento.
      </p>
      <p className="mb-2">
        7.2. O descumprimento grave pode ensejar rescisão com suspensão
        imediata do acesso, sem prejuízo de perdas e danos na medida da lei.
      </p>
      <p className="mb-2">
        7.3. Após o encerramento, poderão ser mantidos registros pelo prazo
        legal ou contratual de backup e auditoria, observada a LGPD.
      </p>
      <p className="mb-2">
        7.4. O acesso poderá ser suspenso por inadimplência, suspeita de fraude,
        violação deste contrato, tentativa de burlar limites técnicos do plano ou
        ordem de autoridade, sem prejuízo de cobrança de valores em aberto.
      </p>
      <p className="mb-3">
        7.5. A CONTRATADA poderá alterar ou descontinuar funcionalidades do
        plano gratuito, mediante aviso razoável na Plataforma, sem direito a
        indenização por mera alteração de escopo gratuito.
      </p>

      <h3 className="font-bold mt-3 mb-1">
        CLÁUSULA 8ª — DA PROTEÇÃO DE DADOS (LGPD)
      </h3>
      <p className="mb-2">
        8.1. O tratamento de dados pessoais observará a LGPD, podendo ter como
        bases legais, conforme o caso, a execução deste contrato, o legítimo
        interesse com balanceamento de direitos, o cumprimento de obrigação
        legal e o consentimento quando exigido.
      </p>
      <p className="mb-2">
        8.2. O CONTRATANTE poderá exercer direitos de titular pelos canais
        indicados pela CONTRATADA, resguardadas exceções legais.
      </p>
      <p className="mb-3">
        8.3. Dados poderão ser armazenados em infraestrutura em nuvem, inclusive
        fora do domicílio do CONTRATANTE, desde que em conformidade com a LGPD e
        medidas de segurança compatíveis com o risco.
      </p>

      {gratuito && (
        <>
          <h3 className="font-bold mt-3 mb-1 border-t border-border pt-2">
            CLÁUSULA 9ª — DO PLANO GRATUITO (DEGUSTAÇÃO)
          </h3>
          <p className="mb-2">
            9.1. O plano <strong>Gratuito</strong> destina-se exclusivamente à
            experimentação limitada da Plataforma, sem caráter de gestão
            ambiental completa, e está sujeito aos seguintes limites técnicos,
            que podem ser verificados automaticamente pelo sistema: até{" "}
            <strong>um (1) empreendimento</strong> cadastrado; até{" "}
            <strong>um (1) registro</strong> por módulo de dado (ex.: licença,
            outorga, condicionante, uso insignificante, intervenção);{" "}
            <strong>proibição de upload</strong> de arquivos e anexos;{" "}
            <strong>ausência de alertas automáticos</strong> de vencimento ou
            prazo no aplicativo; e demais restrições exibidas na tela de planos.
          </p>
          <p className="mb-2">
            9.2. O CONTRATANTE no plano Gratuito <strong>não autoriza</strong>,
            pelo só aceite deste contrato, o uso de seus dados cadastrais para
            campanhas promocionais <strong>diretas da CONTRATADA</strong> (e-mail,
            telefone, WhatsApp, SMS ou equivalentes); eventual comunicação
            limitar-se-á ao necessário para operação da conta, segurança e
            cumprimento legal. Isso é distinto da publicidade de terceiros
            prevista no item 9.4.
          </p>
          <p className="mb-2">
            9.3. O plano Gratuito constitui <strong>versão com publicidade</strong>
            : a Plataforma poderá exibir, em áreas identificadas como
            patrocinadas ou publicidade (por exemplo rodapé, listagens ou telas
            de apoio), conteúdo publicitário de <strong>terceiros</strong>,
            incluindo redes de anúncios como Google AdSense ou equivalentes, sem
            mistura ao conteúdo técnico ou aos formulários de dados ambientais do
            CONTRATANTE.
          </p>
          <p className="mb-2">
            9.4. Ao aceitar este contrato no plano Gratuito, o CONTRATANTE declara
            ciência de que: (a) provedores de publicidade e anunciantes podem
            utilizar cookies, identificadores de dispositivo e tecnologias
            correlatas, nos termos das políticas desses provedores e da
            legislação aplicável (incluindo manifestação de preferências de
            cookies ou publicidade, quando disponibilizada na Plataforma); (b) a
            CONTRATADA <strong>não garante, endossa nem responde</strong> pelo
            conteúdo, produtos ou serviços anunciados por terceiros; (c) a
            migração para plano pago conforme tabela vigente{" "}
            <strong>poderá suprimir ou reduzir</strong> a exibição de
            publicidade de terceiros, conforme política então publicada na
            Plataforma.
          </p>
          <p className="mb-2">
            9.5. A CONTRATADA compromete-se a não sobrepor publicidade de
            terceiros a formulários de cadastro de dados ambientais, fluxos de
            documentos oficiais ou telas de operação crítica; a veiculação
            restringir-se-á a espaços periféricos da navegação, de forma a
            preservar a usabilidade da degustação.
          </p>
          <p className="mb-3">
            9.6. Para ampliar limites, suprimir publicidade de terceiros (quando
            aplicável ao plano), anexar documentos, receber alertas de prazo ou
            utilizar análises com IA (AmbBot), o CONTRATANTE deverá contratar
            plano pago conforme tabela vigente.
          </p>
        </>
      )}

      {basico && (
        <>
          <h3 className="font-bold mt-3 mb-1 border-t border-border pt-2">
            CLÁUSULA {gratuito ? "10ª" : "9ª"} — DO PLANO BÁSICO: LIMITES E
            AUTORIZAÇÃO DE CONTATO COMERCIAL
          </h3>
          <p className="mb-2">
            {gratuito ? "10.1" : "9.1"}. O plano <strong>Básico (Autônomo 1)</strong>{" "}
            permite até <strong>um (1) empreendimento</strong>, upload de
            documentos dentro da cota contratada e funcionalidades descritas na
            tabela de planos vigente no cadastro.
          </p>
          <p className="mb-2">
            {gratuito ? "10.2" : "9.2"}. Ao aceitar este contrato no plano
            Básico, o CONTRATANTE declara, de forma livre, informada e
            inequívoca, que <strong>autoriza</strong> a CONTRATADA a tratar seus
            dados cadastrais e de contato para: comunicações comerciais;
            prospecção; ofertas de upgrade; pesquisas; convites; e contato por{" "}
            <strong>
              e-mail, telefone (incluindo ligações), WhatsApp, SMS, mensagens
              em aplicativos de celular, notificações push e demais canais
              digitais ou presenciais
            </strong>{" "}
            relacionados a produtos e serviços da CONTRATADA e parceiros do
            segmento ambiental,{" "}
            <strong>
              sem necessidade de autorização prévia adicional para cada campanha
            </strong>
            , respeitados a LGPD e o direito de oposição/revogação.
          </p>
          <p className="mb-3">
            {gratuito ? "10.3" : "9.3"}. O CONTRATANTE poderá solicitar
            descadastro de comunicações promocionais pelos canais de
            atendimento, sem prejuízo de mensagens estritamente contratuais ou
            legais.
          </p>
        </>
      )}

      {optInMarketing && (
        <>
          <h3 className="font-bold mt-3 mb-1 border-t border-border pt-2">
            CLÁUSULA 9ª — DOS PLANOS PAGOS (INTERMEDIÁRIO, AVANÇADO E COMPLETO):
            CONTATO COMERCIAL SOB CONSENTIMENTO ESPECÍFICO
          </h3>
          <p className="mb-2">
            9.1. Nos planos pagos acima do Básico, o tratamento de dados para{" "}
            <strong>marketing, prospecção e propaganda</strong>{" "}
            <strong>não</strong> decorre automaticamente do aceite deste
            contrato.
          </p>
          <p className="mb-3">
            9.2. Tal tratamento depende de manifestação expressa na caixa
            &quot;disponibilizo meus dados para contato comercial&quot; no
            cadastro (art. 7º, I e art. 8º da LGPD). Sem a marcação, a
            CONTRATADA limitar-se-á ao necessário para prestação do serviço
            contratado.
          </p>
        </>
      )}

      {packageId === "sob_consulta" && (
        <>
          <h3 className="font-bold mt-3 mb-1 border-t border-border pt-2">
            CLÁUSULA 9ª — PLANO SOB CONSULTA
          </h3>
          <p className="mb-3">
            9.1. Limites de uso, armazenamento, usuários e condições comerciais
            serão definidos em proposta ou aditivo específico, prevalecendo
            sobre disposições genéricas deste instrumento em caso de conflito.
          </p>
        </>
      )}

      <h3 className="font-bold mt-3 mb-1">
        CLÁUSULA 10ª — DO USO ACEITÁVEL E SEGURANÇA
      </h3>
      <p className="mb-2">
        10.1. É vedado utilizar a Plataforma para fins ilícitos, envio de spam,
        sobrecarga intencional, engenharia reversa, scraping automatizado não
        autorizado, compartilhamento de credenciais com terceiros não vinculados
        ao contrato ou revenda de acesso.
      </p>
      <p className="mb-3">
        10.2. O CONTRATANTE é responsável pelos dados inseridos e pelas
        consequências de sua divulgação a terceiros fora da Plataforma.
      </p>

      <h3 className="font-bold mt-3 mb-1">
        CLÁUSULA 11ª — DA CONFIDENCIALIDADE
      </h3>
      <p className="mb-3">
        11.1. As partes manterão confidenciais informações técnicas ou comerciais
        não públicas a que tenham acesso em razão deste contrato, salvo
        divulgação exigida por lei ou ordem judicial.
      </p>

      <h3 className="font-bold mt-3 mb-1">
        CLÁUSULA 12ª — DAS COMUNICAÇÕES ELETRÔNICAS
      </h3>
      <p className="mb-3">
        12.1. Notificações relacionadas ao serviço poderão ser enviadas ao
        e-mail cadastrado, presumindo-se recebidas após envio, salvo prova em
        contrário.
      </p>

      <h3 className="font-bold mt-3 mb-1">
        CLÁUSULA 13ª — DA NULIDADE PARCIAL E TOLERÂNCIA
      </h3>
      <p className="mb-3">
        13.1. A eventual nulidade ou ineficácia de cláusula, na medida em que
        declarada por autoridade competente, não prejudicará a validade das
        demais. A tolerância a infrações não implicará renúncia a direitos.
      </p>

      <h3 className="font-bold mt-3 mb-1">
        CLÁUSULA 14ª — DA LEI APLICÁVEL E FORO
      </h3>
      <p className="mb-2">
        14.1. Aplica-se a legislação brasileira. Quando o CONTRATANTE for
        consumidor nos termos do Código de Defesa do Consumidor, serão observadas
        as normas imperativas de proteção ao consumidor, sem prejuízo do
        equilíbrio contratual em cláusulas válidas.
      </p>
      <p className="mb-3">
        14.2. Fica eleito o foro da comarca de <strong>Belo Horizonte</strong>,
        Estado de <strong>Minas Gerais</strong>, com renúncia a qualquer outro,
        por mais privilegiado que seja, salvo competência absoluta de outro
        foro por disposição legal imperativa.
      </p>

      <h3 className="font-bold mt-3 mb-1">
        CLÁUSULA 15ª — DAS DISPOSIÇÕES FINAIS
      </h3>
      <p className="mb-2">
        15.1. Este instrumento constitui o entendimento integral entre as
        partes quanto ao objeto, substituindo tratativas anteriores sobre a
        mesma matéria.
      </p>
      <p className="mb-2">
        15.2. O aceite eletrônico, com uso de login e senha ou confirmação em
        tela, produz os mesmos efeitos de assinatura física, nos termos da
        Medida Provisória nº 2.200-2/2001 e legislação correlata, quando
        aplicável.
      </p>
      <p className="mb-3">
        15.3. Os limites técnicos dos planos (empreendimentos, arquivos, módulos,
        AmbBot, alertas) são parte integrante da relação contratual e podem ser
        atualizados com comunicação prévia na Plataforma.
      </p>

      {optInMarketing && (
        <div className="mt-3 rounded-md border border-primary/30 bg-primary/5 p-2 text-[11px]">
          <strong>Atenção:</strong> para o plano selecionado, além de aceitar este
          contrato, você deverá marcar a opção específica de disponibilização de
          dados para contato comercial no formulário abaixo do texto contratual.
        </div>
      )}

      {gratuito && (
        <div className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-[11px]">
          <strong>Plano Gratuito (versão com publicidade):</strong> uso limitado
          (1 empreendimento, 1 registro por tipo, sem upload e sem alertas
          automáticos de prazo). Poderão ser exibidos anúncios de terceiros em
          áreas da Plataforma — sem contato comercial automático da CONTRATADA.
          Planos pagos ampliam recursos e podem remover a publicidade.
        </div>
      )}

      {basico && (
        <div className="mt-3 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-2 text-[11px]">
          <strong>Plano Básico:</strong> ao aceitar o contrato, você autoriza
          contato comercial da CONTRATADA pelos canais descritos na cláusula do
          plano Básico (e-mail, telefone, WhatsApp, SMS, etc.).
        </div>
      )}

      <p className="mt-4 text-center text-[11px] italic text-muted-foreground">
        Documento para fins de cadastro na Plataforma AmbientaR. Recomenda-se
        revisão jurídica antes de publicação definitiva em produção.
      </p>
    </div>
  );
}

export function packageRequiresMarketingOptIn(
  pkg: ClientPackage | undefined | null,
): boolean {
  return isPlanoPagoComOptInMarketing(pkg ?? undefined);
}
