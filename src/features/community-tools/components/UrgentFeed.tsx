import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Clock3, MapPin, Droplets } from "lucide-react";
import { communityToolsApi } from "../api/community-tools.api";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { groups } from "@/features/donors/constants/blood-groups";
import { requestLabel } from "@/features/blood-requests/request-labels";
import { Field } from "@/components/ui/Field";
import { Failure } from "@/components/feedback/Failure";
import { Loading } from "@/components/feedback/Loading";
import { Pager } from "@/components/ui/Pager";
import "../community-tools.css";
export function UrgentFeed() {
  const { en } = usePrefs();
  const [page, setPage] = useState(1);
  const [bloodGroup, setBlood] = useState("");
  const [urgency, setUrgency] = useState("");
  const [area, setArea] = useState("");
  const q = useQuery({
    queryKey: ["urgent-feed", page, bloodGroup, urgency, area],
    queryFn: () =>
      communityToolsApi.urgent({
        page,
        bloodGroup: bloodGroup || undefined,
        urgency: urgency || undefined,
        area: area || undefined,
      }),
    refetchInterval: 60000,
  });
  return (
    <section className="community-tool urgent-feed">
      <div className="tool-heading">
        <div>
          <span className="tool-eyebrow">
            <Droplets size={16} />
            {t(en, "দ্রুত সহায়তা", "URGENT SUPPORT")}
          </span>
          <h2>{t(en, "জরুরি রক্তের অনুরোধ", "Urgent blood requests")}</h2>
          <p>
            {t(
              en,
              "অতি জরুরি অনুরোধ আগে, এরপর প্রয়োজনের সময় অনুযায়ী।",
              "Critical requests first, then ordered by the time blood is needed.",
            )}
          </p>
        </div>
      </div>
      <div className="tool-filters">
        <Field label={t(en, "রক্তের গ্রুপ", "Blood group")}>
          <select
            value={bloodGroup}
            onChange={(e) => {
              setBlood(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t(en, "সব গ্রুপ", "All groups")}</option>
            {groups.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </Field>
        <Field label={t(en, "জরুরিতা", "Urgency")}>
          <select
            value={urgency}
            onChange={(e) => {
              setUrgency(e.target.value);
              setPage(1);
            }}
          >
            <option value="">
              {t(en, "সব জরুরি অনুরোধ", "All urgent requests")}
            </option>
            <option value="critical">{requestLabel(en, "critical")}</option>
            <option value="urgent">{requestLabel(en, "urgent")}</option>
          </select>
        </Field>
        <Field label={t(en, "এলাকা", "Area")}>
          <select
            value={area}
            onChange={(e) => {
              setArea(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{t(en, "সব এলাকা", "All areas")}</option>
            <option value="Madhupur, Tangail">
              {t(en, "মধুপুর, টাঙ্গাইল", "Madhupur, Tangail")}
            </option>
          </select>
        </Field>
      </div>
      {q.isPending ? (
        <Loading compact />
      ) : q.isError ? (
        <Failure error={q.error} />
      ) : (
        <>
          {q.data.items.length ? (
            <div className="tool-card-grid">
              {q.data.items.map((r) => (
                <Link
                  className="tool-request"
                  key={r.id}
                  to={`/requests/${r.id}`}
                >
                  <div className="tool-between">
                    <strong className="tool-blood">{r.bloodGroup}</strong>
                    <span className="badge">{requestLabel(en, r.urgency)}</span>
                  </div>
                  <h3>{r.hospital}</h3>
                  <p>
                    <MapPin size={14} />
                    {r.area}
                  </p>
                  <p>
                    <Clock3 size={14} />
                    {new Date(r.requiredAt).toLocaleString(
                      en ? "en-GB" : "bn-BD",
                    )}
                  </p>
                  <strong>
                    {r.units} {t(en, "ইউনিট প্রয়োজন", "units needed")}
                  </strong>
                  <span className="text-link">
                    {t(en, "অনুরোধ দেখুন", "View request")} →
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="tool-empty">
              {t(
                en,
                "এই ফিল্টারে কোনো চলমান জরুরি অনুরোধ নেই।",
                "No open urgent requests match these filters.",
              )}
            </p>
          )}
          <Pager page={page} total={q.data.total} setPage={setPage} />
        </>
      )}
    </section>
  );
}
