import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

const rows = Array.from({ length: 18 }, (_, index) => ({ id: `PED-${String(index + 1).padStart(3, '0')}`, cliente: ['Ana', 'Bruno', 'Clara', 'Diego'][index % 4], status: ['Pago', 'Pendente', 'Cancelado', 'Em análise'][index % 4], origem: ['Web', 'Loja', 'App'][index % 3], total: `R$ ${(120 + index * 37).toFixed(2)}` }));

export default function TableExample() {
  return (
    <ExampleShell title="Table" description="Tabela responsiva composta por subcomponentes semânticos." checks={["Mantém elementos table", "Wrapper com overflow", "Header/body/caption"]}>
      <DemoCard title="Pedidos recentes" scroll="both" contentClassName="max-h-[30rem]">
        <Table className="min-w-190"><TableCaption>Lista simplificada de pedidos com rolagem horizontal e vertical.</TableCaption><TableHeader><TableRow><TableHead>Pedido</TableHead><TableHead>Cliente</TableHead><TableHead>Status</TableHead><TableHead>Origem</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader><TableBody>{rows.map((row) => <TableRow key={row.id}><TableCell className="font-medium">{row.id}</TableCell><TableCell>{row.cliente}</TableCell><TableCell>{row.status}</TableCell><TableCell>{row.origem}</TableCell><TableCell className="text-right">{row.total}</TableCell></TableRow>)}</TableBody></Table>
      </DemoCard>
    </ExampleShell>
  );
}
