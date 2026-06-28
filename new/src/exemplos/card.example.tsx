import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Button } from '../componentes';
import { DemoCard, ExampleShell, primaryButtonClassName } from './_example-shell';

export default function CardExample() {
 return (
  <ExampleShell title="Card" description="Container de conteúdo com header, descrição, conteúdo e rodapé." checks={["Composição semântica", "Padding consistente", "Aceita conteúdo livre"]}>
   <DemoCard title="Card composto">
    <Card className="max-w-xl">
     <CardHeader><CardTitle>Resumo do cliente</CardTitle><CardDescription>Dados principais e status de relacionamento.</CardDescription></CardHeader>
     <CardContent><dl className="grid gap-2 text-sm"><div className="flex justify-between"><dt className="text-slate-500">Status</dt><dd className="font-medium">Ativo</dd></div><div className="flex justify-between"><dt className="text-slate-500">Plano</dt><dd className="font-medium">Enterprise</dd></div></dl></CardContent>
     <CardFooter><Button className={primaryButtonClassName} type="button">Abrir cadastro</Button></CardFooter>
    </Card>
   </DemoCard>
  </ExampleShell>
 );
}
