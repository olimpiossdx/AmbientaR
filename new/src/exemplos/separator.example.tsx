import { Separator } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

export default function SeparatorExample() {
 return (
  <ExampleShell title="Separator" description="Separador visual horizontal ou vertical, decorativo ou semântico." checks={["Orientação horizontal", "Orientação vertical", "Role separator opcional"]}>
   <DemoCard title="Separação de conteúdo">
    <div className="grid gap-4">
     <div><p className="font-semibold text-slate-900">Dados pessoais</p><Separator className="my-3" /><p className="text-sm text-slate-600">Campos principais do cadastro.</p></div>
     <div className="flex h-16 items-center gap-4"><span>Resumo</span><Separator orientation="vertical" decorative={false} /><span>Histórico</span><Separator orientation="vertical" /><span>Anexos</span></div>
    </div>
   </DemoCard>
  </ExampleShell>
 );
}
