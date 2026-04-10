import type { ClientPackage } from "@/lib/types";

function isGratuitoOuBasico(pkg: ClientPackage | undefined): boolean {
  return pkg === "gratuito" || pkg === "basico";
}

/**
 * Contrato exibido no cadastro. Texto meramente orientativo — revisão por advogado é recomendada.
 */
export function RegisterContractContent({
  packageId,
}: {
  packageId: ClientPackage | undefined;
}) {
  const gOrB = isGratuitoOuBasico(packageId);

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
        <strong>CONTRATADA:</strong> PIMENTA CONSULTORIA AMBIENTAL, pessoa
        jurídica de direito privado, inscrita no CNPJ sob o nº que consta de
        seus registros públicos, com sede em território nacional, doravante
        simplesmente &quot;CONTRATADA&quot; ou &quot;PIMENTA&quot;.
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
      <p className="mb-3">
        5.4. Integrações com terceiros (hospedagem, APIs, meios de pagamento,
        etc.) observam os termos desses fornecedores; falhas alheias à esfera de
        controle razoável da CONTRATADA não lhe serão imputadas.
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
      <p className="mb-3">
        7.3. Após o encerramento, poderão ser mantidos registros pelo prazo
        legal ou contratual de backup e auditoria, observada a LGPD.
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

      {gOrB ? (
        <>
          <h3 className="font-bold mt-3 mb-1 border-t border-border pt-2">
            CLÁUSULA 9ª — DOS PLANOS GRATUITO E BÁSICO: TRATAMENTO DE DADOS PARA
            CONTATO COMERCIAL
          </h3>
          <p className="mb-2">
            9.1. O CONTRATANTE que selecionar os planos <strong>Gratuito</strong>{" "}
            ou <strong>Básico</strong> declara, de forma livre, informada e
            inequívoca, ao aceitar este contrato, que <strong>autoriza</strong> a
            CONTRATADA a tratar seus dados cadastrais e de contato — incluindo,
            sem se limitar a, nome, e-mail, telefone, dados de identificação e
            demais informações fornecidas no cadastro — para as finalidades de:
            envio de comunicações sobre produtos e serviços da CONTRATADA e de
            parceiros comerciais alinhados à área ambiental e de gestão;
            prospecção comercial; convites a eventos; pesquisas de satisfação;
            ofertas personalizadas; e contato por e-mail, telefone, mensagens
            instantâneas, SMS ou outros meios digitais ou físicos,{" "}
            <strong>sem necessidade de aviso ou autorização prévia adicional</strong>{" "}
            para cada contato, respeitados os limites legais e o direito de
            oposição e revogação do consentimento quando aplicável.
          </p>
          <p className="mb-2">
            9.2. O CONTRATANTE poderá solicitar a interrupção de comunicações
            promocionais por meio dos canais de atendimento da CONTRATADA ou
            mecanismos de descadastro, sem prejuízo do tratamento necessário à
            execução contratual ou cumprimento de obrigação legal.
          </p>
          <p className="mb-3">
            9.3. A presente autorização integra o escopo contratual dos referidos
            planos e vigora enquanto mantida a relação ou até manifestação de
            oposição nos termos da LGPD.
          </p>
        </>
      ) : (
        <>
          <h3 className="font-bold mt-3 mb-1 border-t border-border pt-2">
            CLÁUSULA 9ª — DOS DEMAIS PLANOS: CONTATO COMERCIAL SOB CONSENTIMENTO
            ESPECÍFICO
          </h3>
          <p className="mb-3">
            9.1. Para os planos <strong>Intermediário</strong>,{" "}
            <strong>Avançado</strong>, <strong>Completo</strong> e{" "}
            <strong>Sob consulta</strong>, o tratamento de dados pessoais para
            fins de marketing, prospecção ou contato comercial{" "}
            <strong>adicional</strong> ao estritamente necessário à execução do
            serviço contratado dependerá da manifestação expressa do
            CONTRATANTE na caixa de seleção específica (&quot;disponibilizo dados
            para contato&quot;) apresentada no formulário de cadastro, nos termos
            do art. 8º da LGPD.
          </p>
        </>
      )}

      <h3 className="font-bold mt-3 mb-1">
        CLÁUSULA 10ª — DA CONFIDENCIALIDADE
      </h3>
      <p className="mb-3">
        10.1. As partes manterão confidenciais informações técnicas ou comerciais
        não públicas a que tenham acesso em razão deste contrato, salvo
        divulgação exigida por lei ou ordem judicial.
      </p>

      <h3 className="font-bold mt-3 mb-1">
        CLÁUSULA 11ª — DAS COMUNICAÇÕES ELETRÔNICAS
      </h3>
      <p className="mb-3">
        11.1. Notificações relacionadas ao serviço poderão ser enviadas ao
        e-mail cadastrado, presumindo-se recebidas após envio, salvo prova em
        contrário.
      </p>

      <h3 className="font-bold mt-3 mb-1">
        CLÁUSULA 12ª — DA NULIDADE PARCIAL E TOLERÂNCIA
      </h3>
      <p className="mb-3">
        12.1. A eventual nulidade ou ineficácia de cláusula, na medida em que
        declarada por autoridade competente, não prejudicará a validade das
        demais. A tolerância a infrações não implicará renúncia a direitos.
      </p>

      <h3 className="font-bold mt-3 mb-1">
        CLÁUSULA 13ª — DA LEI APLICÁVEL E FORO
      </h3>
      <p className="mb-2">
        13.1. Aplica-se a legislação brasileira. Quando o CONTRATANTE for
        consumidor nos termos do Código de Defesa do Consumidor, serão observadas
        as normas imperativas de proteção ao consumidor, sem prejuízo do
        equilíbrio contratual em cláusulas válidas.
      </p>
      <p className="mb-3">
        13.2. Fica eleito o foro da comarca de <strong>Belo Horizonte</strong>,
        Estado de <strong>Minas Gerais</strong>, com renúncia a qualquer outro,
        por mais privilegiado que seja, salvo competência absoluta de outro
        foro por disposição legal imperativa.
      </p>

      <h3 className="font-bold mt-3 mb-1">
        CLÁUSULA 14ª — DAS DISPOSIÇÕES FINAIS
      </h3>
      <p className="mb-2">
        14.1. Este instrumento constitui o entendimento integral entre as
        partes quanto ao objeto, substituindo tratativas anteriores sobre a
        mesma matéria.
      </p>
      <p className="mb-3">
        14.2. O aceite eletrônico, com uso de login e senha ou confirmação em
        tela, produz os mesmos efeitos de assinatura física, nos termos da
        Medida Provisória nº 2.200-2/2001 e legislação correlata, quando
        aplicável.
      </p>

      {!gOrB && (
        <div className="mt-3 rounded-md border border-primary/30 bg-primary/5 p-2 text-[11px]">
          <strong>Atenção:</strong> para o plano selecionado, além de aceitar este
          contrato, você deverá marcar a opção específica de disponibilização de
          dados para contato comercial no formulário abaixo do texto contratual.
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
  if (!pkg) return false;
  return !isGratuitoOuBasico(pkg);
}
