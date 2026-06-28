/**
 * Exemplo sem Modelo Inicial – Formulário que começa vazio
 * 
 * Recursos demonstrados:
 * - Uso do `useForm` sem fornecer a prop `model`
 * - Todos os campos começam vazios (ou com valores padrão do HTML, se houver)
 * - Submissão com log do modelo tipado (campos opcionais)
 * 
 * Público: Desenvolvedores que querem um formulário "em branco" sem valores pré-preenchidos.
 * 
 * Observações importantes:
 * - Sem `model`, o hook não carrega nenhum valor inicial – nem mesmo valores "default"
 *  definidos diretamente nos inputs (ex.: `<Input defaultValue="x">`) serão carregados.
 *  O formulário respeitará o estado real do DOM após a montagem.
 * - O tipo `ImModel` tem todos os campos opcionais (`?`), permitindo que o formulário
 *  não precise conter todos eles.
 * - O botão "Limpar" está presente no layout, mas NÃO está conectado ao `reset` do hook.
 *  Isso é proposital para mostrar a diferença: reset do HTML nativo vs. reset gerenciado.
 */

import React from "react";
import { useForm } from "../hook/use-from";
import { Button, Input, Select, Textarea } from '../componentes';

// Modelo com campos opcionais – adequado para formulário sem dados iniciais
interface ImModel {
 nome: string;
 sobreNome?: string;
 carros?: string;
 aceita: boolean;
 observacoes?: string;
 cor?: string;
}

const ExemploFormSemModel: React.FC = () => {
 const handleSubmit = (model: ImModel) => {
  console.log("[Exemplo sem Modelo] Dados enviados:", model);
 };

 // Nenhum `model` é passado – formulário começa vazio
 const { formProps } = useForm<ImModel>({ id: "form-sem-modelo", onSubmit: handleSubmit });

 return (
  <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
   <h2 className="text-2xl font-bold text-slate-900 mb-6">
    📄 Formulário sem Modelo Inicial
   </h2>

   <form {...formProps} className="flex flex-col gap-6">
    <fieldset className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
     <legend className="text-base font-semibold text-slate-700 mb-3">
      📝 Dados
     </legend>
     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex flex-col">
       <label htmlFor="nome" className="text-sm font-medium text-slate-600 mb-2">Nome</label>
       <Input
        type="text"
        name="nome"
        placeholder="Nome"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
      </div>

      <div className="flex flex-col">
       <label htmlFor="sobrenome" className="text-sm font-medium text-slate-600 mb-2">Sobrenome</label>
       <Input
        type="text"
        name="sobreNome"
        placeholder="Sobrenome"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
      </div>

      <div className="flex flex-col">
       <label htmlFor="carros" className="text-sm font-medium text-slate-600 mb-2">Carros</label>
       <Select
        name="carros"
        id="carros"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm bg-white"
       >
        <option value="">Selecione</option>
        <option value="1">Uno</option>
        <option value="2">Strada</option>
        <option value="3">HB20</option>
       </Select>
      </div>

      <div className="flex flex-col">
       <label htmlFor="cor" className="text-sm font-medium text-slate-600 mb-2">Cor favorita</label>
       <Input
        type="color"
        name="cor"
        id="cor"
        className="w-20 h-10 px-1 py-1 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition"
       />
      </div>
     </div>

     <div className="mt-4">
      <label className="flex items-center gap-2 cursor-pointer select-none">
       <Input
        type="checkbox"
        name="aceita"
        className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-100 cursor-pointer"
       />
       <span className="text-sm font-medium text-slate-700">Aceita termos?</span>
      </label>
     </div>

     <div className="mt-4">
      <label htmlFor="textarea" className="text-sm font-medium text-slate-600 mb-2 block">Observações</label>
      <Textarea
       name="observacoes"
       rows={3}
       placeholder="Observações..."
       className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm resize-y"
      />
     </div>
    </fieldset>

    <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
     <Button
      type="submit"
      className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-medium px-4 py-2 rounded-md transition shadow-sm"
     >
      📤 Enviar
     </Button>
     {/* 
      ⚠️ Este botão "Limpar" usa o comportamento nativo do HTML (reset do formulário).
      Ele NÃO está conectado ao `reset` do hook. Para usar o reset gerenciado,
      seria necessário obter `reset` do retorno do useForm e chamá-lo.
      Exemplo: const { formProps, reset } = useForm(...); depois <Button onClick={reset}>Reset</Button>
     */}
     <Button
      type="button"
      className="w-full sm:w-auto bg-slate-500 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded-md transition shadow-sm"
      onClick={() => {
       // Reset nativo: limpa os campos para os valores iniciais do HTML (vazios, pois não há modelo)
       const form = document.getElementById("form-sem-modelo") as HTMLFormElement | null;
       if (form) form.reset();
       console.log("[Exemplo sem Modelo] Reset nativo acionado (valores voltam ao estado inicial do DOM)");
      }}
     >
      🧹 Limpar (reset nativo)
     </Button>
    </div>
   </form>
  </div>
 );
};

export default ExemploFormSemModel;