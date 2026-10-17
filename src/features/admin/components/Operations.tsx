import { DemoExamples } from "@/features/demo/DemoExamples";
import { useState } from "react";
import { useMe } from "@/features/auth/hooks/useMe";
import { AnalyticsPanel } from "./AnalyticsPanel";
import { CaseList } from "./CaseList";
import { UsersPanel } from "@/features/super-admin/components/UsersPanel";
import { AuditPanel } from "@/features/super-admin/components/AuditPanel";
import { LocationsPanel } from "@/features/locations/components/LocationsPanel";
import { SettingsPanel } from "@/features/super-admin/components/SettingsPanel";
export type Tab =
  | "demo-data"
  | "analytics"
  | "reports"
  | "tickets"
  | "users"
  | "locations"
  | "audit-logs"
  | "settings";
export function Operations({ selected }: { selected?: Tab }) {
  const [localTab, setTab] = useState<Tab>("analytics");
  const tab = selected ?? localTab;
  const { data: me } = useMe();
  const superAdmin = me?.roles.includes("super-admin");
  const tabs: Tab[] = [
    "analytics",
    "reports",
    ...(me?.roles.some((r) => ["admin", "super-admin"].includes(r))
      ? ["demo-data" as Tab]
      : []),
    ...(superAdmin
      ? (["tickets", "users", "locations", "audit-logs", "settings"] as Tab[])
      : []),
  ];
  return (
    <section className="operations">
      {!selected && <h2>Operations</h2>}
      {!selected && (
        <div className="dashboard-tabs">
          {tabs.map((value) => (
            <button
              className={tab === value ? "selected" : ""}
              key={value}
              onClick={() => setTab(value)}
            >
              {value}
            </button>
          ))}
        </div>
      )}
      <>
        {tab === "demo-data" ? (
          <DemoExamples manage />
        ) : tab === "analytics" ? (
          <AnalyticsPanel />
        ) : tab === "reports" || tab === "tickets" ? (
          <CaseList tab={tab} />
        ) : tab === "users" ? (
          <UsersPanel />
        ) : tab === "locations" ? (
          <LocationsPanel />
        ) : tab === "settings" ? (
          <SettingsPanel />
        ) : (
          <AuditPanel />
        )}
      </>
    </section>
  );
}
