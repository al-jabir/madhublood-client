import { Loading } from "@/components/feedback/Loading";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { superAdminApi } from "../api/super-admin.api";
import { RoleEditor } from "./RoleEditor";
import { Failure } from "@/components/feedback/Failure";
import { errorText } from "@/utils/error-text";
import { useState } from "react";
export function UsersPanel() {
  const [page, setPage] = useState(1);
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ["operations", "users", page],
    queryFn: () => superAdminApi.users(page),
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
              <strong>{row.name || row.email}</strong>
              <small>
                {row.roles.join(", ")} ·{" "}
                {row.profileCompleted
                  ? "Profile complete"
                  : "Profile incomplete"}
              </small>
            </div>
            <RoleEditor
              row={row}
              save={async (roles, areas) => {
                try {
                  await superAdminApi.updateRoles(row._id, roles, areas);
                  toast.success("Saved");
                  client.invalidateQueries({ queryKey: ["operations"] });
                } catch (error) {
                  toast.error(errorText(error));
                }
              }}
            />
          </div>
        ))
      )}
      <nav className="button-row" aria-label="User list pages">
        <button
          disabled={page <= 1 || q.isFetching}
          onClick={() => setPage((value) => value - 1)}
        >
          Previous
        </button>
        <span>Page {page}</span>
        <button
          disabled={page * 20 >= q.data.total || q.isFetching}
          onClick={() => setPage((value) => value + 1)}
        >
          Next
        </button>
      </nav>
    </div>
  );
}
