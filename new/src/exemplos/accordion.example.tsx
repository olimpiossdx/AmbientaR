import { Accordion } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

export default function AccordionExample() {
 return (
  <ExampleShell title="Accordion" description="Lista expansível em modo single ou multiple." checks={["Controle single/multiple", "aria-expanded", "Itens desabilitados"]}>
   <DemoCard title="FAQ">
    <Accordion defaultValue="form" items={[{ value: 'form', title: 'Como integra com formulário?', content: 'Campos preservam name e eventos nativos sempre que necessário.' }, { value: 'theme', title: 'Como customizar estilo?', content: 'Use className para compor Tailwind sem perder o padrão base.' }, { value: 'disabled', title: 'Item indisponível', content: 'Não deve abrir.', disabled: true }]} />
   </DemoCard>
  </ExampleShell>
 );
}
