import { api } from "@/services/http";
import type { LocationRecord, Items } from "@/types/api";
export const locationsApi = {
  list: async (limit = 50) =>
    (await api.get<Items<LocationRecord>>(`/locations?limit=${limit}`)).data,
  create: (data: unknown) => api.post("/super-admin/locations", data),
};
