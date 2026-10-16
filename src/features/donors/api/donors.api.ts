import { api } from "@/services/http";
import type { DonorCard, DonorProfile, PageResult } from "@/types/api";
export const donorsApi = {
  search: async (
    params: Record<string, string | number | undefined>,
    signal?: AbortSignal,
  ) =>
    (await api.get<PageResult<DonorCard>>("/donors", { params, signal })).data,
  me: async () => (await api.get<DonorProfile | null>("/donors/me")).data,
  update: async (data: unknown) =>
    (await api.put<DonorProfile>("/donors/me", data)).data,
};
