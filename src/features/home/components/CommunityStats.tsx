import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { communityApi, type Stats } from "../api/community.api";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
export function CommunityStats() {
  const { en } = usePrefs();
  const q = useQuery({
    queryKey: ["community-stats"],
    queryFn: communityApi.stats,
    refetchInterval: 60000,
  });
  const metrics = [
    [
      "activeRequests",
      t(en, "সক্রিয় রক্তের অনুরোধ", "Active blood requests"),
      "/requests",
    ],
    [
      "availableDonors",
      t(en, "রক্তদানে প্রস্তুত", "Available donor profiles"),
      "/donors?available=true",
    ],
    [
      "contributingDonors",
      t(en, "রক্তদান নথিভুক্ত করেছেন", "Members recording donations"),
      "/how-it-works",
    ],
    [
      "recordedDonations",
      t(en, "নথিভুক্ত রক্তদান", "Recorded donations"),
      "/how-it-works",
    ],
  ];
  return (
    <section className="section-wrapper community-live-section">
      <h2>{t(en, "আমাদের কমিউনিটির বর্তমান চিত্র", "Our community, live")}</h2>
      <p>
        {t(
          en,
          "রক্তদানের হিসাব ব্যবহারকারীর নিজের নথিভুক্ত তথ্য; হাসপাতাল-যাচাইকৃত নয়। Demo তথ্য এখানে গণনা হয় না।",
          "Donation counts are user-recorded, not hospital-verified. Demo examples are excluded.",
        )}
      </p>
      {q.isError ? (
        <p role="status">
          {t(
            en,
            "এই মুহূর্তে হিসাব লোড হয়নি।",
            "Community counts are currently unavailable.",
          )}{" "}
          <button className="text-link" onClick={() => void q.refetch()}>
            {t(en, "আবার চেষ্টা করুন", "Retry")}
          </button>
        </p>
      ) : (
        <div className="community-live-grid">
          {metrics.map(([key, label, to]) => (
            <Link to={to} key={key}>
              <strong>
                {q.isPending
                  ? "—"
                  : typeof q.data?.[key as keyof Stats] === "number"
                    ? q.data[key as keyof Stats].toLocaleString(
                        en ? "en-BD" : "bn-BD",
                      )
                    : "—"}
              </strong>
              <span>{label}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
