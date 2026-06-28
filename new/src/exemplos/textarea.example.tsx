import { Textarea } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

export default function TextareaExample() {
 return (
  <ExampleShell
   title="Textarea"
   description="Campo de texto multilinha com label, estado inválido e autoresize."
   checks={["Integra com forms nativos", "Suporta aria-invalid", "Autoresize acompanha o conteúdo"]}
  >
   <DemoCard title="Estados principais">
    <div className="grid gap-4 md:grid-cols-2">
     <Textarea name="observacao" label="Observação" placeholder="Digite uma observação..." defaultValue="Texto inicial do componente." />
     <Textarea name="mensagem" label="Mensagem com autoResize" autoResize placeholder="Escreva várias linhas para testar o crescimento automático." />
     <Textarea name="erro" label="Campo inválido" invalid defaultValue="Valor com pendência" />
     <Textarea name="desabilitado" label="Desabilitado" disabled defaultValue="Conteúdo bloqueado para edição." />
    </div>
   </DemoCard>
  </ExampleShell>
 );
}
