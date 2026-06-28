import { Badge } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

export default function BadgeExample() {
 return (
  <ExampleShell title="Badge" description="Marcadores compactos para status, filtros e categorias." checks={["Variações semânticas", "Baixo peso visual", "Uso inline"]}>
   <DemoCard title="Variantes">
    <div className="flex flex-wrap gap-3"><Badge>Default</Badge><Badge variant="secondary">Secondary</Badge><Badge variant="success">Success</Badge><Badge variant="warning">Warning</Badge><Badge variant="error">Error</Badge><Badge variant="outline">Outline</Badge></div>
   </DemoCard>
  </ExampleShell>
 );
}
