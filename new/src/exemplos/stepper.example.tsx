import { Stepper } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

export default function StepperExample() {
 return (
  <ExampleShell title="Stepper" description="Indicador navegável de etapas com estado atual e concluído." checks={["Controlável ou não-controlado", "Anterior/próximo", "Descrição por etapa"]}>
   <DemoCard title="Fluxo de cadastro">
    <Stepper defaultIndex={1} steps={[{ title: 'Cliente', description: 'Dados pessoais' }, { title: 'Endereço', description: 'Entrega' }, { title: 'Revisão', description: 'Confirmar envio' }]} />
   </DemoCard>
  </ExampleShell>
 );
}
