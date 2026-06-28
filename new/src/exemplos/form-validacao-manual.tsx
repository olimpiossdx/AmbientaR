/**
 * Exemplo de Validação Manual – Chamando `validate()` e `clearErrors()` programaticamente
 * 
 * Recursos demonstrados:
 * - Chamada manual de `validate()` para validar todo o formulário sem submetê-lo
 * - Chamada de `clearErrors()` para limpar mensagens de erro
 * - Uso combinado com validação nativa (`mode: 'native'`) para feedback visual
 * - Estado de carregamento durante validação assíncrona (se houver)
 * 
 * Público: Desenvolvedores que precisam de botões como "Validar agora", "Limpar erros",
 * ou que querem validar o formulário antes de habilitar um botão de submit.
 * 
 * Diferenciais deste exemplo:
 * - Demonstra que `validate()` pode ser chamado independentemente do submit.
 * - Mostra que `clearErrors()` remove as mensagens de erro da validação nativa.
 * - Útil para formulários longos onde o usuário quer ver erros antes de tentar enviar.
 * 
 * Como testar:
 * 1. Preencha alguns campos corretamente, outros incorretamente.
 * 2. Clique em "🔍 Validar agora" – os campos inválidos mostrarão mensagens nativas.
 * 3. Clique em "🧹 Limpar erros" – as mensagens desaparecem.
 * 4. Envie o formulário – a validação ocorre automaticamente.
 */

import React from "react";
import { useForm } from "../hook/use-from";
import type { ValidationConfig } from "../hook/use-validation.type";
import { Button, Input } from '../componentes';

interface CadastroModel {
 nome: string;
 email: string;
 idade: number;
}

// Validador simples de idade
const idadeMinima = (min: number) => ({
 validate: (value: unknown) => ({
  valid: Number(value) >= min,
  message: `Idade mínima é ${min} anos`,
  type: "error" as const,
 }),
});

const ExemploValidacaoManual: React.FC = () => {
 const [mensagemStatus, setMensagemStatus] = React.useState<string>("");

 const validationConfig: ValidationConfig<CadastroModel> = {
  schema: {
   nome: {
    validate: (value) => ({
     valid: typeof value === "string" && value.trim().length >= 3,
     message: "Nome deve ter pelo menos 3 caracteres",
     type: "error",
    }),
   },
   email: {
    validate: (value) => ({
     valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)),
     message: "E-mail inválido",
     type: "error",
    }),
   },
   idade: idadeMinima(18),
  },
  mode: "native",   // mostra mensagens nativas do navegador
  debounce: 300,
  validateOnChange: true,
  validateOnBlur: true,
 };

 const { formProps, validate, clearErrors, isValidating } = useForm<CadastroModel>({
  id: "form-validacao-manual",
  onSubmit: (model) => {
   console.log("[Exemplo Manual] Dados enviados:", model);
   setMensagemStatus("✅ Formulário enviado com sucesso!");
   setTimeout(() => setMensagemStatus(""), 3000);
  },
  model: { nome: "", email: "", idade: 0 },
  validation: validationConfig,
 });

 const handleValidateManually = async () => {
  setMensagemStatus("⏳ Validando...");
  const isValid = await validate();
  if (isValid) {
   setMensagemStatus("✅ Formulário válido! Pode enviar.");
  } else {
   setMensagemStatus("❌ Formulário inválido. Corrija os erros.");
  }
  setTimeout(() => {
   if (mensagemStatus !== "✅ Formulário enviado com sucesso!") {
    setMensagemStatus("");
   }
  }, 3000);
 };

 const handleClearErrors = () => {
  clearErrors();
  setMensagemStatus("🧹 Erros de validação limpos.");
  setTimeout(() => setMensagemStatus(""), 2000);
 };

 return (
  <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
   <h2 className="text-2xl font-bold text-slate-900 mb-6">
    🎯 Validação Manual – validate() e clearErrors()
   </h2>

   <form {...formProps} className="flex flex-col gap-6">
    <fieldset className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
     <legend className="px-1 text-base font-semibold text-slate-700 mb-3">
      📝 Dados
     </legend>
     <div className="space-y-4">
      <div>
       <label htmlFor="manual-validation-nome" className="block text-sm font-medium text-slate-600 mb-1">
        Nome (mínimo 3 caracteres)
       </label>
       <Input
        id="manual-validation-nome"
        name="nome"
        type="text"
        className="w-full h-10 px-3 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-sky-100"
       />
      </div>
      <div>
       <label htmlFor="manual-validation-email" className="block text-sm font-medium text-slate-600 mb-1">
        E-mail
       </label>
       <Input
        id="manual-validation-email"
        name="email"
        type="email"
        className="w-full h-10 px-3 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-sky-100"
       />
      </div>
      <div>
       <label htmlFor="manual-validation-idade" className="block text-sm font-medium text-slate-600 mb-1">
        Idade (mínimo 18)
       </label>
       <Input
        id="manual-validation-idade"
        name="idade"
        type="number"
        min="0"
        className="w-full h-10 px-3 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-sky-100"
       />
      </div>
     </div>
    </fieldset>

    {mensagemStatus && (
     <div className="p-3 rounded-md text-center text-sm font-medium bg-slate-100 text-slate-700">
      {mensagemStatus}
     </div>
    )}

    <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
     <Button
      type="submit"
      disabled={isValidating}
      className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-md transition shadow-sm"
     >
      📤 Enviar
     </Button>
     <Button
      type="button"
      onClick={handleValidateManually}
      disabled={isValidating}
      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-md transition shadow-sm"
     >
      {isValidating ? "Validando..." : "🔍 Validar agora"}
     </Button>
     <Button
      type="button"
      onClick={handleClearErrors}
      className="bg-slate-500 hover:bg-gray-600 text-white font-medium px-4 py-2 rounded-md transition shadow-sm"
     >
      🧹 Limpar erros
     </Button>
    </div>

    <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-md">
     💡 Dica: Preencha campos incorretamente e clique em "Validar agora" para ver
     as mensagens nativas. Depois clique em "Limpar erros" para removê-las.
    </div>
   </form>
  </div>
 );
};

export default ExemploValidacaoManual;