import { api } from "@/services/http";
export interface FamilyFeedback {
  outcome: string;
  receivedUnits: number;
  note?: string;
  recordedAt?: string;
}
export interface VolunteerRequest {
  _id: string;
  hospital: string;
  bloodGroup: string;
  units: number;
  area: string;
  status: string;
  requiredAt: string;
  urgency?: string;
  representative?: string;
  contact?: string;
  owner?: string;
  createdAt?: string;
  familyFeedback?: FamilyFeedback;
}
export interface VolunteerTask {
  id: string;
  requestId: string;
  donorId: string;
  name: string;
  phone?: string;
  hospital: string;
  bloodGroup: string;
  nextContactAt: string;
  outcome: string;
}
export interface VolunteerActivity {
  id: string;
  requestId: string;
  action: string;
  createdAt: string;
  hospital: string;
  bloodGroup: string;
}
export interface VolunteerData {
  stats: {
    created: number;
    pending: number;
    open: number;
    completed: number;
    assignedOpen: number;
    callbacks: number;
    requestedUnits: number;
    familyReportedUnits: number;
  };
  items: (VolunteerRequest | VolunteerTask | VolunteerActivity)[];
  total: number;
  page: number;
  canSubmit: boolean;
  canManage: boolean;
}
export const volunteerApi = {
  dashboard: async (view: string, page: number, status: string) =>
    (
      await api.get<VolunteerData>("/admin/volunteer-dashboard", {
        params: { view, page, status },
      })
    ).data,
  feedback: (
    id: string,
    data: { outcome: string; receivedUnits: number; note: string },
  ) => api.post(`/admin/coordination/${id}/family-feedback`, data),
};
