import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import {
  clientPackageRequiresAnnualPaymentStep,
  isPlatformPaymentAutoApproveEnabled,
  PACKAGE_ANNUAL_AMOUNT_LABEL,
} from "@/lib/platform-access";
import type { RegisterFormValues } from "../schemas/register.schema";
import type { RegisterPaymentState } from "../types/register.types";

export type CreatePlatformPaymentRequestInput = {
  firestore: Firestore;
  uid: string;
  values: RegisterFormValues;
  payment: Pick<RegisterPaymentState, "paymentMethod">;
};

export async function createPlatformPaymentRequest({
  firestore,
  uid,
  values,
  payment,
}: CreatePlatformPaymentRequestInput): Promise<void> {
  if (
    !clientPackageRequiresAnnualPaymentStep(values.selectedPackage) ||
    isPlatformPaymentAutoApproveEnabled()
  ) {
    return;
  }

  try {
    await addDoc(collection(firestore, "platform_payment_requests"), {
      userId: uid,
      email: values.email,
      name: values.name,
      packageId: values.selectedPackage,
      method: payment.paymentMethod,
      amountLabel: PACKAGE_ANNUAL_AMOUNT_LABEL[values.selectedPackage] ?? "",
      status: "pending_verification",
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    console.warn("platform_payment_requests não gravado:", e);
  }
}
