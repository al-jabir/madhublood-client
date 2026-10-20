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
  CheckCircle2,
  Wrench,
  Radio,
  FileText,
} from "lucide-react";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { superAdminApi } from "@/features/super-admin/api/super-admin.api";
import { adminApi } from "../api/admin.api";
import { useMe } from "@/features/auth/hooks/useMe";

export function AdminDashboardHub() {
  const { en } = usePrefs();
  const { data: me } = useMe();
  const isSuperAdmin = me?.roles?.includes("super-admin");

  const platformQuery = useQuery({
    queryKey: ["platform"],
    queryFn: superAdminApi.platform,
    staleTime: 15000,
  });

  const queueQuery = useQuery({
    queryKey: ["moderation"],
    queryFn: adminApi.queue,
    staleTime: 30000,
  });

  const pendingRequestsCount = queueQuery.data?.requests?.length ?? 0;
  const pendingDonorsCount = queueQuery.data?.donors?.length ?? 0;
  const isMaintenance = Boolean(platformQuery.data?.maintenance);
  const isRegistrationOpen = platformQuery.data?.registrationOpen ?? true;

  const n = (val: number) => val.toLocaleString(en ? "en-GB" : "bn-BD");

  return (
    <div className="admin-dashboard-hub">
      {/* Platform Live Control & Status Banner */}
      <div className="admin-platform-status-bar">
        <div className="status-item">
          <span className="status-label">
            <Radio size={14} className="text-red" />
            {t(en, "প্ল্যাটফর্ম স্ট্যাটাস:", "Platform Status:")}
          </span>
          <span
            className={`status-pill ${isMaintenance ? "status-warning" : "status-active"}`}
          >
            {isMaintenance
              ? t(en, "রক্ষণাবেক্ষণ মোড সক্রিয় (ওয়েবসাইট বন্ধ)", "Maintenance Active (Site Offline)")
              : t(en, "সক্রিয় ও লাইভ (ওয়েবসাইট উন্মুক্ত)", "Operational & Live")}
          </span>
        </div>

        <div className="status-item">
          <span className="status-label">
            <Users size={14} />
            {t(en, "পাবলিক রেজিস্ট্রেশন:", "Registration:")}
          </span>
          <span
            className={`status-pill ${isRegistrationOpen ? "status-active" : "status-warning"}`}
          >
            {isRegistrationOpen
              ? t(en, "উন্মুক্ত", "Open")
              : t(en, "স্থগিত", "Paused")}
          </span>
        </div>

        <div className="status-item">
          <span className="status-label">
            <Activity size={14} />
            {t(en, "ডাটাবেস ও সিস্টেম:", "Backend System:")}
          </span>
          <span className="status-pill status-active">
            <CheckCircle2 size={12} />
            {t(en, "সংযুক্ত ও সুস্থ", "Connected & Healthy")}
          </span>
        </div>

        <Link
          to="/admin?section=settings"
          className="button secondary small status-manage-btn"
        >
          <Wrench size={13} />
          <span>{t(en, "সেটিংস পরিবর্তন", "Manage Settings")}</span>
        </Link>
      </div>

      {/* Moderation Queue Alerts (if there are items waiting) */}
      <div className="admin-queue-summary-grid">
        <Link
          to="/admin?section=requests"
          className={`admin-queue-card ${pendingRequestsCount > 0 ? "has-pending" : ""}`}
        >
          <div className="queue-card-icon red">
            <Droplets size={20} />
          </div>
          <div className="queue-card-body">
            <span className="queue-label">
              {t(en, "অপেক্ষমান রক্তের অনুরোধ", "Pending Blood Requests")}
            </span>
            <div className="queue-count-row">
              <strong>{n(pendingRequestsCount)}</strong>
              <span className="queue-status-text">
                {pendingRequestsCount > 0
                  ? t(en, "পর্যালোচনা প্রয়োজন", "Requires review")
                  : t(en, "সব পরিষ্কার", "All cleared")}
              </span>
            </div>
          </div>
          <ArrowUpRight size={16} className="queue-arrow" />
        </Link>

        <Link
          to="/admin?section=donors"
          className={`admin-queue-card ${pendingDonorsCount > 0 ? "has-pending" : ""}`}
        >
          <div className="queue-card-icon blue">
            <Users size={20} />
          </div>
          <div className="queue-card-body">
            <span className="queue-label">
              {t(en, "যাচাইহীন রক্তদাতার প্রোফাইল", "Unverified Donor Profiles")}
            </span>
            <div className="queue-count-row">
              <strong>{n(pendingDonorsCount)}</strong>
              <span className="queue-status-text">
                {pendingDonorsCount > 0
                  ? t(en, "যাচাইয়ের অপেক্ষায়", "Awaiting verification")
                  : t(en, "সব যাচাইকৃত", "All verified")}
              </span>
            </div>
          </div>
          <ArrowUpRight size={16} className="queue-arrow" />
        </Link>

        <Link to="/admin?section=coordination" className="admin-queue-card">
          <div className="queue-card-icon green">
            <ClipboardList size={20} />
          </div>
          <div className="queue-card-body">
            <span className="queue-label">
              {t(en, "সমন্বয় ও ফলো-আপ ডেস্ক", "Coordination Desk")}
            </span>
            <div className="queue-count-row">
              <span className="queue-status-text">
                {t(en, "রোগী ও ডোনার যোগাযোগ", "Active patient & donor calls")}
              </span>
            </div>
          </div>
          <ArrowUpRight size={16} className="queue-arrow" />
        </Link>
      </div>

      {/* Primary Management Hub Actions */}
      <div className="admin-management-actions-section">
        <h3 className="admin-hub-title">
          <ShieldAlert size={18} className="text-red" />
          <span>{t(en, "প্রশাসনিক দ্রুত ব্যবস্থাপনা", "Administrative Quick Management")}</span>
        </h3>

        <div className="admin-hub-actions-grid">
          <Link
            to="/requests/new?onBehalf=1"
            className="admin-hub-action-btn primary"
          >
            <div className="action-btn-icon">
              <Plus size={18} />
            </div>
            <div className="action-btn-text">
              <strong>{t(en, "নতুন রক্তের অনুরোধ যুক্ত করুন", "Add Blood Request")}</strong>
              <small>{t(en, "রোগীর পক্ষে সরাসরি জরুরি অনুরোধ তুলুন", "Create on behalf of patient")}</small>
            </div>
          </Link>

          <Link
            to="/admin?section=community"
            className="admin-hub-action-btn"
          >
            <div className="action-btn-icon">
              <Radio size={18} />
            </div>
            <div className="action-btn-text">
              <strong>{t(en, "জরুরি ঘোষণা প্রকাশ করুন", "Publish Announcement")}</strong>
              <small>{t(en, "ওয়েবসাইটের শীর্ষে বার্তা প্রচার করুন", "Banner across all pages")}</small>
            </div>
          </Link>

          {isSuperAdmin && (
            <Link
              to="/admin?section=users"
              className="admin-hub-action-btn"
            >
              <div className="action-btn-icon">
                <Users size={18} />
              </div>
              <div className="action-btn-text">
                <strong>{t(en, "ব্যবহারকারী ও পারমিশন কন্ট্রোল", "Users & Role Access")}</strong>
                <small>{t(en, "স্বেচ্ছাসেবক ও অ্যাডমিন অনুমোদন", "Manage roles & accounts")}</small>
              </div>
            </Link>
          )}

          {isSuperAdmin && (
            <Link
              to="/admin?section=locations"
              className="admin-hub-action-btn"
            >
              <div className="action-btn-icon">
                <MapPin size={18} />
              </div>
              <div className="action-btn-text">
                <strong>{t(en, "এলাকা ও ইউনিয়ন ডাটাবেস", "Locations & Unions")}</strong>
                <small>{t(en, "নতুন এলাকা ও হাসপাতাল তালিকা", "Add wards, unions, hospitals")}</small>
              </div>
            </Link>
          )}

          <Link
            to="/admin?section=reports"
            className="admin-hub-action-btn"
          >
            <div className="action-btn-icon">
              <FileText size={18} />
            </div>
            <div className="action-btn-text">
              <strong>{t(en, "অভিযোগ ও সহায়তা কেস", "Reports & Complaints")}</strong>
              <small>{t(en, "ব্যবহারকারীদের পাঠানো রিপোর্ট সমাধান", "Review and resolve tickets")}</small>
            </div>
          </Link>

          <Link
            to="/admin?section=settings"
            className="admin-hub-action-btn"
          >
            <div className="action-btn-icon">
              <Wrench size={18} />
            </div>
            <div className="action-btn-text">
              <strong>{t(en, "সাইট সেটিংস ও ব্যাকআপ", "Platform Settings")}</strong>
              <small>{t(en, "রক্ষণাবেক্ষণ মোড ও সাপোর্ট বার্তা", "Maintenance & support notice")}</small>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
