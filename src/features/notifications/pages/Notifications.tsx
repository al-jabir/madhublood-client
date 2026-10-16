import { useCursorNavigation } from "@/hooks/useCursorNavigation";
import { CursorPager } from "@/components/common/CursorPager";
import { notificationsApi } from "@/features/notifications/api/notifications.api";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { qc } from "@/lib/query-client";
import { Loading } from "@/components/feedback/Loading";
import { Failure } from "@/components/feedback/Failure";
import { Empty } from "@/components/feedback/Empty";

export function Notifications() {
  const pagination = useCursorNavigation("");
  const q = useQuery({
    queryKey: ["notifications", pagination.after],
    queryFn: async () => notificationsApi.list(pagination.after),
  });
  return (
    <div className="panel">
      <h2>Notifications</h2>
      {q.isPending ? (
        <Loading />
      ) : q.isError ? (
        <Failure error={q.error} />
      ) : q.data.items.length ? (
        q.data.items.map((n) => (
          <div className="list-row" key={n._id}>
            <Bell />
            <p>{n.text}</p>
            {!n.read && (
              <button
                onClick={async () => {
                  await notificationsApi.markRead(n._id);
                  qc.invalidateQueries({ queryKey: ["notifications"] });
                }}
              >
                Mark read
              </button>
            )}
          </div>
        ))
      ) : (
        <Empty />
      )}
      <CursorPager
        navigation={pagination}
        nextCursor={q.data?.nextCursor}
        busy={q.isFetching}
      />
    </div>
  );
}
