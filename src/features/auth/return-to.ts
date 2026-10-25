import type { ApiUser } from "@/types/api";
import { canVolunteer } from "@/utils/volunteer-permissions";
export interface ReturnTo {
  pathname: string;
  state?: unknown;
}
export function returnToFrom(state: unknown): ReturnTo | undefined {
  if (!state || typeof state !== "object" || !("returnTo" in state)) return;
  const target = state.returnTo;
  if (
    !target ||
    typeof target !== "object" ||
    !("pathname" in target) ||
    typeof target.pathname !== "string"
  )
    return;
  if (
    !/^\/(?:requests(?:\/new|\/[a-f0-9]{24}(?:\/edit)?)?|dashboard|admin)$/.test(
      target.pathname,
    )
  )
    return;
  return {
    pathname: target.pathname,
    state: "state" in target ? target.state : undefined,
  };
}

// A saved internal destination is still subject to the signed-in user's role.
export function authorizedReturnTo(
  state: unknown,
  user: Pick<ApiUser, "roles" | "volunteerPermissions"> | null | undefined,
): ReturnTo | undefined {
  const target = returnToFrom(state);
  if (!target || !user) return;
  if (
    target.pathname === "/admin" &&
    !user.roles.some((role) => ["admin", "super-admin"].includes(role))
  )
    return;
  if (
    (target.pathname === "/requests/new" ||
      target.pathname.endsWith("/edit")) &&
    !canVolunteer(user, "submit-referrals")
  )
    return;
  return target;
}
export function personalLoginPath(profileCompleted: boolean) {
  return profileCompleted ? "/dashboard" : "/dashboard?tab=profile";
}
