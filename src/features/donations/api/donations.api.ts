import { api } from "@/services/http";
import type { DonationRecord, Items } from "@/types/api";
export const donationsApi = {
  list: async (after?: string) =>
    (
      await api.get<Items<DonationRecord>>("/donors/donations", {
        params: { after },
      })
    ).data,
  record: (data: unknown) => api.post("/donors/donations", data),
};
