import { adminDb } from "@/lib/firebase-admin";
import { formatPlatformCompanyAddress } from "@/lib/platform-company";
import type { PlatformContractPublic } from "@/lib/types";
import {
  fetchBrandingImagesForServer,
  fetchCompanyBrandingSettings,
} from "@/lib/branding/branding-server";
import type { BrandingPdfImages } from "@/lib/branding-pdf";

export type McaConsultancyBranding = {
  companyName: string;
  address?: string;
  phone?: string;
  email?: string;
};

const DEFAULT_BRANDING: McaConsultancyBranding = {
  companyName: "Pimenta Consultoria Ambiental",
  address: "Unaí — MG",
  email: "pimentambiental@hotmail.com",
};

export async function fetchMcaConsultancyBranding(): Promise<McaConsultancyBranding> {
  try {
    const snap = await adminDb()
      .collection("companySettings")
      .doc("platformContractPublic")
      .get();
    if (!snap.exists) return DEFAULT_BRANDING;
    const data = snap.data() as PlatformContractPublic;
    if (!data.name?.trim()) return DEFAULT_BRANDING;
    return {
      companyName: data.fantasyName?.trim() || data.name.trim(),
      address: formatPlatformCompanyAddress(data),
      phone: undefined,
      email: data.email?.trim() || undefined,
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}

/** Imagens de branding (opcional — não bloqueia export MCA). */
export async function fetchMcaOptionalBrandingImages(): Promise<BrandingPdfImages> {
  try {
    const settings = await fetchCompanyBrandingSettings();
    return fetchBrandingImagesForServer({
      headerImageUrl: settings.headerImageUrl,
      footerImageUrl: settings.footerImageUrl,
      watermarkImageUrl: settings.watermarkImageUrl,
    });
  } catch {
    return {
      headerBase64: null,
      footerBase64: null,
      watermarkBase64: null,
    };
  }
}
