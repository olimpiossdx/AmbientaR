import type { UserRole } from "@/lib/types";

/** Admin e supervisor: mesmas capacidades de supervisão na UI onde aplicável. */
export function isAdminOrSupervisorRole(
  role: UserRole | undefined | null,
): boolean {
  return role === "admin" || role === "supervisor";
}
