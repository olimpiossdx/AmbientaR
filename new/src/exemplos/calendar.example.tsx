import React from 'react';
import { Calendar } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

export default function CalendarExample() {
 const [date, setDate] = React.useState(new Date());
 return (
  <ExampleShell title="Calendar" description="Calendário mensal simples para seleção de data." checks={["Navega entre meses", "Seleciona dia", "Permite disabledDate"]}>
   <DemoCard title="Seleção de data" scroll="x" contentClassName="pb-2">
    <div className="grid gap-4 md:grid-cols-[auto_1fr]"><Calendar value={date} onValueChange={setDate} disabledDate={(day) => day.getDay() === 0} /><pre className="rounded-lg bg-slate-950 p-4 text-xs text-white">{date.toISOString()}</pre></div>
   </DemoCard>
  </ExampleShell>
 );
}
