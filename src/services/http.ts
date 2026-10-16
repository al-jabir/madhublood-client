import axios from "axios";
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL?.trim() || "/api/v1",
  withCredentials: true,
  timeout: 60000,
});
let csrf = "";
export function setCsrf(value: string) {
  csrf = value;
}
api.interceptors.request.use((config) => {
  if (csrf) config.headers["X-CSRF-Token"] = csrf;
  return config;
});
