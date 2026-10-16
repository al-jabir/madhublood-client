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
export function AnalyticsPanel() {
  const q = useQuery({
    queryKey: ["operations", "analytics"],
    queryFn: adminApi.analytics,
  });
  if (q.isPending) return <p role="status">Loading…</p>;
  if (q.isError) return <Failure error={q.error} />;
  return (
    <div className="panel">
      <div className="dashboard-summary">
        {Object.entries(q.data).map(([key, value]) => (
          <div key={key}>
            <h3>{key}</h3>
            <strong className="metric">{value}</strong>
          </div>
        ))}
      </div>
      <div
        style={{ height: 230 }}
        role="img"
        aria-label="Operational counts shown numerically above"
      >
        <ResponsiveContainer>
          <BarChart
            data={Object.entries(q.data).map(([name, count]) => ({
              name,
              count,
            }))}
          >
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#ac233d" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
