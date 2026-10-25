import { api } from "@/services/http";
import type { LocationRecord, Items } from "@/types/api";
export const locationsApi = {
  list: async (limit = 50) =>
    (await api.get<Items<LocationRecord>>(`/locations?limit=${limit}`)).data,
  scopeOptions: async () => {
    async function all(kind: string) {
      const rows: LocationRecord[] = [];
      const seen = new Set<string>();
      let after: string | undefined;
      do {
        const data = (
          await api.get<Items<LocationRecord>>("/locations", {
            params: { kind, limit: 50, after },
          })
        ).data;
        rows.push(...data.items);
        after = data.nextCursor ?? undefined;
        if (after && seen.has(after))
          throw new Error("Location pagination did not advance");
        if (after) seen.add(after);
      } while (after);
      return rows;
    }
    const [districts, upazilas] = await Promise.all([
      all("district"),
      all("upazila"),
    ]);
    return upazilas
      .flatMap((row) => {
        const district = districts.find((parent) => parent._id === row.parent);
        return district
          ? [{ id: row._id, area: `${row.name}, ${district.name}` }]
          : [];
      })
      .sort((a, b) => a.area.localeCompare(b.area));
  },
  create: (data: unknown) => api.post("/super-admin/locations", data),
};
