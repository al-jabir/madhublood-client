import type { ApiUser } from "@/types/api";
export type VolunteerPermission = "submit-referrals" | "coordinate-requests";
export function canVolunteer(user: Pick<ApiUser,"roles" | "volunteerPermissions"> | null | undefined, permission: VolunteerPermission) {
 return !!user && (user.roles.some(role => ["admin","super-admin"].includes(role)) || (user.roles.includes("volunteer") && user.volunteerPermissions?.includes(permission) === true));
}
