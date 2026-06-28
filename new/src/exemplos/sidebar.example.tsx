import React from 'react';
import { Sidebar, Button } from '../componentes';
import { DemoCard, ExampleShell, buttonClassName } from './_example-shell';

export default function SidebarExample() {
 const [collapsed, setCollapsed] = React.useState(false);
 return (
  <ExampleShell title="Sidebar" description="Navegação lateral com estado colapsado." checks={["Largura configurável", "Modo collapsed", "Conteúdo livre"]}>
   <DemoCard title="Layout com sidebar" scroll="x" contentClassName="pb-2">
    <Button className={buttonClassName} type="button" onClick={() => setCollapsed((v) => !v)}>Alternar colapso</Button>
    <div className="mt-4 flex h-72 min-w-180 overflow-hidden rounded-xl border border-slate-200 bg-white"><Sidebar collapsed={collapsed} className="p-3"><div className="font-bold text-slate-900">{collapsed ? 'L' : 'Logo'}</div><nav className="mt-6 grid gap-2 text-sm text-slate-600"><span>Dashboard</span><span>Clientes</span><span>Relatórios</span></nav></Sidebar><main className="flex-1 p-6 text-sm text-slate-600">Conteúdo principal da aplicação.</main></div>
   </DemoCard>
  </ExampleShell>
 );
}
