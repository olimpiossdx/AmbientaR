import { Tabs } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

export default function TabsExample() {
 return (
  <ExampleShell title="Tabs" description="Navegação por abas com conteúdo controlado por value." checks={["role tablist", "defaultValue", "Itens desabilitados"]}>
   <DemoCard title="Cadastro">
    <Tabs defaultValue="dados" items={[{ value: 'dados', label: 'Dados', content: <p className="text-sm text-slate-600">Dados básicos do cliente.</p> }, { value: 'enderecos', label: 'Endereços', content: <p className="text-sm text-slate-600">Lista de endereços cadastrados.</p> }, { value: 'faturamento', label: 'Faturamento', content: <p>Bloqueado.</p>, disabled: true }]} />
   </DemoCard>
  </ExampleShell>
 );
}
