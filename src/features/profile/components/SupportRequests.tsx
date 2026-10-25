import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { accountApi } from "../api/account.api";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { qc } from "@/lib/query-client";
import { useCursorNavigation } from "@/hooks/useCursorNavigation";
import { CursorPager } from "@/components/common/CursorPager";
import { Field } from "@/components/ui/Field";
import { Loading } from "@/components/feedback/Loading";
import { Failure } from "@/components/feedback/Failure";
import { errorText } from "@/utils/error-text";
export function SupportRequests() {
  const { en } = usePrefs();
  const [open, setOpen] = useState(false);
  const [generation, setGeneration] = useState(0);
  const page = useCursorNavigation(`support:${generation}`);
  const [message, setMessage] = useState("");
  const q = useQuery({
    queryKey: ["my-support", page.after],
    queryFn: () => accountApi.mySupport(page.after),
    enabled: open,
    refetchInterval: open ? 60000 : false,
  });
  const save = useMutation({
    mutationFn: () => accountApi.support(message.trim()),
    onSuccess: async () => {
      setMessage("");
      setGeneration((v) => v + 1);
      await qc.invalidateQueries({ queryKey: ["my-support"] });
      toast.success(
        t(en, "সহায়তার অনুরোধ পাঠানো হয়েছে", "Support request sent"),
      );
    },
    onError: (e) => toast.error(errorText(e)),
  });
  return (
    <details
      className="panel settings-support"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>
        {t(en, "সমস্যা জানান ও উত্তর দেখুন", "Get help & view replies")}
      </summary>
      <p>
        {t(
          en,
          "অ্যাকাউন্ট বা সাইট ব্যবহারের সমস্যা লিখুন। জরুরি রক্তের অনুরোধ এখানে দেবেন না; password বা verification code লিখবেন না।",
          "Describe an account or site issue. This is not for urgent blood requests. Never include passwords or verification codes.",
        )}
      </p>
      <form
        className="settings-feature-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!save.isPending) save.mutate();
        }}
      >
        <Field label={t(en, "আপনার সমস্যা", "Your issue")}>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            minLength={10}
            maxLength={2000}
            rows={4}
            required
            disabled={save.isPending}
          />
        </Field>
        <button
          className="button"
          disabled={save.isPending || message.trim().length < 10}
        >
          {save.isPending
            ? t(en, "পাঠানো হচ্ছে…", "Sending…")
            : t(en, "অনুরোধ পাঠান", "Send support request")}
        </button>
      </form>
      <div className="support-history-heading">
        <h4>{t(en, "আপনার অনুরোধ", "Your requests")}</h4>
        <button
          type="button"
          className="text-link"
          disabled={q.isFetching}
          onClick={() => q.refetch()}
        >
          {t(en, "হালনাগাদ করুন", "Refresh")}
        </button>
      </div>
      {q.isPending ? (
        <Loading compact />
      ) : q.isError ? (
        <Failure error={q.error} />
      ) : q.data.items.length ? (
        q.data.items.map((item) => (
          <article key={item._id} className="support-history-card">
            <div>
              <small>#{item._id.slice(-6)}</small>
              <span className="badge">
                {item.status === "resolved"
                  ? t(en, "সমাধান হয়েছে", "Resolved")
                  : t(en, "উত্তরের অপেক্ষায়", "Awaiting reply")}
              </span>
            </div>
            <p>{item.message}</p>
            {item.reply && (
              <div className="support-reply">
                <strong>
                  {t(en, "প্রশাসকের উত্তর", "Administrator reply")}
                </strong>
                <p>{item.reply}</p>
              </div>
            )}
          </article>
        ))
      ) : (
        <p>
          {t(en, "এখনও কোনো অনুরোধ নেই।", "You have no support requests yet.")}
        </p>
      )}
      <CursorPager
        navigation={page}
        nextCursor={q.data?.nextCursor}
        busy={q.isFetching}
      />
    </details>
  );
}
