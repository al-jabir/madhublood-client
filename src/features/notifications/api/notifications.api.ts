import { api } from "@/services/http";
import type { InAppNotification, Items } from "@/types/api";
export const notificationsApi = {
  list: async (after?: string) =>
    (
      await api.get<Items<InAppNotification>>("/notifications", {
        params: { after },
      })
    ).data,
  markRead: (id: string) => api.patch("/notifications/" + id),
};
