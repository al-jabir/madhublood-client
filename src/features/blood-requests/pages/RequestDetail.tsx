import { requestLabel } from "../request-labels";
import { donorsApi } from "@/features/donors/api/donors.api";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { requestsApi } from "@/features/blood-requests/api/blood-requests.api";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import { qc } from "@/lib/query-client";
import { useMe } from "@/features/auth/hooks/useMe";
import { Loading } from "@/components/feedback/Loading";
import { Failure } from "@/components/feedback/Failure";
import { Empty } from "@/components/feedback/Empty";
import { PageHeading } from "@/components/common/PageHeading";
import { Field } from "@/components/ui/Field";
import { RequireUser } from "@/features/auth/components/RequireUser";
import { errorText } from "@/utils/error-text";

export function RequestDetail() {
  const { en } = usePrefs();
  const { id } = useParams();
  const { data: me } = useMe();
  const q = useQuery({
    queryKey: ["request", id, me?.id],
    queryFn: async () => requestsApi.detail(id),
  });
  const donor = useQuery({
    queryKey: ["profile"],
    enabled: !!me && !me.verificationRequired,
    queryFn: donorsApi.me,
  });
  const r = useQuery({
    queryKey: ["responses", id],
    enabled: !!q.data?.owner && q.data.owner === me?.id,
    queryFn: async () => requestsApi.responses(id),
  });
  const mutation = useMutation({
    mutationFn: async ({ path, data }: { path: string; data: unknown }) =>
      requestsApi.action(id, path, data),
    onSuccess: () => {
      qc.invalidateQueries();
      toast.success(t(en, "আপডেট হয়েছে", "Updated"));
    },
    onError: (e) => toast.error(errorText(e)),
  });
  if (q.isPending) return <Loading />;
  if (q.isError)
    return (
      <section className="page">
        <Failure error={q.error} />
      </section>
    );
  const item = q.data;
  const donorIssues = [
    !me?.profileCompleted
      ? t(
          en,
          "আগে আপনার ব্যক্তিগত প্রোফাইল পূরণ করুন।",
          "Complete your personal profile first.",
        )
      : "",
    !donor.data
      ? t(
          en,
          "আপনার রক্তদাতার তথ্য এখনো পূরণ করা নেই।",
          "Your donor profile has not been set up yet.",
        )
      : "",
    donor.data && donor.data.bloodGroup !== item.bloodGroup
      ? t(
          en,
          `এখানে ${item.bloodGroup} দরকার। আপনার প্রোফাইলে ${donor.data.bloodGroup} আছে। শুধু নিজের প্রকৃত রক্তের গ্রুপ ব্যবহার করুন।`,
          `This request needs ${item.bloodGroup}; your profile says ${donor.data.bloodGroup}. Only use your actual blood group.`,
        )
      : "",
    donor.data && !donor.data.available
      ? t(
          en,
          "রক্তদানে প্রস্তুত থাকলে রক্তদাতার তথ্যে রক্তদানে প্রস্তুত থাকার অপশন চালু করুন।",
          "If you are ready to donate, enable availability in your Donor form.",
        )
      : "",
    donor.data && !donor.data.contactConsent
      ? t(
          en,
          "সাড়া দিতে যোগাযোগের তথ্য শেয়ার করার সম্মতি দিন।",
          "Enable consent to share your contact when accepting a request.",
        )
      : "",
    !["active", "donors-contacted"].includes(item.status) ||
    Date.parse(item.requiredAt) <= Date.now()
      ? t(
          en,
          "এই অনুরোধে এখন নতুন সাড়া নেওয়া হচ্ছে না।",
          "This request is no longer accepting responses.",
        )
      : "",
  ].filter(Boolean);
  return (
    <section className="page narrow">
      <PageHeading title={`${item.bloodGroup} · ${item.hospital}`} />
      <div className="panel">
        <span className="badge">{requestLabel(en, item.status)}</span>
        <h2>
          {item.units} {t(en, "ইউনিট", "units")} ·{" "}
          {requestLabel(en, item.component)}
        </h2>
        <p>{item.area}</p>
        <p>
          {new Date(item.requiredAt).toLocaleString(en ? "en-BD" : "bn-BD")}
        </p>
        {item.contact && (
          <div className="request-contact-card">
            <div>
              <small>{t(en, "অনুরোধকারীর যোগাযোগ", "Requester contact")}</small>
              <strong>{item.contact.replace(/^\+88/, "")}</strong>
            </div>
            <a className="button" href={`tel:${item.contact}`}>
              <Phone size={17} />
              {t(en, "কল করুন", "Call requester")}
            </a>
          </div>
        )}
        {item.instructions && <p>{item.instructions}</p>}
        {item.owner === me?.id ? (
          <>
            {["submitted", "verification", "active"].includes(item.status) && (
              <Link className="text-link" to={`/requests/${id}/edit`}>
                {t(
                  en,
                  "সম্পাদনা করে আবার যাচাইয়ের জন্য জমা দিন",
                  "Edit request & resubmit for review",
                )}
              </Link>
            )}
            <div className="button-row">
              {(item.status === "arranged"
                ? ["completed", "cancelled"]
                : ["active", "donors-contacted"].includes(item.status)
                  ? ["arranged", "cancelled"]
                  : ["submitted", "verification"].includes(item.status)
                    ? ["cancelled"]
                    : []
              ).map((status) => (
                <button
                  key={requestLabel(en, status)}
                  className="button secondary"
                  disabled={mutation.isPending}
                  onClick={() => {
                    if (
                      confirm(
                        t(
                          en,
                          `অনুরোধের অবস্থা «${requestLabel(false, status)}» করবেন?`,
                          `Mark this request ${requestLabel(true, status)}?`,
                        ),
                      )
                    )
                      mutation.mutate({ path: "status", data: { status } });
                  }}
                >
                  {requestLabel(en, status)}
                </button>
              ))}
            </div>
            <h3>{t(en, "রক্তদাতাদের সাড়া", "Donor responses")}</h3>
            {r.isError ? (
              <Failure error={r.error} />
            ) : r.data?.items.length ? (
              r.data.items.map((x) => (
                <p key={x.id}>
                  {requestLabel(en, x.response)} · {x.name} {x.phone}
                </p>
              ))
            ) : (
              <Empty />
            )}
          </>
        ) : (
          <RequireUser>
            <section className="donor-response-guide">
              <h3>{t(en, "রক্ত দিতে চান?", "Want to donate?")}</h3>
              <p>
                {t(
                  en,
                  `এই অনুরোধে ${item.bloodGroup} গ্রুপের রক্তদাতা দরকার। সাড়া দেওয়ার আগে নিচের তথ্য মিলতে হবে।`,
                  `This request needs a ${item.bloodGroup} donor. Check your donor information before responding.`,
                )}
              </p>
              {donor.isPending ? (
                <p role="status">
                  {t(
                    en,
                    "আপনার তথ্য দেখা হচ্ছে…",
                    "Checking your donor profile…",
                  )}
                </p>
              ) : donor.isError ? (
                <Failure error={donor.error} />
              ) : donorIssues.length ? (
                <>
                  <ul>
                    {donorIssues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                  <Link
                    className="button secondary"
                    to={
                      me?.profileCompleted
                        ? "/dashboard?tab=donor"
                        : "/dashboard?tab=profile"
                    }
                  >
                    {t(en, "আমার তথ্য ঠিক করুন", "Review my donor details")}
                  </Link>
                </>
              ) : (
                <p>
                  {t(
                    en,
                    "আপনার প্রোফাইলের তথ্য মিলেছে। সাড়া দিতে পারবেন। চূড়ান্ত উপযুক্ততা হাসপাতাল যাচাই করবে।",
                    "Your profile matches the response requirements. The hospital will assess clinical suitability.",
                  )}
                </p>
              )}
            </section>
            <div className="button-row">
              {["accepted", "declined"].map((response) => (
                <button
                  className="button"
                  key={response}
                  disabled={
                    mutation.isPending ||
                    donor.isPending ||
                    donor.isError ||
                    donorIssues.length > 0
                  }
                  onClick={() =>
                    mutation.mutate({ path: "respond", data: { response } })
                  }
                >
                  {response === "accepted"
                    ? t(en, "আমি রক্ত দিতে চাই", "I want to donate")
                    : t(en, "সাড়া দেব না", "Decline")}
                </button>
              ))}
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                try {
                  await requestsApi.report({
                    request: id,
                    reason: new FormData(form).get("reason"),
                  });
                  toast.success(t(en, "অভিযোগ জমা হয়েছে", "Report submitted"));
                  form.reset();
                } catch (err) {
                  toast.error(errorText(err));
                }
              }}
            >
              <Field label={t(en, "সমস্যা জানান", "Report a concern")}>
                <textarea
                  name="reason"
                  required
                  minLength={10}
                  maxLength={500}
                />
              </Field>
              <button className="button secondary">
                {t(en, "অভিযোগ জমা দিন", "Submit report")}
              </button>
            </form>
          </RequireUser>
        )}
      </div>
    </section>
  );
}
