/**
 * Exemplo Completo com Modelo – Todos os tipos de campos HTML5
 * 
 * Recursos demonstrados:
 * - Modelo inicial rico com todos os tipos de input: text, password, email, tel, url, search,
 *  date, datetime-local, month, week, time, number, range, color, checkbox, radio, file,
 *  hidden, textarea, select, datalist.
 * - Uso da função `reset` do hook – restaura todos os campos aos valores do modelo inicial
 * - Validação nativa do HTML (required, type, min, etc.) – sem configuração adicional
 * 
 * Público: Desenvolvedores que precisam de referência para mapear tipos de campo e 
 * valores iniciais, ou que querem entender o comportamento do reset gerenciado.
 * 
 * Observações importantes:
 * - O `model` é carregado apenas uma vez na montagem. Mudanças posteriores na prop `model`
 *  NÃO alteram os campos já preenchidos.
 * - O `reset()` do hook restaura os campos para os valores do modelo INICIAL (o que foi
 *  passado na criação), não para valores vazios ou para um novo modelo.
 * - Campos do tipo `file` NÃO são pré-preenchidos por questões de segurança do navegador.
 * - O campo `hidden` não é visível, mas seu valor estará presente no `getModel()`.
 */

import React from "react";
import { useForm } from "../hook/use-from";
import { Button, Input, Select, Textarea } from '../componentes';

/* ------------------- Modelo com todos os tipos suportados ------------------- */
interface ImModel {
 text: string;
 password: string;
 email: string;
 tel: string;
 url: string;
 search: string;
 date: string;
 datetimeLocal: string;
 month: string;
 week: string;
 time: string;
 number: string;
 range: string;
 color: string;
 checkbox: boolean;
 radio: string;
 file: FileList | null;
 hidden: string;
 textarea: string;
 select: string;
 datalist: string;
}

/* ------------------- Componente ------------------- */
const AppComModelo: React.FC = () => {
 const handleSubmit = (model: ImModel) => {
  console.log("[Exemplo Completo] Dados enviados (com modelo inicial):", model);
 };

 const { formProps, reset } = useForm<ImModel>({
  id: "form-com-modelo",
  onSubmit: handleSubmit,
  model: {
   text: "Texto padrão",
   password: "senha123",
   email: "usuario@exemplo.com",
   tel: "(11) 99999-9999",
   url: "https://exemplo.com",
   search: "busca inicial",
   date: "2026-04-21",
   datetimeLocal: "2026-04-21T14:30",
   month: "2026-04",
   week: "2026-W16",
   time: "14:30",
   number: "42",
   range: "50",
   color: "#ff5733",
   checkbox: true,
   radio: "op2",
   file: null,        // 🔒 arquivos não são pré-carregados
   hidden: "valor-oculto",
   textarea: "Texto inicial da textarea\ncom quebra de linha.",
   select: "strada",
   datalist: "Banana",
  },
 });

 return (
  <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
   <h2 className="text-2xl font-bold text-slate-900 mb-6">
    🧪 Exemplo de Formulário com Modelo (todos os tipos)
   </h2>

   <form {...formProps} className="flex flex-col gap-6">
    {/* ────────── Inputs de Texto e Básicos ────────── */}
    <fieldset className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
     <legend className="text-base font-semibold text-slate-700 mb-3">
      📝 Tipos de Input
     </legend>
     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex flex-col">
       <label htmlFor="text" className="text-sm font-medium text-slate-600 mb-2">Text</label>
       <Input
        type="text"
        name="text"
        id="text"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
      </div>

      <div className="flex flex-col">
       <label htmlFor="password" className="text-sm font-medium text-slate-600 mb-2">Password</label>
       <Input
        type="password"
        name="password"
        id="password"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
      </div>

      <div className="flex flex-col">
       <label htmlFor="email" className="text-sm font-medium text-slate-600 mb-2">E‑mail</label>
       <Input
        type="email"
        name="email"
        id="email"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
      </div>

      <div className="flex flex-col">
       <label htmlFor="tel" className="text-sm font-medium text-slate-600 mb-2">Telefone</label>
       <Input
        type="tel"
        name="tel"
        id="tel"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
      </div>

      <div className="flex flex-col">
       <label htmlFor="url" className="text-sm font-medium text-slate-600 mb-2">URL</label>
       <Input
        type="url"
        name="url"
        id="url"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
      </div>

      <div className="flex flex-col">
       <label htmlFor="search" className="text-sm font-medium text-slate-600 mb-2">Search</label>
       <Input
        type="search"
        name="search"
        id="search"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
      </div>
     </div>
    </fieldset>

    {/* ────────── Datas e Horas ────────── */}
    <fieldset className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
     <legend className="text-base font-semibold text-slate-700 mb-3">
      📅 Datas e Horas
     </legend>
     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <div className="flex flex-col">
       <label htmlFor="date" className="text-sm font-medium text-slate-600 mb-2">Date</label>
       <Input
        type="date"
        name="date"
        id="date"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
      </div>

      <div className="flex flex-col">
       <label htmlFor="datetimeLocal" className="text-sm font-medium text-slate-600 mb-2">Date‑time local</label>
       <Input
        type="datetime-local"
        name="datetimeLocal"
        id="datetimeLocal"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
      </div>

      <div className="flex flex-col">
       <label htmlFor="month" className="text-sm font-medium text-slate-600 mb-2">Month</label>
       <Input
        type="month"
        name="month"
        id="month"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
      </div>

      <div className="flex flex-col">
       <label htmlFor="week" className="text-sm font-medium text-slate-600 mb-2">Week</label>
       <Input
        type="week"
        name="week"
        id="week"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
      </div>

      <div className="flex flex-col">
       <label htmlFor="time" className="text-sm font-medium text-slate-600 mb-2">Time</label>
       <Input
        type="time"
        name="time"
        id="time"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
      </div>
     </div>
    </fieldset>

    {/* ────────── Números e Outros ────────── */}
    <fieldset className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
     <legend className="text-base font-semibold text-slate-700 mb-3">
      🔢 Números e Seletores
     </legend>
     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex flex-col">
       <label htmlFor="number" className="text-sm font-medium text-slate-600 mb-2">Number</label>
       <Input
        type="number"
        name="number"
        id="number"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
      </div>

      <div className="flex flex-col">
       <label htmlFor="range" className="text-sm font-medium text-slate-600 mb-2">Range</label>
       <Input
        type="range"
        name="range"
        min="0"
        max="100"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
      </div>

      <div className="flex flex-col">
       <label htmlFor="color" className="text-sm font-medium text-slate-600 mb-2">Color</label>
       <Input
        type="color"
        name="color"
        id="color"
        className="w-20 h-10 px-1 py-1 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition"
       />
      </div>
     </div>
    </fieldset>

    {/* ────────── Checkbox e Radio ────────── */}
    <fieldset className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
     <legend className="text-base font-semibold text-slate-700 mb-3">
      ☑️ Seletores
     </legend>
     <div className="space-y-3">
      <label className="flex items-center gap-2 cursor-pointer select-none">
       <Input
        type="checkbox"
        name="checkbox"
        className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-100 cursor-pointer"
       />
       <span className="text-sm font-medium text-slate-700">Aceitar termos</span>
      </label>

      <div className="space-y-2 mt-2">
       <span className="text-sm font-medium text-slate-600">Radio</span>
       <div className="flex flex-wrap gap-4">
        {[
         { value: "op1", label: "Opção 1" },
         { value: "op2", label: "Opção 2" },
         { value: "op3", label: "Opção 3" },
        ].map(({ value, label }) => (
         <label
          key={value}
          className="flex items-center gap-2 cursor-pointer select-none"
         >
          <Input
           type="radio"
           name="radio"
           value={value}
           className="w-4 h-4 text-sky-600 border-slate-300 focus:ring-sky-100 cursor-pointer"
          />
          <span className="text-sm font-medium text-slate-700">{label}</span>
         </label>
        ))}
       </div>
      </div>
     </div>
    </fieldset>

    {/* ────────── Arquivo e Oculto ────────── */}
    <fieldset className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
     <legend className="text-base font-semibold text-slate-700 mb-3">
      📎 Outros
     </legend>
     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex flex-col">
       <label htmlFor="file" className="text-sm font-medium text-slate-600 mb-2">File</label>
       <Input
        type="file"
        name="file"
        id="file"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
      </div>
      <Input type="hidden" name="hidden" />
     </div>
    </fieldset>

    {/* ────────── Textarea ────────── */}
    <fieldset className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
     <legend className="text-base font-semibold text-slate-700 mb-3">
      📄 Textarea
     </legend>
     <div className="flex flex-col">
      <label htmlFor="textarea" className="text-sm font-medium text-slate-600 mb-2">Observações</label>
      <Textarea
       name="textarea"
       rows={3}
       className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm resize-y"
      />
     </div>
    </fieldset>

    {/* ────────── Select e Datalist ────────── */}
    <fieldset className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
     <legend className="text-base font-semibold text-slate-700 mb-3">
      🔽 Seleção
     </legend>
     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="flex flex-col">
       <label htmlFor="select" className="text-sm font-medium text-slate-600 mb-2">Selecione um carro</label>
       <Select
        name="select"
        id="select"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm bg-white"
       >
        <option value="">Selecione</option>
        <option value="uno">Uno</option>
        <option value="strada">Strada</option>
        <option value="hb20">HB20</option>
       </Select>
      </div>

      <div className="flex flex-col">
       <label htmlFor="datalist" className="text-sm font-medium text-slate-600 mb-2">Escolha uma fruta</label>
       <Input
        type="text"
        name="datalist"
        id="datalist"
        list="frutas"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
       <datalist id="frutas">
        <option value="Maçã"></option>
        <option value="Banana"></option>
        <option value="Uva"></option>
        <option value="Laranja"></option>
       </datalist>
      </div>
     </div>
    </fieldset>

    {/* ────────── Ações ────────── */}
    <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
     <Button
      type="submit"
      className="bg-sky-600 hover:bg-sky-700 text-white font-medium px-4 py-2 rounded-md transition shadow-sm"
     >
      📤 Enviar
     </Button>
     <Button
      type="button"
      onClick={reset}
      className="bg-slate-500 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded-md transition shadow-sm"
     >
      🧹 Reset (para o modelo inicial)
     </Button>
    </div>
   </form>
  </div>
 );
};

export default AppComModelo;