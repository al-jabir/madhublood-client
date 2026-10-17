import { canVolunteer } from "@/utils/volunteer-permissions";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useMe } from "@/features/auth/hooks/useMe";
import { authApi } from "@/features/auth/api/auth.api";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { qc } from "@/lib/query-client";
import { setCsrf } from "@/services/http";
import { errorText } from "@/utils/error-text";

export function AccountMenu() {
  const { data: me } = useMe();
  const { en } = usePrefs();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const nav = useNavigate();
  useEffect(() => setOpen(false), [location]);
  useEffect(() => {
    function outside(e: PointerEvent) {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    }
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    if (open) {
      document.addEventListener("pointerdown", outside);
      document.addEventListener("keydown", escape);
    }
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  if (!me) return null;
  const links = [
    ["profile", t(en, "আমার প্রোফাইল", "My profile")],
    ["donor", t(en, "রক্তদাতা ফর্ম", "Donor form")],
    ["donations", t(en, "রক্তদানের ইতিহাস", "Donation history")],
    ["notifications", t(en, "বিজ্ঞপ্তি", "Notifications")],
    ["settings", t(en, "অ্যাকাউন্ট ও নিরাপত্তা", "Account & security")],
  ];
  return (
    <div className="account-menu" ref={root}>
      <button
        ref={trigger}
        className="account-trigger"
        aria-label={me.name || t(en, "আমার অ্যাকাউন্ট", "My account")}
        aria-expanded={open}
        aria-controls="account-links"
        onClick={() => setOpen(!open)}
      >
        <span className="account-avatar">
          <UserRound size={18} />
        </span>
        <span className="account-name">
          {me.name || t(en, "আমার অ্যাকাউন্ট", "My account")}
        </span>
        <ChevronDown size={15} />
      </button>
      {open && (
        <div id="account-links" className="account-dropdown">
          <strong>{me.name || t(en, "আমার অ্যাকাউন্ট", "My account")}</strong>
          {links.map(([tab, label]) => (
            <Link key={tab} to={`/dashboard?tab=${tab}`}>
              {label}
            </Link>
          ))}
          {canVolunteer(me, "submit-referrals") && (
            <Link to="/requests/new">
              {t(en, "রক্তের অনুরোধ করুন", "Create blood request")}
            </Link>
          )}
          {me.roles.some((r) =>
            ["admin", "super-admin", "volunteer"].includes(r),
          ) && (
            <Link
              to={
                me.roles.some((r) => ["admin", "super-admin"].includes(r))
                  ? "/admin?section=coordination"
                  : "/volunteer"
              }
            >
              {me.roles.some((r) => ["admin", "super-admin"].includes(r))
                ? t(en, "রক্তের সমন্বয়", "Coordination desk")
                : t(en, "স্বেচ্ছাসেবকের ড্যাশবোর্ড", "Volunteer dashboard")}
            </Link>
          )}
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await authApi.logout();
                setCsrf("");
                qc.clear();
                setOpen(false);
                nav("/login");
              } catch (e) {
                toast.error(errorText(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            <LogOut size={16} />
            {t(en, "লগ আউট", "Sign out")}
          </button>
        </div>
      )}
    </div>
  );
}
