import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
 toUserCreateInput,
 toUserUpdateInput,
 UserValidationError,
} from "../modules/users/users.schemas";
import type { UserInput } from "../modules/users/users.types";

const validUser: UserInput = {
 tipo: "FISICA",
 cpfCnpj: "529.982.247-25",
 entityType: "CLIENTE",
 nome: "  Ana   Silva ",
 email: " ANA@EXEMPLO.COM ",
 telefone: "31999999999",
 cep: "30.100-000",
 logradouro: " Rua A ",
 numero: " 1 ",
 bairro: " Centro ",
 municipio: " Belo Horizonte ",
 uf: "mg",
 rg: "MG-1234",
 emissor: "SSP",
 nacionalidade: "Brasileira",
 estadoCivil: "solteiro",
 dataNascimento: "1990-01-01",
 ctfIbama: "",
};

describe("contrato de usuário", () => {
 it("normaliza criação conforme o contrato real da API", () => {
  const result = toUserCreateInput(validUser);
  assert.equal(result.nome, "Ana Silva");
  assert.equal(result.email, "ana@exemplo.com");
  assert.equal(result.cpfCnpj, "52998224725");
  assert.equal(result.cep, "30100000");
  assert.equal(result.uf, "MG");
  assert.equal(result.estadoCivil, "SOLTEIRO");
  assert.equal(result.ctfIbama, undefined);
 });

 it("não envia campos imutáveis no PUT de usuário", () => {
  const result = toUserUpdateInput(validUser);
  assert.equal("tipo" in result, false);
  assert.equal("cpfCnpj" in result, false);
  assert.equal("entityType" in result, false);
  assert.equal(result.nome, "Ana Silva");
 });

 it("exige os campos condicionais de pessoa física", () => {
  assert.throws(
   () => toUserCreateInput({ ...validUser, dataNascimento: null, estadoCivil: "" }),
   (error: unknown) => {
    assert.ok(error instanceof UserValidationError);
    assert.ok(error.fieldErrors.dataNascimento);
    assert.ok(error.fieldErrors.estadoCivil);
    return true;
   },
  );
 });

 it("aceita pessoa jurídica sem nascimento e estado civil", () => {
  const result = toUserCreateInput({
   ...validUser,
   tipo: "JURIDICA",
   cpfCnpj: "04.252.011/0001-10",
   dataNascimento: null,
   estadoCivil: "",
  });
  assert.equal(result.cpfCnpj, "04252011000110");
 });

 it("rejeita documento, nome, e-mail, RG, endereço e UF inválidos", () => {
  assert.throws(
   () => toUserCreateInput({
    ...validUser,
    cpfCnpj: "111.111.111-11",
    nome: "Ana",
    email: "invalido",
    rg: "12",
    cep: "",
    logradouro: "",
    numero: "",
    bairro: "",
    municipio: "",
    uf: "M",
   }),
   (error: unknown) => {
    assert.ok(error instanceof UserValidationError);
    assert.deepEqual(Object.keys(error.fieldErrors).sort(), [
     "bairro", "cep", "cpfCnpj", "email", "logradouro", "municipio", "nome", "numero", "rg", "uf",
    ]);
    return true;
   },
  );
 });
});
