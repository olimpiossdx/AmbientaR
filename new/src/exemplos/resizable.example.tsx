import { Resizable } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

export default function ResizableExample() {
 return (
  <ExampleShell title="Resizable" description="Área redimensionável usando resize nativo do navegador." checks={["Direção both/horizontal/vertical", "Min width/height", "Conteúdo com overflow"]}>
   <DemoCard title="Editor redimensionável" scroll="both" contentClassName="min-h-[14rem]">
    <Resizable direction="both" minWidth={260} minHeight={160} className="h-48 w-full max-w-3xl bg-white p-4 text-sm text-slate-600">Arraste o canto inferior direito para testar o redimensionamento.</Resizable>
   </DemoCard>
  </ExampleShell>
 );
}
