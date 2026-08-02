import { useCallback, useEffect, useState } from "react";
import { toUsersListViewState } from "./users-list-state";
import { usersService } from "./users.service";
import type { UsersListViewState } from "./users.types";

export function useUsersList(search: string, page: number, size: number) {
 const [revision, setRevision] = useState(0);
 const [state, setState] = useState<UsersListViewState>({ status: "loading" });

 useEffect(() => {
  const controller = new AbortController();
  setState({ status: "loading" });

  void usersService.list({ search, page, size, signal: controller.signal })
   .then((result) => {
    if (!controller.signal.aborted) setState(toUsersListViewState(result));
   })
   .catch((error: unknown) => {
    if (!controller.signal.aborted) {
     setState({ status: "error", message: error instanceof Error ? error.message : "Não foi possível carregar os usuários." });
    }
   });

  return () => controller.abort();
 }, [page, revision, search, size]);

 const retry = useCallback(() => setRevision((current) => current + 1), []);
 return { state, retry };
}
