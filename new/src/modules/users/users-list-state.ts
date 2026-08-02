import type { UsersListResult, UsersListViewState } from "./users.types";

export function toUsersListViewState(result: UsersListResult): UsersListViewState {
 if (result.status === "forbidden") {
  return result;
 }

 if (result.status === "error") {
  return result;
 }

 return result.page.items.length === 0
  ? { status: "empty", page: result.page }
  : { status: "ready", page: result.page };
}

export function getUsersTotalPages(total: number, size: number): number {
 return Math.max(1, Math.ceil(Math.max(0, total) / Math.max(1, size)));
}
