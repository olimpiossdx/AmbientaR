import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getUsersTotalPages, toUsersListViewState } from "../modules/users/users-list-state";

describe("estado da listagem de usuários", () => {
 it("distingue lista vazia de lista carregada", () => {
  const state = toUsersListViewState({
   status: "success",
   page: { items: [], page: 1, size: 10, total: 0 },
  });

  assert.equal(state.status, "empty");
 });

 it("calcula páginas sem produzir zero páginas", () => {
  assert.equal(getUsersTotalPages(0, 10), 1);
  assert.equal(getUsersTotalPages(21, 10), 3);
 });

 it("preserva estado de erro e acesso negado", () => {
  assert.deepEqual(
   toUsersListViewState({ status: "error", message: "falha" }),
   { status: "error", message: "falha" },
  );
  assert.deepEqual(
   toUsersListViewState({ status: "forbidden", message: "negado" }),
   { status: "forbidden", message: "negado" },
  );
 });
});
