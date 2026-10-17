import { api } from "@/services/http";
export interface Example {
  kind: string;
  name: string;
  bloodGroup: string;
  area: string;
  hospital?: string;
  units?: number;
}
export const demoApi = {
  list: async () =>
    (await api.get<{ total: number; items: Example[] }>("/demo-data")).data,
  clear: () => api.delete("/demo-data"),
  generate: () => api.post("/demo-data"),
};
