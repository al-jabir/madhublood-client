import { isAxiosError } from "axios";
import { authApi } from "../api/auth.api";
import { useQuery } from "@tanstack/react-query";
import { setCsrf } from "@/services/http";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const data = await authApi.me();
        setCsrf(data.csrf);
        return data.user;
      } catch (e: unknown) {
        if (isAxiosError(e) && e.response?.status === 401) return null;
        throw e;
      }
    },
  });
}
