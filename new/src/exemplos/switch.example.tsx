import { Switch } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

export default function SwitchExample() {
 return (
  <ExampleShell title="Switch" description="Alternância booleana com role switch e descrição opcional." checks={["Usa input checkbox nativo", "Role switch acessível", "Suporta disabled e invalid"]}>
   <DemoCard title="Preferências">
    <div className="grid gap-4">
     <Switch name="email" label="Receber alertas por e-mail" description="Envia atualizações importantes para a caixa principal." defaultChecked />
     <Switch name="sms" label="SMS transacional" description="Usado apenas para notificações críticas." />
     <Switch name="bloqueado" label="Recurso bloqueado" disabled />
    </div>
   </DemoCard>
  </ExampleShell>
 );
}
