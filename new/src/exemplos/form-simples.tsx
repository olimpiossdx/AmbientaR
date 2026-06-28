/**
 * Exemplo Básico – Formulário com modelo inicial
 * 
 * Recursos demonstrados:
 * - Configuração mínima do `useForm`
 * - Passagem de `model` inicial para preencher os campos
 * - Submissão com log do modelo tipado
 * 
 * Público: Desenvolvedores iniciantes que querem entender a configuração básica.
 * 
 * Observações:
 * - O `model` só carrega na montagem; mudanças posteriores na prop NÃO alteram os campos.
 * - Os campos `name` devem corresponder às chaves do modelo (ex.: "nome").
 * - O hook gerencia o estado dos campos automaticamente via DOM.
 */

import React from "react";
import { useForm } from "../hook/use-from";
import { Button, Input, Select } from '../componentes';

// Modelo tipado – garante segurança e autocompletar
interface ImModel {
 nome: string;
 sobreNome?: string;  // opcional – campo não obrigatório no formulário
 carros?: string;
}

const FormSimples: React.FC = () => {
 // Callback de submissão – recebe o modelo atual preenchido pelo usuário
 const handleSubmit = (model: ImModel) => {
  console.log("[Exemplo Básico] Dados enviados:", model);
 };

 // ID único do formulário – usado para localizar o <form> no DOM
 const id = "meu-form";

 // Inicializa o hook com modelo parcial (nome e carros preenchidos)
 // O campo `sobreNome` ficará vazio inicialmente
 const { formProps } = useForm({
  id,
  onSubmit: handleSubmit,
  model: { nome: "jose", carros: "1" },
 });

 return (
  <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
   <h2 className="text-2xl font-bold text-slate-900 mb-6">
    📋 Formulário Simples
   </h2>

   {/* 
    formProps contém { id, ref } – espalhar é obrigatório para o hook funcionar.
    O id garante a localização, a ref mantém a referência atualizada.
   */}
   <form {...formProps} className="flex flex-col gap-6">
    <fieldset className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
     <legend className="text-base font-semibold text-slate-700 mb-3">
      📝 Dados Pessoais
     </legend>
     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="flex flex-col">
       <label htmlFor="nome" className="text-sm font-medium text-slate-600 mb-2">Nome</label>
       <Input
        name="nome"          // 🔑 deve bater com a chave do modelo
        placeholder="Nome"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
      </div>

      <div className="flex flex-col">
       <label htmlFor="sobrenome" className="text-sm font-medium text-slate-600 mb-2">Sobrenome</label>
       <Input
        name="sobreNome"       // 🔑 opcional no modelo
        placeholder="Sobrenome"
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm"
       />
      </div>

      <div className="flex flex-col">
       <label htmlFor="carros" className="text-sm font-medium text-slate-600 mb-2">Carros</label>
       <Select
        name="carros"         // 🔑 seletor também usa `name`
        className="w-full h-10 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-100 focus:border-sky-500 outline-none transition text-sm bg-white"
       >
        <option value="">Selecione</option>
        <option value="1">Uno</option>
        <option value="2">Strada</option>
       </Select>
      </div>
     </div>
    </fieldset>

    <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
     <Button
      type="submit"
      className="bg-sky-600 hover:bg-sky-700 text-white font-medium px-4 py-2 rounded-md transition shadow-sm"
     >
      📤 Enviar
     </Button>
    </div>
   </form>
  </div>
 );
};

export default FormSimples;