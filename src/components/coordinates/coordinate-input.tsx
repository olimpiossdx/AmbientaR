"use client";

import * as React from "react";
import type { CoordinateFormat, Datum } from "@/lib/types";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { DEFAULT_DATUM } from "@/lib/coordinates";
import { CoordinateDecimalPreview } from "./coordinate-decimal-preview";
import {
  COORDINATE_DATUM_OPTIONS,
  COORDINATE_FORMAT_OPTIONS,
  COORDINATE_FUSO_OPTIONS,
} from "./coordinate-options";

export type CoordinateInputVariant = "full" | "coords-only" | "trecho-e";

/** Metadados de localização: cadastro geral vs listagens FEAM (município extra). */
export type CoordinateMetadataVariant = "project" | "listagem";

export type CoordinateInputProps = {
  /** Instância react-hook-form (mesmo padrão dos formulários de empreendimento). */
  form: any;
  /** Prefixo do path, ex.: `geographicLocation` ou `listagemE.geoTrecho.inicio`. */
  basePath: string;
  /** Nome do campo de formato: `format` (empreendimento) ou `formato` (trecho E). */
  formatFieldName?: "format" | "formato";
  variant?: CoordinateInputVariant;
  /** Campos auxiliares abaixo das coordenadas (`listagem` inclui município). */
  metadataVariant?: CoordinateMetadataVariant;
  title?: string;
  /** Fixa SIRGAS 2000 como único datum visível (cadastros novos). */
  lockDatum?: boolean;
  /** Mostra datums legados além de SIRGAS 2000 (edição de registros antigos). */
  showLegacyDatums?: boolean;
  className?: string;
};

function path(basePath: string, suffix: string): string {
  return `${basePath}.${suffix}`;
}

function DmsRow({
  form,
  axisLabel,
  grauName,
  minName,
  segName,
}: {
  form: CoordinateInputProps["form"];
  axisLabel: string;
  grauName: string;
  minName: string;
  segName: string;
}) {
  return (
    <div className="space-y-2 rounded-md border p-3">
      <p className="text-sm font-medium">{axisLabel}</p>
      <div className="grid grid-cols-3 gap-2">
        <FormField
          control={form.control}
          name={grauName}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Grau</FormLabel>
              <FormControl>
                <Input placeholder="00" inputMode="numeric" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={minName}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Min</FormLabel>
              <FormControl>
                <Input placeholder="00" inputMode="numeric" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={segName}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Seg</FormLabel>
              <FormControl>
                <Input placeholder="00" inputMode="decimal" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

function MetadataTextField({
  form,
  name,
  label,
  className,
  placeholder,
}: {
  form: CoordinateInputProps["form"];
  name: string;
  label: string;
  className?: string;
  placeholder?: string;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input placeholder={placeholder} {...field} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

export function CoordinateInput({
  form,
  basePath,
  formatFieldName = "format",
  variant = "full",
  metadataVariant = "project",
  title,
  lockDatum = false,
  showLegacyDatums = true,
  className,
}: CoordinateInputProps) {
  const formatPath = path(basePath, formatFieldName);
  const coordinateFormat = form.watch(formatPath) as CoordinateFormat | undefined;
  const latLong = form.watch(path(basePath, "latLong"));
  const utm = form.watch(path(basePath, "utm"));

  const datumOptions = React.useMemo(() => {
    if (lockDatum && !showLegacyDatums) {
      return COORDINATE_DATUM_OPTIONS.filter((d) => d.value === DEFAULT_DATUM);
    }
    if (!showLegacyDatums) {
      return COORDINATE_DATUM_OPTIONS.filter((d) => d.value === DEFAULT_DATUM);
    }
    return COORDINATE_DATUM_OPTIONS;
  }, [lockDatum, showLegacyDatums]);

  const showHeading = Boolean(title) || variant !== "coords-only";

  return (
    <div className={cn("space-y-4 rounded-md border p-4", className)}>
      {showHeading && title ? (
        <h4 className="font-medium">{title}</h4>
      ) : null}
      {showHeading && !title && variant === "full" ? (
        <h3 className="text-lg font-medium">Localização Geográfica</h3>
      ) : null}

      <FormField
        control={form.control}
        name={path(basePath, "datum")}
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>
              {lockDatum && !showLegacyDatums
                ? "Datum"
                : "Assinalar Datum (Obrigatório)"}
            </FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value ?? DEFAULT_DATUM}
                className="flex flex-wrap gap-4"
                disabled={lockDatum && !showLegacyDatums && datumOptions.length === 1}
              >
                {datumOptions.map((d) => (
                  <FormItem key={d.value} className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value={d.value} />
                    </FormControl>
                    <FormLabel className="font-normal">{d.label}</FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormControl>
            {lockDatum ? (
              <FormDescription>
                Padrão AmbientaR: SIRGAS 2000 / UTM 23S (Minas Gerais).
              </FormDescription>
            ) : null}
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={formatPath}
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Formato da coordenada</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex flex-wrap gap-4"
              >
                {COORDINATE_FORMAT_OPTIONS.map((f) => (
                  <FormItem key={f.value} className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value={f.value} />
                    </FormControl>
                    <FormLabel className="font-normal">{f.label}</FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {coordinateFormat === "Lat/Long" ? (
        <div className="space-y-3 border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Digite graus, minutos e segundos como magnitudes positivas. Latitude Sul e
            longitude Oeste serão registradas com sinal negativo no preview decimal.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DmsRow
              form={form}
              axisLabel="Latitude"
              grauName={path(basePath, "latLong.lat.grau")}
              minName={path(basePath, "latLong.lat.min")}
              segName={path(basePath, "latLong.lat.seg")}
            />
            <DmsRow
              form={form}
              axisLabel="Longitude"
              grauName={path(basePath, "latLong.long.grau")}
              minName={path(basePath, "latLong.long.min")}
              segName={path(basePath, "latLong.long.seg")}
            />
          </div>
        </div>
      ) : null}

      {coordinateFormat === "UTM" ? (
        <div className="space-y-4 border-t pt-4">
          <p className="text-sm text-muted-foreground">
            SIRGAS 2000 — UTM hemisfério sul. X com 6 dígitos, Y com 7 dígitos (sem
            casas decimais).
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name={path(basePath, "utm.x")}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>X / Easting (6 dígitos)</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" maxLength={6} {...field} />
                  </FormControl>
                  <FormDescription>Não considerar casas decimais</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={path(basePath, "utm.y")}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Y / Northing (7 dígitos)</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" maxLength={7} {...field} />
                  </FormControl>
                  <FormDescription>Não considerar casas decimais</FormDescription>
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name={path(basePath, "utm.fuso")}
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Fuso UTM</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value ?? "23"}
                    className="flex flex-wrap gap-4"
                  >
                    {COORDINATE_FUSO_OPTIONS.map((f) => (
                      <FormItem key={f.value} className="flex items-center gap-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={f.value} />
                        </FormControl>
                        <FormLabel className="font-normal">{f.label}</FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ) : null}

      <CoordinateDecimalPreview
        format={coordinateFormat}
        latLong={latLong}
        utm={utm}
      />

      {variant === "full" ? (
        <>
          <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2">
            <MetadataTextField
              form={form}
              name={path(basePath, "local")}
              label={
                metadataVariant === "listagem"
                  ? "Local (fazenda, sítio etc.)"
                  : "Local (Fazenda, Sítio, etc.)"
              }
            />
            {metadataVariant === "listagem" ? (
              <MetadataTextField
                form={form}
                name={path(basePath, "municipio")}
                label="Município(s)"
              />
            ) : null}
            <MetadataTextField
              form={form}
              name={path(basePath, "additionalLocationInfo")}
              label={
                metadataVariant === "listagem"
                  ? "Referência adicional para localização"
                  : "Informação adicional para localização"
              }
              placeholder={
                metadataVariant === "listagem"
                  ? undefined
                  : "Ex: Próximo à ponte sobre o Rio..."
              }
              className={metadataVariant === "listagem" ? "md:col-span-2" : undefined}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <MetadataTextField
              form={form}
              name={path(basePath, "hydrographicBasin")}
              label={
                metadataVariant === "listagem"
                  ? "Bacia hidrográfica"
                  : "Bacia Hidrográfica"
              }
            />
            <MetadataTextField
              form={form}
              name={path(basePath, "hydrographicSubBasin")}
              label={
                metadataVariant === "listagem"
                  ? "Sub-bacia hidrográfica"
                  : "Sub-bacia Hidrográfica"
              }
            />
            <MetadataTextField
              form={form}
              name={path(basePath, "upgrh")}
              label="UPGRH"
            />
            <MetadataTextField
              form={form}
              name={path(basePath, "nearestWaterCourse")}
              label="Curso d'água mais próximo"
            />
          </div>
        </>
      ) : null}

      {variant === "trecho-e" ? (
        <div className="grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-2">
          <MetadataTextField
            form={form}
            name={path(basePath, "local")}
            label="Local (fazenda, sítio etc.)"
          />
          <MetadataTextField
            form={form}
            name={path(basePath, "municipio")}
            label="Município(s)"
          />
          <MetadataTextField
            form={form}
            name={path(basePath, "referenciaAdicional")}
            label="Referência adicional para localização"
            className="md:col-span-2"
          />
          <MetadataTextField
            form={form}
            name={path(basePath, "baciaHidrografica")}
            label="Bacia hidrográfica"
          />
          <MetadataTextField
            form={form}
            name={path(basePath, "subBaciaHidrografica")}
            label="Sub-bacia hidrográfica"
          />
          <MetadataTextField
            form={form}
            name={path(basePath, "upgrh")}
            label="UPGRH"
          />
          <MetadataTextField
            form={form}
            name={path(basePath, "cursoDaguaProximo")}
            label="Curso d'água mais próximo"
          />
        </div>
      ) : null}
    </div>
  );
}

export type { Datum };
