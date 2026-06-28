import { Toaster, toast, Button } from '../componentes';
import { DemoCard, ExampleShell, buttonClassName } from './_example-shell';

export default function ToasterExample() {
 return (
  <ExampleShell title="Toaster" description="Container global de notificações e serviço toast." checks={["Tipos semânticos", "Dismiss manual", "Posicionamento"]}>
   <DemoCard title="Disparar notificações">
    <div className="flex flex-wrap gap-3"><Button className={buttonClassName} type="button" onClick={() => toast.success('Registro salvo com sucesso.', { title: 'Sucesso' })}>Success</Button><Button className={buttonClassName} type="button" onClick={() => toast.error('Não foi possível salvar.', { title: 'Erro' })}>Error</Button><Button className={buttonClassName} type="button" onClick={() => toast.info('Processamento iniciado.', { title: 'Info' })}>Info</Button><Button className={buttonClassName} type="button" onClick={() => toast.clear()}>Limpar</Button></div>
    <Toaster position="top-right" />
   </DemoCard>
  </ExampleShell>
 );
}
