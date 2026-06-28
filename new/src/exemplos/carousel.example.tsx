import { Carousel } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

export default function CarouselExample() {
 return (
  <ExampleShell title="Carousel" description="Carrossel horizontal com controles anterior/próximo." checks={["Modo loop", "Índice controlável", "Conteúdo livre por slide"]}>
   <DemoCard title="Destaques" scroll="x" contentClassName="pb-2">
    <Carousel loop className="min-w-[640px] max-w-4xl">
     {['Relatórios', 'Clientes', 'Automação'].map((item, index) => <div key={item} className="flex h-56 items-center justify-center bg-gradient-to-br from-sky-50 to-slate-100 text-2xl font-bold text-slate-800">{index + 1}. {item}</div>)}
    </Carousel>
   </DemoCard>
  </ExampleShell>
 );
}
