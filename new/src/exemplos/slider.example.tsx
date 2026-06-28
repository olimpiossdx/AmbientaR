import { Slider } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

export default function SliderExample() {
 return (
  <ExampleShell title="Slider" description="Controle de intervalo baseado em input range nativo." checks={["Mantém input nativo", "Exibe valor", "Aceita min/max/step"]}>
   <DemoCard title="Preferências">
    <div className="grid gap-5"><Slider name="volume" label="Volume" min={0} max={100} defaultValue={60} showValue /><Slider name="prioridade" label="Prioridade" min={1} max={5} step={1} defaultValue={3} showValue /></div>
   </DemoCard>
  </ExampleShell>
 );
}
