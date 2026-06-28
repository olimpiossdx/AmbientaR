import { Progress } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

export default function ProgressExample() {
 return (
  <ExampleShell title="Progress" description="Barra de progresso com atributos ARIA e percentual opcional." checks={["role progressbar", "Respeita max", "Exibe valor opcional"]}>
   <DemoCard title="Upload e processamento">
    <div className="grid gap-4"><Progress value={35} showValue /><Progress value={72} showValue /><Progress value={100} max={100} showValue /></div>
   </DemoCard>
  </ExampleShell>
 );
}
