import type { ApiUser } from "@/types/api";
import { api } from "@/services/http";
export const accountApi = {
  profile: async () => (await api.get<ApiUser>("/account/profile")).data,
  saveProfile: async (data: unknown) =>
    (await api.put<ApiUser>("/account/profile", data)).data,
  delete: () => api.delete("/account", { data: { confirm: true } }),
  support: (message: FormDataEntryValue | null) =>
    api.post("/support", { message }),
};
