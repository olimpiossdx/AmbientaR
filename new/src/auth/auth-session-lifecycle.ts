import { AUTH_STORAGE_KEY } from "./auth-persistence";
import { authStore } from "./auth-store";

export function installAuthSessionLifecycle(): () => void {
 if (typeof window === "undefined" || typeof document === "undefined") {
  return () => undefined;
 }

 const checkExpiration = () => {
  authStore.checkExpiration();
 };

 const handleVisibilityChange = () => {
  if (document.visibilityState === "visible") {
   checkExpiration();
  }
 };

 const handleStorage = (event: StorageEvent) => {
  if (event.key === AUTH_STORAGE_KEY || event.key === null) {
   authStore.syncFromPersistence();
  }
 };

 window.addEventListener("focus", checkExpiration);
 window.addEventListener("storage", handleStorage);
 document.addEventListener("visibilitychange", handleVisibilityChange);

 return () => {
  window.removeEventListener("focus", checkExpiration);
  window.removeEventListener("storage", handleStorage);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
 };
}
