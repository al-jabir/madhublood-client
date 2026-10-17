import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
export function Loading({
  compact = false,
  label,
}: {
  compact?: boolean;
  label?: string;
}) {
  const { en } = usePrefs();
  return (
    <div
      className={`blood-loader${compact ? " blood-loader-compact" : ""}`}
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
        <strong>
          Madhu<span>Blood</span>
        </strong>
        <p>
          {label ??
            t(
              en,
              "আপনার জন্য প্রস্তুত হচ্ছে…",
              "Getting things ready for you…",
            )}
        </p>
      </div>
    </div>
  );
}
