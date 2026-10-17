import { Loading } from "@/components/feedback/Loading";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { adminApi } from "../api/admin.api";
import { Failure } from "@/components/feedback/Failure";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { Users, Droplets, HeartHandshake, CheckCheck } from "lucide-react";
export function AnalyticsPanel() {
  const { en } = usePrefs();
  const q = useQuery({
    queryKey: ["operations", "analytics"],
    queryFn: adminApi.analytics,
  });
  if (q.isPending) return <Loading compact />;
  if (q.isError) return <Failure error={q.error} />;
  const labels: Record<string, string> = {
    donors: t(en, "রক্তদাতার প্রোফাইল", "Donor profiles"),
    available: t(en, "রক্তদানে প্রস্তুত", "Available donors"),
    active: t(en, "চলমান অনুরোধ", "Active requests"),
    completed: t(en, "সম্পন্ন অনুরোধ", "Completed requests"),
    users: t(en, "নিবন্ধিত সদস্য", "Registered members"),
    requests: t(en, "মোট অনুরোধ", "Blood requests"),
  };
  const icons = [Users, HeartHandshake, Droplets, CheckCheck];
  const chart = Object.entries(q.data).map(([key, count]) => ({
    name: labels[key] ?? key,
    count,
  }));
  return (
    <div className="admin-overview">
      <div className="admin-metrics">
        {Object.entries(q.data).map(([key, value], index) => {
          const Icon = icons[index % icons.length];
          return (
            <div key={key}>
              <span className="admin-metric-icon">
                <Icon size={19} />
              </span>
              <strong>{value.toLocaleString(en ? "en-GB" : "bn-BD")}</strong>
              <h3>{labels[key] ?? key}</h3>
            </div>
          );
        })}
      </div>
      <section className="panel admin-chart-panel">
        <h2>
          {t(en, "আপনার এলাকার কার্যক্রম", "Activity in your service area")}
        </h2>
        <p className="muted">
          {t(
            en,
            "বর্তমান রক্তদাতা ও অনুরোধের হিসাব।",
            "Current donor and request counts within your permissions.",
          )}
        </p>
        <div
          style={{ height: 230 }}
          role="img"
          aria-label={t(
            en,
            "উপরের সংখ্যাগুলোর তুলনামূলক চিত্র",
            "Operational counts shown numerically above",
          )}
        >
          <ResponsiveContainer>
            <BarChart
              data={chart}
              layout="vertical"
              margin={{ top: 20, right: 12, left: 0, bottom: 8 }}
            >
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fill: "var(--muted)", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={135}
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--bg)",
                  border: "1px solid var(--line)",
                  borderRadius: 10,
                  color: "var(--ink)",
                }}
              />
              <Bar
                dataKey="count"
                name={t(en, "সংখ্যা", "Count")}
                fill="#ef4444"
                radius={[0, 5, 5, 0]}
                maxBarSize={24}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
