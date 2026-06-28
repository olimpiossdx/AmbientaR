# Popover

Popover evoluído para manter a API atual e também suportar as funcionalidades da versão antiga.

## Uso atual preservado

```tsx
<Popover trigger="Abrir" align="start">
  Conteúdo
</Popover>
```

## Uso com âncora externa

```tsx
const triggerRef = React.useRef<HTMLDivElement>(null);

<div ref={triggerRef}>Controle complexo</div>

<Popover
  open={open}
  onOpenChange={setOpen}
  triggerRef={triggerRef}
  portal
  fullWidth
>
  Conteúdo
</Popover>
```

## Compatibilidade com API antiga

A API antiga também continua funcionando:

```tsx
<Popover
  isOpen={isOpen}
  onClose={onClose}
  triggerRef={triggerRef}
  fullWidth
>
  Conteúdo
</Popover>
```

Preferência para novos usos:

```tsx
open + onOpenChange
```

## Recursos

- `trigger` declarativo para casos simples;
- `triggerRef` para componentes complexos;
- `portal` para renderizar em `document.body`;
- colisão vertical com flip automático;
- colisão horizontal com ajuste dentro do viewport;
- atualização em `scroll` e `resize`;
- `fullWidth` para alinhar com largura da âncora;
- `align="start" | "center" | "end"`;
- `side="bottom" | "top"`;
- `sideOffset`.

## Importante

Quando o trigger for um controle complexo contendo inputs, botões ou múltiplos elementos interativos, não use a prop `trigger`. Use `triggerRef`.

Isso evita HTML inválido como input dentro de button.
