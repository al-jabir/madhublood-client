import { useCursorNavigation } from "@/hooks/useCursorNavigation";
import { CursorPager } from "@/components/common/CursorPager";
import { useQuery } from "@tanstack/react-query";
import { superAdminApi } from "../api/super-admin.api";
import { Failure } from "@/components/feedback/Failure";
export function AuditPanel() {
  const pagination = useCursorNavigation("");
  const q = useQuery({
    queryKey: ["operations", "audit-logs", pagination.after],
    queryFn: () => superAdminApi.audit(pagination.after),
  });
  if (q.isPending) return <p role="status">Loading…</p>;
  if (q.isError) return <Failure error={q.error} />;
  return (
    <div className="panel">
      {!q.data.items.length ? (
        <p className="muted">No records.</p>
      ) : (
        q.data.items.map((row) => (
          <div className="list-row" key={row._id}>
            <div>
              <strong>{row.action}</strong>
              <small>
                {new Date(row.createdAt).toLocaleString()} · {row.target}
              </small>
            </div>
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
