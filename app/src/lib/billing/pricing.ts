import type { ClientPackage } from "@/lib/types";
import { PACKAGE_ANNUAL_PRICE_BRL } from "@/lib/package-pricing";
import { clientPackageRequiresAnnualPaymentStep } from "@/lib/platform-access";

export function resolvePackageAnnualAmountBrl(pkg: ClientPackage): number | null {
  if (!clientPackageRequiresAnnualPaymentStep(pkg)) return null;
  const value = PACKAGE_ANNUAL_PRICE_BRL[pkg];
  return typeof value === "number" && value > 0 ? value : null;
}

/** Formato exigido pela API Pix: "1234.56" */
export function formatPixAmountBrl(amount: number): string {
  return amount.toFixed(2);
}
