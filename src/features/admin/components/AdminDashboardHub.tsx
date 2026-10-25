import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldAlert,
  Droplets,
  Users,
  MapPin,
  ClipboardList,
  Plus,
  ArrowUpRight,
  Activity,
  Wrench,
  Radio,
  FileText,
  RefreshCw,
} from "lucide-react";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { superAdminApi } from "@/features/super-admin/api/super-admin.api";
import { adminApi } from "../api/admin.api";
import { useMe } from "@/features/auth/hooks/useMe";
export function AdminDashboardHub() {
  const { en } = usePrefs();
  const { data: me } = useMe();
  const isSuperAdmin = me?.roles.includes("super-admin");
  const platform = useQuery({
    queryKey: ["platform"],
    queryFn: superAdminApi.platform,
    staleTime: 15000,
  });
  const readiness = useQuery({
    queryKey: ["operations", "readiness"],
    queryFn: adminApi.readiness,
    refetchInterval: 30000,
    retry: 1,
  });
  const queue = useQuery({
    queryKey: ["moderation"],
    queryFn: () => adminApi.queue(),
    staleTime: 30000,
  });
  const knownPlatform =
    !platform.isError && typeof platform.data?.maintenance === "boolean";
  const knownRegistration =
    !platform.isError && typeof platform.data?.registrationOpen === "boolean";
  const ready =
    !readiness.isError &&
    readiness.data?.ready === true &&
    readiness.data?.database === "connected";
  const validQueue =
    !queue.isError &&
    Array.isArray(queue.data?.requests) &&
    Array.isArray(queue.data?.donors);
  const n = (value: number) => value.toLocaleString(en ? "en-GB" : "bn-BD");
  const counts = [
    {
      key: "requests",
      label: t(en, "অপেক্ষমান রক্তের অনুরোধ", "Pending Blood Requests"),
      count: queue.data?.requestsTotal ?? queue.data?.requests?.length,
      more:
        queue.data?.requestsTotal === undefined &&
        !!queue.data?.requestsNextCursor,
      Icon: Droplets,
      color: "red",
      pending: t(en, "পর্যালোচনা প্রয়োজন", "Requires review"),
      empty: t(en, "পর্যালোচনা বাকি নেই", "No requests awaiting review"),
    },
    {
      key: "donors",
      label: t(en, "যাচাইহীন রক্তদাতার প্রোফাইল", "Unverified Donor Profiles"),
      count: queue.data?.donorsTotal ?? queue.data?.donors?.length,
      more:
        queue.data?.donorsTotal === undefined && !!queue.data?.donorsNextCursor,
      Icon: Users,
      color: "blue",
      pending: t(en, "যাচাইয়ের অপেক্ষায়", "Awaiting verification"),
      empty: t(en, "যাচাইয়ের তালিকা খালি", "Verification queue is empty"),
    },
  ];
  const actions = [
    {
      to: "/requests/new?onBehalf=1",
      Icon: Plus,
      label: t(en, "নতুন রক্তের অনুরোধ যুক্ত করুন", "Add Blood Request"),
      hint: t(
        en,
        "পরিবারের অনুমতি নিয়ে অনুরোধ যোগ করুন",
        "Submit with the family’s permission",
      ),
      primary: true,
    },
    {
      to: "/admin?section=community",
      Icon: Radio,
      label: t(en, "জরুরি ঘোষণা প্রকাশ করুন", "Publish Announcement"),
      hint: t(
        en,
        "হোম পেজের ঘোষণা পরিচালনা করুন",
        "Manage the home page announcement",
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            to: "/admin?section=users",
            Icon: Users,
            label: t(en, "ব্যবহারকারী ও অনুমতি", "Users & Role Access"),
            hint: t(
              en,
              "ভূমিকা ও কাজের অনুমতি নিয়ন্ত্রণ করুন",
              "Manage roles and work permissions",
            ),
          },
          {
            to: "/admin?section=locations",
            Icon: MapPin,
            label: t(en, "এলাকা ও ইউনিয়ন", "Locations & Unions"),
            hint: t(
              en,
              "যাচাইকৃত উপজেলা, ইউনিয়ন ও ওয়ার্ড",
              "Verified upazilas, unions and wards",
            ),
          },
        ]
      : []),
    {
      to: "/admin?section=reports",
      Icon: FileText,
      label: t(en, "অভিযোগ ও রিপোর্ট", "Reports & Complaints"),
      hint: t(
        en,
        "অনুরোধের বিষয়ে পাঠানো রিপোর্ট দেখুন",
        "Review concerns about blood requests",
      ),
    },
    ...(isSuperAdmin
      ? [
          {
            to: "/admin?section=settings",
            Icon: Wrench,
            label: t(en, "সাইট সেটিংস", "Platform Settings"),
            hint: t(
              en,
              "রক্ষণাবেক্ষণ ও সহায়তার বার্তা",
              "Maintenance and support notice",
            ),
          },
        ]
      : []),
  ];
  return (
    <div className="admin-dashboard-hub">
      <div className="admin-platform-status-bar">
        <div className="status-item">
          <span className="status-label">
            <Radio size={14} />
            {t(en, "সাইটের মোড:", "Site mode:")}
          </span>
          <span
            className={`status-pill ${knownPlatform && !platform.data?.maintenance ? "status-active" : "status-warning"}`}
          >
            {platform.isPending
              ? t(en, "দেখা হচ্ছে…", "Checking…")
              : !knownPlatform
                ? t(en, "অবস্থা জানা যায়নি", "Status unavailable")
                : platform.data?.maintenance
                  ? t(en, "রক্ষণাবেক্ষণ চলছে", "Maintenance mode")
                  : t(en, "স্বাভাবিক মোড", "Normal mode")}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">
            <Users size={14} />
            {t(en, "নিবন্ধন:", "Registration:")}
          </span>
          <span
            className={`status-pill ${knownRegistration && platform.data?.registrationOpen ? "status-active" : "status-warning"}`}
          >
            {platform.isPending
              ? t(en, "দেখা হচ্ছে…", "Checking…")
              : !knownRegistration
                ? t(en, "অবস্থা জানা যায়নি", "Status unavailable")
                : platform.data?.registrationOpen
                  ? t(en, "উন্মুক্ত", "Open")
                  : t(en, "স্থগিত", "Paused")}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">
            <Activity size={14} />
            {t(en, "সার্ভার ও ডাটাবেস:", "Server & database:")}
          </span>
          <span
            className={`status-pill ${ready ? "status-active" : "status-warning"}`}
          >
            {readiness.isPending
              ? t(en, "যাচাই হচ্ছে…", "Checking…")
              : ready
                ? t(en, "সংযুক্ত ও প্রস্তুত", "Connected & ready")
                : readiness.data?.ready === false && !readiness.isError
                  ? t(en, "এখনও প্রস্তুত নয়", "Not ready")
                  : t(en, "যাচাই করা যায়নি", "Could not verify")}
          </span>
        </div>
        {isSuperAdmin && (
          <Link
            to="/admin?section=settings"
            className="button secondary small status-manage-btn"
          >
            <Wrench size={13} />
            {t(en, "সেটিংস পরিবর্তন", "Manage Settings")}
          </Link>
        )}
      </div>
      <div className="admin-queue-summary-grid">
        {counts.map(
          ({ key, label, count, more, Icon, color, pending, empty }) => (
            <Link
              key={key}
              to={`/admin?section=${key}`}
              className={`admin-queue-card ${validQueue && (count ?? 0) > 0 ? "has-pending" : ""}`}
            >
              <div className={`queue-card-icon ${color}`}>
                <Icon size={20} />
              </div>
              <div className="queue-card-body">
                <span className="queue-label">{label}</span>
                <div className="queue-count-row">
                  <strong>
                    {validQueue && typeof count === "number"
                      ? n(count) + (more ? "+" : "")
                      : "—"}
                  </strong>
                  <span className="queue-status-text">
                    {queue.isPending
                      ? t(en, "লোড হচ্ছে…", "Loading…")
                      : !validQueue
                        ? t(en, "তালিকা লোড হয়নি", "Could not load queue")
                        : (count ?? 0) > 0
                          ? pending
                          : empty}
                  </span>
                </div>
              </div>
              <ArrowUpRight size={16} className="queue-arrow" />
            </Link>
          ),
        )}
        <Link to="/admin?section=coordination" className="admin-queue-card">
          <div className="queue-card-icon green">
            <ClipboardList size={20} />
          </div>
          <div className="queue-card-body">
            <span className="queue-label">
              {t(en, "সমন্বয় ও খোঁজখবর", "Coordination Desk")}
            </span>
            <div className="queue-count-row">
              <span className="queue-status-text">
                {t(
                  en,
                  "পরিবার ও রক্তদাতার সঙ্গে যোগাযোগ",
                  "Family and donor follow-up",
                )}
              </span>
            </div>
          </div>
          <ArrowUpRight size={16} className="queue-arrow" />
        </Link>
      </div>
      {(platform.isError || readiness.isError || queue.isError) && (
        <button
          className="admin-hub-retry"
          onClick={() => {
            void platform.refetch();
            void readiness.refetch();
            void queue.refetch();
          }}
        >
          <RefreshCw size={15} />
          {t(en, "অবস্থা ও তালিকা আবার দেখুন", "Retry status and queue checks")}
        </button>
      )}
      <div className="admin-management-actions-section">
        <h3 className="admin-hub-title">
          <ShieldAlert size={18} className="text-red" />
          {t(en, "দ্রুত ব্যবস্থাপনা", "Administrative Quick Management")}
        </h3>
        <div className="admin-hub-actions-grid">
          {actions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className={`admin-hub-action-btn ${action.primary ? "primary" : ""}`}
            >
              <div className="action-btn-icon">
                <action.Icon size={18} />
              </div>
              <div className="action-btn-text">
                <strong>{action.label}</strong>
                <small>{action.hint}</small>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
