import { useState, type FormEvent, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  Droplets,
  Languages,
  Sun,
  Moon,
  ArrowRight,
  AlertTriangle,
  Lock,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { useMe } from "@/features/auth/hooks/useMe";
import { authApi } from "@/features/auth/api/auth.api";
import { qc } from "@/lib/query-client";
import { errorText } from "@/utils/error-text";
import { PasswordInput } from "@/components/ui/PasswordInput";
import "../admin-login.css";

export function AdminLogin() {
  const { en, dark, toggleLang, toggleTheme } = usePrefs();
  const { data: me, isLoading: checkingAuth } = useMe();
  const nav = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already logged in as admin, redirect immediately to /admin
  useEffect(() => {
    if (
      me &&
      (me.roles.includes("admin") || me.roles.includes("super-admin"))
    ) {
      const returnTo =
        (location.state as { returnTo?: { pathname?: string } })?.returnTo
          ?.pathname || "/admin";
      nav(returnTo, { replace: true });
    }
  }, [me, nav, location.state]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const session = await authApi.login({
        email: email.trim(),
        password,
      });

      await qc.invalidateQueries({ queryKey: ["me"] });

      const roles = session.user?.roles || [];
      const isStaff = roles.some((r) =>
        ["admin", "super-admin", "volunteer"].includes(r),
      );

      if (!isStaff) {
        // Authenticated as a non-admin user; log out and block access
        await authApi.logout();
        await qc.invalidateQueries({ queryKey: ["me"] });
        setErrorMessage(
          t(
            en,
            "আপনার অ্যাকাউন্টে অ্যাডমিন অধিকার নেই। অনুগ্রহ করে মূল সাইটের সদস্য লগইন ব্যবহার করুন।",
            "This account does not have administrator privileges. Please use the public member login.",
          ),
        );
        setLoading(false);
        return;
      }

      toast.success(
        t(en, "অ্যাডমিন পোর্টালে স্বাগতম!", "Welcome to the Admin Portal!"),
      );

      const returnTo =
        (location.state as { returnTo?: { pathname?: string } })?.returnTo
          ?.pathname || "/admin";
      nav(returnTo, { replace: true });
    } catch (err) {
      setErrorMessage(errorText(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <header className="admin-login-header">
        <Link to="/" className="admin-login-brand">
          <div className="admin-brand-icon-box">
            <Droplets size={22} fill="currentColor" />
          </div>
          <div>
            <h1>
              Madhu<span>Blood</span>
            </h1>
            <small>
              {t(
                en,
                "মধুপুর রক্তদান নেটওয়ার্ক",
                "Madhupur Blood Donation Network",
              )}
            </small>
          </div>
          <span className="admin-console-pill">
            <Lock size={11} />
            {t(en, "অ্যাডমিন কনসোল", "Admin Console")}
          </span>
        </Link>

        <div className="admin-login-tools">
          <button
            type="button"
            className="admin-tool-btn"
            onClick={toggleLang}
            aria-label="Change language"
          >
            <Languages size={15} />
            <span>{en ? "বাংলা" : "EN"}</span>
          </button>
          <button
            type="button"
            className="admin-tool-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
      </header>

      <main className="admin-login-main">
        <div className="admin-login-card">
          <div className="admin-login-title-box">
            <div className="admin-login-badge-icon">
              <ShieldCheck size={28} />
            </div>
            <h2>
              {t(
                en,
                "অ্যাডমিন পোর্টাল লগইন",
                "Sign In to Admin Portal",
              )}
            </h2>
            <p>
              {t(
                en,
                "প্ল্যাটফর্ম পরিচালনা ও তদারকির জন্য শুধুমাত্র অনুমোদিত কর্মকর্তাদের নিরাপদ প্রবেশাধিকার।",
                "Restricted access for authorized platform administrators and coordinators.",
              )}
            </p>
          </div>

          <div className="admin-security-notice">
            <AlertTriangle size={16} />
            <div>
              <strong>
                {t(en, "নিরাপত্তা সতর্কতা:", "Security Advisory:")}
              </strong>{" "}
              {t(
                en,
                "অননুমোদিত প্রবেশের চেষ্টা অডিট লগে সংরক্ষিত ও নিরীক্ষিত হয়।",
                "Unauthorized access attempts are monitored and recorded in audit logs.",
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="admin-login-error" role="alert">
              <AlertTriangle size={18} />
              <div>{errorMessage}</div>
            </div>
          )}

          <form className="admin-login-form" onSubmit={handleSubmit}>
            <div className="admin-form-group">
              <label htmlFor="admin-email">
                {t(en, "অ্যাডমিন ইমেইল ঠিকানা", "Administrator Email")}
              </label>
              <input
                id="admin-email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@madhublood.org"
              />
            </div>

            <div className="admin-form-group">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <label htmlFor="admin-password">
                  {t(en, "পাসওয়ার্ড", "Password")}
                </label>
                <Link
                  to="/forgot-password"
                  style={{
                    fontSize: "12px",
                    color: "#f43f5e",
                    textDecoration: "none",
                  }}
                >
                  {t(en, "পাসওয়ার্ড ভুলে গেছেন?", "Forgot password?")}
                </Link>
              </div>
              <PasswordInput
                id="admin-password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
              />
            </div>

            <button
              type="submit"
              className="admin-login-btn"
              disabled={loading || checkingAuth}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>
                    {t(en, "যাচাই করা হচ্ছে...", "Authenticating...")}
                  </span>
                </>
              ) : (
                <>
                  <ShieldCheck size={17} />
                  <span>
                    {t(en, "কন্ট্রোল প্যানেলে প্রবেশ করুন", "Sign In to Console")}
                  </span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="admin-login-footer-links">
            <Link to="/login" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <ArrowLeft size={13} />
              <span>
                {t(
                  en,
                  "সাধারণ ব্যবহারকারী লগইন",
                  "Public Member Sign In",
                )}
              </span>
            </Link>
            <Link to="/">
              {t(en, "মূল হোমপেজে ফিরুন", "Back to Home")}
            </Link>
          </div>
        </div>
      </main>

      <footer className="admin-page-footer">
        © {new Date().getFullYear()} MadhuBlood · {t(en, "নিরাপদ প্রশাসনিক কনসোল", "Secure Administrative Console")}
      </footer>
    </div>
  );
}
