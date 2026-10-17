import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { MessageSquare, Save } from "lucide-react";
import { toast } from "sonner";
import {
  volunteerApi,
  type FamilyFeedback as Feedback,
} from "../api/volunteer.api";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { qc } from "@/lib/query-client";
import { errorText } from "@/utils/error-text";
import "../volunteer.css";
export function FamilyFeedback({
  id,
  units,
  feedback,
}: {
  id: string;
  units: number;
  feedback?: Feedback;
}) {
  const { en } = usePrefs();
  const [outcome, setOutcome] = useState(feedback?.outcome ?? "contacted");
  const [received, setReceived] = useState(feedback?.receivedUnits || 1);
  const [note, setNote] = useState(feedback?.note ?? "");
  const save = useMutation({
    mutationFn: () =>
      volunteerApi.feedback(id, {
        outcome,
        receivedUnits: outcome === "received" ? received : 0,
        note,
      }),
    onSuccess: async () => {
      await Promise.all(
        [
          "volunteer-dashboard",
          "coordination-detail",
          "request",
          "request-timeline",
        ].map((key) => qc.invalidateQueries({ queryKey: [key] })),
      );
      toast.success(
        t(en, "পরিবারের মতামত রাখা হয়েছে", "Family feedback saved"),
      );
    },
    onError: (e) => toast.error(errorText(e)),
  });
  return (
    <form
      className="volunteer-feedback"
      onSubmit={(e) => {
        e.preventDefault();
        if (!save.isPending) save.mutate();
      }}
    >
      <div className="volunteer-section-title">
        <MessageSquare size={21} />
        <div>
          <h3>
            {t(en, "পরিবারের খোঁজ ও মতামত", "Family follow-up & feedback")}
          </h3>
          <p>
            {t(
              en,
              "প্রতিনিধির সঙ্গে কথা বলে লিখুন। এটি অনুরোধের অবস্থা বদলায় না।",
              "Record what the representative told you. This does not change request status.",
            )}
          </p>
        </div>
      </div>
      <label className="field">
        <span>{t(en, "কী জানা গেল?", "What did the family say?")}</span>
        <select value={outcome} onChange={(e) => setOutcome(e.target.value)}>
          <option value="contacted">{t(en, "কথা হয়েছে", "Contacted")}</option>
          <option value="no-answer">{t(en, "ফোন ধরেননি", "No answer")}</option>
          <option value="received">
            {t(en, "রক্ত পেয়েছেন", "Blood received")}
          </option>
          <option value="problem">
            {t(en, "সমস্যা জানিয়েছেন", "Problem reported")}
          </option>
        </select>
      </label>
      {outcome === "received" && (
        <label className="field">
          <span>
            {t(en, "কত ব্যাগ পেয়েছেন?", "How many units were received?")}
          </span>
          <input
            type="number"
            min={1}
            max={units}
            required
            value={received}
            onChange={(e) => setReceived(Number(e.target.value))}
          />
        </label>
      )}
      <label className="field">
        <span>
          {t(en, "ব্যক্তিগত নোট (ঐচ্ছিক)", "Private note (optional)")}
        </span>
        <textarea
          maxLength={500}
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t(
            en,
            "কথার সংক্ষিপ্ত বিবরণ; চিকিৎসার নথি বা পরিচয়পত্র নয়",
            "Brief follow-up only; no medical records or identity documents",
          )}
        />
      </label>
      <div className="volunteer-feedback-footer">
        <small>
          {t(
            en,
            "শুধু অনুমোদিত কর্মীরা এই নোট দেখবেন। সর্বশেষ মতামতটি সংরক্ষিত থাকবে।",
            "Notes are for authorized staff. Saving replaces the previous feedback.",
          )}
        </small>
        <button className="button secondary" disabled={save.isPending}>
          <Save size={16} />
          {save.isPending
            ? t(en, "সংরক্ষণ হচ্ছে…", "Saving…")
            : t(en, "মতামত সংরক্ষণ", "Save feedback")}
        </button>
      </div>
    </form>
  );
}
