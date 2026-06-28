/**
 * Utilitários de path tipado para objetos aninhados.
 *
 * A API pública do Form/useForm usa estes tipos para sugerir campos no editor
 * e para validar, em tempo de TypeScript, o valor aceito por cada caminho.
 */

type Primitive = null | undefined | string | number | boolean | symbol | bigint;
type BrowserNativeObject = Date | File | FileList | Blob;
type ArrayKey = number | `${number}`;

type PathImpl<TKey extends string | number, TValue> =
  TValue extends Primitive | BrowserNativeObject
    ? `${TKey}`
    : TValue extends ReadonlyArray<infer TItem>
      ?
        | `${TKey}`
        | `${TKey}.${ArrayKey}`
        | `${TKey}.${ArrayKey}.${Path<TItem>}`
      : TValue extends object
        ? `${TKey}` | `${TKey}.${Path<TValue>}`
        : `${TKey}`;

export type Path<TValue> =
  TValue extends Primitive | BrowserNativeObject
    ? never
    : TValue extends ReadonlyArray<infer TItem>
      ? `${ArrayKey}` | `${ArrayKey}.${Path<TItem>}`
      : {
          [TKey in keyof TValue]-?: TKey extends string | number
            ? PathImpl<TKey, TValue[TKey]>
            : never;
        }[keyof TValue];

export type PathValue<TValue, TPath extends Path<TValue>> =
  TPath extends `${infer TKey}.${infer TRest}`
    ? TValue extends ReadonlyArray<infer TItem>
      ? TKey extends `${number}`
        ? TRest extends Path<TItem>
          ? PathValue<TItem, TRest>
          : never
        : never
      : TKey extends keyof TValue
        ? TRest extends Path<TValue[TKey]>
          ? PathValue<TValue[TKey], TRest>
          : never
        : never
    : TValue extends ReadonlyArray<infer TItem>
      ? TPath extends `${number}`
        ? TItem
        : never
      : TPath extends keyof TValue
        ? TValue[TPath]
        : never;

export function splitPath(path: string): string[] {
  return path.replace(/\]/g, "").split(/[.\[]/).filter(Boolean);
}

function isIndexKey(key: string): boolean {
  return /^\d+$/.test(key);
}

export function getPathValue<TValue = unknown>(obj: unknown, path: string): TValue | undefined {
  if (!path || obj === null || obj === undefined) {
    return undefined;
  }

  const keys = splitPath(path);
  let current: unknown = obj;

  for (const key of keys) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<string, unknown>)[key];
  }

  return current as TValue | undefined;
}

export function setPathValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = splitPath(path);

  if (keys.length === 0) {
    return;
  }

  let current: Record<string, unknown> = obj;

  keys.forEach((key, index) => {
    const isLast = index === keys.length - 1;

    if (isLast) {
      current[key] = value;
      return;
    }

    const nextKey = keys[index + 1];
    const nextValue = current[key];

    if (nextValue === null || typeof nextValue !== "object") {
      current[key] = isIndexKey(nextKey) ? [] : {};
    }

    current = current[key] as Record<string, unknown>;
  });
}

export function cloneModel<TValue>(value: TValue): TValue {
  if (typeof structuredClone === "function") {
    try {
      return structuredClone(value);
    } catch {
      // File/FileList e alguns objetos nativos podem não ser clonáveis em todos os ambientes.
    }
  }

  if (Array.isArray(value)) {
    return value.map((item) => cloneModel(item)) as TValue;
  }

  if (value && typeof value === "object") {
    if (value instanceof Date || value instanceof File || value instanceof Blob) {
      return value;
    }

    const output: Record<string, unknown> = {};

    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      output[key] = cloneModel(item);
    });

    return output as TValue;
  }

  return value;
}
