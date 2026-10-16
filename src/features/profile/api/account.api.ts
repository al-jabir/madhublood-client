import { api } from "@/services/http";
export const accountApi = {
  export: async () => (await api.get<unknown>("/account/export")).data,
  delete: (password: string) => api.delete("/account", { data: { password } }),
  support: (message: FormDataEntryValue | null) =>
    api.post("/support", { message }),
};
