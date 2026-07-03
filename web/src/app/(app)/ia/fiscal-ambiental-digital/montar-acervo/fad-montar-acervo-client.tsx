"use client";

import { useSearchParams } from "next/navigation";
import { FadSatelliteWorkbench } from "@/components/fiscal-ambiental/fad-satellite-workbench";

export function FadMontarAcervoClient() {
  const searchParams = useSearchParams();
  const workspaceId = searchParams?.get("workspace");
  return <FadSatelliteWorkbench initialWorkspaceId={workspaceId} />;
}
