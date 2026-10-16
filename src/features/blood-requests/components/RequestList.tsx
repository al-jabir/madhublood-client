import { requestsApi } from "@/features/blood-requests/api/blood-requests.api";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Droplets, ArrowUpRight, MapPin, Clock } from "lucide-react";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { Failure } from "@/components/feedback/Failure";
import { Empty } from "@/components/feedback/Empty";
import { Pager } from "@/components/ui/Pager";

export function RequestList({ compact = false }: { compact?: boolean }) {
  const { en } = usePrefs();
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["requests", page],
    queryFn: async () => requestsApi.list(page),
  });
  if (q.isPending)
    return (
      <div className="skeleton-grid" aria-label="Loading requests">
        {[1, 2, 3].map((i) => (
          <div className="skeleton" key={i} />
        ))}
      </div>
    );
  if (q.isError) return <Failure error={q.error} />;
  return (
    <>
      {!q.data.items.length ? (
        <Empty
          text={t(
            en,
            "এই মুহূর্তে কোনো যাচাইকৃত সক্রিয় অনুরোধ নেই।",
            "There are no verified active requests right now.",
          )}
        />
      ) : (
        <div className="card-grid">
          {q.data.items.slice(0, compact ? 3 : 12).map((r) => (
            <Link to={"/requests/" + r.id} className="request-card" key={r.id}>
              <div className="card-top">
                <span className="blood-type">{r.bloodGroup}</span>
                <span className={"badge " + r.urgency}>{r.urgency}</span>
              </div>
              <h3>{r.hospital}</h3>
              <p>
                <MapPin size={15} />
                {r.area}
              </p>
              <p>
                <Droplets size={15} />
                {r.units} {t(en, "ইউনিট", "units")} · {r.component}
              </p>
              <p>
                <Clock size={15} />
                {new Date(r.requiredAt).toLocaleString(en ? "en-BD" : "bn-BD")}
              </p>
              <div className="card-link">
                {t(en, "বিস্তারিত ও সাড়া দিন", "View request")}
                <ArrowUpRight size={18} />
              </div>
            </Link>
          ))}
        </div>
      )}
      {!compact && <Pager page={page} total={q.data.total} setPage={setPage} />}
    </>
  );
}
