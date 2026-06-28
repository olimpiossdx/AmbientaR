/**
 * Exemplo com Arrays Dinâmicos – Adição e remoção de itens em uma lista
 * 
 * Recursos demonstrados:
 * - Gerenciamento de arrays de objetos (`itens: ItemPedido[]`) e arrays primitivos (`tags: string[]`)
 * - Adição e remoção dinâmica de campos usando estado React fora do hook
 * - Uso do `MutationObserver` (interno ao hook) para preencher campos recém-adicionados
 * - API `getModel()` para obter o modelo completo e `getFieldValue()` para leitura parcial
 * 
 * Público: Desenvolvedores que precisam de formulários com listas dinâmicas (pedidos, contatos, etc.)
 * 
 * ⚠️ LIMITAÇÃO CONHECIDA:
 * - A reordenação de itens (ex.: drag-and-drop) NÃO é suportada automaticamente.
 *  Os índices no DOM são fixos baseados na ordem renderizada. Se um item mudar de posição,
 *  seus valores continuarão associados ao índice original, não à posição visual.
 * - Para reordenação, é necessário recarregar o modelo manualmente ou remontar o formulário.
 * 
 * Como funciona a adição de itens:
 * 1. O botão "Adicionar Item" atualiza o estado `itens` com um novo objeto.
 * 2. O React re-renderiza, criando novos elementos `<Input>` com índices atualizados.
 * 3. O `MutationObserver` do useForm detecta a adição dos novos campos no DOM.
 * 4. O hook aplica os valores atuais de `modelRef.current` (que contém o array atualizado)
 *  a esses novos campos, preenchendo-os com os dados do modelo (ex.: `produtoId` vazio,
 *  `quantidade` 1, etc.).
 * 5. O usuário pode então interagir com os novos campos.
 */

import React from "react";
import { useForm } from "../hook/use-from";
import { Button, Input } from '../componentes';

interface ItemPedido {
 id: string;
 produtoId: string;
 quantidade: number;
}

interface PedidoModel {
 cliente: {
  nome: string;
  email: string;
 };
 itens: ItemPedido[];
 tags: string[];
}

const ExemploFormComArray: React.FC = () => {
 // Estado local gerenciando a lista de itens – usado para renderizar e também passado ao hook
 const [itens, setItens] = React.useState<ItemPedido[]>([
  { id: '1', produtoId: 'prod-1', quantidade: 2 },
  { id: '2', produtoId: 'prod-2', quantidade: 1 },
 ]);
 const [tags, setTags] = React.useState<string[]>(['react', 'typescript']);

 const handleSubmit = (model: PedidoModel) => {
  console.log("[Exemplo Array] Model submetido:", model);
 };

 const { formProps, getModel, getFieldValue } = useForm<PedidoModel>({
  id: "pedido-form-array",
  onSubmit: handleSubmit,
  model: {
   cliente: { nome: "João", email: "joao@email.com" },
   itens,   // 🔑 estado local passado como modelo inicial
   tags,
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

 const adicionarTag = () => {
  const novaTag = prompt('Nova tag:');
  if (novaTag && !tags.includes(novaTag)) {
   setTags(prev => [...prev, novaTag]);
  } else if (novaTag) {
   alert('Tag já existe. Use valores únicos.');
  }
 };

 const removerTag = (index: number) => {
  setTags(prev => prev.filter((_, i) => i !== index));
 };

 const handleDadosAtuais = () => {
  const dados = getModel();
  console.log("[Exemplo Array] Dados atuais do form:", dados);

  const cliente = getFieldValue('cliente');
  console.log("[Exemplo Array] getFieldValue('cliente'):", cliente);
 };

 return (
  <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
   <h2 className="text-2xl font-bold text-slate-900 mb-6">
    📦 Exemplo de Formulário com Arrays Dinâmicos
   </h2>

   <form {...formProps} className="flex flex-col gap-6">
    {/* ────────── Seção Cliente ────────── */}
    <fieldset className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
     <legend className="px-1 text-base font-semibold text-slate-700 mb-3">
      👤 Cliente
     </legend>
     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
       <label htmlFor="pedido-array-cliente-nome" className="block text-sm font-medium text-slate-600 mb-2">
        Nome
       </label>
       <Input
        id="pedido-array-cliente-nome"
        name="cliente.nome"
        placeholder="Nome"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
      </div>
      <div>
       <label htmlFor="pedido-array-cliente-email" className="block text-sm font-medium text-slate-600 mb-2">
        Email
       </label>
       <Input
        id="pedido-array-cliente-email"
        name="cliente.email"
        placeholder="Email"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
      </div>
     </div>
    </fieldset>

    {/* ────────── Seção Itens (array de objetos) ────────── */}
    <fieldset className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
     <legend className="px-1 text-base font-semibold text-slate-700 mb-3">
      📦 Itens do Pedido
     </legend>

     <div className="space-y-4 mb-4">
      {itens.map((item, index) => (
       <div
        key={item.id}
        className="border border-slate-100 rounded-lg p-4 flex flex-wrap items-center gap-4 bg-white hover:bg-slate-50 transition"
       >
        {/* Campo oculto para o id – mantém a associação mesmo se o usuário não editar */}
        <Input
         type="hidden"
         name={`itens.${index}.id`}
         value={item.id}
        />

        <div className="flex-1 min-w-20 max-w-50">
         <label htmlFor={`pedido-array-item-${index}-produto`} className="block text-xs font-medium text-slate-500 mb-1 whitespace-nowrap">
          Produto
         </label>
         <Input
          id={`pedido-array-item-${index}-produto`}
          name={`itens.${index}.produtoId`}
          placeholder="ID do Produto"
          className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
         />
        </div>

        <div className="w-16">
         <label htmlFor={`pedido-array-item-${index}-quantidade`} className="block text-xs font-medium text-slate-500 mb-1 whitespace-nowrap">
          Qtd
         </label>
         <Input
          id={`pedido-array-item-${index}-quantidade`}
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

    {/* ────────── Seção Tags (array primitivo) ────────── */}
    <fieldset className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
     <legend className="px-1 text-base font-semibold text-slate-700 mb-3">
      🏷️ Tags
     </legend>

     <div className="flex flex-wrap gap-3 mb-4">
      {tags.map((tag, index) => (
       <div
        key={tag}
        className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 transition text-sm"
       >
        <Input
         name={`tags.${index}`}
         aria-label={`Tag ${index + 1}`}
         className="w-24 h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
        />
        <Button
         type="button"
         onClick={() => removerTag(index)}
         className="bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium px-2 py-1 rounded-md transition"
        >
         ×
        </Button>
       </div>
      ))}
     </div>

     <Button
      type="button"
      onClick={adicionarTag}
      className="bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium px-4 py-2 rounded-md transition flex items-center gap-2"
     >
      ＋ Adicionar Tag
     </Button>
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
      onClick={handleDadosAtuais}
      className="bg-gray-600 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-md transition shadow-sm"
     >
      🔍 Ver Dados Atuais
     </Button>
    </div>
   </form>
  </div>
 );
};

export default ExemploFormComArray;