/**
 * Exemplo com Troca Dinâmica de ID – Demonstra cleanup e recarga de formulário
 * 
 * Recursos demonstrados:
 * - Mudança do `id` do formulário em tempo real (ex.: alternar entre "form-A" e "form-B")
 * - Comportamento do hook quando o `id` muda: desmonta completamente o primeiro formulário
 *  (remove listeners, observers, cancela rAF) e monta o novo do zero.
 * - Garantia de que `modelRef.current` e `formRef.current` são limpos corretamente.
 * - Cada formulário mantém seu próprio estado independente.
 * 
 * Público: Desenvolvedores que precisam trocar o formulário ativo na mesma tela (ex.: abas,
 * wizard steps, formulários condicionais), garantindo que não haja vazamento de memória ou
 * eventos fantasmas.
 * 
 * Como testar:
 * 1. Preencha alguns campos no formulário atual.
 * 2. Clique em "Trocar para Formulário B" – os dados do primeiro são perdidos (pois é um novo DOM).
 * 3. Preencha algo no segundo.
 * 4. Volte para o primeiro – ele recarrega o modelo inicial (dados originais).
 * 
 * ⚠️ Importante:
 * - A troca de `id` recria todo o formulário no DOM. Os dados não persistem entre trocas.
 * - Se a intenção for preservar dados, mantenha o mesmo `id` e manipule o modelo via estado,
 *  ou use uma solução de cache externa.
 * - O exemplo usa `key` no `<form>` para forçar remontagem do React, mas o `useForm` também
 *  reagiria à mudança do `id` sozinho. A `key` é redundante, mas didática.
 */

import React from "react";
import { useForm } from "../hook/use-from";
import { Button, Input } from '../componentes';

interface FormData {
 campo: string;
 numero: number;
}

const initialModelA: FormData = { campo: "Valor A", numero: 10 };
const initialModelB: FormData = { campo: "Valor B", numero: 20 };

const ExemploDynamicId: React.FC = () => {
 const [currentId, setCurrentId] = React.useState<"form-dinamico-A" | "form-dinamico-B">("form-dinamico-A");

 const currentModel = currentId === "form-dinamico-A" ? initialModelA : initialModelB;

 const { formProps, getModel, reset } = useForm<FormData>({
  id: currentId,
  onSubmit: (model) => {
   console.log(`[${currentId}] Dados enviados:`, model);
   alert(`Formulário ${currentId} enviado! Ver console.`);
  },
  model: currentModel,
 });

 const toggleForm = () => {
  setCurrentId(prev =>
   prev === "form-dinamico-A" ? "form-dinamico-B" : "form-dinamico-A"
  );
 };

 const handleGetModel = () => {
  const data = getModel();
  console.log(`[${currentId}] getModel() atual:`, data);
  alert(`Dados atuais de ${currentId}: ${JSON.stringify(data, null, 2)} (ver console)`);
 };

 const handleReset = () => {
  reset();
  console.log(`[${currentId}] Reset acionado -> volta ao modelo inicial`);
 };

 return (
  <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
   <h2 className="text-2xl font-bold text-slate-900 mb-6">
    🔄 Formulário com ID Dinâmico
   </h2>

   <div className="mb-4 flex gap-3">
    <Button
     type="button"
     onClick={toggleForm}
     className="bg-violet-600 hover:bg-violet-700 text-white font-medium p-2 rounded-md transition"
    >
     🔁 Trocar para {currentId === "form-dinamico-A" ? "Formulário B" : "Formulário A"}
    </Button>
    <Button
     type="button"
     onClick={handleGetModel}
     className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium p-2 rounded-md transition"
    >
     📋 Ver Dados Atuais
    </Button>
    <Button
     type="button"
     onClick={handleReset}
     className="bg-slate-500 hover:bg-gray-600 text-white font-medium p-2 rounded-md transition"
    >
     🧹 Reset (modelo inicial)
    </Button>
   </div>

   <div className="border border-slate-200 rounded-lg p-4 bg-white shadow-sm">
    <p className="text-sm text-slate-500 mb-3">
     ID atual: <code className="bg-slate-100 px-1 py-0.5 rounded">{currentId}</code>
    </p>

    <form {...formProps} key={currentId} className="flex flex-col gap-4">
     <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">
       Campo Texto
      </label>
      <Input
       name="campo"
       type="text"
       className="w-full h-10 px-3 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-sky-100"
      />
     </div>
     <div>
      <label className="block text-sm font-medium text-slate-600 mb-1">
       Número
      </label>
      <Input
       name="numero"
       type="number"
       className="w-full h-10 px-3 border border-slate-300 rounded-md text-sm outline-none focus:ring-2 focus:ring-sky-100"
      />
     </div>
     <div className="flex gap-3 pt-2">
      <Button
       type="submit"
       className="bg-sky-600 hover:bg-sky-700 text-white font-medium px-4 py-2 rounded-md transition"
      >
       📤 Enviar
      </Button>
     </div>
    </form>
   </div>

   <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-md mt-4">
    💡 Teste: Preencha valores no formulário A, troque para B (note que o conteúdo
    é reiniciado para o modelo B), volte para A – os dados do A voltam ao modelo
    inicial (não persistem). Isso mostra que a troca de <code>id</code> recria o
    estado do formulário do zero.
   </div>
  </div>
 );
};

export default ExemploDynamicId;