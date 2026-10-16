import { api } from "@/services/http";
import type {
  BloodRequest,
  DonorResponse,
  Items,
  PageResult,
} from "@/types/api";
export interface RequestDraft {
  _id: string;
  data: Record<string, unknown>;
  updatedAt: string;
}
export const requestsApi = {
  drafts: async () =>
    (await api.get<Items<RequestDraft>>("/blood-requests/drafts")).data,
  saveDraft: async (data: unknown, id?: string) =>
    id
      ? (await api.patch<RequestDraft>(`/blood-requests/drafts/${id}`, data))
          .data
      : (await api.post<RequestDraft>("/blood-requests/drafts", data)).data,
  deleteDraft: (id: string) => api.delete(`/blood-requests/drafts/${id}`),
  submitDraft: async (id: string) =>
    (await api.post<BloodRequest>(`/blood-requests/drafts/${id}/submit`)).data,
  list: async (page: number) =>
    (
      await api.get<PageResult<BloodRequest>>("/blood-requests", {
        params: { page },
      })
    ).data,
  mine: async (after?: string) =>
    (
      await api.get<Items<BloodRequest>>("/blood-requests/mine", {
        params: { after },
      })
    ).data,
  detail: async (id: string | undefined) =>
    (await api.get<BloodRequest>("/blood-requests/" + id)).data,
  responses: async (id: string | undefined) =>
    (await api.get<Items<DonorResponse>>(`/blood-requests/${id}/responses`))
      .data,
  create: async (data: unknown) =>
    (await api.post<BloodRequest>("/blood-requests", data)).data,
  edit: (id: string | undefined, data: unknown) =>
    api.patch("/blood-requests/" + id, data),
  action: (id: string | undefined, path: string, data: unknown) =>
    api.post(`/blood-requests/${id}/${path}`, data),
  report: (data: unknown) => api.post("/reports", data),
};
