# DateRangePicker

Componente de seleção de intervalo de datas para o design system.

## Objetivo

O `DateRangePicker` funciona como um campo composto. A API pública recebe apenas `name` e o componente cria dois campos reais de formulário usando a convenção:

- `${name}-start`
- `${name}-end`

Exemplo:

```tsx
<DateRangePicker name="periodo" label="Período" required />
```

Serializa no `FormData`:

```ts
{
  "periodo-start": "2026-06-01",
  "periodo-end": "2026-06-30"
}
```

## API

```ts
export interface IDateRangePickerProps {
  name: string;
  label?: React.ReactNode;

  minDate?: string;
  maxDate?: string;
  excludeWeekends?: boolean;

  months?: 1 | 2;
  showPresets?: boolean;
  matchInputWidth?: boolean;
  presets?: DateRangePreset[];

  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;

  size?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

## Integração com Form/useForm

O componente mantém dois inputs reais `type="date"`, ocultos visualmente, para integração com `FormData`, `useForm`, `reset`, `setFieldValue` e validação.

Campos gerados:

```tsx
<input type="date" name={`${name}-start`} />
<input type="date" name={`${name}-end`} />
```

Quando o range muda, os inputs reais disparam os eventos DOM:

- `input`
- `change`

Isso mantém o componente compatível com o fluxo atual do `useForm` e do `useValidation`.

## Validação nativa

Não existe um terceiro campo sentinela. A validação usa os próprios dois campos reais:

- se faltar início, o erro fica em `${name}-start`;
- se faltar fim, o erro fica em `${name}-end`;
- se o fim for menor que o início, o erro fica em `${name}-end`.

Os dois campos continuam sendo `type="date"`.

## Popover

O componente usa o Popover evoluído com:

```tsx
<Popover
  open={isOpen}
  onOpenChange={setIsOpen}
  triggerRef={containerRef}
  portal
  fullWidth={matchInputWidth}
/>
```

Essa abordagem evita colocar inputs dentro do botão interno do Popover e preserva funcionalidades da API antiga:

- portal;
- posicionamento por `triggerRef`;
- detecção de colisão;
- ajuste em scroll/resize;
- `fullWidth`.

## Performance

O calendário mantém o preview de hover do range. A otimização foi feita sem remover funcionalidade:

- `CalendarGrid` usa `React.memo`;
- dias do mês são memoizados com `useMemo`;
- handlers principais usam `useCallback`;
- `setHoverDate` ignora atualizações redundantes;
- estilos foram extraídos para `styles.date-range-picker.ts`.

## Exemplo

```tsx
<DateRangePicker
  name="periodo"
  label="Período"
  required
  months={2}
  matchInputWidth
  minDate="2026-01-01"
  maxDate="2026-12-31"
/>
```
