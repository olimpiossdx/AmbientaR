import React from 'react';

type ExampleShellProps = {
  title: string;
  description: string;
  checks: string[];
  children: React.ReactNode;
};


function getScrollClassName(scroll: DemoCardScroll | undefined): string {
  if (scroll === 'x') return 'overflow-x-auto overflow-y-hidden';
  if (scroll === 'y') return 'max-h-[32rem] overflow-y-auto overflow-x-hidden pr-1';
  if (scroll === 'both') return 'max-h-[36rem] overflow-auto pr-1';
  return 'overflow-visible';
}

function isScrollable(scroll: DemoCardScroll | undefined): boolean {
  return Boolean(scroll);
}

export function ExampleShell({ title, description, checks, children }: ExampleShellProps) {
  return (
    <section className="mx-auto w-full max-w-none rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:p-8">
      <header className="mb-6 border-b border-slate-200 pb-5">
        <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
          UI Component
        </span>
        <div className="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] xl:items-start">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 md:text-3xl">{title}</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600 md:text-base">{description}</p>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 xl:grid-cols-1">
            {checks.map((check) => (
              <div key={check} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                <span className="mr-1 text-emerald-600">✓</span>
                {check}
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="grid min-w-0 gap-6 xl:grid-cols-2 [&>*:only-child]:xl:col-span-2">{children}</div>
    </section>
  );
}

type DemoCardScroll = boolean | "x" | "y" | "both";

type DemoCardProps = {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  scroll?: DemoCardScroll | undefined;
  className?: string;
  contentClassName?: string;
};

export function DemoCard({
  title,
  description,
  children,
  scroll = false,
  className = "",
  contentClassName = "",
}: DemoCardProps) {
  const reactId = React.useId();
  const titleId = `demo-card-${reactId}`;

  return (
    <div
      className={[
        "min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mb-4 space-y-1">
        <h3 id={titleId} className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h3>

        {description ? (
          <p className="text-sm leading-6 text-slate-600">{description}</p>
        ) : null}
      </div>

      <div
        role={isScrollable(scroll) ? 'region' : undefined}
        aria-labelledby={isScrollable(scroll) ? titleId : undefined}
        tabIndex={isScrollable(scroll) ? 0 : undefined}
        className={[
          "min-w-0 rounded-lg",
          getScrollClassName(scroll),
          contentClassName,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>
    </div>
  );
}

export const buttonClassName =
  'rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-sky-100';

export const primaryButtonClassName =
  'rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100';

export const inputClassName =
  'h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-4 focus:ring-sky-100';
