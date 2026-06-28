import { RadioGroup, RadioGroupItem } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

export default function RadioGroupExample() {
 return (
  <ExampleShell title="RadioGroup" description="Grupo de opções exclusivas com name nativo para integração com formulário." checks={["Usa role radiogroup", "Compartilha name", "Suporta descrição por item"]}>
   <DemoCard title="Plano de atendimento">
    <RadioGroup name="plano" defaultValue="pro" className="max-w-xl">
     <RadioGroupItem value="basic" label="Basic" description="Recursos essenciais para começar." />
     <RadioGroupItem value="pro" label="Pro" description="Inclui automações e relatórios avançados." />
     <RadioGroupItem value="enterprise" label="Enterprise" description="Governança e suporte dedicado." />
     <RadioGroupItem value="legacy" label="Legado" description="Opção indisponível para novos contratos." disabled />
    </RadioGroup>
   </DemoCard>
  </ExampleShell>
 );
}
