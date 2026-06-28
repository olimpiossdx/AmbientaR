import React from 'react';
import { Sheet, Button } from '../componentes';
import { DemoCard, ExampleShell, primaryButtonClassName } from './_example-shell';

export default function SheetExample() {
 const [open, setOpen] = React.useState(false);
 return (
  <ExampleShell title="Sheet" description="Painel lateral ou inferior para fluxos auxiliares." checks={["Usa portal", "Fecha pelo overlay", "Suporta lados"]}>
   <DemoCard title="Painel lateral" className="overflow-visible" contentClassName="min-h-[10rem] overflow-visible">
    <Button className={primaryButtonClassName} type="button" onClick={() => setOpen(true)}>Abrir sheet</Button>
    <Sheet open={open} onOpenChange={setOpen} side="right"><h3 className="text-lg font-bold text-slate-950">Filtros avançados</h3><p className="mt-2 text-sm text-slate-600">Configure filtros sem sair da tela principal.</p><Button className="mt-6 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white" type="button" onClick={() => setOpen(false)}>Fechar</Button></Sheet>
   </DemoCard>
  </ExampleShell>
 );
}
