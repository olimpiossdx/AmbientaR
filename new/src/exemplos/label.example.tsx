import { Label } from '../componentes';
import { DemoCard, ExampleShell, inputClassName } from './_example-shell';

export default function LabelExample() {
 return (
  <ExampleShell
   title="Label"
   description="Rótulo acessível com indicador obrigatório e opcional."
   checks={["Usa htmlFor", "Marca obrigatório visualmente", "Permite texto opcional"]}
  >
   <DemoCard title="Variações">
    <div className="grid gap-4 md:grid-cols-2">
     <div className="grid gap-1.5"><Label htmlFor="nome" required>Nome</Label><input id="nome" className={inputClassName} placeholder="Nome completo" /></div>
     <div className="grid gap-1.5"><Label htmlFor="apelido" optional>Apelido</Label><input id="apelido" className={inputClassName} placeholder="Como deseja ser chamado" /></div>
     <div className="grid gap-1.5"><Label htmlFor="codigo" optional="(gerado automaticamente)">Código</Label><input id="codigo" className={inputClassName} defaultValue="CLI-1024" /></div>
    </div>
   </DemoCard>
  </ExampleShell>
 );
}
