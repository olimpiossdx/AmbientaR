import { Menubar } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

export default function MenubarExample() {
 return (
  <ExampleShell title="Menubar" description="Barra de menus com itens aninhados para ações de tela." checks={["role menubar", "Submenus", "Itens desabilitados"]}>
   <DemoCard title="Menu principal" scroll="x" contentClassName="pb-16">
    <Menubar items={[{ label: 'Arquivo', children: [{ label: 'Novo' }, { label: 'Salvar' }, { label: 'Exportar' }] }, { label: 'Editar', children: [{ label: 'Copiar' }, { label: 'Colar', disabled: true }] }, { label: 'Ajuda' }]} />
   </DemoCard>
  </ExampleShell>
 );
}
