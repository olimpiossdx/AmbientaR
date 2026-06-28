import { Tooltip, Button } from '../componentes';
import { DemoCard, ExampleShell, buttonClassName } from './_example-shell';

export default function TooltipExample() {
 return (
  <ExampleShell title="Tooltip" description="Dica contextual exibida em hover/focus." checks={["role tooltip", "Quatro posições", "Sem bloquear clique"]}>
   <DemoCard title="Ajuda contextual">
    <div className="flex flex-wrap gap-4"><Tooltip content="Informação no topo"><Button className={buttonClassName} type="button">Topo</Button></Tooltip><Tooltip side="right" content="Informação à direita"><Button className={buttonClassName} type="button">Direita</Button></Tooltip><Tooltip side="bottom" content="Informação abaixo"><Button className={buttonClassName} type="button">Baixo</Button></Tooltip></div>
   </DemoCard>
  </ExampleShell>
 );
}
