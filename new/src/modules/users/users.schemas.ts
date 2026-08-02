import type {
 UserCreateInput,
 UserFieldErrors,
 UserInput,
 UserUpdateInput,
} from "./users.types";

const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
const CIVIL_STATES = new Set(["SOLTEIRO", "CASADO", "DIVORCIADO", "VIUVO", "OUTROS"]);

export class UserValidationError extends Error {
 readonly fieldErrors: UserFieldErrors;

 constructor(fieldErrors: UserFieldErrors) {
  super(Object.values(fieldErrors)[0] ?? "Revise os dados do usuário.");
  this.name = "UserValidationError";
  this.fieldErrors = fieldErrors;
 }
}

function text(value: string | undefined | null): string {
 return value?.trim() ?? "";
}

function documentDigits(value: string): string {
 return value.replace(/\D/g, "");
}

function isCpfValid(cpf: string): boolean {
 if (!/^\d{11}$/.test(cpf) || /^(\d)\1+$/.test(cpf)) return false;
 const digit = (length: number) => {
  let sum = 0;
  for (let index = 0; index < length; index += 1) sum += Number(cpf[index]) * (length + 1 - index);
  const remainder = (sum * 10) % 11;
  return remainder === 10 ? 0 : remainder;
 };
 return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

function isCnpjValid(cnpj: string): boolean {
 if (!/^\d{14}$/.test(cnpj) || /^(\d)\1+$/.test(cnpj)) return false;
 const calculate = (base: string) => {
  let weight = base.length - 7;
  let sum = 0;
  for (const character of base) {
   sum += Number(character) * weight;
   weight -= 1;
   if (weight < 2) weight = 9;
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
 };
 const first = calculate(cnpj.slice(0, 12));
 return first === Number(cnpj[12]) && calculate(cnpj.slice(0, 12) + first) === Number(cnpj[13]);
}

function isAdult(value: string): boolean {
 const birth = new Date(`${value.slice(0, 10)}T12:00:00`);
 if (Number.isNaN(birth.getTime())) return false;
 const today = new Date();
 let age = today.getFullYear() - birth.getFullYear();
 if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age -= 1;
 return age >= 18;
}

export function validateUserInput(input: UserInput, mode: "create" | "update"): UserInput {
 const normalized: UserInput = {
  ...input,
  nome: text(input.nome).replace(/\s+/g, " "),
  email: text(input.email).toLowerCase(),
  telefone: text(input.telefone),
  cpfCnpj: documentDigits(input.cpfCnpj),
  entityType: text(input.entityType),
  cep: documentDigits(input.cep),
  logradouro: text(input.logradouro),
  numero: text(input.numero),
  bairro: text(input.bairro),
  municipio: text(input.municipio),
  uf: text(input.uf).toUpperCase(),
  rg: text(input.rg) || undefined,
  emissor: text(input.emissor) || undefined,
  nacionalidade: text(input.nacionalidade) || "Brasileira",
  estadoCivil: text(input.estadoCivil).toUpperCase() || undefined,
  dataNascimento: input.dataNascimento ? input.dataNascimento.slice(0, 10) : null,
  ctfIbama: text(input.ctfIbama) || undefined,
 };
 const errors: UserFieldErrors = {};
 if (normalized.nome.split(/\s+/).length < 2) errors.nome = "Informe nome e sobrenome ou a razão social completa.";
 if (!EMAIL_PATTERN.test(normalized.email)) errors.email = "Informe um e-mail válido.";
 if (!normalized.telefone) errors.telefone = "Informe o telefone.";
 if (!normalized.cep) errors.cep = "Informe o CEP.";
 if (!normalized.logradouro) errors.logradouro = "Informe o logradouro.";
 if (!normalized.numero) errors.numero = "Informe o número.";
 if (!normalized.bairro) errors.bairro = "Informe o bairro.";
 if (!normalized.municipio) errors.municipio = "Informe o município.";
 if (!/^[A-Z]{2}$/.test(normalized.uf)) errors.uf = "Informe a UF com duas letras.";
 if (normalized.rg && normalized.rg.replace(/[^a-zA-Z0-9]/g, "").length < 4) errors.rg = "O RG deve ter pelo menos quatro caracteres.";
 if (mode === "create" && !isCpfValid(normalized.cpfCnpj) && !isCnpjValid(normalized.cpfCnpj)) {
  errors.cpfCnpj = "Informe um CPF ou CNPJ válido.";
 }
 if (normalized.tipo === "FISICA") {
  if (!normalized.dataNascimento || !isAdult(normalized.dataNascimento)) errors.dataNascimento = "A pessoa física deve ter pelo menos 18 anos.";
  if (!normalized.estadoCivil || !CIVIL_STATES.has(normalized.estadoCivil)) errors.estadoCivil = "Selecione um estado civil válido.";
 }
 if (Object.keys(errors).length) throw new UserValidationError(errors);
 return normalized;
}

export function toUserCreateInput(input: UserInput): UserCreateInput {
 return validateUserInput(input, "create");
}

export function toUserUpdateInput(input: UserInput): UserUpdateInput {
 const { tipo: _tipo, cpfCnpj: _cpfCnpj, entityType: _entityType, ...update } = validateUserInput(input, "update");
 void _tipo; void _cpfCnpj; void _entityType;
 return update;
}
