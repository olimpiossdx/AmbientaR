/**
 * Exemplo com Componente Customizado (Autocomplete)
 * 
 * Recursos demonstrados:
 * - Integração de componentes customizados com o `useForm`
 * - Suporte a seleção múltipla (array de valores) e única (string)
 * - Uso de `children` para passar opções (em vez de prop `options`)
 * 
 * Público: Desenvolvedores que precisam integrar bibliotecas de UI (React-Select, downshift, etc.)
 * ou componentes customizados que não são inputs HTML nativos.
 * 
 * 📌 REQUISITOS PARA COMPONENTES CUSTOMIZADOS:
 * Para que o `useForm` gerencie corretamente o valor de um componente customizado, ele deve:
 * 
 * 1. Ter um atributo `name` (obrigatório) – usado como chave no modelo.
 * 2. Disparar eventos DOM padrão `change` ou `input` quando seu valor mudar.
 * 3. Opcionalmente, implementar `value` (string) ou `checked` (checkbox) para leitura/escrita.
 * 
 * O componente `Autocomplete` usado neste exemplo atende a esses requisitos:
 * - Renderiza um `<Input type='text'>` interno ou `<Select>` dependendo da prop `multiple`.
 * - Emite evento `change` com o(s) valor(es) selecionado(s).
 * - Suporta a prop `value` (para controle externo) ou `defaultValue`.
 * - Para múltipla seleção, mantém um array internamente e serializa para string separada por vírgulas
 *  (ou outro formato) no atributo `value` do input oculto? Na prática, o componente deve expor
 *  um campo de formulário que o navegador entenda.
 * 
 * 🔧 DICA: Se estiver integrando com bibliotecas que NÃO emitem eventos DOM padrão, você pode:
 * - Envolver o componente em um proxy que dispara `change` manualmente.
 * - Usar `setFieldValue` para atualizar programaticamente o valor no hook.
 * 
 * ⚠️ Neste exemplo, o componente `Autocomplete` é importado de '../componentes/autocomple'
 * (caminho provável). Certifique-se de que ele atenda aos requisitos acima.
 */

import React from 'react';
import Autocomplete from '../componentes/autocomplete';
import { useForm } from '../hook/use-from';
import { Button } from '../componentes';

interface PedidoModel {
  categorias: string[];  // múltipla seleção
  cidade: string;     // única seleção
  cores: string[];    // múltipla via children
}

const ExemploFormAutocomplete: React.FC = () => {
  const { formProps, getModel, reset } = useForm<PedidoModel>({
    id: 'form-autocomplete',
    onSubmit: (model) => console.log('[Exemplo Autocomplete] Model submetido:', model),
    // cores não tem valor inicial – começa vazio
    model: { categorias: ['tech'], cidade: 'sp' },
  });

  const verDadosAtuais = () => {
    const dados = getModel();
    console.log('[Exemplo Autocomplete] Dados atuais:', dados);
  };

  const handleReset = () => {
    reset();
    console.log(`['form-autocomplete'] Reset acionado -> volta ao modelo inicial`);
  };

  return (
    <div className='mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
      <h2 className='text-2xl font-bold text-slate-900 mb-6'>
        🔍 Exemplo de Autocomplete
      </h2>

      <form {...formProps} className='flex flex-col gap-6'>
        {/* ────────── Múltipla seleção (via prop options) ────────── */}
        <fieldset className='border border-slate-200 rounded-lg p-4 bg-white shadow-sm'>
          <legend className='px-1 text-base font-semibold text-slate-700 mb-3'>
            🏷️ Categorias (múltiplo)
          </legend>
          <Autocomplete
            id='form-autocomplete-categorias'
            name='categorias'
            aria-label='Categorias'
            multiple               // permite múltipla seleção → valor será array
            placeholder='Selecione categorias'
            options={[
              { value: 'tech', label: 'Tecnologia' },
              { value: 'design', label: 'Design' },
              { value: 'marketing', label: 'Marketing' },
              { value: 'vendas', label: 'Vendas', disabled: true },
            ]}
          />
          {/* 
      O Autocomplete deve:
      - Internamente gerenciar um array de valores selecionados.
      - Em cada mudança, disparar um evento 'change' em um elemento com name='categorias'.
      - O useForm lerá o value desse elemento (ex.: input hidden com JSON ou input com valores separados).
      - O parseFormData precisa interpretar o formato do componente. 
       Se o componente usar um <Select multiple>, o navegador já envia array.
     */}
        </fieldset>

        {/* ────────── Seleção única (via prop options) ────────── */}
        <fieldset className='border border-slate-200 rounded-lg p-4 bg-white shadow-sm'>
          <legend className='px-1 text-base font-semibold text-slate-700 mb-3'>
            🌆 Cidade (único)
          </legend>
          <Autocomplete
            id='form-autocomplete-cidade'
            name='cidade'
            aria-label='Cidade'
            placeholder='Selecione uma cidade'
            options={[
              { value: 'sp', label: 'São Paulo' },
              { value: 'rj', label: 'Rio de Janeiro' },
              { value: 'bh', label: 'Belo Horizonte' },
            ]}
          />
        </fieldset>

        {/* ────────── Múltipla seleção via children ────────── */}
        <fieldset className='border border-slate-200 rounded-lg p-4 bg-white shadow-sm'>
          <legend className='px-1 text-base font-semibold text-slate-700 mb-3'>
            🎨 Cores (via children)
          </legend>
          <Autocomplete id='form-autocomplete-cores' name='cores' aria-label='Cores' multiple placeholder='Selecione cores'>
            <option value='red'>Vermelho</option>
            <option value='blue'>Azul</option>
            <option value='green' disabled>Verde (indisponível)</option>
            <option value='yellow'>Amarelo</option>
          </Autocomplete>
          {/* 
      Quando usa children, o Autocomplete provavelmente renderiza um <Select> nativo.
      Isso facilita a integração porque o navegador já lida com múltipla seleção.
      O useForm suporta <Select multiple> nativamente: o valor será array.
     */}
        </fieldset>

        <div className='flex flex-wrap gap-3 pt-4 border-t border-slate-200'>
          <Button
            type='submit'
            className='bg-sky-600 hover:bg-sky-700 text-white font-medium px-4 py-2 rounded-md transition shadow-sm'
          >
            📤 Enviar
          </Button>
          <Button
            type='button'
            onClick={verDadosAtuais}
            className='bg-gray-600 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-md transition shadow-sm'
          >
            🔍 Ver Dados Atuais
          </Button>
          <Button
            type='button'
            onClick={handleReset}
            className='bg-slate-500 hover:bg-gray-600 text-white font-medium p-2 rounded-md transition'
          >
            🧹 Reset (modelo inicial)
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ExemploFormAutocomplete;