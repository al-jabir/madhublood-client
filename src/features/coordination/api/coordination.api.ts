import { api } from "@/services/http";
export interface Summary {
  required: number;
  arranged: number;
  arrived: number;
  remaining: number;
}
export interface Assignment {
  id: string;
  name: string;
}
export interface DeskRequest {
  id: string;
  hospital: string;
  bloodGroup: string;
  area: string;
  requiredAt: string;
  status: string;
  coordinator: Assignment | null;
  confirmed: boolean;
  summary: Summary;
}
export interface Contact {
  id: string;
  name: string;
  phone: string | null;
  outcome: string;
  note: string;
  nextContactAt: string | null;
}
export interface DeskDetail {
  request: Omit<DeskRequest, "summary" | "coordinator" | "confirmed"> & {
    representative: string | null;
    contact: string | null;
  };
  donors: Contact[];
  summary: Summary;
  coordinator: Assignment | null;
  confirmed: boolean;
  canAssign: boolean;
  canUpdate: boolean;
  candidates: Assignment[];
}
export interface OwnerProgress {
  managed: boolean;
  confirmed: boolean;
  coordinator: { name: string } | null;
  summary: Summary;
}
export const coordinationApi = {
  board: async (page: number) =>
    (
      await api.get<{
        items: DeskRequest[];
        total: number;
        page: number;
        canAssign: boolean;
      }>("/admin/coordination", { params: { page } })
    ).data,
  detail: async (id: string) =>
    (await api.get<DeskDetail>(`/admin/coordination/${id}`)).data,
  assign: (id: string, coordinatorId: string | null) =>
    api.put(`/admin/blood-requests/${id}/coordinator`, { coordinatorId }),
  contact: (
    id: string,
    data: {
      donorId: string;
      outcome: string;
      note: string;
      nextContactAt: string | null;
    },
  ) => api.post(`/admin/coordination/${id}/contact`, data),
  action: (id: string, action: "ready" | "complete") =>
    api.post(`/admin/coordination/${id}/${action}`, {}),
  progress: async (id: string) =>
    (
      await api.get<OwnerProgress>(
        `/blood-requests/${id}/coordination-progress`,
      )
    ).data,
  confirm: (id: string) =>
    api.post(`/blood-requests/${id}/confirm-fulfillment`, {}),
};
