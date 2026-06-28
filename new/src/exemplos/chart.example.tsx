import { ChartContainer, ChartLegend, ChartTooltip } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

const data = [{ label: 'Jan', receita: 68, meta: 80 }, { label: 'Fev', receita: 86, meta: 80 }, { label: 'Mar', receita: 74, meta: 80 }];

export default function ChartExample() {
 return (
  <ExampleShell title="Chart" description="Container de gráfico com legenda e tooltip para compor visualizações customizadas." checks={["Contexto de config", "Legend reutilizável", "Tooltip estilizado"]}>
   <DemoCard title="Receita mensal" scroll="x" contentClassName="pb-2">
    <ChartContainer className="min-w-[640px]" config={{ receita: { label: 'Receita', color: '#0284c7' }, meta: { label: 'Meta', color: '#94a3b8' } }}>
     <ChartLegend className="mb-6" />
     <div role="img" aria-label="Receita mensal por percentual: janeiro 68 de 100, fevereiro 86 de 100, março 74 de 100. Meta mensal: 80 de 100.">
      <div className="grid gap-4" aria-hidden="true">
       {data.map((item) => <div key={item.label} className="grid grid-cols-[3rem_1fr] items-center gap-3 text-sm"><span className="font-medium text-slate-500">{item.label}</span><div className="relative h-8 rounded-full bg-slate-100"><div className="h-8 rounded-full bg-sky-600" style={{ width: `${item.receita}%` }} /><span className="absolute inset-y-0 left-[80%] w-px bg-slate-400" /></div></div>)}
      </div>
     </div>
     <table className="sr-only">
      <caption>Dados do gráfico de receita mensal</caption>
      <thead><tr><th>Mês</th><th>Receita</th><th>Meta</th></tr></thead>
      <tbody>{data.map((item) => <tr key={item.label}><td>{item.label}</td><td>{item.receita}</td><td>{item.meta}</td></tr>)}</tbody>
     </table>
     <ChartTooltip className="mt-4">Passe o mouse no gráfico real para exibir detalhes; este exemplo demonstra a composição visual.</ChartTooltip>
    </ChartContainer>
   </DemoCard>
  </ExampleShell>
 );
}
