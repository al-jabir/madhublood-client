import { canVolunteer } from "@/utils/volunteer-permissions";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  LogOut,
  UserRound,
  LayoutDashboard,
  Globe,
  UsersRound,
} from "lucide-react";
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
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const nav = useNavigate();
  useEffect(() => setOpen(false), [location.pathname, location.search]);
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
      const rect = trigger.current?.getBoundingClientRect();
      if (rect)
        setPosition({
          top: rect.bottom + 8,
          left: Math.max(
            12,
            Math.min(rect.right - 300, window.innerWidth - 312),
          ),
        });
    }
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  if (!me) return null;
  const admin = me.roles.some((r) => ["admin", "super-admin"].includes(r));
  const inAdmin = location.pathname === "/admin";
  return (
    <div className="account-menu" ref={root}>
      <button
        ref={trigger}
        type="button"
        className="account-trigger"
        aria-label={me.name || t(en, "আমার অ্যাকাউন্ট", "My account")}
        aria-expanded={open}
        aria-controls="account-links"
        onClick={() => {
          const rect = trigger.current?.getBoundingClientRect();
          if (rect)
            setPosition({
              top: rect.bottom + 8,
              left: Math.max(
                12,
                Math.min(rect.right - 300, window.innerWidth - 312),
              ),
            });
          setOpen(!open);
        }}
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
        <div
          id="account-links"
          className="account-dropdown"
          onClick={(event) => {
            if ((event.target as Element).closest("a")) setOpen(false);
          }}
          style={{
            position: "fixed",
            top: position.top,
            left: position.left,
            right: "auto",
            maxHeight: `calc(100dvh - ${position.top + 12}px)`,
          }}
        >
          <div className="account-identity">
            <span className="account-avatar">
              <UserRound size={20} />
            </span>
            <div>
              <strong>
                {me.name || t(en, "আমার অ্যাকাউন্ট", "My account")}
              </strong>
              <small>
                {admin
                  ? t(en, "অ্যাডমিন অ্যাকাউন্ট", "Administrator")
                  : t(en, "কমিউনিটি সদস্য", "Community member")}
              </small>
            </div>
          </div>
          {admin && (
            <Link
              className="account-workspace-link"
              to={inAdmin ? "/" : "/admin"}
            >
              {inAdmin ? <Globe size={18} /> : <LayoutDashboard size={18} />}
              <span>
                {inAdmin
                  ? t(en, "ওয়েবসাইট দেখুন", "View website")
                  : t(en, "অ্যাডমিন ড্যাশবোর্ড", "Admin dashboard")}
              </span>
            </Link>
          )}
          <Link
            to="/dashboard"
            aria-current={
              location.pathname === "/dashboard" ? "page" : undefined
            }
          >
            <LayoutDashboard size={18} />
            <span>{t(en, "আমার ড্যাশবোর্ড", "My dashboard")}</span>
          </Link>
          {!admin &&
            (canVolunteer(me, "submit-referrals") ||
              canVolunteer(me, "coordinate-requests")) && (
              <Link to="/volunteer">
                <UsersRound size={18} />
                <span>
                  {t(en, "স্বেচ্ছাসেবকের ড্যাশবোর্ড", "Volunteer dashboard")}
                </span>
              </Link>
            )}
          <button
            type="button"
            className="account-signout"
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
            {busy
              ? t(en, "বের হচ্ছে…", "Signing out…")
              : t(en, "লগ আউট", "Sign out")}
          </button>
        </div>
      )}
    </div>
  );
}
