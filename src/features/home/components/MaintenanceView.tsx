import { Link } from "react-router-dom";
import {
  Wrench,
  ShieldAlert,
  Info,
  Sparkles,
  Eye,
} from "lucide-react";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";

interface MaintenanceViewProps {
  supportMessage?: string;
  isFetching?: boolean;
  onRefresh?: () => void;
  isAdmin?: boolean;
  onPreview?: () => void;
}

export function MaintenanceView({
  supportMessage,
  isAdmin,
  onPreview,
}: MaintenanceViewProps) {
  const { en } = usePrefs();

  return (
    <div className="home-maintenance-view">
      <div className="maintenance-card">
        {/* Pulsing Status Badge */}
        <div className="maintenance-status-badge">
          <span className="maintenance-pulse-dot" />
          <span>
            {t(
              en,
              "সিস্টেম রক্ষণাবেক্ষণ ও উন্নয়ন চলছে",
              "System Maintenance in Progress",
            )}
          </span>
        </div>

        {/* Animated Icon Box */}
        <div className="maintenance-icon-box">
          <div className="maintenance-icon-halo" />
          <Wrench size={42} className="maintenance-icon" />
        </div>

        {/* Main Title */}
        <h1 className="maintenance-title">
          {t(
            en,
            "সাইটের রক্ষণাবেক্ষণ কাজ চলছে",
            "Site Maintenance in Progress",
          )}
        </h1>

        {/* User-Requested Core Promise Banner */}
        <div className="maintenance-promise-banner">
          <div className="maintenance-promise-header">
            <Sparkles size={20} className="text-red" />
            <h2>
              {t(
                en,
                "কাজ সম্পন্ন হলে সাইটটি আবার চালু হবে",
                "The site will be shown once work is completed",
              )}
            </h2>
          </div>
          <p>
            {t(
              en,
              "ব্যবহারকারীদের আরও নির্ভরযোগ্য ও দ্রুত সেবা প্রদানের উদ্দেশ্যে সিস্টেম আপগ্রেডের কাজ চলছে। কাজ শেষ হওয়ামাত্রই সম্পূর্ণ সাইট স্বয়ংক্রিয়ভাবে আবার সবার জন্য উন্মুক্ত ও দৃশ্যমান হবে।",
              "The platform is currently undergoing scheduled maintenance and system optimization. All features and data will be automatically restored as soon as maintenance is complete.",
            )}
          </p>
          <p className="maintenance-status-sub" style={{ marginTop: "10px", fontSize: "13px", opacity: 0.85 }}>
            {t(
              en,
              "সাইটের রক্ষণাবেক্ষণ চলছে। কিছু সুবিধা সাময়িক বন্ধ আছে।",
              "Maintenance is in progress. Some services are temporarily unavailable.",
            )}
          </p>
        </div>

        {/* Admin Support Message (if set by super-admin) */}
        {supportMessage && (
          <div className="maintenance-support-box">
            <Info size={18} className="text-red" />
            <div>
              <strong>
                {t(en, "প্রশাসনিক বার্তা", "Notice from Administrators")}
              </strong>
              <p>{supportMessage}</p>
            </div>
          </div>
        )}

        {/* Emergency Assistance Notice */}
        <div className="maintenance-emergency-alert">
          <ShieldAlert size={20} className="text-red" />
          <div>
            <strong>
              {t(en, "জরুরী রক্তের প্রয়োজনে", "For Urgent Blood Needs")}
            </strong>
            <p>
              {t(
                en,
                "অতি জরুরী পরিস্থিতিতে সরাসরি নিকটস্থ হাসপাতাল, ব্লাড ব্যাংক বা স্থানীয় জরুরি হেল্পলাইনে যোগাযোগ করার অনুরোধ করা হচ্ছে।",
                "In urgent medical emergencies, please directly contact your nearest hospital blood bank or local emergency services.",
              )}
            </p>
          </div>
        </div>

        {/* Admin / Staff Controls (only if admin previews view) */}
        {isAdmin && (
          <div className="maintenance-admin-card">
            <div className="maintenance-admin-info">
              <span className="maintenance-admin-tag">
                {t(en, "অ্যাডমিন অ্যাক্সেস", "Admin Access")}
              </span>
              <p>
                {t(
                  en,
                  "আপনি প্রশাসক হিসেবে যুক্ত আছেন। রক্ষণাবেক্ষণ মোড বন্ধ করতে অ্যাডমিন সেটিংসে যান অথবা সাইটের প্রিভিউ দেখুন।",
                  "You are logged in as an administrator. You can turn off maintenance mode in settings or preview the live site.",
                )}
              </p>
            </div>
            <div className="maintenance-admin-buttons">
              <Link
                to="/admin?section=settings"
                className="button secondary small"
              >
                <Wrench size={14} />
                <span>{t(en, "অ্যাডমিন সেটিংস", "Admin Settings")}</span>
              </Link>
              {onPreview && (
                <button
                  type="button"
                  className="button secondary small"
                  onClick={onPreview}
                >
                  <Eye size={14} />
                  <span>{t(en, "সাইট প্রিভিউ", "Preview Site")}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
