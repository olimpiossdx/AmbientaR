import { DropdownMenu } from '../componentes';
import { DemoCard, ExampleShell, buttonClassName } from './_example-shell';

export default function DropdownMenuExample() {
 return (
  <ExampleShell title="DropdownMenu" description="Menu de ações acionado por botão com itens desabilitados e destrutivos." checks={["role menu", "Fecha ao selecionar", "Suporta item destructive"]}>
   <DemoCard title="Ações do registro" className="overflow-visible" contentClassName="min-h-[12rem] overflow-visible">
    <DropdownMenu trigger={<span className={buttonClassName}>Abrir menu</span>} items={[{ label: 'Editar' }, { label: 'Duplicar' }, { label: 'Arquivar', disabled: true }, { label: 'Excluir', destructive: true }]} />
   </DemoCard>
  </ExampleShell>
 );
}
