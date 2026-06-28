# Modal - tema claro

Esta versão corrige a entrega anterior: o módulo não usa mais classes `dark:*`.

Arquivos incluídos:

- `hook.tsx`
- `index.tsx`
- `modal.tsx`
- `modal.types.ts`
- `modal-form.tsx`

## O que foi ajustado

- Removidas as classes `dark:*` do modal e do `ModalForm`.
- Painel sempre claro: `bg-white`, texto em `slate`, bordas claras e footer em `slate-50`.
- Overlay mais leve: `bg-slate-950/45`.
- Botão de fechar nativo, claro, sem depender do tema do `Button`.
- Ações padrão do `ModalForm` com botões nativos claros para evitar herdar estilos escuros do componente Button quando o app estiver em modo dark.
- Mantidos os contratos públicos e os tipos.

## Como aplicar

Substitua os arquivos equivalentes dentro da pasta do componente modal.

Se seus conteúdos internos passados para `children`, `actions` ou `footer` tiverem classes `dark:*`, eles ainda poderão ficar escuros. Esta correção deixa claro apenas o módulo do modal e suas ações padrão.
