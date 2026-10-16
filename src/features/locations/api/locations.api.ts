import { api } from "@/services/http";
import type { LocationRecord, Items } from "@/types/api";
export const locationsApi = {
  list: async () => (await api.get<Items<LocationRecord>>("/locations")).data,
  create: (data: unknown) => api.post("/super-admin/locations", data),
};
