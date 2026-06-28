/**
 * Exemplo de Validação com Mensagens Customizadas – Exibindo erros abaixo dos campos
 * 
 * Recursos demonstrados:
 * - Modo `mode: 'both'` (validação nativa + customizada)
 * - Leitura das mensagens de erro do DOM (`validationMessage`) para exibição customizada
 * - Estado local de erros para feedback visual amigável
 * - Botão "Limpar erros" que chama `clearErrors()` e limpa o estado
 * - Validação manual via `validate()` e exibição dos erros
 * 
 * Público: Desenvolvedores que desejam integrar a validação do hook com um design system
 * próprio, mostrando mensagens de erro com cores, ícones, etc., sem depender da UI nativa.
 * 
 * Como funciona a exibição customizada:
 * 1. O hook aplica `setCustomValidity` nos campos, preenchendo a propriedade `validationMessage`.
 * 2. Após chamar `validate()` (ou no submit), lemos `element.validationMessage` para cada campo.
 * 3. Armazenamos essas mensagens em um estado local `errors`.
 * 4. Renderizamos as mensagens abaixo de cada campo.
 * 5. Ao chamar `clearErrors()`, o hook limpa as mensagens nativas; também limpamos o estado local.
 * 
 * Dica: Em formulários reais, você pode também usar `onChange`/`onBlur` para revalidar e atualizar
 * os erros automaticamente. Este exemplo demonstra o fluxo manual para clareza.
 */

import React from "react";
import { useForm } from "../hook/use-from";
import type { ValidationConfig } from "../hook/use-validation.type";
import { Button, Input } from '../componentes';

interface UsuarioModel {
 nome: string;
 email: string;
 idade: number;
}

// Validadores simples
const required = (message: string) => ({
 validate: (value: unknown) => ({
  valid: value !== undefined && value !== null && value !== "",
  message,
  type: "error" as const,
 }),
});

const emailFormat = () => ({
 validate: (value: unknown) => ({
  valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)),
  message: "E-mail inválido",
  type: "error" as const,
 }),
});

const minAge = (min: number) => ({
 validate: (value: unknown) => ({
  valid: Number(value) >= min,
  message: `Idade mínima: ${min} anos`,
  type: "error" as const,
 }),
});

const ExemploCustomValidationMessages: React.FC = () => {
 const [errors, setErrors] = React.useState<{ nome?: string; email?: string; idade?: string }>({});

 const validationConfig: ValidationConfig<UsuarioModel> = {
  schema: {
   nome: required("Nome é obrigatório"),
   email: [required("E-mail é obrigatório"), emailFormat()],
   idade: minAge(18),
  },
  mode: "both",     // aplica validação nativa + customizada (setCustomValidity)
  debounce: 300,
  validateOnChange: true,
  validateOnBlur: true,
 };

 const { formProps, validate, clearErrors } = useForm<UsuarioModel>({
  id: "form-custom-errors",
  onSubmit: async (model) => {
   console.log("[Custom Errors] Submetendo:", model);
   const isValid = await validate();  // ✅ `validate` é assíncrona, mantém await
   updateErrorsFromDOM();       // ✅ agora sem await
   if (isValid) {
    alert("✅ Formulário válido! Dados enviados (simulado).");
   } else {
    alert("❌ Existem erros no formulário. Corrija e tente novamente.");
   }
  },
  model: { nome: "", email: "", idade: 0 },
  validation: validationConfig,
 });

 // Lê as mensagens de validação diretamente dos elementos do DOM
 const updateErrorsFromDOM = () => {
  const form = document.getElementById("form-custom-errors") as HTMLFormElement | null;
  if (!form) return;

  const nomeInput = form.elements.namedItem("nome") as HTMLInputElement | null;
  const emailInput = form.elements.namedItem("email") as HTMLInputElement | null;
  const idadeInput = form.elements.namedItem("idade") as HTMLInputElement | null;

  setErrors({
   nome: nomeInput?.validationMessage || undefined,
   email: emailInput?.validationMessage || undefined,
   idade: idadeInput?.validationMessage || undefined,
  });
 };

 const handleValidateAndShowErrors = async () => {
  await validate();     // executa a validação e aplica setCustomValidity
  updateErrorsFromDOM();   // captura as mensagens e atualiza o estado
 };

 const handleClearErrors = () => {
  clearErrors();       // limpa setCustomValidity de todos os campos
  setErrors({});       // limpa o estado local de erros
 };

 // Efeito para atualizar erros quando os campos mudam (opcional, mas melhora UX)
 React.useEffect(() => {
  const form = document.getElementById("form-custom-errors") as HTMLFormElement | null;
  if (!form) return;

  const handleFieldChange = () => {
   // Aguarda um tick para garantir que a validação (debounced) já tenha ocorrido
   setTimeout(() => updateErrorsFromDOM(), 100);
  };

  form.addEventListener("change", handleFieldChange);
  form.addEventListener("input", handleFieldChange);
  return () => {
   form.removeEventListener("change", handleFieldChange);
   form.removeEventListener("input", handleFieldChange);
  };
 }, []);

 return (
  <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
   <h2 className="text-2xl font-bold text-slate-900 mb-6">
    🎨 Validação com Mensagens Customizadas
   </h2>

   <form {...formProps} className="flex flex-col gap-6">
    <fieldset className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
     <legend className="px-1 text-base font-semibold text-slate-700 mb-3">
      👤 Dados Pessoais
     </legend>
     <div className="space-y-4">
      {/* Campo Nome */}
      <div>
       <label htmlFor="custom-validation-nome" className="block text-sm font-medium text-slate-600 mb-1">
        Nome *
       </label>
       <Input
        id="custom-validation-nome"
        name="nome"
        type="text"
        aria-describedby={errors.nome ? "custom-validation-nome-error" : undefined}
        className={`w-full h-10 px-3 border rounded-md text-sm outline-none focus:ring-2 focus:ring-sky-100 ${errors.nome ? "border-red-500" : "border-slate-300"
         }`}
       />
       {errors.nome && (
        <p id="custom-validation-nome-error" className="text-red-500 text-xs mt-1 flex items-center gap-1">
         <span>⚠️</span> {errors.nome}
        </p>
       )}
      </div>

      {/* Campo Email */}
      <div>
       <label htmlFor="custom-validation-email" className="block text-sm font-medium text-slate-600 mb-1">
        E-mail *
       </label>
       <Input
        id="custom-validation-email"
        name="email"
        type="email"
        aria-describedby={errors.email ? "custom-validation-email-error" : undefined}
        className={`w-full h-10 px-3 border rounded-md text-sm outline-none focus:ring-2 focus:ring-sky-100 ${errors.email ? "border-red-500" : "border-slate-300"
         }`}
       />
       {errors.email && (
        <p id="custom-validation-email-error" className="text-red-500 text-xs mt-1 flex items-center gap-1">
         <span>⚠️</span> {errors.email}
        </p>
       )}
      </div>

      {/* Campo Idade */}
      <div>
       <label htmlFor="custom-validation-idade" className="block text-sm font-medium text-slate-600 mb-1">
        Idade (mínimo 18)
       </label>
       <Input
        id="custom-validation-idade"
        name="idade"
        type="number"
        min="0"
        aria-describedby={errors.idade ? "custom-validation-idade-error" : undefined}
        className={`w-full h-10 px-3 border rounded-md text-sm outline-none focus:ring-2 focus:ring-sky-100 ${errors.idade ? "border-red-500" : "border-slate-300"
         }`}
       />
       {errors.idade && (
        <p id="custom-validation-idade-error" className="text-red-500 text-xs mt-1 flex items-center gap-1">
         <span>⚠️</span> {errors.idade}
        </p>
       )}
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
     <Button
      type="button"
      onClick={handleValidateAndShowErrors}
      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-md transition shadow-sm"
     >
      ✅ Validar e mostrar erros
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
     💡 Dica: Preencha campos inválidos (ex.: nome vazio, e-mail sem @, idade menor que 18)
     e clique em "Validar e mostrar erros". As mensagens aparecerão abaixo de cada campo.
     O botão "Limpar erros" remove todas as mensagens.
     Os campos com erro ficam com borda vermelha e ícone de alerta.
    </div>
   </form>
  </div>
 );
};

export default ExemploCustomValidationMessages;