import { useCursorNavigation } from "@/hooks/useCursorNavigation";
import { CursorPager } from "@/components/common/CursorPager";
import { authApi } from "@/features/auth/api/auth.api";
import { requestsApi } from "@/features/blood-requests/api/blood-requests.api";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ShieldCheck,
  Activity,
  LogOut,
  Plus,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { qc } from "@/lib/query-client";
import { useMe } from "@/features/auth/hooks/useMe";
import { Loading } from "@/components/feedback/Loading";
import { Failure } from "@/components/feedback/Failure";
import { Empty } from "@/components/feedback/Empty";
import { PageHeading } from "@/components/common/PageHeading";
import { RequireUser } from "@/features/auth/components/RequireUser";
import { AccountData } from "@/features/profile/components/AccountData";
import { AccountSecurity } from "@/features/auth/components/AccountSecurity";
import { DonorProfile } from "@/features/donors/components/DonorProfile";
import { Donations } from "@/features/donations/pages/Donations";
import { Notifications } from "@/features/notifications/pages/Notifications";
import { setCsrf } from "@/services/http";
import { errorText } from "@/utils/error-text";

export function Dashboard() {
  const pagination = useCursorNavigation("");
  const { data: me } = useMe();
  const nav = useNavigate();
  const q = useQuery({
    queryKey: ["my-requests", pagination.after],
    enabled: !!me,
    queryFn: async () => requestsApi.mine(pagination.after),
  });
  const [tab, setTab] = useState("overview");
  return (
    <RequireUser>
      <section className="page">
        <PageHeading
          title={`স্বাগতম, ${me?.name ?? ""}`}
          desc="Your donor profile, requests, and privacy—together in one place."
        />
        <div className="dashboard-tabs">
          {[
            "overview",
            "profile",
            "donations",
            "notifications",
            "settings",
          ].map((s) => (
            <button
              className={tab === s ? "selected" : ""}
              key={s}
              onClick={() => setTab(s)}
            >
              {s}
            </button>
          ))}
          {me?.roles.some((r: string) =>
            ["admin", "volunteer", "super-admin"].includes(r),
          ) && <Link to="/admin">Moderation</Link>}
        </div>
        {!me?.verified && (
          <div className="notice">
            Verify your phone before registering as a donor or submitting
            requests. <Link to="/verify-otp">Verify now →</Link>
          </div>
        )}
        {tab === "overview" && (
          <>
            <div className="dashboard-summary">
              <div className="panel">
                <Activity className="red" />
                <h3>My blood requests</h3>
                <strong className="metric">
                  {q.data?.total ?? q.data?.items.length ?? "—"}
                </strong>
              </div>
              <div className="panel">
                <ShieldCheck className="green" />
                <h3>Phone verification</h3>
                <strong>{me?.verified ? "Verified" : "Pending"}</strong>
              </div>
              <Link to="/requests/new" className="panel create-tile">
                <Plus />
                <h3>Create a request</h3>
                <ArrowUpRight />
              </Link>
            </div>
            <h2>My requests</h2>
            <CursorPager
              navigation={pagination}
              nextCursor={q.data?.nextCursor}
              busy={q.isFetching}
            />
            {q.isError ? (
              <Failure error={q.error} />
            ) : q.isPending ? (
              <Loading />
            ) : q.data.items.length ? (
              q.data.items.map((r) => (
                <Link
                  className="list-row"
                  key={r._id}
                  to={"/requests/" + r._id}
                >
                  <span className="blood-type small-type">{r.bloodGroup}</span>
                  <span>
                    {r.hospital}
                    <small>{r.status}</small>
                  </span>
                  <ChevronRight />
                </Link>
              ))
            ) : (
              <Empty />
            )}
          </>
        )}
        {tab === "profile" && <DonorProfile />}
        {tab === "donations" && <Donations />}
        {tab === "notifications" && <Notifications />}
        {tab === "settings" && (
          <div className="panel">
            <h2>Account sessions</h2>
            <p>
              Sign out of all your devices if you suspect unauthorized access.
            </p>
            <button
              className="button secondary"
              onClick={async () => {
                if (confirm("Sign out of all devices?")) {
                  await authApi.logoutAll();
                  setCsrf("");
                  qc.clear();
                  nav("/login");
                }
              }}
            >
              <LogOut size={17} />
              Sign out everywhere
            </button>
            <p>
              <Link to="/forgot-password">
                Change password through SMS verification
              </Link>
            </p>
            <AccountData />
            <AccountSecurity />
          </div>
        )}
        <button
          className="text-link signout"
          onClick={async () => {
            try {
              await authApi.logout();
              setCsrf("");
              qc.clear();
              nav("/login");
            } catch (e) {
              toast.error(errorText(e));
            }
          }}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </section>
    </RequireUser>
  );
}
