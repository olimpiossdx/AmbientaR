import { useSyncExternalStore } from "react";
import { authStore } from "./auth-store";

export function useAuthSnapshot() {
 return useSyncExternalStore(authStore.subscribe, authStore.getSnapshot, authStore.getSnapshot);
}

export function useAuthUser() {
 return useAuthSnapshot().user;
}

export function useCanUseApp() {
 return useAuthSnapshot().canUseApp;
}

export function useIsSessionLocked() {
 return useAuthSnapshot().isLocked;
}
