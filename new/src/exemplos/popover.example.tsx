import React from 'react';
import { Popover, Button, Input } from '../componentes';
import { DemoCard, ExampleShell, buttonClassName } from './_example-shell';

function TriggerRefPortalExample() {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  return (
    <div className="grid gap-3">
      <Button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={buttonClassName}
      >
        Abrir por triggerRef
      </Button>

      <Popover
        open={open}
        onOpenChange={setOpen}
        triggerRef={triggerRef}
        portal
        fullWidth
        align="start"
      >
        <div className="grid gap-2 text-sm">
          <strong>Trigger externo</strong>
          <p className="text-gray-500">
            Usa portal, fecha ao clicar fora e aplica min-width igual ao trigger sem alterar o tema base.
          </p>
          <label>
            <Input name='' type="checkbox" className="mr-2" />
            Largura do trigger
          </label>
          <label>
            <Input name='' type="checkbox" className="mr-2" />
            Conteúdo em portal
          </label>
        </div>
      </Popover>
    </div>
  );
}

function CollisionAndAlignExample() {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  return (
    <div className="flex min-h-48 items-end justify-end rounded-md border border-dashed border-gray-200 bg-gray-50 p-4">
      <Button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={buttonClassName}
      >
        Abrir no canto
      </Button>

      <Popover
        open={open}
        onOpenChange={setOpen}
        triggerRef={triggerRef}
        portal
        align="end"
        className="w-64"
      >
        <div className="grid gap-2 text-sm">
          <strong>Colisão e alinhamento</strong>
          <p className="text-gray-500">
            Mantém o visual original e adiciona ajuste horizontal, flip vertical e reposicionamento em scroll/resize.
          </p>
        </div>
      </Popover>
    </div>
  );
}

export default function PopoverExample() {
  return (
    <ExampleShell
      title="Popover"
      description="Conteúdo flutuante acionado por trigger, útil para filtros e informações auxiliares. A atualização preserva o tema original e adiciona triggerRef, portal e fullWidth."
      checks={["Fecha ao clicar fora", "Alinhamento configurável", "Conteúdo livre", "triggerRef + portal + fullWidth"]}
    >
      <DemoCard title="Filtro rápido" className="overflow-visible" contentClassName="min-h-[14rem] overflow-visible">
        <Popover trigger={<span className={buttonClassName}>Abrir filtros</span>} align="start">
          <div className="grid gap-2 text-sm">
            <strong>Filtros</strong>
            <label>
              <Input name='' type="checkbox" className="mr-2" />
              Somente ativos
            </label>
            <label>
              <Input name='' type="checkbox" className="mr-2" />
              Com pendências
            </label>
          </div>
        </Popover>
      </DemoCard>

      <DemoCard
        title="Trigger externo com portal e fullWidth"
        description="Novo exemplo mantendo a base visual original do Storybook."
        className="overflow-visible"
        contentClassName="min-h-[14rem] overflow-visible"
      >
        <TriggerRefPortalExample />
      </DemoCard>

      <DemoCard
        title="Portal com alinhamento e colisão"
        description="Valida align='end', cálculo de posição, flip vertical e ajuste horizontal sem trocar o tema."
        className="overflow-visible"
        contentClassName="overflow-visible"
      >
        <CollisionAndAlignExample />
      </DemoCard>
    </ExampleShell>
  );
}
