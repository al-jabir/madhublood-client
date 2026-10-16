import { adminApi } from "@/features/admin/api/admin.api";
import { Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { qc } from "@/lib/query-client";
import { useMe } from "@/features/auth/hooks/useMe";
import { Loading } from "@/components/feedback/Loading";
import { Failure } from "@/components/feedback/Failure";
import { Empty } from "@/components/feedback/Empty";
import { PageHeading } from "@/components/common/PageHeading";
import { RequireUser } from "@/features/auth/components/RequireUser";
import { Info } from "@/components/feedback/Info";
import { Operations } from "@/features/admin/components/Operations";
import { errorText } from "@/utils/error-text";

export function Admin() {
  const { data: me } = useMe();
  const allowed = me?.roles.some((r: string) =>
    ["admin", "volunteer", "super-admin"].includes(r),
  );
  const q = useQuery({
    queryKey: ["moderation"],
    enabled: !!allowed,
    queryFn: async () => adminApi.queue(),
  });
  async function moderate(path: string, data: unknown) {
    try {
      await adminApi.moderate(path, data);
      qc.invalidateQueries({ queryKey: ["moderation"] });
      toast.success("Moderation recorded");
    } catch (e) {
      toast.error(errorText(e));
    }
  }
  return (
    <RequireUser>
      <section className="page">
        <PageHeading
          title="Moderation queue"
          desc="Only your assigned geographic areas are accessible. Actions are audited."
        />
        {!allowed ? (
          <Info title="403" text="Staff permission required." />
        ) : q.isPending ? (
          <Loading />
        ) : q.isError ? (
          <Failure error={q.error} />
        ) : (
          <>
            <h2>Blood requests</h2>
            {q.data.requests.length ? (
              q.data.requests.map((r) => (
                <div className="list-row" key={r._id}>
                  <span className="blood-type small-type">{r.bloodGroup}</span>
                  <span>
                    {r.hospital}
                    <small>
                      {r.status} · {r.area}
                    </small>
                  </span>
                  <div className="button-row">
                    {(["submitted", "reported"].includes(r.status)
                      ? ["verification"]
                      : ["active", "rejected"]
                    ).map((status) => (
                      <button
                        key={status}
                        onClick={() =>
                          moderate(`/admin/blood-requests/${r._id}`, { status })
                        }
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <Empty />
            )}
            <h2>Donor verification</h2>
            {q.data.donors.length ? (
              q.data.donors.map((d) => (
                <div className="list-row" key={d._id}>
                  <span>
                    {d.displayName} · {d.area}
                  </span>
                  <button
                    onClick={() => {
                      if (
                        confirm(
                          "Confirm donor verification has been independently completed?",
                        )
                      )
                        moderate(`/admin/donors/${d._id}/verify`, {});
                    }}
                  >
                    Mark verified
                  </button>
                </div>
              ))
            ) : (
              <Empty />
            )}
            <Suspense fallback={<Loading />}>
              <Operations />
            </Suspense>
          </>
        )}
      </section>
    </RequireUser>
  );
}
