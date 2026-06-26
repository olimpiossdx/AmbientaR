import { redirect } from "next/navigation";
import { FAD_ROUTE_BASE } from "@/lib/fiscal-ambiental/constants";

export default function FiscalAmbientalDigitalIndexPage() {
  redirect(`${FAD_ROUTE_BASE}/dashboard`);
}
