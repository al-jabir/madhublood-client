import { api } from "@/services/http";
import type { ManagedUser, AuditRecord, PageResult, Items } from "@/types/api";
export const superAdminApi = {
  platform: async () =>
    (
      await api.get<{
        maintenance: boolean;
        registrationOpen: boolean;
        supportMessage: string;
      }>("/platform")
    ).data,
  settings: async () =>
    (
      await api.get<Items<{ key: string; value: boolean | string }>>(
        "/super-admin/settings",
      )
    ).data,
  updateSetting: (key: string, value: string | boolean) =>
    api.put(`/super-admin/settings/${key}`, { value }),
  users: async (page = 1) =>
    (
      await api.get<PageResult<ManagedUser>>("/super-admin/users", {
        params: { page },
      })
    ).data,
  audit: async (after?: string) =>
    (
      await api.get<Items<AuditRecord>>("/super-admin/audit-logs", {
        params: { after },
      })
    ).data,
  updateRoles: (
    id: string,
    roles: string[],
    areas: string[],
    volunteerPermissions: string[] = [],
    locationIds: string[] = [],
  ) =>
    api.patch(`/super-admin/users/${id}/roles`, {
      roles,
      areas,
      volunteerPermissions,
      locationIds,
    }),
};
