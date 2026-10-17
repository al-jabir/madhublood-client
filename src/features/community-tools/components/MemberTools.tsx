import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { BellRing, Megaphone, CheckCircle2 } from "lucide-react";
import { communityToolsApi } from "../api/community-tools.api";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { qc } from "@/lib/query-client";
import { errorText } from "@/utils/error-text";
import { Failure } from "@/components/feedback/Failure";
import { requestLabel } from "@/features/blood-requests/request-labels";
import "../community-tools.css";
export function AnnouncementBanner() {
  const { en } = usePrefs();
  const q = useQuery({
    queryKey: ["community-announcement"],
    queryFn: communityToolsApi.announcement,
    refetchInterval: 60000,
  });
  if (
    !q.data?.enabled ||
    (q.data.expiresAt && Date.parse(q.data.expiresAt) <= Date.now())
  )
    return null;
  return (
    <aside className="tool-announcement">
      <Megaphone size={22} />
      <div>
        <strong>{en ? q.data.titleEn : q.data.titleBn}</strong>
        <p>{en ? q.data.bodyEn : q.data.bodyBn}</p>
      </div>
    </aside>
  );
}
export function AvailabilityReminder() {
  const { en } = usePrefs();
  const q = useQuery({
    queryKey: ["availability-check"],
    queryFn: communityToolsApi.availability,
  });
  const save = useMutation({
    mutationFn: communityToolsApi.confirmAvailability,
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["availability-check"] }),
        qc.invalidateQueries({ queryKey: ["profile"] }),
        qc.invalidateQueries({ queryKey: ["donors"] }),
      ]);
      toast.success(
        t(
          en,
          "রক্তদানের প্রস্তুতির অবস্থা হালনাগাদ হয়েছে",
          "Availability updated",
        ),
      );
    },
    onError: (e) => toast.error(errorText(e)),
  });
  if (!q.data?.exists || !q.data.stale) return null;
  return (
    <aside className="community-tool availability-reminder">
      <BellRing size={24} />
      <div>
        <h3>
          {t(
            en,
            "এখনও কি রক্তদানে প্রস্তুত আছেন?",
            "Is your donor availability up to date?",
          )}
        </h3>
        <p>
          {t(
            en,
            "৩০ দিন ধরে আপনার রক্তদাতার তথ্য হালনাগাদ হয়নি। বর্তমান অবস্থা নিশ্চিত করুন।",
            "Your donor information has not been updated for 30 days. Confirm your current availability.",
          )}
        </p>
        <div className="button-row">
          <button
            className="button small"
            disabled={save.isPending || !q.data.canEnable}
            onClick={() => save.mutate(true)}
          >
            {t(en, "হ্যাঁ, প্রস্তুত আছি", "Yes, I am available")}
          </button>
          <button
            className="button secondary small"
            disabled={save.isPending}
            onClick={() => save.mutate(false)}
          >
            {t(en, "এখন প্রস্তুত নই", "Not available now")}
          </button>
          <Link className="text-link" to="/dashboard?tab=donor">
            {t(en, "রক্তদাতার তথ্য দেখুন", "Review donor profile")}
          </Link>
        </div>
      </div>
    </aside>
  );
}
const timelineLabels: Record<string, [string, string]> = {
  updated: ["অনুরোধের তথ্য হালনাগাদ হয়েছে", "Request information updated"],
  "coordination.ready": ["রক্তের ব্যবস্থা সম্পন্ন", "Blood arrangement ready"],
  "coordination.family-feedback": ["পরিবারের মতামত রাখা হয়েছে", "Family feedback recorded"],
  "coordination.family-confirmed": [
    "পরিবারের ফোনে নিশ্চিতকরণ রাখা হয়েছে",
    "Family confirmation recorded by volunteer",
  ],
  "coordination.owner-confirmed": [
    "অনুরোধকারী নিশ্চিত করেছেন",
    "Requester confirmed",
  ],
  "coordination.admin-completed": [
    "অ্যাডমিন অনুরোধ সম্পন্ন করেছেন",
    "Administrator completed request",
  ],
  "coordinator.assigned": ["সমন্বয়কারী নিয়োগ হয়েছে", "Coordinator assigned"],
  "coordinator.removed": [
    "সমন্বয়কারীর দায়িত্ব সরানো হয়েছে",
    "Coordinator removed",
  ],
};
export function RequestTimeline({ id }: { id: string }) {
  const { en } = usePrefs();
  const q = useQuery({
    queryKey: ["request-timeline", id],
    queryFn: () => communityToolsApi.timeline(id),
    refetchInterval: 30000,
  });
  return (
    <section className="community-tool">
      <h3>{t(en, "অনুরোধের ঘটনাক্রম", "Request timeline")}</h3>
      {q.isError ? (
        <Failure error={q.error} />
      ) : q.isPending ? (
        <p>{t(en, "ঘটনাক্রম দেখা হচ্ছে…", "Loading timeline…")}</p>
      ) : (
        <>
          <p className="tool-muted">
            {t(en, "বর্তমান অবস্থা:", "Current status:")}{" "}
            {requestLabel(en, q.data.status)}
          </p>
          <ol className="tool-timeline">
            {q.data.items.map((e) => (
              <li key={e.id}>
                <CheckCircle2 size={17} />
                <div>
                  <strong>
                    {timelineLabels[e.event]?.[en ? 1 : 0] ??
                      requestLabel(en, e.event)}
                  </strong>
                  <small>
                    {new Date(e.at).toLocaleString(en ? "en-GB" : "bn-BD")}
                  </small>
                </div>
              </li>
            ))}
          </ol>
        </>
      )}
    </section>
  );
}
export function DonorSuggestions({ id }: { id: string }) {
  const { en } = usePrefs();
  const q = useQuery({
    queryKey: ["donor-suggestions", id],
    queryFn: () => communityToolsApi.suggestions(id),
  });
  return (
    <section className="community-tool">
      <h3>{t(en, "সম্ভাব্য রক্তদাতা", "Potential donor matches")}</h3>
      <p className="tool-muted">
        {t(
          en,
          "একই গ্রুপ ও এলাকায় প্রস্তুত, প্রকাশ্যে থাকার সম্মতি দেওয়া প্রোফাইল। এটি চিকিৎসাগত যোগ্যতার নিশ্চয়তা নয়। ব্যক্তিগত ফোন এখানে দেখানো হয় না।",
          "Available public profiles with the same group and area. These are not medical eligibility recommendations. Private phone numbers are not shown here.",
        )}
      </p>
      {q.isError ? (
        <Failure error={q.error} />
      ) : q.isPending ? (
        <p>{t(en, "খোঁজা হচ্ছে…", "Finding matches…")}</p>
      ) : q.data.items.length ? (
        <div className="tool-suggestions">
          {q.data.items.map((d) => (
            <div key={d.id}>
              <span className="tool-blood">{d.bloodGroup}</span>
              <div>
                <strong>{d.name}</strong>
                <small>{d.locationLabel || d.area}</small>
              </div>
              <Link
                className="text-link"
                to={`/donors?bloodGroup=${encodeURIComponent(d.bloodGroup)}&area=${encodeURIComponent(d.area)}`}
              >
                {t(en, "তালিকা দেখুন", "View directory")}
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <p className="tool-empty">
          {t(
            en,
            "এখন কোনো মিল পাওয়া যায়নি। অনুরোধের লিংক শেয়ার করুন।",
            "No matching public profiles right now. Share the request link to reach donors.",
          )}
        </p>
      )}
    </section>
  );
}
