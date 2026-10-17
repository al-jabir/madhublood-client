import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { coordinationApi } from "../api/coordination.api";
import { ProgressCards } from "./CoordinationDesk";
import { qc } from "@/lib/query-client";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { errorText } from "@/utils/error-text";
import { Failure } from "@/components/feedback/Failure";
export function RequestCoordination({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const { en } = usePrefs();
  const q = useQuery({
    queryKey: ["coordination-progress", id],
    queryFn: () => coordinationApi.progress(id),
    refetchInterval: 30000,
  });
  const confirm = useMutation({
    mutationFn: () => coordinationApi.confirm(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["coordination-progress", id] });
      toast.success(
        t(en, "আপনার নিশ্চিতকরণ রাখা হয়েছে", "Your confirmation was recorded"),
      );
    },
    onError: (e) => toast.error(errorText(e)),
  });
  if (q.isPending)
    return (
      <p>
        {t(
          en,
          "সমন্বয়ের অগ্রগতি দেখা হচ্ছে…",
          "Loading coordination progress…",
        )}
      </p>
    );
  if (q.isError) return <Failure error={q.error} />;
  if (!q.data.managed) return null;
  return (
    <section className="coord-owner">
      <h3>{t(en, "আপনার অনুরোধের অগ্রগতি", "Your request progress")}</h3>
      <p>
        {t(en, "দায়িত্বে:", "Coordinator:")} {q.data.coordinator?.name}
      </p>
      <ProgressCards summary={q.data.summary} />
      <p>
        {status === "completed"
          ? t(
              en,
              "এই অনুরোধ সম্পন্ন হয়েছে।",
              "This request has been completed.",
            )
          : q.data.confirmed
            ? t(
                en,
                "আপনি নিশ্চিত করেছেন। Admin চূড়ান্তভাবে অনুরোধ বন্ধ করবেন।",
                "You confirmed the arrangement. An administrator will close the request.",
              )
            : t(
                en,
                "ব্যবস্থা সম্পন্ন হলে আপনি রক্তের ব্যবস্থা পেয়েছেন কি না নিশ্চিত করবেন।",
                "Once arrangements are ready, confirm that your blood requirement has been arranged.",
              )}
      </p>
      {status === "arranged" && !q.data.confirmed && (
        <button
          className="button"
          disabled={confirm.isPending || q.data.summary.remaining > 0}
          onClick={() => {
            if (
              window.confirm(
                t(
                  en,
                  "রক্তের ব্যবস্থা পেয়েছেন—এটি নিশ্চিত করছেন?",
                  "Confirm that your blood requirement has been arranged?",
                ),
              )
            )
              confirm.mutate();
          }}
        >
          {t(
            en,
            "ব্যবস্থা পেয়েছি—নিশ্চিত করুন",
            "Confirm arrangement received",
          )}
        </button>
      )}
    </section>
  );
}
