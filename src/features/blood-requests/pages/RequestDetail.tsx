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
  const { id } = useParams();
  const { data: me } = useMe();
  const q = useQuery({
    queryKey: ["request", id],
    queryFn: async () => requestsApi.detail(id),
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
      toast.success("Updated");
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
  return (
    <section className="page narrow">
      <PageHeading title={`${item.bloodGroup} · ${item.hospital}`} />
      <div className="panel">
        <span className="badge">{item.status}</span>
        <h2>
          {item.units} units · {item.component}
        </h2>
        <p>{item.area}</p>
        <p>{new Date(item.requiredAt).toLocaleString()}</p>
        {item.contact && (
          <p>
            <Phone size={16} /> {item.contact}
          </p>
        )}
        {item.instructions && <p>{item.instructions}</p>}
        {item.owner === me?.id ? (
          <>
            {["submitted", "verification", "active"].includes(item.status) && (
              <Link className="text-link" to={`/requests/${id}/edit`}>
                Edit request & resubmit for review
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
                  key={status}
                  className="button secondary"
                  disabled={mutation.isPending}
                  onClick={() => {
                    if (confirm(`Mark this request ${status}?`))
                      mutation.mutate({ path: "status", data: { status } });
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
            <h3>Donor responses</h3>
            {r.isError ? (
              <Failure error={r.error} />
            ) : r.data?.items.length ? (
              r.data.items.map((x) => (
                <p key={x.id}>
                  {x.response} · {x.name} {x.phone}
                </p>
              ))
            ) : (
              <Empty />
            )}
          </>
        ) : (
          <RequireUser>
            <p>
              Contact is shared after you accept, with consent. Your donor
              profile must match the requested blood group.
            </p>
            <div className="button-row">
              {["accepted", "declined"].map((response) => (
                <button
                  className="button"
                  key={response}
                  disabled={mutation.isPending}
                  onClick={() =>
                    mutation.mutate({ path: "respond", data: { response } })
                  }
                >
                  {response === "accepted"
                    ? "আমি সাড়া দিতে চাই · Accept"
                    : "Decline"}
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
                  toast.success("Report submitted");
                  form.reset();
                } catch (err) {
                  toast.error(errorText(err));
                }
              }}
            >
              <Field label="Report a concern">
                <textarea
                  name="reason"
                  required
                  minLength={10}
                  maxLength={500}
                />
              </Field>
              <button className="button secondary">Submit report</button>
            </form>
          </RequireUser>
        )}
      </div>
    </section>
  );
}
