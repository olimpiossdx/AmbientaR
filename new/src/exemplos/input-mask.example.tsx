import React from "react";
import Input from "../componentes/input";
import { DemoCard, ExampleShell } from "./_example-shell";

type Snapshot = {
  cpf: string;
  cnpj: string;
  telefone: string;
  cep: string;
  valor: string;
  codigo: string;
  protocolo: string;
};

const initialSnapshot: Snapshot = {
  cpf: "",
  cnpj: "",
  telefone: "",
  cep: "",
  valor: "",
  codigo: "",
  protocolo: "",
};

export default function InputMaskExample() {
  const [snapshot, setSnapshot] = React.useState<Snapshot>(initialSnapshot);

  const updateSnapshot = React.useCallback(
    (key: keyof Snapshot, value: string) => {
      setSnapshot((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  return (
    <ExampleShell
      title="Input com mask"
      description="A máscara agora é uma capacidade do Input. Quando a prop mask está preenchida, o onChange recebe o evento padrão e um segundo parâmetro com os valores mascarado e limpo. Não existe MaskedInput separado."
      checks={["Sem componente separado", "Sem data-mask/data-unmask", "mask-builder compartilhado"]}
    >
      <DemoCard title="Máscaras conhecidas">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Input
            name="cpf"
            label="CPF"
            mask="cpf"
            placeholder="Digite 12345678900"
            onChange={(_, payload) => updateSnapshot("cpf", payload.unmaskedValue)}
          />

          <Input
            name="cnpj"
            label="CNPJ"
            mask="cnpj"
            placeholder="Digite 12345678000199"
            onChange={(_, payload) => updateSnapshot("cnpj", payload.unmaskedValue)}
          />

          <Input
            name="telefone"
            label="Telefone"
            mask="phone"
            placeholder="Digite 11999998888"
            onChange={(_, payload) => updateSnapshot("telefone", payload.unmaskedValue)}
          />

          <Input
            name="cep"
            label="CEP"
            mask="cep"
            placeholder="Digite 01001000"
            onChange={(_, payload) => updateSnapshot("cep", payload.unmaskedValue)}
          />

          <Input
            name="valor"
            label="Valor"
            mask="currency"
            placeholder="Digite 123456"
            onChange={(_, payload) => updateSnapshot("valor", payload.unmaskedValue)}
          />
        </div>

        <p className="mt-4 rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm leading-6 text-sky-900">
          Dica: nos campos com preset, digite apenas os caracteres úteis. Exemplo: em CPF digite <strong>12345678900</strong> e o Input exibe <strong>123.456.789-00</strong>. Também funciona colando <strong>123.456.789-00</strong>.
        </p>
      </DemoCard>

      <DemoCard title="Código customizado">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            name="codigo"
            label="Código customizado"
            mask="AA-9999"
            placeholder="Digite AB1234"
            onChange={(_, payload) => updateSnapshot("codigo", payload.unmaskedValue)}
          />

          <Input
            name="protocolo"
            label="Protocolo alfanumérico"
            mask="***-999"
            placeholder="Digite A1B123"
            onChange={(_, payload) => updateSnapshot("protocolo", payload.unmaskedValue)}
          />
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
          <p className="font-semibold text-slate-900">Como preencher patterns customizados</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><code>9</code> aceita números.</li>
            <li><code>A</code> aceita letras.</li>
            <li><code>*</code> aceita letras ou números.</li>
            <li>Os separadores do pattern, como <code>-</code>, <code>.</code> e <code>/</code>, são inseridos automaticamente.</li>
          </ul>
          <p className="mt-2">
            Para <code>AA-9999</code>, digite <strong>AB1234</strong>. O campo exibirá <strong>AB-1234</strong> e o valor limpo será <strong>AB1234</strong>.
          </p>
        </div>
      </DemoCard>

      <DemoCard title="Valores limpos recebidos no onChange" className="xl:col-span-2" scroll={true}>
        <pre className="min-w-xl max-h-72 overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-50" tabIndex={0} aria-label="Resultado da máscara">
          {JSON.stringify(snapshot, null, 2)}
        </pre>
      </DemoCard>
    </ExampleShell>
  );
}
