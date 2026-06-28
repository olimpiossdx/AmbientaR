export type MaskTokenMap = Record<string, RegExp>;

export type MaskPreset =
  | "digits"
  | "number"
  | "currency"
  | "cpf"
  | "cnpj"
  | "phone"
  | "telefone"
  | "tel"
  | "cep";

export type MaskDefinition = MaskPreset | string;

export type MaskResult = {
  /** Valor sem mascara, pronto para modelo/form. */
  value: string;
  /** Valor formatado para exibir no input. */
  maskedValue: string;
  /** Alias explicito de value para facilitar leitura no onChange. */
  unmaskedValue: string;
  /** Mascara usada para gerar o resultado. */
  mask: MaskDefinition;
};

export type MaskInputMode =
  | "none"
  | "text"
  | "tel"
  | "url"
  | "email"
  | "numeric"
  | "decimal"
  | "search";

export type ResolvedMask = {
  mask: MaskDefinition;
  preset?: MaskPreset;
  pattern?: string;
  inputMode?: MaskInputMode;
  maxLength?: number;
};

export type InputMaskApi = {
  apply: (value?: unknown) => string;
  remove: (value?: unknown) => string;
  getMaskedValue: () => string;
  getUnmaskedValue: () => string;
  getResult: () => MaskResult | null;
  getDefinition: () => ResolvedMask;
};

export type CreateMaskOptions = {
  tokens?: MaskTokenMap;
  currency?: {
    locale?: string;
    currency?: string;
  };
};

const DEFAULT_TOKENS: MaskTokenMap = {
  "9": /\d/,
  A: /[a-zA-Z]/,
  a: /[a-zA-Z]/,
  "*": /[a-zA-Z0-9]/,
};

const PRESET_PATTERNS: Partial<Record<MaskPreset, string>> = {
  cpf: "999.999.999-99",
  cnpj: "99.999.999/9999-99",
  cep: "99999-999",
};

const PRESET_ALIASES: Partial<Record<MaskPreset, MaskPreset>> = {
  telefone: "phone",
  tel: "phone",
};

function toStringValue(value: unknown): string {
  return value == null ? "" : String(value);
}

export function onlyDigits(value: unknown): string {
  return toStringValue(value).replace(/\D/g, "");
}

export function onlyLetters(value: unknown): string {
  return toStringValue(value).replace(/[^a-zA-Z]/g, "");
}

export function onlyAlphaNumeric(value: unknown): string {
  return toStringValue(value).replace(/[^a-zA-Z0-9]/g, "");
}

function isKnownPreset(mask: MaskDefinition): mask is MaskPreset {
  return [
    "digits",
    "number",
    "currency",
    "cpf",
    "cnpj",
    "phone",
    "telefone",
    "tel",
    "cep",
  ].includes(mask);
}

function normalizePreset(mask: MaskDefinition): MaskPreset | undefined {
  if (!isKnownPreset(mask)) {
    return undefined;
  }

  return PRESET_ALIASES[mask] ?? mask;
}

function resolvePhonePattern(value: unknown): string {
  return onlyDigits(value).length > 10 ? "(99) 99999-9999" : "(99) 9999-9999";
}

function inferCustomUnmask(value: unknown,  pattern: string,  tokenMap: MaskTokenMap = DEFAULT_TOKENS): string {
  const source = toStringValue(value);
  const activeTokens = Array.from(new Set(pattern.split(""))).filter((char) => tokenMap[char]);

  if (!activeTokens.length) {
    return onlyAlphaNumeric(source);
  }

  return Array.from(source)
    .filter((char) => activeTokens.some((token) => tokenMap[token].test(char)))
    .join("");
}

export function resolveMask(mask: MaskDefinition, value?: unknown): ResolvedMask {
  const preset = normalizePreset(mask);

  if (preset === "digits") {
    return { mask, preset, inputMode: "numeric" };
  }

  if (preset === "number") {
    return { mask, preset, inputMode: "decimal" };
  }

  if (preset === "currency") {
    return { mask, preset, inputMode: "numeric" };
  }

  if (preset === "phone") {
    const pattern = resolvePhonePattern(value);
    return { mask, preset, pattern, inputMode: "numeric", maxLength: "(99) 99999-9999".length };
  }

  if (preset && PRESET_PATTERNS[preset]) {
    const pattern = PRESET_PATTERNS[preset]!;
    return { mask, preset, pattern, inputMode: "numeric", maxLength: pattern.length };
  }

  return { mask, pattern: String(mask), inputMode: "text", maxLength: String(mask).length };
}

export function applyPatternMask(
  value: unknown,
  pattern: string,
  tokenMap: MaskTokenMap = DEFAULT_TOKENS,
): string {
  const source = onlyAlphaNumeric(value);
  let sourceIndex = 0;
  let output = "";

  for (let patternIndex = 0; patternIndex < pattern.length && sourceIndex < source.length; patternIndex += 1) {
    const patternChar = pattern[patternIndex];
    const token = tokenMap[patternChar];

    if (!token) {
      output += patternChar;

      if (source[sourceIndex] === patternChar) {
        sourceIndex += 1;
      }

      continue;
    }

    while (sourceIndex < source.length) {
      const valueChar = source[sourceIndex];
      sourceIndex += 1;

      if (token.test(valueChar)) {
        output += valueChar;
        break;
      }
    }
  }

  return output;
}

export function applyCurrencyMask(
  value: unknown,
  locale = "pt-BR",
  currency = "BRL",
): string {
  const digits = onlyDigits(value);

  if (!digits) {
    return "";
  }

  const amount = Number(digits) / 100;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);
}

export function removeMask(
  value: unknown,
  mask: MaskDefinition,
  options: CreateMaskOptions = {},
): string {
  const preset = normalizePreset(mask);

  if (preset === "currency") {
    const digits = onlyDigits(value);

    if (!digits) {
      return "";
    }

    return String(Number(digits) / 100);
  }

  if (preset === "number") {
    const normalized = toStringValue(value)
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^0-9.-]/g, "");

    if (!normalized || normalized === "-" || normalized === "." || normalized === "-.") {
      return "";
    }

    return normalized;
  }

  if (preset) {
    return onlyDigits(value);
  }

  return inferCustomUnmask(value, String(mask), {
    ...DEFAULT_TOKENS,
    ...options.tokens,
  });
}

export function applyMask(
  value: unknown,
  mask: MaskDefinition,
  options: CreateMaskOptions = {},
): MaskResult {
  const rawValue = toStringValue(value);
  const resolvedMask = resolveMask(mask, rawValue);
  const unmaskedValue = removeMask(rawValue, mask, options);
  let maskedValue = rawValue;

  if (resolvedMask.preset === "digits") {
    maskedValue = onlyDigits(rawValue);
  } else if (resolvedMask.preset === "number") {
    maskedValue = removeMask(rawValue, mask, options);
  } else if (resolvedMask.preset === "currency") {
    maskedValue = applyCurrencyMask(rawValue, options.currency?.locale, options.currency?.currency);
  } else if (resolvedMask.pattern) {
    maskedValue = applyPatternMask(unmaskedValue, resolvedMask.pattern, {
      ...DEFAULT_TOKENS,
      ...options.tokens,
    });
  }

  return {
    value: unmaskedValue,
    maskedValue,
    unmaskedValue,
    mask,
  };
}

export function createMask(mask: MaskDefinition, options: CreateMaskOptions = {}) {
  return {
    mask,
    resolve(value?: unknown) {
      return resolveMask(mask, value);
    },
    apply(value?: unknown) {
      return applyMask(value, mask, options).maskedValue;
    },
    remove(value?: unknown) {
      return removeMask(value, mask, options);
    },
    getResult(value?: unknown) {
      return applyMask(value, mask, options);
    },
  };
}
