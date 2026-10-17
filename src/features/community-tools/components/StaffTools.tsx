import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  communityToolsApi,
  type Announcement,
} from "../api/community-tools.api";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { qc } from "@/lib/query-client";
import { errorText } from "@/utils/error-text";
import { Failure } from "@/components/feedback/Failure";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { Loading } from "@/components/feedback/Loading";
import "../community-tools.css";
export function CoordinatorTasks({
  page,
  onSelect,
}: {
  page: number;
  onSelect: (id: string) => void;
}) {
  const { en } = usePrefs();
  const q = useQuery({
    queryKey: ["coordination-tasks", page],
    queryFn: () => communityToolsApi.tasks(page),
    refetchInterval: 30000,
  });
  return (
    <section className="community-tool">
      <h3>{t(en, "এই পাতার যোগাযোগের কাজ", "Follow-up tasks on this page")}</h3>
      <p className="tool-muted">
        {t(
          en,
          "সময় পেরিয়ে যাওয়া callback আগে দেখায়। সময় নির্ধারণ করলে স্বয়ংক্রিয় কল বা এসএমএস যায় না।",
          "Overdue callbacks appear first. Scheduling a callback does not make automatic calls or send SMS.",
        )}
      </p>
      {q.isError ? (
        <Failure error={q.error} />
      ) : q.isPending ? (
        <p>{t(en, "কাজের তালিকা দেখা হচ্ছে…", "Loading tasks…")}</p>
      ) : q.data.items.length ? (
        <div className="tool-task-list">
          {q.data.items.map((task) => (
            <div
              key={`${task.requestId}-${task.donorId}`}
              className={task.due ? "is-overdue" : ""}
            >
              <div>
                <strong>
                  {task.name} · {task.bloodGroup}
                </strong>
                <small>{task.hospital}</small>
              </div>
              <span>
                {task.due
                  ? t(en, "যোগাযোগের সময় হয়েছে", "Callback overdue")
                  : task.nextContactAt
                    ? new Date(task.nextContactAt).toLocaleString(
                        en ? "en-GB" : "bn-BD",
                      )
                    : t(en, "যোগাযোগ বাকি", "Follow-up needed")}
              </span>
              <button
                className="button secondary small"
                onClick={() => onSelect(task.requestId)}
              >
                {t(en, "কাজটি খুলুন", "Open request")}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="tool-empty">
          {t(
            en,
            "এই পাতায় বাকি যোগাযোগের কাজ নেই।",
            "No pending follow-ups on this page.",
          )}
        </p>
      )}
    </section>
  );
}
const emptyAnnouncement: Announcement = {
  enabled: false,
  titleBn: "",
  titleEn: "",
  bodyBn: "",
  bodyEn: "",
  expiresAt: null,
};
function AnnouncementEditor({ initial }: { initial: Announcement | null }) {
  const { en } = usePrefs();
  const [data, setData] = useState(initial ?? emptyAnnouncement);
  const [expiry, setExpiry] = useState(
    initial?.expiresAt
      ? new Date(
          Date.parse(initial.expiresAt) -
            new Date(initial.expiresAt).getTimezoneOffset() * 60000,
        )
          .toISOString()
          .slice(0, 16)
      : "",
  );
  const save = useMutation({
    mutationFn: () =>
      communityToolsApi.publish({
        ...data,
        expiresAt: expiry ? new Date(expiry).toISOString() : null,
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["community-announcement"] });
      toast.success(t(en, "ঘোষণা সংরক্ষণ হয়েছে", "Announcement saved"));
    },
    onError: (e) => toast.error(errorText(e)),
  });
  return (
    <form
      className="community-tool tool-announcement-editor"
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
    >
      <h2>{t(en, "কমিউনিটির ঘোষণা", "Community announcement")}</h2>
      <p className="tool-muted">
        {t(
          en,
          "ভাষা অনুযায়ী সঠিক লেখা দেখাতে দুই ভাষাতেই পূরণ করুন। ঘোষণা প্রকাশ্যে দেখাবে—ব্যক্তিগত তথ্য দেবেন না।",
          "Provide both languages so visitors see the correct version. Announcements are public; do not include private information.",
        )}
      </p>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={data.enabled}
          onChange={(e) => setData({ ...data, enabled: e.target.checked })}
        />
        {t(en, "ঘোষণা প্রকাশ করুন", "Publish announcement")}
      </label>
      <div className="tool-editor-grid">
        {(
          [
            ["titleBn", "বাংলা শিরোনাম", "Bangla title"],
            ["titleEn", "ইংরেজি শিরোনাম", "English title"],
            ["bodyBn", "বাংলা ঘোষণা", "Bangla message"],
            ["bodyEn", "ইংরেজি ঘোষণা", "English message"],
          ] as const
        ).map(([key, bn, english]) => (
          <label key={key}>
            {t(en, bn, english)}
            {key.startsWith("title") ? (
              <input
                maxLength={100}
                required={data.enabled}
                value={data[key]}
                onChange={(e) => setData({ ...data, [key]: e.target.value })}
              />
            ) : (
              <textarea
                maxLength={600}
                rows={3}
                required={data.enabled}
                value={data[key]}
                onChange={(e) => setData({ ...data, [key]: e.target.value })}
              />
            )}
          </label>
        ))}
      </div>
      <details>
        <summary>
          {t(en, "শেষ হওয়ার সময় (ঐচ্ছিক)", "Expiry time (optional)")}
        </summary>
        <DateTimePicker
          required={false}
          name="announcementExpiry"
          value={expiry}
          onChange={setExpiry}
          title={t(
            en,
            "ঘোষণা কখন শেষ হবে?",
            "When should this announcement expire?",
          )}
        />
        {expiry && (
          <button
            type="button"
            className="text-link"
            onClick={() => setExpiry("")}
          >
            {t(en, "সময় সরান", "Clear expiry")}
          </button>
        )}
      </details>
      <button className="button" disabled={save.isPending}>
        {t(en, "ঘোষণা সংরক্ষণ", "Save announcement")}
      </button>
    </form>
  );
}
export function CommunityOperations() {
  const { en } = usePrefs();
  const [page, setPage] = useState(1);
  const announcement = useQuery({
    queryKey: ["community-announcement"],
    queryFn: communityToolsApi.announcement,
  });
  const review = useQuery({
    queryKey: ["community-review", page],
    queryFn: () => communityToolsApi.review(page),
  });
  const checked = useMutation({
    mutationFn: communityToolsApi.reviewed,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["community-review"] }),
    onError: (e) => toast.error(errorText(e)),
  });
  const labels: Record<string, string> = {
    "similar-request": t(
      en,
      "কাছাকাছি সময়ে একই হাসপাতাল ও গ্রুপের অন্য অনুরোধ",
      "Similar hospital, group and time",
    ),
    "large-units": t(
      en,
      "বেশি ইউনিট চাওয়া হয়েছে—যাচাই করুন",
      "Large unit requirement: verify details",
    ),
    "member-report": t(en, "সদস্যের অভিযোগ রয়েছে", "Reported by a member"),
  };
  return (
    <div className="community-operations">
      {announcement.isPending ? (
        <Loading compact />
      ) : announcement.isError ? (
        <Failure error={announcement.error} />
      ) : (
        <AnnouncementEditor initial={announcement.data} />
      )}
      <section className="community-tool">
        <h2>
          {t(
            en,
            "মানুষের পর্যালোচনা প্রয়োজন",
            "Requests needing a closer look",
          )}
        </h2>
        <p className="tool-muted">
          {t(
            en,
            "এগুলো সম্ভাব্য মিল বা যাচাইয়ের সংকেত; প্রতারণার প্রমাণ নয়। যাচাই না করে অনুরোধ বাতিল করবেন না।",
            "These are possible overlaps or review signals, not evidence of fraud. Verify the circumstances before rejecting a request.",
          )}
        </p>
        {review.isPending ? (
          <Loading compact />
        ) : review.isError ? (
          <Failure error={review.error} />
        ) : (
          <>
            {review.data.items.length ? (
              review.data.items.map((r) => (
                <article className="tool-review" key={r.id}>
                  <div className="tool-between">
                    <h3>
                      {r.bloodGroup} · {r.hospital}
                    </h3>
                    <span className="badge">
                      {r.units} {t(en, "ইউনিট", "units")}
                    </span>
                  </div>
                  <p>{r.area}</p>
                  <ul>
                    {r.reasons.map((reason) => (
                      <li key={reason}>{labels[reason] ?? reason}</li>
                    ))}
                  </ul>
                  <div className="button-row">
                    <Link
                      className="button secondary small"
                      to={`/requests/${r.id}`}
                    >
                      {t(en, "অনুরোধ দেখুন", "View request")}
                    </Link>
                    <button
                      className="button secondary small"
                      disabled={checked.isPending}
                      onClick={() => {
                        if (
                          window.confirm(
                            t(
                              en,
                              "অনুরোধটি পর্যালোচনা করেছেন? এটি অনুরোধ বাতিল করবে না।",
                              "Have you reviewed this request? This does not reject it.",
                            ),
                          )
                        )
                          checked.mutate(r.id);
                      }}
                    >
                      {t(en, "পর্যালোচনা করেছি", "Mark reviewed")}
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <p className="tool-empty">
                {t(
                  en,
                  "এই পাতায় নতুন পর্যালোচনার সংকেত নেই।",
                  "No new review signals on this page.",
                )}
              </p>
            )}
            <div className="tool-between">
              <button
                className="button secondary small"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                {t(en, "আগের", "Previous")}
              </button>
              <span>
                {t(en, "পৃষ্ঠা", "Page")} {page}
              </span>
              <button
                className="button secondary small"
                disabled={!review.data.hasMore}
                onClick={() => setPage(page + 1)}
              >
                {t(en, "পরের", "Next")}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
