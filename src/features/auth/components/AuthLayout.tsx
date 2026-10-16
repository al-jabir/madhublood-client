import type { ReactNode } from "react";
import { Heart, ShieldCheck, ArrowUpRight, Droplet } from "lucide-react";
import { Link } from "react-router-dom";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";

export function AuthLayout({ children }: { children: ReactNode }) {
  const { en } = usePrefs();
  return (
    <section className="auth-shell">
      <aside className="auth-story">
        <span className="overline">MADHUPUR · TOGETHER FOR LIFE</span>
        <div className="auth-symbol" aria-hidden="true">
          <Droplet size={76} strokeWidth={1.2} />
          <Heart size={24} />
        </div>
        <h2>
          {t(
            en,
            "একটু ভালোবাসা।\nএকটি নতুন জীবন।",
            "A little kindness.\nA whole new beginning.",
          )}
        </h2>
        <p>
          {t(
            en,
            "রক্তদাতা ও রক্তের প্রয়োজনে থাকা মানুষদের পাশে, একসাথে।",
            "A community connecting people who can give with people who need a little hope.",
          )}
        </p>
        <div className="auth-promise">
          <ShieldCheck size={19} />
          <span>
            {t(
              en,
              "আপনার সম্মতি। আপনার তথ্যের নিয়ন্ত্রণ।",
              "Your consent. Your details. Your control.",
            )}
          </span>
        </div>
        <Link to="/how-it-works" className="text-link">
          {t(en, "যেভাবে কাজ করে", "Discover how it works")}
          <ArrowUpRight size={17} />
        </Link>
      </aside>
      <div className="auth-content">{children}</div>
    </section>
  );
}
