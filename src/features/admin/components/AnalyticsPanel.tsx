import { Loading } from "@/components/feedback/Loading";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { adminApi } from "../api/admin.api";
import { Failure } from "@/components/feedback/Failure";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import {
  Users,
  Droplets,
  HeartHandshake,
  CheckCheck,
  ArrowUpRight,
  MapPin,
} from "lucide-react";
import "../analytics.css";
export function AnalyticsPanel() {
  const { en } = usePrefs();
  const q = useQuery({
    queryKey: ["operations", "analytics"],
    queryFn: adminApi.analytics,
  });
  if (q.isPending) return <Loading compact />;
  if (q.isError) return <Failure error={q.error} />;
  const n = (value: number) => value.toLocaleString(en ? "en-GB" : "bn-BD");
  const { donors = 0, available = 0, active = 0, completed = 0 } = q.data;
  const availability =
    donors > 0 ? Math.min(100, Math.round((available / donors) * 100)) : 0;
  const metrics = [
    {
      key: "donors",
      value: donors,
      icon: Users,
      label: t(en, "রক্তদাতার প্রোফাইল", "Donor profiles"),
      hint: t(en, "আপনার সেবা এলাকার মধ্যে", "Within your service area"),
      tone: "blue",
    },
    {
      key: "available",
      value: available,
      icon: HeartHandshake,
      label: t(en, "রক্তদানে প্রস্তুত", "Available donors"),
      hint: t(
        en,
        "প্রোফাইলে প্রস্তুত হিসেবে চিহ্নিত",
        "Marked available in their profile",
      ),
      tone: "green",
    },
    {
      key: "active",
      value: active,
      icon: Droplets,
      label: t(en, "চলমান অনুরোধ", "Active requests"),
      hint: t(en, "বর্তমানে রক্তের প্রয়োজন আছে", "Currently seeking blood"),
      tone: "red",
    },
    {
      key: "completed",
      value: completed,
      icon: CheckCheck,
      label: t(en, "সম্পন্ন অনুরোধ", "Completed requests"),
      hint: t(en, "সম্পন্ন হিসেবে বন্ধ করা হয়েছে", "Closed as completed"),
      tone: "violet",
    },
  ];
  return (
    <div className="admin-overview analytics-overview">
      <div className="analytics-context">
        <span>
          <MapPin size={15} />
          {t(en, "আপনার সেবা এলাকার হিসাব", "Your service area at a glance")}
        </span>
        <span>{t(en, "বর্তমান তথ্য", "Current snapshot")}</span>
      </div>
      <div className="admin-metrics analytics-metrics">
        {metrics.map(({ key, value, icon: Icon, label, hint, tone }) => (
          <div key={key} className={`analytics-metric analytics-${tone}`}>
            <div className="analytics-metric-top">
              <span className="admin-metric-icon">
                <Icon size={19} />
              </span>
              <h3>{label}</h3>
            </div>
            <strong>{n(value)}</strong>
            <p>{hint}</p>
          </div>
        ))}
      </div>
      <div className="analytics-detail-grid">
        <section
          className="analytics-card"
          aria-labelledby="donor-capacity-title"
        >
          <div className="analytics-card-heading">
            <div>
              <span className="analytics-eyebrow">
                {t(en, "রক্তদাতার প্রস্তুতি", "DONOR AVAILABILITY")}
              </span>
              <h2 id="donor-capacity-title">
                {t(en, "সাড়া দেওয়ার জন্য প্রস্তুত", "Ready to respond")}
              </h2>
            </div>
            <span className="analytics-symbol analytics-green">
              <HeartHandshake size={22} />
            </span>
          </div>
          <div className="analytics-capacity">
            <strong>{donors > 0 ? n(availability) + "%" : "—"}</strong>
            <span>
              {t(
                en,
                "রক্তদাতার প্রোফাইলে প্রস্তুত চিহ্নিত",
                "of donor profiles marked available",
              )}
            </span>
          </div>
          <div
            className="analytics-meter"
            role="progressbar"
            aria-label={t(
              en,
              "রক্তদাতার প্রস্তুতির অনুপাত",
              "Donor availability share",
            )}
            aria-valuenow={availability}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span style={{ width: `${availability}%` }} />
          </div>
          <div className="analytics-meter-labels">
            <span>
              <i />
              {n(available)} {t(en, "প্রস্তুত", "available")}
            </span>
            <span>
              {n(donors)} {t(en, "মোট প্রোফাইল", "total profiles")}
            </span>
          </div>
          <p className="analytics-note">
            {donors === 0
              ? t(
                  en,
                  "এখনও কোনো রক্তদাতার প্রোফাইল নেই।",
                  "No donor profiles in this service area yet.",
                )
              : t(
                  en,
                  "প্রস্তুতির তথ্য রক্তদাতার দেওয়া। যোগাযোগের সময় আবার নিশ্চিত করুন।",
                  "Availability is self-reported. Reconfirm when contacting a donor.",
                )}
          </p>
          <Link className="analytics-link" to="/admin?section=donors">
            {t(en, "রক্তদাতাদের দেখুন", "View donors")}
            <ArrowUpRight size={17} />
          </Link>
        </section>
        <section
          className="analytics-card"
          aria-labelledby="request-activity-title"
        >
          <div className="analytics-card-heading">
            <div>
              <span className="analytics-eyebrow">
                {t(en, "অনুরোধের কার্যক্রম", "REQUEST ACTIVITY")}
              </span>
              <h2 id="request-activity-title">
                {t(en, "প্রয়োজন থেকে ব্যবস্থা", "From need to coordination")}
              </h2>
            </div>
            <span className="analytics-symbol analytics-red">
              <Droplets size={22} />
            </span>
          </div>
          <div className="analytics-request-row">
            <span className="analytics-status-dot is-active" />
            <div>
              <h3>{t(en, "এখন রক্ত খুঁজছেন", "Seeking blood now")}</h3>
              <p>
                {t(
                  en,
                  "চলমান ও রক্তদাতার সাড়া পাওয়া অনুরোধ",
                  "Active and donor-contacted requests",
                )}
              </p>
            </div>
            <strong>{n(active)}</strong>
          </div>
          <div className="analytics-request-row">
            <span className="analytics-status-dot is-completed" />
            <div>
              <h3>{t(en, "অনুরোধ সম্পন্ন হয়েছে", "Requests completed")}</h3>
              <p>
                {t(
                  en,
                  "সম্পন্ন হিসেবে রেকর্ড করা হয়েছে",
                  "Recorded as completed",
                )}
              </p>
            </div>
            <strong>{n(completed)}</strong>
          </div>
          <p className="analytics-note">
            {t(
              en,
              "যাচাইয়ের অপেক্ষায়, বাতিল ও মেয়াদোত্তীর্ণ অনুরোধ এই হিসাবে নেই।",
              "Pending review, cancelled and expired requests are excluded here.",
            )}
          </p>
          <Link className="analytics-link" to="/admin?section=coordination">
            {t(en, "সমন্বয় প্যানেল খুলুন", "Open coordination desk")}
            <ArrowUpRight size={17} />
          </Link>
        </section>
      </div>
    </div>
  );
}
