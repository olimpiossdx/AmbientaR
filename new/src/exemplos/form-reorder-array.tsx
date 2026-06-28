/**
 * Exemplo de Reordenação de Array – Demonstra a limitação conhecida
 * 
 * ⚠️ LIMITAÇÃO CONHECIDA DO `useForm`:
 * - A reordenação de itens em arrays dinâmicos (ex.: drag-and-drop) NÃO é suportada automaticamente.
 * - Os campos no DOM têm nomes fixos baseados no índice (ex.: `itens.0.nome`, `itens.1.nome`).
 * - Quando o usuário reordena visualmente (ex.: troca a posição de dois itens), o React re-renderiza
 *  com os índices trocados, mas os valores que estavam associados aos índices originais permanecem.
 * - O resultado é que os dados não acompanham a ordem visual.
 * 
 * Cenário de exemplo:
 * 1. Adicione dois itens: "Maçã" e "Banana".
 * 2. Troque a ordem visualmente (botão "↑" / "↓").
 * 3. O campo "Maçã" continua com o valor "Maçã", mas agora no índice 1 (visualmente abaixo).
 * 4. O modelo submetido mantém os valores nos índices originais, não na ordem visual.
 * 
 * Workarounds possíveis:
 * - Evite reordenação; use adição/remoção apenas.
 * - Se for necessário reordenar, force o recarregamento do modelo manualmente após a reordenação,
 *  usando `loadModel` (não exposto atualmente) ou remontando o componente.
 * - Mantenha uma `key` estável baseada no ID do item, mas isso só resolve a identidade visual,
 *  não a associação dos valores. A solução completa exigiria reatribuir os valores aos novos índices.
 * 
 * Público: Desenvolvedores que entendem a limitação e querem testá-la ou planejar alternativas.
 */

import React from "react";
import { useForm } from "../hook/use-from";
import { Button, Input } from '../componentes';

interface Item {
 id: string;
 nome: string;
}

interface Modelo {
 itens: Item[];
}

const ExemploReorderArray: React.FC = () => {
 const [itens, setItens] = React.useState<Item[]>([
  { id: "1", nome: "Maçã" },
  { id: "2", nome: "Banana" },
  { id: "3", nome: "Laranja" },
 ]);

 const { formProps, getModel } = useForm<Modelo>({
  id: "form-reorder",
  onSubmit: (model) => {
   console.log("[Reorder] Modelo submetido:", model);
   alert(`Dados enviados (veja console). Ordem enviada: ${model.itens.map(i => i.nome).join(" → ")}`);
  },
  model: { itens },
 });

 // Função para mover item para cima (índice -1)
 const moveUp = (index: number) => {
  if (index === 0) return;
  const newItens = [...itens];
  [newItens[index - 1], newItens[index]] = [newItens[index], newItens[index - 1]];
  setItens(newItens);
 };

 // Função para mover item para baixo (índice +1)
 const moveDown = (index: number) => {
  if (index === itens.length - 1) return;
  const newItens = [...itens];
  [newItens[index], newItens[index + 1]] = [newItens[index + 1], newItens[index]];
  setItens(newItens);
 };

 const verDadosAtuais = () => {
  const dados = getModel()!;
  console.log("[Reorder] Dados atuais (ordem dos índices):", dados);
  alert(`Ordem atual no modelo: ${dados.itens.map(i => i.nome).join(" → ")}`);
 };

 return (
  <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
   <h2 className="text-2xl font-bold text-slate-900 mb-6">
    🔄 Exemplo: Reordenação de Array (Limitação)
   </h2>

   <div className="bg-amber-50 border-l-4 border-amber-300 p-4 mb-6">
    <p className="text-sm text-amber-800 font-medium">⚠️ Limitação conhecida</p>
    <p className="text-sm text-amber-700">
     Este exemplo demonstra que a <strong>reordenação de itens não é suportada</strong> pelo `useForm`.
     Os valores permanecem associados aos índices originais, não à ordem visual.
     Use apenas adição/remoção. Para reordenar, é necessário recarregar o modelo manualmente.
    </p>
   </div>

   <form {...formProps} className="flex flex-col gap-6">
    <fieldset className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
     <legend className="px-1 text-base font-semibold text-slate-700 mb-3">
      📋 Lista de Frutas
     </legend>

     <div className="space-y-3">
      {itens.map((item, index) => (
       <div
        key={item.id}
        className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg bg-slate-50"
       >
        <span className="text-slate-500 text-sm w-6">{index}</span>
        <Input
         name={`itens.${index}.id`}
         type="hidden"
         defaultValue={item.id}
        />
        <Input
         name={`itens.${index}.nome`}
         defaultValue={item.nome}
         aria-label={`Nome da fruta na posição ${index + 1}`}
         className="flex-1 h-10 px-3 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-sky-100"
        />
        <Button
         type="button"
         onClick={() => moveUp(index)}
         disabled={index === 0}
         aria-label={`Mover ${item.nome} para cima`}
         className="px-2 py-1 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 rounded text-sm"
        >
         ↑
        </Button>
        <Button
         type="button"
         onClick={() => moveDown(index)}
         disabled={index === itens.length - 1}
         aria-label={`Mover ${item.nome} para baixo`}
         className="px-2 py-1 bg-gray-300 hover:bg-gray-400 disabled:opacity-50 rounded text-sm"
        >
         ↓
        </Button>
       </div>
      ))}
     </div>

     <div className="flex gap-3 mt-4 pt-3 border-t border-slate-200">
      <Button
       type="submit"
       className="bg-sky-600 hover:bg-sky-700 text-white font-medium px-4 py-2 rounded-md transition"
      >
       📤 Enviar
      </Button>
      <Button
       type="button"
       onClick={verDadosAtuais}
       className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-md transition"
      >
       🔍 Ver ordem atual
      </Button>
     </div>
    </fieldset>
   </form>

   <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-md mt-4">
    💡 Teste: Edite o nome de um item, depois reordene usando as setas. Observe que
    o valor editado permanece no índice original (ex.: se você mover "Maçã" para baixo,
    o valor "Maçã" continua no índice 0, mesmo visualmente na linha 1).
    A ordem enviada no submit é a dos índices, não a visual.
    <br /><br />
    <strong>Soluções:</strong> Evitar reordenação; ou, se inevitável, após reordenar,
    recarregar o formulário com os dados reordenados (ex.: remontar o componente ou
    usar uma API de recarga manual).
   </div>
  </div>
 );
};

export default ExemploReorderArray;