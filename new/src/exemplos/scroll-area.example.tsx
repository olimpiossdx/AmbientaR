import { ScrollArea } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

export default function ScrollAreaExample() {
 return (
  <ExampleShell title="ScrollArea" description="Container com rolagem vertical, horizontal ou ambas." checks={["Controla overflow", "Preserva conteúdo", "Orientação configurável"]}>
   <DemoCard title="Lista longa" scroll="both">
    <ScrollArea className="h-56 rounded-xl border border-slate-200 bg-white p-3">
     {Array.from({ length: 20 }, (_, index) => <div key={index} className="mb-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">Item de atividade #{index + 1}</div>)}
    </ScrollArea>
   </DemoCard>
  </ExampleShell>
 );
}
