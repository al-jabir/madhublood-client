import axios from "axios";
export const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL?.trim() ||
    (import.meta.env.PROD
      ? "https://madhublood-server.onrender.com/api/v1"
      : "/api/v1"),
  withCredentials: true,
  timeout: 15000,
});
let csrf = "";
export function setCsrf(value: string) {
  csrf = value;
}
api.interceptors.request.use((config) => {
  if (csrf) config.headers["X-CSRF-Token"] = csrf;
  return config;
});
