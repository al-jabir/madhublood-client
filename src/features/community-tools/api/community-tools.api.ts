import { api } from "@/services/http";
import type { BloodRequest, DonorCard } from "@/types/api";
export interface Announcement {
  enabled: boolean;
  titleBn: string;
  titleEn: string;
  bodyBn: string;
  bodyEn: string;
  expiresAt: string | null;
}
export interface Task {
  requestId: string;
  hospital: string;
  bloodGroup: string;
  donorId: string;
  name: string;
  outcome: string;
  due: boolean;
  nextContactAt: string | null;
}
export interface Review extends BloodRequest {
  reasons: string[];
  similar: number;
}
export const communityToolsApi = {
  urgent: async (params: {
    page: number;
    bloodGroup?: string;
    urgency?: string;
    area?: string;
  }) =>
    (
      await api.get<{ items: BloodRequest[]; total: number; page: number }>(
        "/blood-requests/urgent",
        { params },
      )
    ).data,
  announcement: async () =>
    (await api.get<Announcement | null>("/community-announcement")).data,
  publish: (data: Announcement) =>
    api.put("/admin/community-announcement", data),
  timeline: async (id: string) =>
    (
      await api.get<{
        status: string;
        items: { id: string; event: string; at: string }[];
      }>(`/blood-requests/${id}/timeline`)
    ).data,
  suggestions: async (id: string) =>
    (await api.get<{ items: DonorCard[] }>(`/blood-requests/${id}/suggestions`))
      .data,
  tasks: async (page: number) =>
    (
      await api.get<{ items: Task[]; page: number; totalRequests: number }>(
        "/admin/coordination-tasks",
        { params: { page } },
      )
    ).data,
  availability: async () =>
    (
      await api.get<{
        exists: boolean;
        stale: boolean;
        available: boolean;
        canEnable: boolean;
        updatedAt: string | null;
      }>("/donors/me/availability-check")
    ).data,
  confirmAvailability: (available: boolean) =>
    api.post("/donors/me/confirm-availability", { available }),
  review: async (page: number) =>
    (
      await api.get<{ items: Review[]; page: number; hasMore: boolean }>(
        "/admin/community-review",
        { params: { page } },
      )
    ).data,
  reviewed: (id: string) => api.post(`/admin/community-review/${id}`, {}),
};
