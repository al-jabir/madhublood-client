import { useQuery } from "@tanstack/react-query";
import { superAdminApi } from "../api/super-admin.api";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
export function PlatformNotice() {
  const { en } = usePrefs();
  const { data } = useQuery({
    queryKey: ["platform"],
    queryFn: superAdminApi.platform,
    staleTime: 15000,
    refetchInterval: 30000,
  });
  if (
    !data ||
    (!data.maintenance &&
      !data.supportMessage &&
      data.registrationOpen !== false)
  )
    return null;
  return (
    <aside className="notice" role="status">
      {data.maintenance && (
        <p>
          {t(
            en,
            "সাইটের রক্ষণাবেক্ষণ চলছে। কিছু সুবিধা সাময়িক বন্ধ আছে।",
            "Maintenance is in progress. Some services are temporarily unavailable.",
          )}
        </p>
      )}
      {data.registrationOpen === false && (
        <p>
          {t(
            en,
            "নতুন অ্যাকাউন্ট নিবন্ধন সাময়িক বন্ধ আছে।",
            "New account registration is temporarily closed.",
          )}
        </p>
      )}
      {data.supportMessage && <p>{data.supportMessage}</p>}
    </aside>
  );
}
