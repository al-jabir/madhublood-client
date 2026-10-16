import type { ApiUser } from "@/types/api";
import { api } from "@/services/http";
export const accountApi = {
  profile: async () => (await api.get<ApiUser>("/account/profile")).data,
  saveProfile: async (data: unknown) =>
    (await api.put<ApiUser>("/account/profile", data)).data,
  export: async () => (await api.get<unknown>("/account/export")).data,
  delete: (password: string) => api.delete("/account", { data: { password } }),
  support: (message: FormDataEntryValue | null) =>
    api.post("/support", { message }),
};
