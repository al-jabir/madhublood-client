import { api } from "@/services/http";
import type {
  ModerationQueue,
  OperationalMetrics,
  Items,
  CaseRecord,
} from "@/types/api";
export const adminApi = {
  readiness: async () =>
    (
      await api.get<{ ready: boolean; database: string }>("../ready", {
        validateStatus: (status) => status === 200 || status === 503,
      })
    ).data,
  queue: async (params?: { requestsAfter?: string; donorsAfter?: string }) =>
    (
      await api.get<ModerationQueue>("/admin/queue", {
        params: {
          requestsAfter: params?.requestsAfter,
          donorsAfter: params?.donorsAfter,
        },
      })
    ).data,
  analytics: async () =>
    (await api.get<OperationalMetrics>("/admin/analytics")).data,
  cases: async (tab: "reports" | "tickets", after?: string) =>
    (await api.get<Items<CaseRecord>>("/admin/" + tab, { params: { after } }))
      .data,
  replyTicket: (id: string, reply: string) =>
    api.post(`/admin/tickets/${id}/reply`, { reply, status: "resolved" }),
  moderate: (path: string, data: unknown) => api.post(path, data),
  resolve: (tab: "reports" | "tickets", id: string) =>
    api.post(`/admin/${tab}/${id}/resolve`, {}),
};
