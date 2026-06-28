import { Skeleton } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

export default function SkeletonExample() {
 return (
  <ExampleShell title="Skeleton" description="Placeholder de carregamento para cards, listas e avatares." checks={["Usa animate-pulse", "Suporta círculo", "Controlado por className"]}>
   <DemoCard title="Estado carregando">
    <div className="flex gap-4"><Skeleton circle className="h-12 w-12" /><div className="grid flex-1 gap-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-2/3" /><Skeleton className="h-24 w-full" /></div></div>
   </DemoCard>
  </ExampleShell>
 );
}
