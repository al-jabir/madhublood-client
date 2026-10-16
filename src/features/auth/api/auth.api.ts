import { api } from "@/services/http";
import type { Acknowledgment, SessionResponse } from "@/types/api";
export const authApi = {
  requestVerification: async (email: string) =>
    (
      await api.post<Acknowledgment>("/auth/request-email-verification", {
        email,
      })
    ).data,
  verifyEmail: async (data: { email: string; code: string }) =>
    (await api.post<Acknowledgment>("/auth/verify-email", data)).data,
  forgotPassword: async (email: string) =>
    (await api.post<Acknowledgment>("/auth/forgot-password", { email })).data,
  resetPasswordEmail: async (data: {
    email: string;
    code: string;
    password: string;
  }) =>
    (await api.post<Acknowledgment>("/auth/reset-password-email", data)).data,
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
    (
      await api.post<SessionResponse & { message: string }>(
        "/auth/register",
        data,
      )
    ).data,
  resetPassword: async (data: unknown) =>
    (await api.post<Acknowledgment>("/auth/reset-password", data)).data,
  recoveryKey: async (password: string) =>
    (
      await api.post<{ recoveryKey: string; message: string }>(
        "/auth/recovery-key",
        { password },
      )
    ).data,
  logout: () => api.post("/auth/logout"),
  logoutAll: () => api.post("/auth/logout-all"),
};
