import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Button } from '../componentes';
import { DemoCard, ExampleShell, primaryButtonClassName, buttonClassName } from './_example-shell';

export default function DialogExample() {
 return (
  <ExampleShell title="Dialog" description="Janela modal independente, criada sem alterar a implementação de Modal." checks={["Usa portal", "Fecha com Escape", "Composição header/footer"]}>
   <DemoCard title="Dialog básico" className="overflow-visible" contentClassName="min-h-[10rem] overflow-visible">
    <Dialog><DialogTrigger className={primaryButtonClassName}>Abrir dialog</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Novo cliente</DialogTitle><DialogDescription>Preencha as informações principais antes de continuar.</DialogDescription></DialogHeader><div className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">Conteúdo livre do dialog.</div><DialogFooter><Button className={buttonClassName} type="button">Cancelar</Button><Button className={primaryButtonClassName} type="button">Salvar</Button></DialogFooter></DialogContent></Dialog>
   </DemoCard>
  </ExampleShell>
 );
}
