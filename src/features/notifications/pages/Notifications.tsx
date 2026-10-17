import { useState, useMemo } from "react";
import { useCursorNavigation } from "@/hooks/useCursorNavigation";
import { CursorPager } from "@/components/common/CursorPager";
import { notificationsApi } from "@/features/notifications/api/notifications.api";
import { useQuery } from "@tanstack/react-query";
import {
  Inbox,
  Bell,
  Droplets,
  ShieldCheck,
  HeartHandshake,
  CheckCheck,
  Check,
  MailOpen,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { qc } from "@/lib/query-client";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { toast } from "sonner";
import "../inbox.css";

type FilterType = "all" | "unread" | "read";

function getNotificationType(text: string) {
  const lower = text.toLowerCase();
  if (
    lower.includes("blood") ||
    lower.includes("রক্ত") ||
    lower.includes("request") ||
    lower.includes("অনুরোধ") ||
    lower.includes("donor") ||
    lower.includes("দাতা")
  ) {
    return {
      kind: "blood",
      icon: Droplets,
      labelBn: "রক্তের অনুরোধ",
      labelEn: "Blood Request",
    };
  }
  if (
    lower.includes("verify") ||
    lower.includes("যাচাই") ||
    lower.includes("security") ||
    lower.includes("নিরাপত্তা") ||
    lower.includes("password") ||
    lower.includes("পাসওয়ার্ড")
  ) {
    return {
      kind: "security",
      icon: ShieldCheck,
      labelBn: "নিরাপত্তা ও যাচাই",
      labelEn: "Security",
    };
  }
  if (
    lower.includes("volunteer") ||
    lower.includes("স্বেচ্ছাসেবক") ||
    lower.includes("coordinate") ||
    lower.includes("সমন্বয়")
  ) {
    return {
      kind: "volunteer",
      icon: HeartHandshake,
      labelBn: "স্বেচ্ছাসেবক ডেস্ক",
      labelEn: "Volunteer Desk",
    };
  }
  return {
    kind: "general",
    icon: Bell,
    labelBn: "বিজ্ঞপ্তি",
    labelEn: "Notice",
  };
}

function getNotificationTime(
  n: { _id: string; createdAt?: string },
  en: boolean,
) {
  try {
    const date = n.createdAt
      ? new Date(n.createdAt)
      : new Date(parseInt(n._id.substring(0, 8), 16) * 1000);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t(en, "এইমাত্র", "Just now");
    if (diffMins < 60) return `${diffMins} ${t(en, "মিনিট আগে", "mins ago")}`;
    if (diffHours < 24) return `${diffHours} ${t(en, "ঘণ্টা আগে", "hrs ago")}`;
    if (diffDays < 7) return `${diffDays} ${t(en, "দিন আগে", "days ago")}`;
    return date.toLocaleDateString(en ? "en-US" : "bn-BD", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

export function Notifications() {
  const { en } = usePrefs();
  const pagination = useCursorNavigation("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const q = useQuery({
    queryKey: ["notifications", pagination.after],
    queryFn: async () => notificationsApi.list(pagination.after),
  });

  const allItems = q.data?.items ?? [];

  const unreadItems = useMemo(
    () => allItems.filter((n) => !n.read),
    [allItems],
  );

  const readItems = useMemo(
    () => allItems.filter((n) => n.read),
    [allItems],
  );

  const displayedItems = useMemo(() => {
    if (filter === "unread") return unreadItems;
    if (filter === "read") return readItems;
    return allItems;
  }, [allItems, unreadItems, readItems, filter]);

  async function handleMarkRead(id: string) {
    try {
      await notificationsApi.markRead(id);
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(t(en, "পঠিত হিসেবে চিহ্নিত হয়েছে", "Marked as read"));
    } catch {
      toast.error(
        t(en, "ব্যর্থ হয়েছে, আবার চেষ্টা করুন", "Failed to mark as read"),
      );
    }
  }

  async function handleMarkAllRead() {
    if (!unreadItems.length) return;
    setIsMarkingAll(true);
    try {
      await Promise.all(
        unreadItems.map((item) => notificationsApi.markRead(item._id)),
      );
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(
        t(en, "সকল নোটিফিকেশন পঠিত চিহ্নিত হয়েছে", "All marked as read"),
      );
    } catch {
      toast.error(
        t(
          en,
          "কিছু নোটিফিকেশন আপডেট করা যায়নি",
          "Failed to update some notifications",
        ),
      );
    } finally {
      setIsMarkingAll(false);
    }
  }

  return (
    <div className="inbox-panel">
      {/* Header Area */}
      <div className="inbox-header">
        <div className="inbox-header-title">
          <div className="inbox-header-icon">
            <Inbox size={22} />
          </div>
          <div className="inbox-header-text">
            <h2>
              <span>{t(en, "ইনবক্স ও নোটিফিকেশন", "Inbox & Notifications")}</span>
              {unreadItems.length > 0 && (
                <span className="inbox-unread-pill">
                  <span className="inbox-unread-dot" />
                  {unreadItems.length}{" "}
                  {t(en, "নতুন", "new")}
                </span>
              )}
            </h2>
            <p>
              {t(
                en,
                "আপনার অ্যাকাউন্টের সকল বার্তা, রক্তের অনুরোধের আপডেট ও নোটিফিকেশন",
                "All your blood request alerts, security notices, and messages",
              )}
            </p>
          </div>
        </div>

        <div className="inbox-header-actions">
          <button
            type="button"
            className="inbox-action-btn"
            onClick={() => q.refetch()}
            disabled={q.isFetching}
            title={t(en, "রিফ্রেশ করুন", "Refresh inbox")}
          >
            <RefreshCw size={14} className={q.isFetching ? "spin" : ""} />
            <span>{t(en, "রিফ্রেশ", "Refresh")}</span>
          </button>

          {unreadItems.length > 0 && (
            <button
              type="button"
              className="inbox-action-btn"
              onClick={handleMarkAllRead}
              disabled={isMarkingAll || q.isFetching}
            >
              <CheckCheck size={15} />
              <span>
                {isMarkingAll
                  ? t(en, "আপডেট হচ্ছে...", "Updating...")
                  : t(en, "সব পঠিত করুন", "Mark all read")}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="inbox-filters">
        <button
          type="button"
          className={`inbox-filter-btn${filter === "all" ? " active" : ""}`}
          onClick={() => setFilter("all")}
        >
          <span>{t(en, "সকল", "All")}</span>
          <span className="inbox-badge-count">{allItems.length}</span>
        </button>
        <button
          type="button"
          className={`inbox-filter-btn${filter === "unread" ? " active" : ""}`}
          onClick={() => setFilter("unread")}
        >
          <span>{t(en, "অপঠিত", "Unread")}</span>
          <span className="inbox-badge-count">{unreadItems.length}</span>
        </button>
        <button
          type="button"
          className={`inbox-filter-btn${filter === "read" ? " active" : ""}`}
          onClick={() => setFilter("read")}
        >
          <span>{t(en, "পঠিত", "Read")}</span>
          <span className="inbox-badge-count">{readItems.length}</span>
        </button>
      </div>

      {/* Content Area */}
      {q.isPending ? (
        <div className="inbox-list">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="inbox-card"
              style={{ opacity: 0.6, animation: "pulse 1.5s infinite" }}
            >
              <div
                className="inbox-card-icon"
                style={{ background: "var(--line)" }}
              />
              <div className="inbox-card-content" style={{ width: "100%" }}>
                <div
                  style={{
                    height: "12px",
                    width: "30%",
                    background: "var(--line)",
                    borderRadius: "4px",
                    marginBottom: "8px",
                  }}
                />
                <div
                  style={{
                    height: "16px",
                    width: "80%",
                    background: "var(--line)",
                    borderRadius: "4px",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : q.isError ? (
        <div className="inbox-empty-container">
          <div
            className="inbox-empty-icon"
            style={{ color: "#ef4444", borderColor: "#fca5a5" }}
          >
            <AlertCircle size={32} />
          </div>
          <h3 className="inbox-empty-title">
            {t(en, "বার্তা লোড করা সম্ভব হয়নি", "Could not load messages")}
          </h3>
          <p className="inbox-empty-desc">
            {q.error instanceof Error
              ? q.error.message
              : t(
                  en,
                  "দয়া করে ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।",
                  "Please check your internet connection and try again.",
                )}
          </p>
          <button
            type="button"
            className="inbox-action-btn"
            style={{ marginTop: "16px" }}
            onClick={() => q.refetch()}
          >
            <RefreshCw size={14} />
            <span>{t(en, "পুনরায় চেষ্টা করুন", "Try Again")}</span>
          </button>
        </div>
      ) : displayedItems.length > 0 ? (
        <div className="inbox-list">
          {displayedItems.map((n) => {
            const typeInfo = getNotificationType(n.text);
            const Icon = typeInfo.icon;
            const timeText = getNotificationTime(n, en);

            return (
              <div
                key={n._id}
                className={`inbox-card${!n.read ? " is-unread" : ""}`}
              >
                <div className={`inbox-card-icon type-${typeInfo.kind}`}>
                  <Icon size={20} />
                </div>

                <div className="inbox-card-content">
                  <div className="inbox-card-meta">
                    <span className={`inbox-type-tag type-${typeInfo.kind}`}>
                      {en ? typeInfo.labelEn : typeInfo.labelBn}
                    </span>
                    {!n.read && (
                      <span className="inbox-unread-pill">
                        <span className="inbox-unread-dot" />
                        {t(en, "নতুন", "Unread")}
                      </span>
                    )}
                    {timeText && (
                      <span className="inbox-time-text">{timeText}</span>
                    )}
                  </div>
                  <p className="inbox-card-text">{n.text}</p>
                </div>

                <div className="inbox-card-actions">
                  {!n.read && (
                    <button
                      type="button"
                      className="inbox-mark-read-btn"
                      onClick={() => handleMarkRead(n._id)}
                      title={t(
                        en,
                        "পঠিত হিসেবে চিহ্নিত করুন",
                        "Mark as read",
                      )}
                    >
                      <Check size={14} />
                      <span>{t(en, "পঠিত", "Mark read")}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="inbox-empty-container">
          <div className="inbox-empty-icon">
            <MailOpen size={34} />
          </div>
          <h3 className="inbox-empty-title">
            {filter === "unread"
              ? t(en, "কোনো অপঠিত বার্তা নেই", "No unread notifications")
              : filter === "read"
                ? t(en, "কোনো পঠিত বার্তা নেই", "No read notifications")
                : t(en, "ইনবক্স সম্পূর্ণ পরিষ্কার", "Your inbox is clear")}
          </h3>
          <p className="inbox-empty-desc">
            {filter === "unread"
              ? t(
                  en,
                  "আপনার সব নোটিফিকেশন ইতিমধ্যে পঠিত হয়েছে।",
                  "You're all caught up with your notifications.",
                )
              : t(
                  en,
                  "নতুন রক্তের অনুরোধ বা অ্যাকাউন্টের গুরুত্বপূর্ণ নোটিফিকেশন আসলে এখানে দেখতে পাবেন।",
                  "New blood request updates and account notices will appear here.",
                )}
          </p>
        </div>
      )}

      {/* Pagination */}
      <CursorPager
        navigation={pagination}
        nextCursor={q.data?.nextCursor}
        busy={q.isFetching}
      />
    </div>
  );
}
