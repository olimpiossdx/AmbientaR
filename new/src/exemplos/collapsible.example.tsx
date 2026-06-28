import { Collapsible } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

export default function CollapsibleExample() {
 return (
  <ExampleShell title="Collapsible" description="Área simples de mostrar/ocultar conteúdo adicional." checks={["defaultOpen", "Trigger customizável", "Conteúdo livre"]}>
   <DemoCard title="Detalhes avançados">
    <Collapsible defaultOpen trigger={<span>Exibir detalhes técnicos</span>}><div className="rounded-lg bg-white p-4 text-sm text-slate-600 shadow-sm">Este bloco pode carregar configurações, metadados ou logs de auditoria.</div></Collapsible>
   </DemoCard>
  </ExampleShell>
 );
}
