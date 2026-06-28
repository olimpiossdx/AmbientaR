/**
 * Exemplo com Checkboxes e Checkboxes Mestres (Select All)
 * 
 * Recursos demonstrados:
 * - Checkboxes comuns e checkboxes "mestre" que selecionam/deselecionam todos os itens de um grupo
 * - Uso de `value` em checkboxes para representar arrays de strings (categorias)
 * - Checkboxes para itens de array de objetos (itens.*.selecionado)
 * - Integração com o `useCheckboxMaster` interno do hook (convenção de nomes `master-*`)
 * 
 * Público: Desenvolvedores que precisam de grupos de checkboxes com funcionalidade "selecionar todos",
 * como listas de produtos, categorias, permissões, etc.
 * 
 * Como funcionam os checkboxes mestres neste hook:
 * 1. Qualquer checkbox com `name` começando com `master-` (ex.: `master-itens.selecionado`)
 *  é automaticamente tratado como checkbox mestre.
 * 2. O grupo de checkboxes "escravos" é determinado pelo sufixo após `master-`.
 *  Exemplo: `master-itens.selecionado` controla todos os checkboxes com nome
 *  iniciando por `itens.` e terminando com `.selecionado` (padrão: `itens.*.selecionado`).
 * 3. Quando o mestre é marcado/desmarcado, todos os escravos são sincronizados.
 * 4. Quando qualquer escravo muda, o mestre atualiza automaticamente seu estado
 *  (marcado se todos estiverem marcados, desmarcado caso contrário).
 * 5. O hook também suporta grupos aninhados e múltiplos mestres no mesmo formulário.
 * 
 * ⚠️ Atenção:
 * - O nome do mestre deve seguir o padrão `master-[grupo].[qualquer-coisa]`.
 * - O grupo (`[grupo]`) deve corresponder ao prefixo dos escravos.
 * - No caso de arrays, os escravos devem ter nomes como `itens.0.selecionado`, `itens.1.selecionado`, etc.
 */

import React from "react";
import { useForm } from '../hook/use-from';
import { Button, Input } from '../componentes';

interface ItemPedido {
 id: string;
 produtoId: string;
 quantidade: number;
}

interface PedidoModel {
 cliente: { nome: string; email: string };
 itens: ItemPedido[];
 categorias: string[];
}

// Gera 5 itens aleatórios para demonstração
const getMockup = () => Array.from({ length: 5 }, (_, index) => ({
 id: `${index + 1}`,
 produtoId: `prod-${index + 1}`,
 quantidade: Math.floor(Math.random() * 5) + 1,
}));

const ExemploFormComCheckbox: React.FC = () => {
 const [itens, setItens] = React.useState<ItemPedido[]>(getMockup());

 const { formProps, getModel } = useForm<PedidoModel>({
  id: "pedido-checkbox-form",
  onSubmit: (model) => console.log("[Exemplo Checkbox] Model submetido:", model),
  model: {
   cliente: { nome: "João", email: "joao@email.com" },
   itens,
   categorias: ["tech"], // valor inicial: apenas 'tech' marcado
  },
 });

 const adicionarItem = () => {
  const novoItem: ItemPedido = {
   id: Date.now().toString(),
   produtoId: '',
   quantidade: 1,
  };
  setItens(prev => [...prev, novoItem]);
 };

 const removerItem = (index: number) => {
  setItens(prev => prev.filter((_, i) => i !== index));
 };

 const verDadosAtuais = () => {
  const dados = getModel();
  console.log("[Exemplo Checkbox] Dados atuais do form:", dados);
 };

 return (
  <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
   <h2 className="text-2xl font-bold text-slate-900 mb-6">
    ☑️ Exemplo de Formulário com Checkboxes Mestres
   </h2>

   <form {...formProps} className="flex flex-col gap-6">
    {/* ────────── Seção Cliente ────────── */}
    <fieldset className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
     <legend className="px-1 text-base font-semibold text-slate-700 mb-3">
      👤 Cliente
     </legend>
     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
       <label htmlFor="pedido-checkbox-cliente-nome" className="block text-sm font-medium text-slate-600 mb-2">
        Nome
       </label>
       <Input
        id="pedido-checkbox-cliente-nome"
        name="cliente.nome"
        placeholder="Nome completo"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
      </div>
      <div>
       <label htmlFor="pedido-checkbox-cliente-email" className="block text-sm font-medium text-slate-600 mb-2">
        Email
       </label>
       <Input
        id="pedido-checkbox-cliente-email"
        name="cliente.email"
        placeholder="email@exemplo.com"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
      </div>
     </div>
    </fieldset>

    {/* ────────── Seção Itens (com checkbox mestre) ────────── */}
    <fieldset className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
     <legend className="px-1 text-base font-semibold text-slate-700 mb-3">
      📦 Itens do Pedido
     </legend>

     {/* Checkbox mestre para os itens – padrão master-[grupo] */}
     <label className="flex items-center gap-3 mb-4 cursor-pointer select-none">
      <Input
       type="checkbox"
       name="master-itens.selecionado"  // 🔑 'master-' prefixo + grupo 'itens'
       className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-100 cursor-pointer"
      />
      <span className="text-sm font-medium text-slate-700">
       Selecionar todos os itens
      </span>
     </label>

     <div className="space-y-4 mb-4">
      {itens.map((item, index) => (
       <div
        key={item.id}
        className="border border-slate-100 rounded-lg p-4 flex flex-wrap items-center gap-4 bg-white hover:bg-slate-50 transition"
       >
        {/* Checkbox escravo – nome deve seguir o padrão itens.${index}.selecionado */}
        <Input
         type="checkbox"
         name={`itens.${index}.selecionado`}
         aria-label={`Selecionar item ${index + 1}`}
         className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-100 cursor-pointer"
        />
        <Input
         type="hidden"
         name={`itens.${index}.id`}
         value={item.id}
        />

        <div className="flex-1 min-w-20 max-w-50">
         <label htmlFor={`pedido-checkbox-item-${index}-produto`} className="block text-xs font-medium text-slate-500 mb-1 whitespace-nowrap">
          Produto
         </label>
         <Input
          id={`pedido-checkbox-item-${index}-produto`}
          name={`itens.${index}.produtoId`}
          placeholder="ID do Produto"
          className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
         />
        </div>

        <div className="w-16">
         <label htmlFor={`pedido-checkbox-item-${index}-quantidade`} className="block text-xs font-medium text-slate-500 mb-1 whitespace-nowrap">
          Qtd
         </label>
         <Input
          id={`pedido-checkbox-item-${index}-quantidade`}
          name={`itens.${index}.quantidade`}
          type="number"
          min="0"
          className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
         />
        </div>

        <Button
         type="button"
         onClick={() => removerItem(index)}
         className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium px-3 py-1.5 rounded-md transition ml-auto"
        >
         ✕ Remover
        </Button>
       </div>
      ))}
     </div>

     <Button
      type="button"
      onClick={adicionarItem}
      className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-md transition flex items-center gap-2"
     >
      ＋ Adicionar Item
     </Button>
    </fieldset>

    {/* ────────── Seção Categorias (array de strings com mestre) ────────── */}
    <fieldset className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
     <legend className="px-1 text-base font-semibold text-slate-700 mb-3">
      🏷️ Categorias
     </legend>

     {/* Checkbox mestre para categorias – padrão master-[grupo] (grupo = 'categorias') */}
     <label className="flex items-center gap-3 mb-4 cursor-pointer select-none">
      <Input
       type="checkbox"
       name="master-categorias"  // 🔑 'master-' + grupo 'categorias'
       className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-100 cursor-pointer"
      />
      <span className="text-sm font-medium text-slate-700">
       Selecionar todas as categorias
      </span>
     </label>

     <div className="flex flex-wrap gap-3">
      {["tech", "design", "marketing", "vendas", "financeiro"].map(cat => (
       <label
        key={cat}
        className="flex items-center gap-2 cursor-pointer select-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 transition text-sm"
       >
        <Input
         type="checkbox"
         name="categorias"    // 🔑 todos os escravos com mesmo nome formam um array de valores
         value={cat}       // o valor associado será cat (string)
         className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-100 cursor-pointer"
        />
        <span className="font-medium text-slate-700 capitalize whitespace-nowrap">
         {cat}
        </span>
       </label>
      ))}
     </div>
    </fieldset>

    {/* ────────── Ações ────────── */}
    <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
     <Button
      type="submit"
      className="bg-sky-600 hover:bg-sky-700 text-white font-medium px-4 py-2 rounded-md transition shadow-sm"
     >
      📤 Enviar Pedido
     </Button>
     <Button
      type="button"
      onClick={verDadosAtuais}
      className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-md transition shadow-sm"
     >
      🔍 Ver Dados Atuais
     </Button>
    </div>
   </form>
  </div>
 );
};

export default ExemploFormComCheckbox;