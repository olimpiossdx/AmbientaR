"use client";

import * as React from "react";
import { doc, updateDoc } from "firebase/firestore";
import { useFirebase } from "@/firebase";
import { CookieConsentBanner } from "@/components/cookie-consent-banner";
import { AdSenseSlot } from "@/components/adsense-slot";
import { SubscriptionExpiredBanner } from "@/components/subscription-expired-banner";
import {
  hasAdvertisingCookieConsent,
  type CookieConsentRecord,
} from "@/lib/cookie-consent";
import { getAdSenseConfig } from "@/lib/adsense-config";
import { shouldShowThirdPartyAdvertising } from "@/lib/package-subscription";
import { shouldBlockPlatformAccess } from "@/lib/platform-access";
import { PlatformAccessBlocked } from "@/components/platform-access-blocked";
import type { AppUser } from "@/lib/types";

type Props = {
  user: AppUser;
  children: React.ReactNode;
};

export function PortalAdvertisingLayer({ user, children }: Props) {
  const { firestore } = useFirebase();
  const [cookieConsent, setCookieConsent] = React.useState(false);
  const adsConfig = getAdSenseConfig();

  React.useEffect(() => {
    setCookieConsent(hasAdvertisingCookieConsent());
  }, []);

  const handleConsentChange = (record: CookieConsentRecord) => {
    setCookieConsent(record.choice === "accepted");
    if (firestore && user?.id && record.choice === "accepted") {
      const userRef = doc(firestore, "users", user.id);
      void updateDoc(userRef, {
        advertisingCookieConsentAt: record.at,
      }).catch(() => {});
    }
  };

  if (shouldBlockPlatformAccess(user)) {
    return <PlatformAccessBlocked user={user} />;
  }

  const showAds = shouldShowThirdPartyAdvertising(user);
  const adsReady = showAds && cookieConsent;

  return (
    <>
      <SubscriptionExpiredBanner user={user} />
      {children}
      {adsReady && adsConfig?.footerSlotId ? (
        <div className="border-t border-border/50 bg-muted/10 px-4 py-2">
          <AdSenseSlot
            slotId={adsConfig.footerSlotId}
            label="Publicidade no rodapé"
          />
        </div>
      ) : null}
      {showAds ? (
        <CookieConsentBanner onConsentChange={handleConsentChange} />
      ) : null}
    </>
  );
}
