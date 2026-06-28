import { Avatar } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

export default function AvatarExample() {
 return (
  <ExampleShell title="Avatar" description="Representação visual de usuário com imagem, fallback e tamanhos." checks={["Fallback automático", "Tratamento de erro de imagem", "Tamanhos sm/md/lg"]}>
   <DemoCard title="Usuários">
    <div className="flex items-center gap-4"><Avatar size="sm" alt="Ana Maria" fallback="AM" /><Avatar alt="Carlos Silva" fallback="CS" /><Avatar size="lg" src="https://invalid.local/avatar.png" alt="Maria Souza" fallback="MS" /></div>
   </DemoCard>
  </ExampleShell>
 );
}
