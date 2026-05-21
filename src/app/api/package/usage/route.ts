import { NextResponse } from "next/server";
import {
  getPackageUsageForUid,
  verifyIdTokenAndLoadUser,
} from "@/lib/package-enforcement-server";
import {
  isPackageLimitsExempt,
  isSubjectToPackageLimits,
} from "@/lib/package-limits";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const user = await verifyIdTokenAndLoadUser(
      authHeader?.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length)
        : null,
    );

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
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Falha ao carregar limites.",
      },
      { status: 401 },
    );
  }
}
