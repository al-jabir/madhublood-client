import { Loading } from "@/components/feedback/Loading";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { requestsApi, type RequestDraft } from "../api/blood-requests.api";
import { qc } from "@/lib/query-client";
import { useMe } from "@/features/auth/hooks/useMe";
import { errorText } from "@/utils/error-text";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
export function DraftsPanel({
  onLoad,
}: {
  onLoad: (draft: RequestDraft) => void;
}) {
  const { data: me } = useMe();
  const { en } = usePrefs();
  const q = useQuery({
    queryKey: ["request-drafts"],
    enabled: !!me,
    queryFn: requestsApi.drafts,
  });
  const remove = useMutation({
    mutationFn: requestsApi.deleteDraft,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["request-drafts"] }),
    onError: (error) => toast.error(errorText(error)),
  });
  return (
    <section className="panel">
      <h2>{t(en, "সংরক্ষিত খসড়া", "Saved drafts")}</h2>
      <p>
        {t(
          en,
          "খসড়া শুধু আপনি দেখতে পাবেন। জমা দেওয়ার আগে ফোন যাচাই ও সব তথ্য পূরণ করতে হবে।",
          "Drafts are private. Verify your phone and complete all required fields before submitting.",
        )}
      </p>
      {q.isError && <p role="alert">{errorText(q.error)}</p>}
      {q.isPending && <Loading compact />}
      {q.data?.items.map((draft) => (
        <div className="list-row" key={draft._id}>
          <span>
            {String(
              draft.data.hospital ||
                t(en, "অসম্পূর্ণ অনুরোধ", "Untitled request"),
            )}
            <small>{new Date(draft.updatedAt).toLocaleString()}</small>
          </span>
          <button type="button" onClick={() => onLoad(draft)}>
            {t(en, "সম্পাদনা", "Edit")}
          </button>
          <button
            type="button"
            disabled={remove.isPending}
            onClick={() => {
              if (
                confirm(t(en, "এই খসড়াটি মুছে ফেলবেন?", "Delete this draft?"))
              )
                remove.mutate(draft._id);
            }}
          >
            {t(en, "মুছুন", "Delete")}
          </button>
        </div>
      ))}
    </section>
  );
}
