"use client";

import { CoordinateInput } from "./coordinate-input";
import type { Datum } from "@/lib/types";

export function TrechoCoordenadasBlock({
  form,
  basePath,
  title,
}: {
  form: any;
  basePath: string;
  title: string;
}) {
  const geoDatum = form.watch(`${basePath}.datum`) as Datum | undefined;
  const isLegacyDatum =
    geoDatum != null &&
    String(geoDatum).trim() !== "" &&
    geoDatum !== "SIRGAS2000";

  return (
    <CoordinateInput
      form={form}
      basePath={basePath}
      variant="trecho-e"
      formatFieldName="formato"
      title={title}
      lockDatum={!isLegacyDatum}
      showLegacyDatums={isLegacyDatum}
    />
  );
}
