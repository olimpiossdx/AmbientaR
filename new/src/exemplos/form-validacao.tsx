/**
 * Exemplo de Validação Avançada – Com schema, wildcards, validação cruzada e feedback assíncrono
 *
 * Recursos demonstrados:
 * - Configuração de schema de validação com caminhos exatos e com wildcard `*` (para arrays)
 * - Validação síncrona com regras customizadas (fábricas `required`, `min`, `email`, etc.)
 * - Validação cruzada via `dependsOn`: quando um campo dependente muda, outro é revalidado
 * - Suporte a validação nativa (`mode: 'native'`) e customizada
 * - Exibição do estado `isValidating` para desabilitar botão durante validação assíncrona
 * - Uso de `defaultValue` em vez de `value` (para manter controle não controlado)
 *
 * Público: Desenvolvedores que precisam de validação complexa em formulários dinâmicos,
 * incluindo dependências entre campos, validação em arrays, e feedback visual.
 *
 * 🔍 Como funciona a validação neste exemplo:
 * 1. O `validation.schema` mapeia caminhos de campos para regras.
 * 2. Wildcard `*` em `itens.*.produtoId` significa que todos os campos com nome correspondente
 *  (ex.: `itens.0.produtoId`, `itens.1.produtoId`) serão validados com a mesma regra.
 * 3. `dependsOn` no validador `precoQuantidadeCoherenteValidator` faz com que, quando o campo
 *  `itens.*.quantidade` de qualquer índice mudar, o campo `itens.*.preco` do mesmo índice
 *  seja revalidado automaticamente.
 * 4. O hook usa `useValidation` internamente para gerenciar debounce, cancelamento de async,
 *  e o estado `isValidating`.
 * 5. O modo `native` aplica `setCustomValidity` + `reportValidity()` – exibindo mensagens
 *  nativas do navegador. Para UI customizada, seria necessário modo `custom` ou `both`.
 *
 * ⚠️ Limitação conhecida:
 * - Neste exemplo, os totais são calculados localmente (`totaisCalculados`) e não participam
 *  da validação do hook – são apenas exibição. Em um cenário real, você poderia validar o total
 *  também usando uma regra customizada.
 */

import React from "react";
import { useForm } from "../hook/use-from";
import { Button, Input } from '../componentes';
import type {
 CustomValidationRule,
 ValidationResult,
 ValidationConfig,
} from "../hook/use-validation.type";

// ─── Modelo ──────────────────────────────────────────────────────────────────

interface Item {
 id: string;
 produtoId: string;
 quantidade: number;
 preco: number;
}

interface PedidoModel {
 cliente: { nome: string; email: string };
 itens: Item[];
}

// ─── Validadores reutilizáveis (fábricas) ───────────────────────────────────

/**
 * Factory: campo obrigatório.
 * @param message mensagem de erro customizada
 */
const required = (
 message = "Campo obrigatório",
): CustomValidationRule<PedidoModel> => ({
 validate: (value): ValidationResult => ({
  valid: value !== undefined && value !== null && value !== "",
  message,
  type: "error",
 }),
});

/**
 * Factory: obrigatório ter nome e sobrenome (pelo menos duas palavras).
 */
const requiredNomeSobrenome = (
 message = "Nome e sobrenome obrigatório.",
): CustomValidationRule<PedidoModel> => ({
 validate: (value): ValidationResult => {
  const normalizedValue =
   typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
  const partes = normalizedValue.split(" ").filter(Boolean);
  return {
   valid: partes.length >= 2,
   message,
   type: "error",
  };
 },
});

/**
 * Factory: valor mínimo numérico.
 */
const min = (
 minValue: number,
 message?: string,
): CustomValidationRule<PedidoModel> => ({
 validate: (value): ValidationResult => ({
  valid: Number(value) >= minValue,
  message: message ?? `Mínimo: ${minValue}`,
  type: "error",
 }),
});

/**
 * Validador de e-mail (instância única).
 */
const emailValidator: CustomValidationRule<PedidoModel> = {
 validate: (value): ValidationResult => ({
  valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)),
  message: "E-mail inválido",
  type: "error",
 }),
};

/**
 * Validador cruzado: preço e quantidade devem resultar em um total positivo.
 *
 * Demonstra `dependsOn`: quando `quantidade` de um item muda, este validador (associado ao `preco`)
 * é disparado automaticamente, pois depende de `itens.*.quantidade`. O `event.target` é usado
 * para identificar qual índice do array foi alterado.
 */
const precoQuantidadeCoherenteValidator: CustomValidationRule<PedidoModel> = {
 dependsOn: ["itens.*.quantidade"],
 validate: (value, model, event): ValidationResult => {
  // Tenta extrair o índice do campo que disparou a validação (se foi quantidade)
  const elementName =
   (event?.target as HTMLElement | undefined)?.getAttribute("name") ?? "";

  const matchTarget = elementName.match(/itens\.(\d+)\./);
  const index = matchTarget ? Number(matchTarget[1]) : undefined;

  if (index === undefined) {
   return { valid: true };
  }

  const item = model.itens?.[index];
  if (!item) {
   return { valid: true };
  }

  const preco = Number(value);
  const quantidade = Number(item.quantidade);
  const total = preco * quantidade;

  if (total <= 0) {
   return {
    valid: false,
    message: `Preço × Quantidade deve ser maior que zero (atual: ${preco} × ${quantidade} = ${total})`,
    type: "error",
   };
  }

  return { valid: true };
 },
};

// ─── Utilitário de cálculo ───────────────────────────────────────────────────

function calcularTotal(preco: number, quantidade: number): number {
 return Number((preco * quantidade).toFixed(2));
}

// ─── Componente ───────────────────────────────────────────────────────────────

const ExemploPedido: React.FC = () => {
 const [itens, setItens] = React.useState<Item[]>([
  { id: "1", produtoId: "", quantidade: 1, preco: 10 },
 ]);

 const [totaisCalculados, setTotaisCalculados] = React.useState<number[]>([
  calcularTotal(10, 1),
 ]);

 const validation = React.useMemo<ValidationConfig<PedidoModel>>(
  () => ({
   schema: {
    "cliente.nome": [
     required("Nome é obrigatório"),
     requiredNomeSobrenome("É preciso informar nome e sobrenome."),
    ],

    "cliente.email": [required("E-mail é obrigatório"), emailValidator],

    "itens.*.produtoId": [required("Produto é obrigatório")],

    "itens.*.quantidade": [min(1, "Quantidade mínima: 1")],

    "itens.*.preco": [
     min(0.01, "Preço mínimo: 0.01"),
     precoQuantidadeCoherenteValidator,
    ],
   },

   validateOnBlur: true,
   invalidBlurFocusStrategy: "once",
   feedbackMode: "native",
   debounce: 300,
   validateOnChange: true,
  }),
  [],
 );

 const model = React.useMemo<Partial<PedidoModel>>(
  () => ({
   cliente: {
    nome: "",
    email: "",
   },
   itens,
  }),
  [itens],
 );

 const { formProps, isValidating } = useForm<PedidoModel>({
  id: "pedido",
  model,
  validation,
  onSubmit: (data, event) => {
   console.log("[Exemplo Validação] Pedido enviado:", data);
   console.log("[Exemplo Validação] Evento:", event);
  },
 });
 // Recalcula total quando preço ou quantidade mudam (apenas exibição)
 const handlePrecoChange = (index: number, novoPreco: number) => {
  const quantidade = itens[index]?.quantidade ?? 1;
  const novoTotal = calcularTotal(novoPreco, quantidade);
  setTotaisCalculados((prev) => {
   const atualizado = [...prev];
   atualizado[index] = novoTotal;
   return atualizado;
  });
 };

 const handleQuantidadeChange = (index: number, novaQuantidade: number) => {
  const preco = itens[index]?.preco ?? 0;
  const novoTotal = calcularTotal(preco, novaQuantidade);
  setTotaisCalculados((prev) => {
   const atualizado = [...prev];
   atualizado[index] = novoTotal;
   return atualizado;
  });
 };

 // Gerenciamento dinâmico de itens
 const adicionarItem = () => {
  const novoItem: Item = {
   id: Date.now().toString(),
   produtoId: "",
   quantidade: 1,
   preco: 0,
  };
  setItens((prev) => [...prev, novoItem]);
  setTotaisCalculados((prev) => [...prev, 0]);
 };

 const removerItem = (index: number) => {
  setItens((prev) => prev.filter((_, i) => i !== index));
  setTotaisCalculados((prev) => prev.filter((_, i) => i !== index));
 };

 return (
  <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
   <h2 className="text-2xl font-bold text-slate-900 mb-6">
    ✅ Exemplo de Validação Avançada (wildcards, dependsOn)
   </h2>

   <form {...formProps} className="flex flex-col gap-6">
    {/* ────────── Cliente ────────── */}
    <fieldset className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
     <legend className="text-base font-semibold text-slate-700 px-1">
      👤 Cliente
     </legend>
     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
      <div>
       <label className="block text-sm font-medium text-slate-600 mb-1">
        Nome
       </label>
       <Input
        name="cliente.nome"
        placeholder="Nome completo"
        required
        className="w-full h-10 px-3 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-sky-100"
       />
      </div>
      <div>
       <label className="block text-sm font-medium text-slate-600 mb-1">
        E-mail
       </label>
       <Input
        name="cliente.email"
        type="email"
        placeholder="email@exemplo.com"
        required
        className="w-full h-10 px-3 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-sky-100"
       />
      </div>
     </div>
    </fieldset>

    {/* ────────── Itens do Pedido ────────── */}
    <fieldset className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
     <legend className="text-base font-semibold text-slate-700 px-1">
      📦 Itens do Pedido
     </legend>

     <div className="space-y-4 mt-3 mb-4">
      {itens.map((item, index) => (
       <div
        key={item.id}
        className="border border-slate-100 rounded-lg p-4 flex flex-wrap items-end gap-4 bg-white hover:bg-slate-50 transition"
       >
        {/* Campo oculto para ID */}
        <Input
         type="hidden"
         name={`itens.${index}.id`}
         defaultValue={item.id}
        />

        {/* Produto */}
        <div className="flex-1 min-w-32">
         <label className="block text-xs font-medium text-slate-500 mb-1">
          Produto
         </label>
         <Input
          name={`itens.${index}.produtoId`}
          placeholder="ID do Produto"
          required
          className="w-full h-10 px-3 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-sky-100"
         />
        </div>

        {/* Quantidade */}
        <div className="w-20">
         <label className="block text-xs font-medium text-slate-500 mb-1">
          Qtd
         </label>
         <Input
          name={`itens.${index}.quantidade`}
          type="number"
          min="1"
          defaultValue={item.quantidade}
          onChange={(e) =>
           handleQuantidadeChange(index, Number(e.target.value))
          }
          className="w-full h-10 px-3 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-sky-100"
         />
        </div>

        {/* Preço */}
        <div className="w-24">
         <label className="block text-xs font-medium text-slate-500 mb-1">
          Preço
         </label>
         <Input
          name={`itens.${index}.preco`}
          type="number"
          min="0.01"
          step="0.01"
          defaultValue={item.preco}
          onChange={(e) =>
           handlePrecoChange(index, Number(e.target.value))
          }
          className="w-full h-10 px-3 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-sky-100"
         />
        </div>

        {/* Total (apenas exibição) */}
        <div className="w-28">
         <label className="block text-xs font-medium text-slate-500 mb-1">
          Total
         </label>
         <div className="w-full h-10 px-3 flex items-center border border-slate-200 rounded-md bg-slate-50 text-sm font-medium text-slate-700">
          R$ {(totaisCalculados[index] ?? 0).toFixed(2)}
         </div>
        </div>

        <Button
         type="button"
         onClick={() => removerItem(index)}
         className="h-10 px-3 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-md transition"
        >
         ✕
        </Button>
       </div>
      ))}
     </div>

     {/* Totalizador do pedido */}
     <div className="flex justify-end text-sm font-semibold text-slate-700 pr-14 mb-4">
      Total do pedido: R${" "}
      {totaisCalculados.reduce((acc, t) => acc + t, 0).toFixed(2)}
     </div>

     <Button
      type="button"
      onClick={adicionarItem}
      className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-md transition"
     >
      ＋ Adicionar Item
     </Button>
    </fieldset>

    {/* ────────── Ações ────────── */}
    <div className="flex gap-3 pt-4 border-t border-slate-200">
     <Button
      type="submit"
      disabled={isValidating}
      className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-md transition shadow-sm"
     >
      {isValidating ? "Validando..." : "📤 Enviar Pedido"}
     </Button>
    </div>
   </form>
  </div>
 );
};

export default ExemploPedido;
