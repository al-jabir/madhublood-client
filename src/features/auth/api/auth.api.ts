import { api } from "@/services/http";
import type { Acknowledgment, SessionResponse } from "@/types/api";
export const authApi = {
  sessions: async () =>
    (
      await api.get<{
        items: {
          id: string;
          current: boolean;
          createdAt: string;
          expiresAt: string;
        }[];
      }>("/auth/sessions")
    ).data,
  revokeSession: async (id: string) =>
    (await api.delete<Acknowledgment>(`/auth/sessions/${id}`)).data,
  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }) => (await api.post<Acknowledgment>("/auth/change-password", data)).data,
  me: async () => (await api.get<SessionResponse>("/auth/me")).data,
  login: async (data: unknown) =>
    (await api.post<SessionResponse>("/auth/login", data)).data,
  register: async (data: unknown) =>
    (await api.post<Acknowledgment>("/auth/register", data)).data,
  sendCode: async (data: unknown) =>
    (await api.post<Acknowledgment>("/auth/send-code", data)).data,
  verify: async (data: unknown) => api.post("/auth/verify-otp", data),
  logout: () => api.post("/auth/logout"),
  logoutAll: () => api.post("/auth/logout-all"),
};
