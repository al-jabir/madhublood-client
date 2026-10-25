import { useEffect, useState } from "react";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
export function Loading({
  compact = false,
  label,
  fullscreen = false,
}: {
  compact?: boolean;
  label?: string;
  fullscreen?: boolean;
}) {
  const { en } = usePrefs();
  const [visible, setVisible] = useState(fullscreen);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const reveal = window.setTimeout(() => setVisible(true), 150);
    const waiting = window.setTimeout(() => setSlow(true), 10000);
    return () => {
      window.clearTimeout(reveal);
      window.clearTimeout(waiting);
    };
  }, []);
  if (!visible)
    return (
      <div
        aria-hidden="true"
        className={`loading-placeholder${compact ? " is-compact" : ""}`}
      />
    );
  return (
    <div
      className={`blood-loader${compact ? " blood-loader-compact" : ""}${fullscreen ? " blood-loader-fullscreen" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="blood-loader-symbol" aria-hidden="true">
        <span className="blood-loader-orbit" />
        <svg viewBox="0 0 64 72" fill="none">
          <path
            d="M32 4C27 17 11 29 11 44a21 21 0 0 0 42 0C53 29 37 17 32 4Z"
            fill="currentColor"
          />
          <path
            d="m32 51-10-9c-7-7 2-16 10-8 8-8 17 1 10 8l-10 9Z"
            stroke="white"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="blood-loader-copy">
        {!compact && (
          <strong>
            Madhu<span>Blood</span>
          </strong>
        )}
        <p>
          {label ??
            (compact
              ? t(en, "লোড হচ্ছে…", "Loading…")
              : t(
                  en,
                  "আপনার জন্য প্রস্তুত হচ্ছে…",
                  "Getting things ready for you…",
                ))}
        </p>
        {slow && (
          <small className="blood-loader-slow">
            {t(
              en,
              "স্বাভাবিকের চেয়ে বেশি সময় লাগছে। সংযোগের জন্য অপেক্ষা করা হচ্ছে।",
              "This is taking longer than usual. Waiting for a response.",
            )}
          </small>
        )}
      </div>
    </div>
  );
}
