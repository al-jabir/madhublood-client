import { ChevronDown, ShieldCheck, MapPin, Users } from "lucide-react";
import "../users.css";
import { Loading } from "@/components/feedback/Loading";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { superAdminApi } from "../api/super-admin.api";
import { RoleEditor } from "./RoleEditor";
import { Failure } from "@/components/feedback/Failure";
import { errorText } from "@/utils/error-text";
import { useState } from "react";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
export function UsersPanel() {
  const { en } = usePrefs();
  const [page, setPage] = useState(1);
  const client = useQueryClient();
  const q = useQuery({
    queryKey: ["operations", "users", page],
    queryFn: () => superAdminApi.users(page),
  });
  if (q.isPending) return <Loading compact />;
  if (q.isError) return <Failure error={q.error} />;
  return (
    <div className="users-manager">
      <div className="users-toolbar">
        <div>
          <span className="users-section-label">
            <Users size={16} />
            {t(en, "সদস্য ও অনুমতি", "MEMBERS & ACCESS")}
          </span>
          <h2>{t(en, "ব্যবহারকারী পরিচালনা", "Manage your community")}</h2>
          <p>
            {t(
              en,
              "ভূমিকা ও এলাকার দায়িত্ব দেখুন। পরিবর্তনের জন্য অনুমতি সম্পাদনা খুলুন।",
              "Review roles and assigned areas. Open access settings to make a change.",
            )}
          </p>
        </div>
        <span className="users-total">
          {q.data.total} {t(en, "জন সদস্য", "members")}
        </span>
      </div>
      <div className="users-grid">
        {!q.data.items.length ? (
          <p className="muted">
            {t(en, "কোনো ব্যবহারকারী নেই।", "No records.")}
          </p>
        ) : (
          q.data.items.map((row) => (
            <article className="user-access-card" key={row._id}>
              <div className="user-access-heading">
                <span className="user-access-avatar" aria-hidden="true">
                  {(row.name || row.email || "?")
                    .trim()
                    .slice(0, 1)
                    .toUpperCase()}
                </span>
                <div>
                  <h3>
                    {row.name || t(en, "নাম দেওয়া নেই", "Unnamed member")}
                  </h3>
                  <p>{row.email}</p>
                </div>
              </div>
              <div className="user-access-badges">
                {row.roles
                  .filter((role) => role !== "user" || row.roles.length === 1)
                  .map((role) => (
                    <span className={"user-role-pill role-" + role} key={role}>
                      <ShieldCheck size={13} />
                      {role === "volunteer"
                        ? t(en, "সমন্বয়কারী", "Coordinator")
                        : role === "admin"
                          ? t(en, "অ্যাডমিন", "Admin")
                          : role === "super-admin"
                            ? t(en, "সুপার অ্যাডমিন", "Super admin")
                            : t(en, "সদস্য", "Member")}
                    </span>
                  ))}
                <span
                  className={
                    "user-profile-state" +
                    (row.profileCompleted ? " is-complete" : "")
                  }
                >
                  {row.profileCompleted
                    ? t(en, "প্রোফাইল সম্পূর্ণ", "Profile complete")
                    : t(en, "প্রোফাইল অসম্পূর্ণ", "Profile incomplete")}
                </span>
              </div>
              <div className="user-assigned-areas">
                <MapPin size={15} />
                <span>
                  {row.areas?.length
                    ? row.areas.join(" · ")
                    : t(en, "এলাকার দায়িত্ব দেওয়া নেই", "No area assigned")}
                </span>
              </div>
              <details className="user-access-editor">
                <summary>
                  {t(en, "অনুমতি সম্পাদনা", "Manage access")}
                  <ChevronDown size={16} />
                </summary>
                <div className="user-access-editor-body">
                  <RoleEditor
                    row={row}
                    save={async (roles, areas, permissions) => {
                      try {
                        await superAdminApi.updateRoles(
                          row._id,
                          roles,
                          areas,
                          permissions,
                        );
                        toast.success(t(en, "সংরক্ষণ হয়েছে", "Saved"));
                        client.invalidateQueries({ queryKey: ["operations"] });
                        client.invalidateQueries({
                          queryKey: ["coordination-detail"],
                        });
                      } catch (error) {
                        toast.error(errorText(error));
                        throw error;
                      }
                    }}
                  />
                </div>
              </details>
            </article>
          ))
        )}
      </div>
      <nav className="users-pagination" aria-label="User list pages">
        <button
          className="button secondary small"
          disabled={page <= 1 || q.isFetching}
          onClick={() => setPage((value) => value - 1)}
        >
          {t(en, "আগের", "Previous")}
        </button>
        <span>
          {t(en, "পৃষ্ঠা", "Page")} {page}
        </span>
        <button
          className="button secondary small"
          disabled={page * 20 >= q.data.total || q.isFetching}
          onClick={() => setPage((value) => value + 1)}
        >
          {t(en, "পরের", "Next")}
        </button>
      </nav>
    </div>
  );
}
