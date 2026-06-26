"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { CoordinateInput } from "./coordinate-input";
import type { CoordinateInputProps } from "./coordinate-input";
import {
  formatCoordinateBlockForLegacyString,
  getUnparsedLegacyCoordenadasString,
  parseLegacyCoordenadasString,
  type MonitoringPontoCoordenadasForm,
} from "@/lib/monitoring-pontos-form";

type CoordinateStringFieldProps = {
  value?: string;
  onChange: (next: string) => void;
} & Pick<
  CoordinateInputProps,
  "variant" | "lockDatum" | "showLegacyDatums" | "className"
>;

/** Entrada GMS/UTM com persistência em string legada (`coordenadas`, `coordenadas_ponto`). */
export function CoordinateStringField({
  value = "",
  onChange,
  variant = "coords-only",
  lockDatum = true,
  showLegacyDatums = false,
  className,
}: CoordinateStringFieldProps) {
  const form = useForm<{ coordenadas: MonitoringPontoCoordenadasForm }>({
    defaultValues: { coordenadas: parseLegacyCoordenadasString(value) },
  });

  const unparsedLegacy = React.useMemo(
    () => getUnparsedLegacyCoordenadasString(value),
    [value],
  );

  React.useEffect(() => {
    form.reset({ coordenadas: parseLegacyCoordenadasString(value) });
  }, [value, form]);

  const syncingRef = React.useRef(false);

  React.useEffect(() => {
    const subscription = form.watch((data) => {
      if (syncingRef.current) return;
      const block = data.coordenadas as MonitoringPontoCoordenadasForm | undefined;
      const next = formatCoordinateBlockForLegacyString(block);
      if (next !== (value ?? "")) {
        syncingRef.current = true;
        onChange(next);
        queueMicrotask(() => {
          syncingRef.current = false;
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [form, onChange, value]);

  return (
    <div className="space-y-2">
      <Form {...form}>
        <CoordinateInput
          form={form}
          basePath="coordenadas"
          variant={variant}
          lockDatum={lockDatum}
          showLegacyDatums={showLegacyDatums}
          className={className}
        />
      </Form>
      {unparsedLegacy ? (
        <p className="text-xs text-muted-foreground">
          Texto anterior (não estruturado): {unparsedLegacy}
        </p>
      ) : null}
    </div>
  );
}
