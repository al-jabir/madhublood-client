import { useDocumentPreferences } from "@/hooks/useDocumentPreferences";
import { useState, Suspense } from "react";
import { NavLink, Link, Outlet } from "react-router-dom";
import {
  Droplets,
  ArrowUpRight,
  MapPin,
  Menu,
  X,
  Sun,
  Moon,
  Languages,
} from "lucide-react";
import { Toaster } from "sonner";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { useMe } from "@/features/auth/hooks/useMe";
import { Loading } from "@/components/feedback/Loading";
import { content } from "@/i18n/content";
import { PlatformNotice } from "@/features/super-admin/components/PlatformNotice";

export function RootLayout() {
  useDocumentPreferences();
  const { en, dark, toggleLang, toggleTheme } = usePrefs();
  const [open, setOpen] = useState(false);
  const { data: me } = useMe();

  return (
    <>
      <a href="#main" className="skip">
        Skip to content
      </a>
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
      <header>
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
        <button
          className="icon mobile"
          aria-label="Toggle navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
        <nav className={open ? "open" : ""} onClick={() => setOpen(false)}>
          <NavLink to="/" end>
            {t(en, "হোম", "Home")}
          </NavLink>
          <NavLink to="/donors">
            {t(en, "রক্তদাতা খুঁজুন", "Find donors")}
          </NavLink>
          <NavLink to="/requests">
            {t(en, "রক্তের অনুরোধ", "Blood requests")}
          </NavLink>
          <NavLink to="/how-it-works">
            {t(en, "যেভাবে কাজ করে", "How it works")}
          </NavLink>
        </nav>
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
          <Link className="button small" to={me ? "/dashboard" : "/register"}>
            {me
              ? t(en, "ড্যাশবোর্ড", "Dashboard")
              : t(en, "রক্তদাতা হোন", "Become a donor")}
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </header>
      <PlatformNotice />
      <main id="main">
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
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
      <Toaster richColors position="top-center" />
    </>
  );
}
