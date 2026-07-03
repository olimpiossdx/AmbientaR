import { NextResponse } from "next/server";
import {
  apiAuthErrorResponse,
  getBearerToken,
  requireAuthenticatedApi,
} from "@/lib/api-auth";
import {
  getPackageUsageForUid,
} from "@/lib/package-enforcement-server";
import {
  isPackageLimitsExempt,
  isSubjectToPackageLimits,
} from "@/lib/package-limits";

export async function GET(req: Request) {
  try {
    const user = await requireAuthenticatedApi(req);

    if (!isSubjectToPackageLimits(user) || isPackageLimitsExempt(user)) {
      return NextResponse.json({
        enforced: false,
        role: user.role,
        package: user.package ?? null,
      });
    }

    const usage = await getPackageUsageForUid(user.uid || user.id);
    return NextResponse.json({ enforced: true, usage });
  } catch (error) {
    if (!getBearerToken(req)) {
      return apiAuthErrorResponse(error);
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao carregar limites.",
      },
      { status: 500 },
    );
  }
}
