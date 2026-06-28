import React from 'react';
import { AlertTriangle, Bell, CheckCircle, Info, Loader2, Save, Sparkles, Trash2, XCircle } from 'lucide-react';
import toast from '../componentes/toast';
import { Button } from '../componentes';


/**
 * Exemplo de Toast – Todos os tipos e fluxos de uso
 *
 * Recursos demonstrados:
 * - Toasts semânticos: success, error, warning, info e custom
 * - Uso de title, duration, position, size e action
 * - Toast persistente com duration: Infinity
 * - Atualização de um toast em fluxo assíncrono
 * - Fechamento manual via handle.dismiss()
 * - Limpeza geral via toast.clear()
 *
 * Público:
 * Desenvolvedores que precisam entender como usar o serviço de toast
 * em fluxos reais de tela, formulário, modal ou ações assíncronas.
 *
 * Como testar:
 * 1. Clique nos botões de tipo para ver cada variação.
 * 2. Clique em "Simular salvar" para ver o fluxo loading → success/error.
 * 3. Clique em "Toast persistente" para criar uma notificação manualmente fechável.
 * 4. Clique em "Limpar todos" para remover todas as notificações.
 */
const FormToastExemplo: React.FC = () => {
 const [isSaving, setIsSaving] = React.useState(false);
 const persistentToastRef = React.useRef<ReturnType<typeof toast.info> | null>(null);

 const showSuccess = () => {
  toast.success('Operação concluída com sucesso.', {
   title: 'Sucesso',
   duration: 4000,
   position: 'top-right',
  });
 };

 const showError = () => {
  toast.error('Não foi possível concluir a operação.', {
   title: 'Erro ao processar',
   duration: 6000,
   position: 'top-right',
   action: {
    label: 'Tentar novamente',
    onClick: () => {
     toast.info('Tentando novamente...', {
      title: 'Nova tentativa',
     });
    },
   },
  });
 };

 const showWarning = () => {
  toast.warning('Existem campos que merecem sua atenção antes de continuar.', {
   title: 'Atenção',
   duration: 5000,
   position: 'top-center',
  });
 };

 const showInfo = () => {
  toast.info('Esta é uma mensagem informativa para orientar o usuário.', {
   title: 'Informação',
   duration: 4000,
   position: 'bottom-right',
  });
 };

 const showCustom = () => {
  toast.custom('Você pode usar ícones, ações e estilos específicos.', {
   title: 'Toast customizado',
   duration: 5000,
   position: 'bottom-center',
   size: 'large',
   icon: <Sparkles className="text-fuchsia-500" size={24} />,
   action: {
    label: 'Ver detalhes',
    onClick: () => {
     console.log('[Toast Custom] Ação executada');
    },
   },
  });
 };

 const showPersistent = () => {
  if (persistentToastRef.current) {
   persistentToastRef.current.dismiss();
   persistentToastRef.current = null;
  }

  persistentToastRef.current = toast.info('Este toast ficará visível até ser fechado manualmente.', {
   title: 'Toast persistente',
   duration: Infinity,
   position: 'top-left',
   dismissible: true,
   action: {
    label: 'Fechar agora',
    closeOnClick: true,
    onClick: () => {
     persistentToastRef.current = null;
    },
   },
  });
 };

 const simulateSave = async () => {
  setIsSaving(true);

  const currentToast = toast.info('Salvando dados...', {
   title: 'Aguarde',
   duration: Infinity,
   dismissible: false,
   position: 'top-right',
   icon: <Loader2 className="animate-spin text-blue-500" size={24} />,
  });

  try {
   await new Promise((resolve) => setTimeout(resolve, 1800));

   const shouldFail = Math.random() < 0.35;

   if (shouldFail) {
    throw new Error('Falha simulada');
   }

   currentToast.update({
    type: 'success',
    title: 'Dados salvos',
    message: 'As alterações foram persistidas com sucesso.',
    duration: 4000,
    dismissible: true,
    icon: undefined,
   });
  } catch {
   currentToast.update({
    type: 'error',
    title: 'Erro ao salvar',
    message: 'Não foi possível salvar os dados. Tente novamente.',
    duration: 6000,
    dismissible: true,
    icon: undefined,
    action: {
     label: 'Repetir',
     onClick: simulateSave,
    },
   });
  } finally {
   setIsSaving(false);
  }
 };

 const clearAll = () => {
  persistentToastRef.current = null;
  toast.clear();
 };

 return (
  <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
   <div className="mb-6">
    <h2 className="text-2xl font-bold text-slate-900">
     🔔 Exemplo de Toast
    </h2>

    <p className="mt-2 text-sm text-slate-500 ">
     Demonstra os tipos de toast, posições, ações, toast persistente e fluxo assíncrono
     com atualização da mesma notificação.
    </p>
   </div>

   <div className="grid gap-6">
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
     <div className="mb-4">
      <h3 className="text-base font-semibold text-slate-700">
       Tipos semânticos
      </h3>

      <p className="mt-1 text-sm text-slate-500">
       Use cada tipo para comunicar claramente o estado da ação.
      </p>
     </div>

     <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <Button
       type="button"
       onClick={showSuccess}
       className="flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
      >
       <CheckCircle size={16} />
       Success
      </Button>

      <Button
       type="button"
       onClick={showError}
       className="flex items-center justify-center gap-2 rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-700"
      >
       <XCircle size={16} />
       Error
      </Button>

      <Button
       type="button"
       onClick={showWarning}
       className="flex items-center justify-center gap-2 rounded-md bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-yellow-600"
      >
       <AlertTriangle size={16} />
       Warning
      </Button>

      <Button
       type="button"
       onClick={showInfo}
       className="flex items-center justify-center gap-2 rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700"
      >
       <Info size={16} />
       Info
      </Button>

      <Button
       type="button"
       onClick={showCustom}
       className="flex items-center justify-center gap-2 rounded-md bg-fuchsia-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-fuchsia-700"
      >
       <Sparkles size={16} />
       Custom
      </Button>
     </div>
    </section>

    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
     <div className="mb-4">
      <h3 className="text-base font-semibold text-slate-700">
       Fluxos reais
      </h3>

      <p className="mt-1 text-sm text-slate-500">
       Cenários comuns em formulário, modal, tela de listagem ou ação assíncrona.
      </p>
     </div>

     <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Button
       type="button"
       onClick={simulateSave}
       disabled={isSaving}
       className="flex items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-wait disabled:opacity-60"
      >
       {isSaving ? (
        <Loader2 size={16} className="animate-spin" />
       ) : (
        <Save size={16} />
       )}
       {isSaving ? 'Salvando...' : 'Simular salvar'}
      </Button>

      <Button
       type="button"
       onClick={showPersistent}
       className="flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
      >
       <Bell size={16} />
       Toast persistente
      </Button>

      <Button
       type="button"
       onClick={clearAll}
       className="flex items-center justify-center gap-2 rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
      >
       <Trash2 size={16} />
       Limpar todos
      </Button>
     </div>
    </section>

    <section className="rounded-lg border border-blue-100 bg-sky-50 p-4">
     <h3 className="text-sm font-semibold text-sky-800">
      Fluxo recomendado
     </h3>

     <p className="mt-2 text-sm leading-relaxed text-blue-700">
      Para ações assíncronas, prefira criar um toast persistente de carregamento e depois
      atualizar o mesmo toast para sucesso ou erro. Isso evita empilhar notificações
      desnecessárias e deixa o feedback mais previsível para o usuário.
     </p>
    </section>
   </div>
  </div>
 );
};

export default FormToastExemplo;