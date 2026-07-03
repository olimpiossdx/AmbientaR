export const COOKIE_CONSENT_STORAGE_KEY = "ambientar_ad_cookie_consent_v1";

export type CookieConsentChoice = "accepted" | "essential_only";

export type CookieConsentRecord = {
  choice: CookieConsentChoice;
  at: string;
};

export function readCookieConsent(): CookieConsentRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsentRecord;
    if (
      parsed?.choice === "accepted" ||
      parsed?.choice === "essential_only"
    ) {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

export function writeCookieConsent(choice: CookieConsentChoice): CookieConsentRecord {
  const record: CookieConsentRecord = {
    choice,
    at: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      COOKIE_CONSENT_STORAGE_KEY,
      JSON.stringify(record),
    );
  }
  return record;
}

export function hasAdvertisingCookieConsent(): boolean {
  return readCookieConsent()?.choice === "accepted";
}
