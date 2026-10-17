import { Activity } from "lucide-react";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { auditLabel } from "@/features/admin/admin-labels";
import { Loading } from "@/components/feedback/Loading";
import { useCursorNavigation } from "@/hooks/useCursorNavigation";
import { CursorPager } from "@/components/common/CursorPager";
import { useQuery } from "@tanstack/react-query";
import { superAdminApi } from "../api/super-admin.api";
import { Failure } from "@/components/feedback/Failure";
export function AuditPanel() {
  const { en } = usePrefs();
  const pagination = useCursorNavigation("");
  const q = useQuery({
    queryKey: ["operations", "audit-logs", pagination.after],
    queryFn: () => superAdminApi.audit(pagination.after),
  });
  if (q.isPending) return <Loading compact />;
  if (q.isError) return <Failure error={q.error} />;
  return (
    <section className="panel admin-record-panel">
      <div className="admin-section-heading">
        <h2>{t(en, "সাম্প্রতিক কার্যক্রম", "Recent activity")}</h2>
        <p>
          {t(
            en,
            "অনুমতি অনুযায়ী সংরক্ষিত কাজের ইতিহাস।",
            "Recorded actions available within your permissions.",
          )}
        </p>
      </div>
      {!q.data.items.length ? (
        <div className="admin-empty-state">
          <Activity size={28} />
          <p>
            {t(
              en,
              "এই পাতায় কোনো কার্যক্রম নেই।",
              "No activity on this page.",
            )}
          </p>
        </div>
      ) : (
        q.data.items.map((row) => (
          <article className="admin-record" key={row._id}>
            <span className="admin-record-icon">
              <Activity size={17} />
            </span>
            <div>
              <strong>{auditLabel(en, row.action)}</strong>
              <small>
                {new Date(row.createdAt).toLocaleString(en ? "en-GB" : "bn-BD")}{" "}
                · <span className="admin-audit-target">{row.target}</span>
              </small>
            </div>
          </article>
        ))
      )}
      <CursorPager
        navigation={pagination}
        nextCursor={q.data?.nextCursor}
        busy={q.isFetching}
      />
    </section>
  );
}
