export type CpfCnpjKind = "cpf" | "cnpj" | "invalid";

export function normalizeCpfCnpj(value: unknown): string {
  return String(value ?? "").replace(/\D/g, "");
}

export function detectCpfCnpjKind(value: unknown): CpfCnpjKind {
  const digits = normalizeCpfCnpj(value);

  if (digits.length === 11) {
    return "cpf";
  }

  if (digits.length === 14) {
    return "cnpj";
  }

  return "invalid";
}

export function isValidCpf(value: unknown): boolean {
  const cpf = normalizeCpfCnpj(value);

  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(cpf[index]) * (10 - index);
  }

  let firstDigit = (sum * 10) % 11;
  if (firstDigit === 10) {
    firstDigit = 0;
  }

  if (firstDigit !== Number(cpf[9])) {
    return false;
  }

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(cpf[index]) * (11 - index);
  }

  let secondDigit = (sum * 10) % 11;
  if (secondDigit === 10) {
    secondDigit = 0;
  }

  return secondDigit === Number(cpf[10]);
}

export function isValidCnpj(value: unknown): boolean {
  const cnpj = normalizeCpfCnpj(value);

  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  const calculate = (base: string, weights: number[]) => {
    const sum = weights.reduce((total, weight, index) => {
      return total + Number(base[index]) * weight;
    }, 0);
    const rest = sum % 11;

    return rest < 2 ? 0 : 11 - rest;
  };

  const firstDigit = calculate(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculate(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return firstDigit === Number(cnpj[12]) && secondDigit === Number(cnpj[13]);
}

export function isValidCpfCnpj(value: unknown): boolean {
  const kind = detectCpfCnpjKind(value);

  if (kind === "cpf") {
    return isValidCpf(value);
  }

  if (kind === "cnpj") {
    return isValidCnpj(value);
  }

  return false;
}

export function isEmailIdentifier(value: unknown): boolean {
  return String(value ?? "").includes("@");
}

export function isValidEmail(value: unknown): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value ?? "").trim());
}

export function isValidLoginIdentifier(value: unknown): boolean {
  const identifier = String(value ?? "").trim();

  if (!identifier) {
    return false;
  }

  if (isEmailIdentifier(identifier)) {
    return isValidEmail(identifier);
  }

  return isValidCpfCnpj(identifier);
}
