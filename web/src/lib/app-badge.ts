/** Sincroniza badge no ícone do PWA (Badging API), quando suportado. */
export function syncAppBadge(unreadCount: number): void {
  if (typeof navigator === "undefined") return;

  const nav = navigator as Navigator & {
    setAppBadge?: (count?: number) => Promise<void>;
    clearAppBadge?: () => Promise<void>;
  };

  if (unreadCount > 0 && typeof nav.setAppBadge === "function") {
    void nav.setAppBadge(unreadCount).catch(() => {});
    return;
  }
  if (typeof nav.clearAppBadge === "function") {
    void nav.clearAppBadge().catch(() => {});
  }
}
