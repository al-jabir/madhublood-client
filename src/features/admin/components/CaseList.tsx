import { Loading } from "@/components/feedback/Loading";
import { useCursorNavigation } from "@/hooks/useCursorNavigation";
import { CursorPager } from "@/components/common/CursorPager";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi } from "../api/admin.api";
import { Failure } from "@/components/feedback/Failure";
import { errorText } from "@/utils/error-text";
export function CaseList({ tab }: { tab: "reports" | "tickets" }) {
  const pagination = useCursorNavigation(tab);
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ["operations", tab, pagination.after],
    queryFn: () => adminApi.cases(tab, pagination.after),
  });
  if (q.isPending) return <Loading compact />;
  if (q.isError) return <Failure error={q.error} />;
  return (
    <div className="panel">
      {!q.data.items.length ? (
        <p className="muted">No records.</p>
      ) : (
        q.data.items.map((row) => (
          <div className="list-row" key={row._id}>
            <div>
              <strong>{row.status}</strong>
              <p>{tab === "reports" ? row.reason : row.message}</p>
            </div>
            {row.status !== "resolved" && (
              <button
                onClick={async () => {
                  try {
                    await adminApi.resolve(tab, row._id);
                    toast.success("Saved");
                    client.invalidateQueries({ queryKey: ["operations"] });
                  } catch (error) {
                    toast.error(errorText(error));
                  }
                }}
              >
                Resolve
              </button>
            )}
          </div>
        ))
      )}
      <CursorPager
        navigation={pagination}
        nextCursor={q.data?.nextCursor}
        busy={q.isFetching}
      />
    </div>
  );
}
