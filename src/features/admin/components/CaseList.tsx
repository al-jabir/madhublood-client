import { Loading } from "@/components/feedback/Loading";
import { useCursorNavigation } from "@/hooks/useCursorNavigation";
import { CursorPager } from "@/components/common/CursorPager";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "../api/admin.api";
import { Failure } from "@/components/feedback/Failure";
import { errorText } from "@/utils/error-text";
import { useState } from "react";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { MessageSquare, Flag, CheckCircle2 } from "lucide-react";
export function CaseList({ tab }: { tab: "reports" | "tickets" }) {
  const { en } = usePrefs();
  const [busy, setBusy] = useState<string | null>(null);
  const pagination = useCursorNavigation(tab);
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ["operations", tab, pagination.after],
    queryFn: () => adminApi.cases(tab, pagination.after),
  });
  if (q.isPending) return <Loading compact />;
  if (q.isError) return <Failure error={q.error} />;
  return (
    <section className="panel admin-record-panel">
      <div className="admin-section-heading">
        <h2>
          {tab === "reports"
            ? t(en, "সদস্যদের অভিযোগ", "Member reports")
            : t(en, "সহায়তার অনুরোধ", "Support requests")}
        </h2>
        <p>
          {t(
            en,
            "বিস্তারিত দেখে প্রয়োজনীয় ব্যবস্থা নিন, এরপর নিষ্পত্তি করুন।",
            "Review the details, take any necessary action, then mark the case resolved.",
          )}
        </p>
      </div>
      {!q.data.items.length ? (
        <div className="admin-empty-state">
          <CheckCircle2 size={28} />
          <p>{t(en, "এই পাতায় কোনো রেকর্ড নেই।", "No cases on this page.")}</p>
        </div>
      ) : (
        q.data.items.map((row) => (
          <article className="admin-record" key={row._id}>
            <span className="admin-record-icon">
              {tab === "reports" ? (
                <Flag size={18} />
              ) : (
                <MessageSquare size={18} />
              )}
            </span>
            <div className="admin-record-body">
              <div className="admin-record-meta">
                <span
                  className={
                    "badge " + (row.status === "resolved" ? "is-resolved" : "")
                  }
                >
                  {row.status === "resolved"
                    ? t(en, "নিষ্পত্তি হয়েছে", "Resolved")
                    : t(en, "পর্যালোচনা বাকি", "Awaiting review")}
                </span>
                <small>#{row._id.slice(-6)}</small>
              </div>
              <p>{tab === "reports" ? row.reason : row.message}</p>
              {tab === "tickets" && (
                <details className="ticket-reply-editor">
                  <summary>
                    {t(en, "সদস্যকে উত্তর দিন", "Reply to member")}
                  </summary>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (busy) return;
                      const reply = String(
                        new FormData(e.currentTarget).get("reply") ?? "",
                      ).trim();
                      setBusy(row._id);
                      try {
                        await adminApi.replyTicket(row._id, reply);
                        await client.invalidateQueries({
                          queryKey: ["operations"],
                        });
                        toast.success(
                          t(en, "উত্তর পাঠানো হয়েছে", "Reply sent"),
                        );
                      } catch (error) {
                        toast.error(errorText(error));
                      } finally {
                        setBusy(null);
                      }
                    }}
                  >
                    <label>
                      {t(
                        en,
                        "এই উত্তর সদস্য দেখতে পাবেন",
                        "This reply is visible to the member",
                      )}
                      <textarea
                        name="reply"
                        defaultValue={row.reply ?? ""}
                        required
                        maxLength={2000}
                        minLength={1}
                        rows={3}
                      />
                    </label>
                    <button
                      className="button secondary small"
                      disabled={busy !== null}
                    >
                      {t(en, "উত্তর দিয়ে নিষ্পত্তি করুন", "Reply & resolve")}
                    </button>
                  </form>
                </details>
              )}
            </div>
            {row.status !== "resolved" && (
              <button
                className="button secondary small"
                disabled={busy !== null}
                onClick={async () => {
                  setBusy(row._id);
                  try {
                    await adminApi.resolve(tab, row._id);
                    toast.success(t(en, "নিষ্পত্তি হয়েছে", "Case resolved"));
                    client.invalidateQueries({ queryKey: ["operations"] });
                  } catch (error) {
                    toast.error(errorText(error));
                  } finally {
                    setBusy(null);
                  }
                }}
              >
                {busy === row._id
                  ? t(en, "সংরক্ষণ হচ্ছে…", "Saving…")
                  : t(en, "নিষ্পত্তি করুন", "Resolve")}
              </button>
            )}
          </article>
        ))
      )}
      <CursorPager
        navigation={pagination}
        nextCursor={q.data?.nextCursor}
        busy={q.isFetching}
      />
    </section>
  );
}
