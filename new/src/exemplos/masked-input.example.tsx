import React from "react";
import Input from "../componentes/input";
import { DemoCard, ExampleShell } from "./_example-shell";

export default function MaskedInputExample() {
  const [cpf, setCpf] = React.useState("");
  const [telefone, setTelefone] = React.useState("");

  return (
    <ExampleShell
      title="Input com máscara"
      description="O componente MaskedInput foi substituído pelo Input com a prop mask. A máscara é somente apresentação; onChange, validação, model e submit trabalham com valor sem máscara."
      checks={["Usa Input", "mask somente visual", "Retorna valor sem máscara"]}
    >
      <DemoCard title="Compatibilidade do exemplo antigo">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            name="cpf"
            label="CPF"
            mask="cpf"
            placeholder="Digite 12345678900"
            onChange={(_, payload) => setCpf(payload.unmaskedValue)}
          />
          <Input
            name="telefone"
            label="Telefone"
            mask="phone"
            placeholder="Digite 11999998888"
            onChange={(_, payload) => setTelefone(payload.unmaskedValue)}
          />
        </div>

        <pre className="mt-4 max-h-72 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-50" tabIndex={0} aria-label="Resultado do campo mascarado">
          {JSON.stringify({ cpf, telefone }, null, 2)}
        </pre>
      </DemoCard>
    </ExampleShell>
  );
}
