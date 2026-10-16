import { api } from "@/services/http";
import type {
  ModerationQueue,
  OperationalMetrics,
  Items,
  CaseRecord,
} from "@/types/api";
export const adminApi = {
  queue: async () => (await api.get<ModerationQueue>("/admin/queue")).data,
  analytics: async () =>
    (await api.get<OperationalMetrics>("/admin/analytics")).data,
  cases: async (tab: "reports" | "tickets", after?: string) =>
    (await api.get<Items<CaseRecord>>("/admin/" + tab, { params: { after } }))
      .data,
  moderate: (path: string, data: unknown) => api.post(path, data),
  resolve: (tab: "reports" | "tickets", id: string) =>
    api.post(`/admin/${tab}/${id}/resolve`, {}),
};
