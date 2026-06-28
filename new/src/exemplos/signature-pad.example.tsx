import React from 'react';
import { SignaturePad } from '../componentes';
import { DemoCard, ExampleShell } from './_example-shell';

export default function SignaturePadExample() {
 const [value, setValue] = React.useState('');
 return (
  <ExampleShell title="SignaturePad" description="Campo de assinatura em canvas com input hidden para formulários." checks={["Gera dataURL", "Botão limpar", "Integra com name"]}>
   <DemoCard title="Assinatura" scroll="x" contentClassName="pb-2">
    <SignaturePad name="assinatura" onChange={setValue} />
    <p className="mt-3 text-xs text-slate-500">Valor gerado: {value ? `${value.slice(0, 42)}...` : 'vazio'}</p>
   </DemoCard>
  </ExampleShell>
 );
}
