export type AdSenseConfig = {
  clientId: string;
  footerSlotId: string;
  sidebarSlotId: string;
};

export function getAdSenseConfig(): AdSenseConfig | null {
  const clientId =
    process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() ||
    process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID?.trim() ||
    "";
  if (!clientId) return null;

  return {
    clientId,
    footerSlotId:
      process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER?.trim() || "",
    sidebarSlotId:
      process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR?.trim() || "",
  };
}

export function isAdSenseConfigured(): boolean {
  const cfg = getAdSenseConfig();
  return Boolean(cfg?.clientId);
}
