/**
 * Exemplo de Validação Assíncrona – Simulando chamada a API para verificar disponibilidade
 * 
 * Recursos demonstrados:
 * - Regras de validação assíncronas (retornando `Promise<ValidationResult>`)
 * - Uso do estado `isValidating` para feedback de carregamento
 * - Bloqueio do campo durante validação (`readOnly` enquanto isValidating)
 * - Cancelamento automático de validações anteriores via `AbortController` (interno ao hook)
 * - Debounce configurável para evitar chamadas excessivas à API
 * - Submit desabilitado durante validação
 * 
 * Público: Desenvolvedores que precisam validar campos contra serviços externos (ex.: 
 * verificar se e-mail já está cadastrado, se nome de usuário está disponível, etc.)
 * 
 * Como funciona a validação assíncrona no hook:
 * 1. A função `validate` da regra pode retornar uma Promise.
 * 2. O hook gerencia um `AbortController` por campo para cancelar requisições pendentes
 *  quando um novo evento de validação ocorre antes da anterior terminar.
 * 3. O estado `isValidating` é `true` enquanto houver qualquer validação assíncrona em andamento.
 * 4. O submit é bloqueado automaticamente enquanto `isValidating` for `true`.
 * 5. O debounce (300ms padrão) é aplicado a `validateOnChange` – a chamada à API só ocorre
 *  após o usuário parar de digitar.
 * 
 * ⚠️ Neste exemplo, simulamos uma API com `setTimeout`. Em produção, substitua por `fetch`.
 */

import React from "react";
import { useForm } from "../hook/use-from";
import type { ValidationConfig, CustomValidationRule, ValidationResult } from "../hook/use-validation.type";
import { Button, Input } from '../componentes';

interface CadastroModel {
 username: string;
 email: string;
}

/**
 * Simula uma verificação de disponibilidade de username via API.
 * Retorna `true` se disponível, `false` se já existe.
 */
const checkUsernameAvailability = async (username: string): Promise<boolean> => {
 // Simula atraso de rede entre 500ms e 1500ms
 const delay = Math.random() * 1000 + 500;
 await new Promise(resolve => setTimeout(resolve, delay));

 // Lista de usernames já ocupados (simulada)
 const takenUsernames = ["admin", "joao", "maria", "suporte"];
 const isAvailable = !takenUsernames.includes(username.toLowerCase());

 console.log(`[API Simulada] Username "${username}" está ${isAvailable ? 'disponível' : 'ocupado'}`);
 return isAvailable;
};

/**
 * Validador assíncrono para username.
 * Retorna uma Promise que resolve para ValidationResult.
 * O hook automaticamente cancela a Promise anterior se uma nova chamada for feita.
 */
const asyncUsernameValidator: CustomValidationRule<CadastroModel> = {
 validate: async (value): Promise<ValidationResult> => {
  const username = String(value).trim();
  if (username.length < 3) {
   return {
    valid: false,
    message: "Username deve ter pelo menos 3 caracteres",
    type: "error",
   };
  }

  // Simula chamada a API
  const isAvailable = await checkUsernameAvailability(username);

  return {
   valid: isAvailable,
   message: isAvailable ? "" : "Username já está em uso",
   type: "error",
  };
 },
};

/**
 * Validador síncrono para e-mail (obrigatório e formato)
 */
const emailValidator: CustomValidationRule<CadastroModel> = {
 validate: (value): ValidationResult => {
  const email = String(value);
  if (!email) {
   return { valid: false, message: "E-mail é obrigatório", type: "error" };
  }
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  return {
   valid: isValid,
   message: isValid ? "" : "E-mail inválido",
   type: "error",
  };
 },
};

const ExemploAsyncValidation: React.FC = () => {
 const [apiStatus, setApiStatus] = React.useState<string>("");

 const validationConfig: ValidationConfig<CadastroModel> = {
  schema: {
   username: asyncUsernameValidator,
   email: emailValidator,
  },
  mode: "native",    // mensagens nativas do navegador
  debounce: 600,     // aumenta debounce para não chamar API a cada tecla (600ms)
  validateOnChange: true,
  validateOnBlur: true,
 };

 const { formProps, isValidating, validate } = useForm<CadastroModel>({
  id: "form-async-validation",
  onSubmit: (model) => {
   console.log("[Async] Cadastro enviado:", model);
   setApiStatus("✅ Cadastro realizado com sucesso!");
   setTimeout(() => setApiStatus(""), 4000);
  },
  model: { username: "", email: "" },
  validation: validationConfig,
 });

 const handleValidateButton = async () => {
  setApiStatus("⏳ Validando...");
  const isValid = await validate();
  if (isValid) {
   setApiStatus("✅ Formulário válido! Pronto para enviar.");
  } else {
   setApiStatus("❌ Existem erros. Corrija antes de enviar.");
  }
  setTimeout(() => {
   if (!apiStatus.includes("sucesso")) setApiStatus("");
  }, 3000);
 };

 return (
  <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
   <h2 className="text-2xl font-bold text-slate-900 mb-6">
    ⏳ Validação Assíncrona – Username disponível
   </h2>

   <form {...formProps} className="flex flex-col gap-6">
    <fieldset className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
     <legend className="px-1 text-base font-semibold text-slate-700 mb-3">
      🔐 Cadastro
     </legend>
     <div className="space-y-4">
      <div>
       <label htmlFor="async-validation-username" className="block text-sm font-medium text-slate-600 mb-1">
        Username (mínimo 3 caracteres, verifica disponibilidade)
       </label>
       <Input
        id="async-validation-username"
        name="username"
        type="text"
        autoComplete="off"
        readOnly={isValidating}
        className={`w-full h-10 px-3 border rounded-md text-sm outline-none focus:ring-2 focus:ring-sky-100 ${isValidating
         ? 'bg-slate-100 cursor-not-allowed text-slate-500'
         : 'bg-white'
         }`}
       />
       <p className="text-xs text-gray-400 mt-1">
        ⚡ Após parar de digitar, aguarde ~600ms – simulamos chamada à API.
        {isValidating && " 🔒 Campo bloqueado durante validação."}
       </p>
      </div>
      <div>
       <label htmlFor="async-validation-email" className="block text-sm font-medium text-slate-600 mb-1">
        E-mail
       </label>
       <Input
        id="async-validation-email"
        name="email"
        type="email"
        className="w-full h-10 px-3 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-sky-100"
       />
      </div>
     </div>
    </fieldset>

    {/* Barra de status */}
    {apiStatus && (
     <div className="p-3 rounded-md text-center text-sm font-medium bg-sky-50 text-blue-700">
      {apiStatus}
     </div>
    )}

    {/* Indicador de validação assíncrona em andamento */}
    {isValidating && (
     <div className="p-3 rounded-md text-center text-sm font-medium bg-amber-50 text-amber-800 flex items-center justify-center gap-2">
      <svg className="animate-spin h-4 w-4 text-amber-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Validando disponibilidade... (campo bloqueado)
     </div>
    )}

    <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
     <Button
      type="submit"
      disabled={isValidating}
      className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-md transition shadow-sm"
     >
      {isValidating ? "Aguarde..." : "📤 Cadastrar"}
     </Button>
     <Button
      type="button"
      onClick={handleValidateButton}
      disabled={isValidating}
      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-md transition shadow-sm"
     >
      ✅ Validar agora
     </Button>
    </div>

    <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-md">
     💡 Teste os usernames: "admin", "joao", "maria" – retornarão como indisponíveis.
     Qualquer outro nome (mínimo 3 letras) será aceito.
     Durante a validação, o campo username fica bloqueado e o botão de submit desabilitado.
    </div>
   </form>
  </div>
 );
};

export default ExemploAsyncValidation;