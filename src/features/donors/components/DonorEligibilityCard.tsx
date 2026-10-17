import { useState } from "react";
import { Clock, CheckCircle2, Calendar } from "lucide-react";
import { t } from "@/i18n/translate";
import { donorsApi } from "../api/donors.api";
import { toast } from "sonner";
import { qc } from "@/lib/query-client";
import { errorText } from "@/utils/error-text";

interface DonorEligibilityProps {
  lastDonation?: string;
  available?: boolean;
  bloodGroup?: string;
  en: boolean;
  onNavigateToDonorTab?: () => void;
}

export function DonorEligibilityCard({
  lastDonation,
  available,
  bloodGroup,
  en,
  onNavigateToDonorTab,
}: DonorEligibilityProps) {
  const [busy, setBusy] = useState(false);

  // Interval in days for whole blood donation (WHO standard: ~90 days)
  const REQUIRED_INTERVAL_DAYS = 90;

  let isEligible = true;
  let daysRemaining = 0;
  let daysPassed = 0;
  let nextDateStr = "";
  let progressPercent = 100;

  if (lastDonation) {
    const lastDate = new Date(lastDonation);
    if (!isNaN(lastDate.getTime())) {
      const now = new Date();
      const diffMs = now.getTime() - lastDate.getTime();
      daysPassed = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (daysPassed < REQUIRED_INTERVAL_DAYS) {
        isEligible = false;
        daysRemaining = REQUIRED_INTERVAL_DAYS - daysPassed;
        const nextDate = new Date(
          lastDate.getTime() + REQUIRED_INTERVAL_DAYS * 24 * 60 * 60 * 1000,
        );
        nextDateStr = nextDate.toLocaleDateString(en ? "en-BD" : "bn-BD", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        progressPercent = Math.min(
          99,
          Math.max(5, Math.round((daysPassed / REQUIRED_INTERVAL_DAYS) * 100)),
        );
      }
    }
  }

  async function handleToggleAvailability() {
    setBusy(true);
    try {
      const saved = await donorsApi.update({
        available: !available,
      });
      qc.setQueryData(["profile"], saved);
      await qc.invalidateQueries({ queryKey: ["donors"] });
      toast.success(
        available
          ? t(en, "উপলব্ধতা বন্ধ করা হয়েছে", "Availability paused")
          : t(en, "আপনি এখন রক্তদানে প্রস্তুত!", "You are now marked available!"),
      );
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`eligibility-card ${isEligible ? "eligible" : "resting"}`}>
      <div className="eligibility-card-header">
        <div className="eligibility-icon-wrap">
          {isEligible ? (
            <CheckCircle2 size={24} className="green" />
          ) : (
            <Clock size={24} className="amber" />
          )}
        </div>
        <div>
          <h4>
            {isEligible
              ? t(
                  en,
                  "রক্তদানের বর্তমান অবস্থা: প্রস্তুত",
                  "Blood Donation Status: Eligible",
                )
              : t(
                  en,
                  "রক্তদানের বর্তমান অবস্থা: বিশ্রামে আছেন",
                  "Blood Donation Status: Resting Period",
                )}
          </h4>
          <p>
            {isEligible
              ? t(
                  en,
                  "আপনি সুস্থ থাকলে যে কোনো সময় জরুরি প্রয়োজনে রক্তদান করতে পারেন।",
                  "You have completed the required recovery interval and can donate.",
                )
              : t(
                  en,
                  `শেষ রক্তদানের পর ৯০ দিনের বিশ্রামের সময়কাল চলছে।`,
                  `Required 90-day recovery interval is currently in progress.`,
                )}
          </p>
        </div>
        {bloodGroup && (
          <span className="blood-type-pill">{bloodGroup}</span>
        )}
      </div>

      {!isEligible ? (
        <div className="eligibility-countdown-box">
          <div className="countdown-stat">
            <span className="countdown-number">{daysRemaining}</span>
            <span className="countdown-label">
              {t(en, "দিন বাকি", "days remaining")}
            </span>
          </div>

          <div className="countdown-progress-wrap">
            <div className="countdown-progress-labels">
              <span>
                {t(en, "অতিক্রান্ত: ", "Elapsed: ")}
                <strong>{daysPassed} {t(en, "দিন", "days")}</strong>
              </span>
              <span>
                {t(en, "পরবর্তী রক্তদান: ", "Next eligible: ")}
                <strong>{nextDateStr}</strong>
              </span>
            </div>
            <div className="countdown-bar-track">
              <div
                className="countdown-bar-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="eligibility-ready-box">
          <div className="ready-badge-row">
            <span className={`status-pill ${available ? "ready" : "paused"}`}>
              {available
                ? t(en, "সক্রিয় · অনুরোধ গ্রহণের জন্য প্রস্তুত", "Active · Ready for requests")
                : t(en, "নিষ্ক্রিয় · সাময়িক বন্ধ", "Paused · Currently inactive")}
            </span>
            <button
              type="button"
              className="button small secondary"
              disabled={busy}
              onClick={handleToggleAvailability}
            >
              {available
                ? t(en, "বিরতি নিন", "Pause availability")
                : t(en, "এখন প্রস্তুত হিসেবে চিহ্নিত করুন", "Mark as Ready")}
            </button>
          </div>
        </div>
      )}

      {lastDonation && (
        <div className="eligibility-footer-meta">
          <Calendar size={14} />
          <span>
            {t(en, "সর্বশেষ রক্তদান: ", "Last donation: ")}
            <strong>
              {new Date(lastDonation).toLocaleDateString(
                en ? "en-BD" : "bn-BD",
                {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                },
              )}
            </strong>
          </span>
          {onNavigateToDonorTab && (
            <button
              type="button"
              onClick={onNavigateToDonorTab}
              className="text-link"
              style={{ marginLeft: "auto" }}
            >
              {t(en, "তারিখ পরিবর্তন করুন →", "Update date →")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
