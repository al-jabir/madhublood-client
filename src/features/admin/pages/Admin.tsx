import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Droplets,
  Users,
  ShieldCheck,
  Flag,
  Settings,
  MapPin,
  ClipboardList,
  FlaskConical,
  Menu,
  X,
  ArrowUpRight,
  Sun,
  Moon,
  Languages,
} from "lucide-react";
import { toast } from "sonner";
import { adminApi } from "../api/admin.api";
import { qc } from "@/lib/query-client";
import { useMe } from "@/features/auth/hooks/useMe";
import { RequireUser } from "@/features/auth/components/RequireUser";
import { Loading } from "@/components/feedback/Loading";
import { Failure } from "@/components/feedback/Failure";
import { Empty } from "@/components/feedback/Empty";
import { Info } from "@/components/feedback/Info";
import { AccountMenu } from "@/components/common/AccountMenu";
import { Operations, type Tab } from "../components/Operations";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { errorText } from "@/utils/error-text";
export function Admin() {
  const { data: me } = useMe();
  const { en, dark, toggleLang, toggleTheme } = usePrefs();
  const [params] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const allowed = me?.roles.some((r) =>
    ["admin", "super-admin", "volunteer"].includes(r),
  );
  const superAdmin = me?.roles.includes("super-admin");
  const administrator = me?.roles.some((r) =>
    ["admin", "super-admin"].includes(r),
  );
  const entries = [
    {
      key: "overview",
      label: t(en, "সারসংক্ষেপ", "Overview"),
      icon: LayoutDashboard,
    },
    {
      key: "requests",
      label: t(en, "রক্তের অনুরোধ", "Blood requests"),
      icon: Droplets,
    },
    {
      key: "donors",
      label: t(en, "রক্তদাতা যাচাই", "Donor verification"),
      icon: ShieldCheck,
    },
    { key: "reports", label: t(en, "অভিযোগ", "Reports"), icon: Flag },
    ...(administrator
      ? [
          {
            key: "demo-data",
            label: t(en, "ডেমো তথ্য", "Demo data"),
            icon: FlaskConical,
          },
        ]
      : []),
    ...(superAdmin
      ? [
          { key: "users", label: t(en, "ব্যবহারকারী", "Users"), icon: Users },
          {
            key: "tickets",
            label: t(en, "সহায়তা", "Support tickets"),
            icon: ClipboardList,
          },
          {
            key: "locations",
            label: t(en, "এলাকা", "Locations"),
            icon: MapPin,
          },
          {
            key: "audit-logs",
            label: t(en, "কার্যক্রমের রেকর্ড", "Audit logs"),
            icon: ClipboardList,
          },
          {
            key: "settings",
            label: t(en, "সেটিংস", "Settings"),
            icon: Settings,
          },
        ]
      : []),
  ];
  const selected =
    entries.find((entry) => entry.key === params.get("section")) ?? entries[0];
  const q = useQuery({
    queryKey: ["moderation"],
    enabled: !!allowed && ["requests", "donors"].includes(selected.key),
    queryFn: adminApi.queue,
  });
  async function moderate(path: string, data: unknown) {
    setBusy(true);
    try {
      await adminApi.moderate(path, data);
      await qc.invalidateQueries({ queryKey: ["moderation"] });
      toast.success(t(en, "আপডেট হয়েছে", "Moderation recorded"));
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <RequireUser>
      {!allowed ? (
        <section className="page">
          <Info
            title="403"
            text={t(
              en,
              "শুধু অনুমোদিত কর্মীদের জন্য",
              "Staff permission required",
            )}
          />
        </section>
      ) : (
        <div className="admin-shell">
          {open && (
            <button
              className="admin-backdrop"
              aria-label="Close navigation"
              onClick={() => setOpen(false)}
            />
          )}
          <aside className={"admin-sidebar" + (open ? " is-open" : "")}>
            <Link to="/admin" className="admin-brand">
              <Droplets size={28} />
              <span>
                MadhuBlood
                <small>{t(en, "পরিচালনা কেন্দ্র", "Management console")}</small>
              </span>
            </Link>
            <p className="admin-nav-label">{t(en, "পরিচালনা", "WORKSPACE")}</p>
            <div
              role="navigation"
              aria-label="Admin navigation"
              className="admin-navigation"
            >
              {entries.map((entry) => (
                <Link
                  key={entry.key}
                  aria-current={selected.key === entry.key ? "page" : undefined}
                  to={`/admin?section=${entry.key}`}
                  onClick={() => setOpen(false)}
                >
                  <entry.icon size={19} />
                  {entry.label}
                </Link>
              ))}
            </div>
            <Link className="admin-site-link" to="/">
              {t(en, "ওয়েবসাইট দেখুন", "View website")}
              <ArrowUpRight size={16} />
            </Link>
          </aside>
          <div className="admin-workspace">
            <div className="admin-topbar">
              <button
                className="icon admin-menu-toggle"
                aria-label="Toggle admin navigation"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </button>
              <span className="admin-role">
                {superAdmin
                  ? "Super admin"
                  : administrator
                    ? "Admin"
                    : "Volunteer"}
              </span>
              <div className="admin-topbar-actions">
                <button
                  className="icon"
                  aria-label="Change language"
                  onClick={toggleLang}
                >
                  <Languages size={18} />
                  {en ? "বাংলা" : "EN"}
                </button>
                <button
                  className="icon"
                  aria-label="Toggle theme"
                  onClick={toggleTheme}
                >
                  {dark ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <AccountMenu />
              </div>
            </div>
            <div className="admin-content">
              <div className="admin-page-heading">
                <span>MadhuBlood / {t(en, "পরিচালনা", "Administration")}</span>
                <h1>{selected.label}</h1>
                <p>
                  {t(
                    en,
                    "অনুমতি অনুযায়ী তথ্য ও কাজ পরিচালনা করুন।",
                    "Manage records and actions within your assigned permissions.",
                  )}
                </p>
              </div>
              {selected.key === "overview" ? (
                <>
                  <Operations selected="analytics" />
                  <div className="admin-quick-actions">
                    <Link to="/admin?section=requests">
                      {t(en, "অনুরোধ পর্যালোচনা করুন", "Review blood requests")}
                      <ArrowUpRight size={18} />
                    </Link>
                    <Link to="/admin?section=donors">
                      {t(en, "রক্তদাতা যাচাই করুন", "Verify donor profiles")}
                      <ArrowUpRight size={18} />
                    </Link>
                  </div>
                </>
              ) : ["requests", "donors"].includes(selected.key) ? (
                <section className="panel admin-queue">
                  {q.isPending ? (
                    <Loading />
                  ) : q.isError ? (
                    <Failure error={q.error} />
                  ) : selected.key === "requests" ? (
                    q.data.requests.length ? (
                      <div className="admin-table-scroll">
                        <table>
                          <thead>
                            <tr>
                              <th>{t(en, "গ্রুপ", "Group")}</th>
                              <th>
                                {t(en, "হাসপাতাল / এলাকা", "Hospital / area")}
                              </th>
                              <th>{t(en, "অবস্থা", "Status")}</th>
                              <th>{t(en, "পদক্ষেপ", "Actions")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            {q.data.requests.map((r) => (
                              <tr key={r._id}>
                                <td>
                                  <span className="blood-type small-type">
                                    {r.bloodGroup}
                                  </span>
                                </td>
                                <td>
                                  <strong>{r.hospital}</strong>
                                  <small>{r.area}</small>
                                </td>
                                <td>
                                  <span className="badge">{r.status}</span>
                                </td>
                                <td>
                                  <div className="button-row">
                                    {(["submitted", "reported"].includes(
                                      r.status,
                                    )
                                      ? ["verification"]
                                      : ["active", "rejected"]
                                    ).map((status) => (
                                      <button
                                        className="button secondary small"
                                        disabled={busy}
                                        key={status}
                                        onClick={() =>
                                          void moderate(
                                            `/admin/blood-requests/${r._id}`,
                                            { status },
                                          )
                                        }
                                      >
                                        {status}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <Empty
                        text={t(
                          en,
                          "পর্যালোচনার জন্য কোনো অনুরোধ নেই।",
                          "No blood requests awaiting review.",
                        )}
                      />
                    )
                  ) : q.data.donors.length ? (
                    q.data.donors.map((d) => (
                      <div className="list-row" key={d._id}>
                        <span>
                          <strong>{d.displayName}</strong>
                          <small>{d.area}</small>
                        </span>
                        <button
                          className="button secondary"
                          disabled={busy}
                          onClick={() => {
                            if (
                              confirm(
                                t(
                                  en,
                                  "রক্তদাতার তথ্য আলাদাভাবে যাচাই করেছেন?",
                                  "Has donor verification been independently completed?",
                                ),
                              )
                            )
                              void moderate(
                                `/admin/donors/${d._id}/verify`,
                                {},
                              );
                          }}
                        >
                          {t(en, "যাচাই সম্পন্ন", "Mark verified")}
                        </button>
                      </div>
                    ))
                  ) : (
                    <Empty
                      text={t(
                        en,
                        "যাচাইয়ের জন্য কোনো রক্তদাতা নেই।",
                        "No donors awaiting verification.",
                      )}
                    />
                  )}
                </section>
              ) : (
                <Operations selected={selected.key as Tab} />
              )}
            </div>
          </div>
        </div>
      )}
    </RequireUser>
  );
}
