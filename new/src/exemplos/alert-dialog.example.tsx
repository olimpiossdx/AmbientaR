import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../componentes';
import { DemoCard, ExampleShell, buttonClassName } from './_example-shell';

export default function AlertDialogExample() {
 return (
  <ExampleShell title="AlertDialog" description="Dialog de confirmação para ações destrutivas ou críticas." checks={["Baseado em Dialog", "Ação destructive", "Mensagem clara"]}>
   <DemoCard title="Confirmação" className="overflow-visible" contentClassName="min-h-[10rem] overflow-visible">
    <AlertDialog><AlertDialogTrigger className={buttonClassName}>Excluir registro</AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir cliente?</AlertDialogTitle><AlertDialogDescription>Essa ação não poderá ser desfeita após a confirmação.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogAction variant="secondary">Cancelar</AlertDialogAction><AlertDialogAction variant="destructive">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
   </DemoCard>
  </ExampleShell>
 );
}
