import React from 'react';

import Button from '../componentes/button';
import { Form } from '../componentes/form/form';
import DateRangePicker from '../componentes/date-range-picker';
import type { ValidationConfig } from '../hook/use-validation.type';
import { DemoCard, ExampleShell, buttonClassName } from './_example-shell';

type FiltroPeriodoModel = {
  'periodo-start': string;
  'periodo-end': string;
};

const initialModel: FiltroPeriodoModel = {
  'periodo-start': '2026-06-01',
  'periodo-end': '2026-06-30',
};

const validation: ValidationConfig<FiltroPeriodoModel> = {
  feedbackMode: 'native',
  validateOnChange: true,
  validateOnBlur: true,
  debounce: 250,
  schema: {
    'periodo-start': {
      dependsOn: ['periodo-end'],
      validate: (value, model) => {
        const start = String(value ?? '');
        const end = String(model['periodo-end'] ?? '');

        if (!start) {
          return { valid: false, type: 'error', message: 'Informe a data inicial.' };
        }

        if (end && start > end) {
          return { valid: false, type: 'error', message: 'A data inicial deve ser menor ou igual à final.' };
        }

        return { valid: true };
      },
    },
    'periodo-end': {
      dependsOn: ['periodo-start'],
      validate: (value, model) => {
        const start = String(model['periodo-start'] ?? '');
        const end = String(value ?? '');

        if (!end) {
          return { valid: false, type: 'error', message: 'Informe a data final.' };
        }

        if (start && end < start) {
          return { valid: false, type: 'error', message: 'A data final deve ser maior ou igual à inicial.' };
        }

        return { valid: true };
      },
    },
  },
};

function DateRangeFormExample() {
  const [submittedModel, setSubmittedModel] = React.useState<FiltroPeriodoModel | null>(null);

  return (
    <Form<FiltroPeriodoModel>
      id="date-range-picker-example"
      model={initialModel}
      validation={validation}
      className="grid gap-4"
      onSubmit={(model) => {
        setSubmittedModel(model);
      }}
    >
      {(form) => (
        <>
          <DateRangePicker
            name="periodo"
            label="Período"
            required
            months={2}
            matchInputWidth
            minDate="2026-01-01"
            maxDate="2026-12-31"
          />

          <div className="flex flex-wrap gap-2">
            <Button type="submit">Enviar</Button>
            <Button type="reset" variant="secondary">Reset</Button>
            <Button
              type="button"
              className={buttonClassName}
              onClick={() => {
                form.setFieldValue('periodo-start', '2026-07-01');
                form.setFieldValue('periodo-end', '2026-07-15');
              }}
            >
              Aplicar julho
            </Button>
          </div>

          <pre className="max-h-72 overflow-auto rounded-md border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700" tabIndex={0} aria-label="Valores selecionados">
            {JSON.stringify(submittedModel ?? form.getModel(), null, 2)}
          </pre>
        </>
      )}
    </Form>
  );
}

export default function DateRangePickerExample() {
  return (
    <ExampleShell
      title="DateRangePicker"
      description="Campo composto para seleção de período. Recebe apenas name e gera os campos nativos periodo-start e periodo-end com type=date."
      checks={["name único", "type=date", "popover com triggerRef", "presets", "hover range preservado"]}
    >
      <DemoCard
        title="Range integrado ao Form"
        description="Mantém o tema base do Storybook e usa a API evoluída do Popover sem alterar a aparência do componente."
        className="overflow-visible"
        contentClassName="overflow-visible"
      >
        <DateRangeFormExample />
      </DemoCard>
    </ExampleShell>
  );
}
