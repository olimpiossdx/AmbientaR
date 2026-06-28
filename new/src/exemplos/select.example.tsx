import { Select } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

export default function SelectExample() {
 return (
  <ExampleShell title="Select" description="Select nativo estilizado com label, placeholder, opções e estado inválido." checks={["Mantém semântica nativa", "Aceita options ou children", "Expõe invalid"]}>
   <DemoCard title="Formulário">
    <div className="grid gap-4 md:grid-cols-2">
     <Select name="status" label="Status" placeholder="Selecione" defaultValue="ativo" options={[{ value: 'ativo', label: 'Ativo' }, { value: 'pausado', label: 'Pausado' }, { value: 'cancelado', label: 'Cancelado', disabled: true }]} />
     <Select name="uf" label="UF" invalid defaultValue=""><option value="">Selecione</option><option value="SP">São Paulo</option><option value="RJ">Rio de Janeiro</option></Select>
    </div>
   </DemoCard>
  </ExampleShell>
 );
}
