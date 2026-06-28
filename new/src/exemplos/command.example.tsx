import { Command } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

export default function CommandExample() {
 return (
  <ExampleShell title="Command" description="Lista pesquisável de comandos ou atalhos da aplicação." checks={["Busca por label/value/keywords", "Estado vazio", "onSelect por item"]}>
   <DemoCard title="Paleta de comandos" scroll="y" contentClassName="max-h-[28rem]">
    <Command items={[{ value: 'novo-cliente', label: 'Novo cliente', keywords: ['cadastro', 'pessoa'] }, { value: 'novo-pedido', label: 'Novo pedido', keywords: ['venda'] }, { value: 'relatorios', label: 'Abrir relatórios' }, { value: 'desabilitado', label: 'Ação indisponível', disabled: true }]} />
   </DemoCard>
  </ExampleShell>
 );
}
