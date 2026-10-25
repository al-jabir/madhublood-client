import type { ApiUser, Items, CaseRecord } from "@/types/api";
import { api } from "@/services/http";
export const accountApi = {
  requestEmailChange: async (data: {
    newEmail: string;
    currentPassword: string;
  }) =>
    (await api.post<{ message: string }>("/account/email-change/request", data))
      .data,
  confirmEmailChange: async (data: { newEmail: string; code: string }) =>
    (await api.post<{ message: string }>("/account/email-change/confirm", data))
      .data,
  mySupport: async (after?: string) =>
    (
      await api.get<Items<CaseRecord>>("/account/support", {
        params: { after },
      })
    ).data,
  profile: async () => (await api.get<ApiUser>("/account/profile")).data,
  saveProfile: async (data: unknown) =>
    (await api.put<ApiUser>("/account/profile", data)).data,
  delete: () => api.delete("/account", { data: { confirm: true } }),
  support: (message: FormDataEntryValue | null) =>
    api.post("/support", { message }),
};
