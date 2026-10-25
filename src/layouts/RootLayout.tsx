import { AccountMenu } from "@/components/common/AccountMenu";
import { useDocumentPreferences } from "@/hooks/useDocumentPreferences";
import { useState, Suspense } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Droplets,
  MapPin,
  Menu,
  X,
  Sun,
  Moon,
  Languages,
  Bell,
  Wrench,
} from "lucide-react";
import { Toaster } from "sonner";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { useMe } from "@/features/auth/hooks/useMe";
import { notificationsApi } from "@/features/notifications/api/notifications.api";
import { Failure } from "@/components/feedback/Failure";
import { Loading } from "@/components/feedback/Loading";
import { content } from "@/i18n/content";
import { PlatformNotice } from "@/features/super-admin/components/PlatformNotice";
import { superAdminApi } from "@/features/super-admin/api/super-admin.api";
import { MaintenanceView } from "@/features/home/components/MaintenanceView";

export function RootLayout() {
  useDocumentPreferences();
  const { en, dark, toggleLang, toggleTheme } = usePrefs();
  const [open, setOpen] = useState(false);
  const { data: me, isPending: accountPending } = useMe();
  const location = useLocation();
  const pathname = location.pathname;
  const adminPage = pathname === "/admin" || pathname === "/admin/login";
  const isAuthRoute =
    pathname === "/login" ||
    pathname === "/admin/login" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/verify-email";

  const platformQuery = useQuery({
    queryKey: ["platform"],
    queryFn: superAdminApi.platform,
    staleTime: 15000,
    refetchInterval: 15000,
  });

  const isMaintenance = Boolean(platformQuery.data?.maintenance);
  const isAdmin = Boolean(
    me && (me.roles?.includes("admin") || me.roles?.includes("super-admin")),
  );

  const { data: notificationsData } = useQuery({
    queryKey: ["notifications", "badge"],
    enabled: !!me && !me.verificationRequired && (!isMaintenance || isAdmin),
    queryFn: () => notificationsApi.list(),
    refetchInterval: 30000,
  });

  const unreadCount =
    notificationsData?.items?.filter((n) => !n.read).length ?? 0;

  if (adminPage)
    return (
      <>
        <a href="#main" className="skip">
          Skip to content
        </a>
        <main id="main">
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </main>
        <Toaster richColors position="top-center" />
      </>
    );

  if (!isAuthRoute && (platformQuery.isPending || platformQuery.isError))
    return platformQuery.isPending ? (
      <Loading />
    ) : (
      <main id="main" className="page">
        <Failure error={platformQuery.error} />
        <button
          type="button"
          className="button"
          onClick={() => platformQuery.refetch()}
        >
          {t(en, "আবার চেষ্টা করুন", "Try again")}
        </button>
        <Link to="/admin/login">{t(en, "অ্যাডমিন লগইন", "Admin sign in")}</Link>
      </main>
    );

  return (
    <>
      <a href="#main" className="skip">
        Skip to content
      </a>
      {isMaintenance && isAdmin && (
        <div className="maintenance-admin-active-bar">
          <div className="maintenance-admin-active-content">
            <span>
              ⚠️{" "}
              {t(
                en,
                "সাইটে রক্ষণাবেক্ষণ মোড চালু আছে (সাধারণ দর্শকদের জন্য সম্পূর্ণ সাইট বন্ধ)। শুধুমাত্র অ্যাডমিন হিসেবে আপনার প্রবেশাধিকার রয়েছে।",
                "Maintenance mode is active (Public site is offline). You have access as an administrator.",
              )}
            </span>
            <Link
              to={
                me?.roles.includes("super-admin")
                  ? "/admin?section=settings"
                  : "/admin"
              }
              className="button small"
            >
              <Wrench size={14} />
              <span>{t(en, "অ্যাডমিন প্যানেল", "Admin workspace")}</span>
            </Link>
          </div>
        </div>
      )}
      <div className="topline">
        <span>
          <MapPin size={13} />{" "}
          {t(
            en,
            "মধুপুর, টাঙ্গাইল থেকে ভালোবাসার উদ্যোগ",
            "A community initiative from Madhupur, Tangail",
          )}
        </span>
        <span>
          {t(
            en,
            "স্বেচ্ছায় রক্তদান, জীবনের পাশে",
            "Voluntary donations. Stronger communities.",
          )}
        </span>
      </div>
      <header
        className={`site-header${isMaintenance && !isAdmin ? " maintenance-header" : ""}`}
      >
        <Link to="/" className="brand">
          <span className="brand-icon">
            <Droplets fill="currentColor" />
          </span>
          <span>
            Madhu<span className="red">Blood</span>
            <small>
              {t(
                en,
                "রক্তের বন্ধনে বাঁচুক জীবন",
                "Connected by blood. United for life.",
              )}
            </small>
          </span>
        </Link>
        {(!isMaintenance || isAdmin) && (
          <>
            <button
              className="icon mobile"
              aria-label="Toggle navigation"
              aria-expanded={open}
              aria-controls="primary-navigation"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
            <nav
              id="primary-navigation"
              aria-label="Main navigation"
              className={open ? "open" : ""}
              onClick={() => setOpen(false)}
            >
              <NavLink to="/" end>
                {t(en, "হোম", "Home")}
              </NavLink>
              <NavLink to="/donors">
                {t(en, "রক্তদাতা খুঁজুন", "Find Donors")}
              </NavLink>
              <NavLink to="/requests">
                {t(en, "রক্তের অনুরোধ", "Blood Requests")}
              </NavLink>
              <NavLink to="/how-it-works">
                {t(en, "যেভাবে কাজ করে", "How It Works")}
              </NavLink>
              <div className="mobile-nav-tools">
                <button className="icon" type="button" onClick={toggleLang}>
                  <Languages size={17} />
                  {en ? "বাংলা" : "English"}
                </button>
                <button className="icon" type="button" onClick={toggleTheme}>
                  {dark ? <Sun size={18} /> : <Moon size={18} />}
                  {t(en, "থিম পরিবর্তন", "Switch Theme")}
                </button>
                {!me && !accountPending && (
                  <Link to="/register">
                    {t(en, "অ্যাকাউন্ট তৈরি করুন", "Create account")}
                  </Link>
                )}
              </div>
            </nav>
          </>
        )}
        <div className="header-actions">
          <button
            className="icon"
            onClick={toggleLang}
            aria-label="Change language"
          >
            <Languages size={17} />
            <span>{en ? "বাংলা" : "EN"}</span>
          </button>
          <button
            className="icon"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {me && (
            <Link
              to="/dashboard?tab=notifications"
              className="icon"
              aria-label={t(en, "বিজ্ঞপ্তি", "Notifications")}
              title={t(en, "বিজ্ঞপ্তি", "Notifications")}
              style={{ position: "relative" }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    background: "var(--color-primary, #dc2626)",
                    color: "#ffffff",
                    borderRadius: "999px",
                    fontSize: "0.65rem",
                    minWidth: "16px",
                    height: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 3px",
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          )}
          {!me && !accountPending && (
            <Link
              to={isMaintenance ? "/admin/login" : "/login"}
              className="header-signin"
            >
              {isMaintenance
                ? t(en, "অ্যাডমিন লগইন", "Admin Login")
                : t(en, "লগ ইন", "Sign In")}
            </Link>
          )}
          {me && <AccountMenu />}
        </div>
      </header>
      {(!isMaintenance || isAdmin) && <PlatformNotice />}
      <main id="main">
        {isMaintenance && !isAdmin ? (
          isAuthRoute ? (
            <Suspense fallback={<Loading />}>
              <Outlet />
            </Suspense>
          ) : (
            <MaintenanceView
              supportMessage={platformQuery.data?.supportMessage}
              isFetching={platformQuery.isFetching}
              onRefresh={() => platformQuery.refetch()}
              isAdmin={false}
            />
          )
        ) : (
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        )}
      </main>
      {(!isMaintenance || isAdmin) && (
        <footer>
          <div className="footer-top">
            <Link to="/" className="brand">
              <Droplets className="red" />
              MadhuBlood
            </Link>
            <p>
              {t(
                en,
                "একটি ছোট উদ্যোগ। জীবনের জন্য বড় আশ্বাস।",
                "A small act. A meaningful difference.",
              )}
            </p>
            <span className="location">
              <MapPin size={15} /> Madhupur, Tangail, Bangladesh
            </span>
          </div>
          <div className="footer-bottom">
            <span>
              © {new Date().getFullYear()} MadhuBlood ·{" "}
              {t(en, "মানুষের জন্য, মানুষের পাশে", "Built around people.")}
            </span>
            <div>
              {["about", "contact", "privacy", "terms", "accessibility"].map(
                (p) => (
                  <Link key={p} to={"/" + p}>
                    {content[p][en ? 1 : 0]}
                  </Link>
                ),
              )}
            </div>
          </div>
          <p className="disclaimer">
            {t(
              en,
              "এটি রক্তদাতা সমন্বয় সেবা। রক্তের প্রাপ্যতা বা চিকিৎসাগত উপযুক্ততার নিশ্চয়তা দেয় না। জরুরি চিকিৎসায় সরাসরি হাসপাতালের সহায়তা নিন।",
              "A donor coordination service. Availability and clinical eligibility are not guaranteed. Contact your hospital directly for urgent medical care.",
            )}
          </p>
        </footer>
      )}
      <Toaster richColors position="top-center" />
    </>
  );
}
