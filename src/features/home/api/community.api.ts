import { api } from "@/services/http";
export interface Stats {
  activeRequests: number;
  availableDonors: number;
  recordedDonations: number;
  contributingDonors: number;
}
export const communityApi = {
  stats: async () => (await api.get<Stats>("/community-stats")).data,
};
