import Alert from "../componentes/alert";

export function ExemploAlert() {
 return (
  <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6">
   <div className="space-y-4">
    <Alert variant="info" title="Informação">
     Esse formulário salva automaticamente os dados após o envio.
    </Alert>

    <Alert variant="success" title="Sucesso">
     Registro salvo com sucesso.
    </Alert>

    <Alert variant="warning" title="Atenção">
     Existem campos opcionais não preenchidos.
    </Alert>

    <Alert
     variant="error"
     title="Erro"
     onClose={() => console.log("fechar")}
    >
     Não foi possível concluir a operação.
    </Alert>

    <Alert variant="neutral" icon={false}>
     Mensagem neutra sem ícone.
    </Alert>
   </div>
  </div>
 );
}
