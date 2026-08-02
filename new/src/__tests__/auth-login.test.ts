import assert from "node:assert/strict";
import test from "node:test";
import type { ApiResponse } from "../service/http/types";
import {
 getLoginErrorMessage,
 normalizeLoginModel,
 resolveLoginRedirect,
} from "../auth/login-policy";

function errorResponse(httpStatus: number, message = "detalhe interno"): ApiResponse<unknown> {
 return {
  ok: false,
  status: "error",
  httpStatus,
  data: null,
  error: { code: String(httpStatus), message },
  notifications: [],
  headers: new Headers(),
  request: {
   url: "http://localhost:3001/auth/login",
   method: "POST",
   attempts: 1,
   retried: false,
  },
 };
}

test("login normaliza e-mail e documentos antes de chamar a API", () => {
 assert.deepEqual(
  normalizeLoginModel({ username: "  USUARIO@EXEMPLO.COM ", password: " senha123 " }),
  { username: "usuario@exemplo.com", password: "senha123" },
 );
 assert.equal(
  normalizeLoginModel({ username: "529.982.247-25", password: "senha123" }).username,
  "52998224725",
 );
 assert.equal(
  normalizeLoginModel({ username: "11.222.333/0001-81", password: "senha123" }).username,
  "11222333000181",
 );
});

test("redirecionamento pós-login aceita somente rotas autenticadas internas", () => {
 assert.equal(resolveLoginRedirect(""), "/app");
 assert.equal(resolveLoginRedirect("?redirect=%2Fapp%2Fcalendar%3Fview%3Dweek"), "/app/calendar?view=week");
 assert.equal(resolveLoginRedirect("?redirect=https%3A%2F%2Fexample.com"), "/app");
 assert.equal(resolveLoginRedirect("?redirect=%2F%2Fevil.example"), "/app");
 assert.equal(resolveLoginRedirect("?redirect=%2Flogin"), "/app");
});

test("login não enumera usuário e diferencia indisponibilidade", () => {
 assert.equal(getLoginErrorMessage(errorResponse(401, "usuário não encontrado")), "E-mail/documento ou senha incorretos.");
 assert.equal(getLoginErrorMessage(errorResponse(403, "senha errada")), "E-mail/documento ou senha incorretos.");
 assert.match(getLoginErrorMessage(errorResponse(0)), /conectar ao AmbientaR/);
 assert.match(getLoginErrorMessage(errorResponse(503)), /temporariamente indisponível/);
});
