import { AvailabilityReminder } from "@/features/community-tools/components/MemberTools";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { ProfileOverview } from "@/features/profile/components/ProfileOverview";
import { useCursorNavigation } from "@/hooks/useCursorNavigation";
import { CursorPager } from "@/components/common/CursorPager";
import { authApi } from "@/features/auth/api/auth.api";
import { requestsApi } from "@/features/blood-requests/api/blood-requests.api";
import {
  Link,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import { returnToFrom } from "@/features/auth/return-to";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  ShieldCheck,
  Activity,
  LogOut,
  Plus,
  ChevronRight,
} from "lucide-react";
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
import { Mail, HeartHandshake } from "lucide-react";
import { donorsApi } from "@/features/donors/api/donors.api";
import { DonorEligibilityCard } from "@/features/donors/components/DonorEligibilityCard";

export function Dashboard() {
  const { en } = usePrefs();
  const pagination = useCursorNavigation("");
  const { data: me } = useMe();
  const nav = useNavigate();
  const returnTo = returnToFrom(useLocation().state);
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab") || "overview";
  const tab = [
    "overview",
    "profile",
    "donor",
    "donations",
    "notifications",
    "settings",
  ].includes(requestedTab)
    ? requestedTab
    : "overview";
  const setTab = (t: string) => setSearchParams({ tab: t });

  const q = useQuery({
    queryKey: ["my-requests", pagination.after],
    enabled: !!me,
    queryFn: async () => requestsApi.mine(pagination.after),
  });

  const donorProfile = useQuery({
    queryKey: ["profile"],
    enabled: !!me && !me.verificationRequired,
    queryFn: donorsApi.me,
  });
  return (
    <RequireUser>
      <section className="page dashboard-page">
        <AvailabilityReminder />
        <PageHeading
          title={`${t(en, "স্বাগতম", "Welcome")}, ${me?.name ?? ""}`}
          desc={t(
            en,
            "আপনার প্রোফাইল, রক্তের অনুরোধ ও অ্যাকাউন্ট এক জায়গায়।",
            "Your profile, blood requests and account in one place.",
          )}
        />
        <div className="dashboard-tabs">
          {[
            "overview",
            "profile",
            "donor",
            "donations",
            "notifications",
            "settings",
          ].map((s) => (
            <button
              className={tab === s ? "selected" : ""}
              key={s}
              onClick={() => setTab(s)}
            >
              {
                {
                  overview: t(en, "সারসংক্ষেপ", "Overview"),
                  profile: t(en, "প্রোফাইল", "Profile"),
                  donor: t(en, "রক্তদাতা ফর্ম", "Donor form"),
                  donations: t(en, "রক্তদান", "Donations"),
                  notifications: t(en, "বিজ্ঞপ্তি", "Notifications"),
                  settings: t(en, "সেটিংস", "Settings"),
                }[s]
              }
            </button>
          ))}
          {me?.roles.some((r: string) =>
            ["admin", "volunteer", "super-admin"].includes(r),
          ) && <Link to="/admin">{t(en, "পরিচালনা", "Moderation")}</Link>}
        </div>
        {me?.profileCompleted && returnTo && (
          <div className="notice">
            <Link
              className="text-link"
              to={returnTo.pathname}
              state={returnTo.state}
            >
              {t(en, "আপনার অনুরোধে ফিরে যান →", "Continue your request →")}
            </Link>
          </div>
        )}
        {!me?.profileCompleted && (
          <div className="notice">
            Complete your personal profile before registering as a donor or
            submitting requests.{" "}
            <button className="text-link" onClick={() => setTab("profile")}>
              {t(en, "প্রোফাইল সম্পূর্ণ করুন →", "Complete profile →")}
            </button>
          </div>
        )}
        {!me?.emailVerified && (
          <div className="verification-banner">
            <Mail size={22} />
            <div>
              <strong>
                {t(
                  en,
                  "ইমেইল যাচাই করে অ্যাকাউন্ট সুরক্ষিত করুন",
                  "Secure your account with a verified email",
                )}
              </strong>
              <p>
                Verify ownership to help keep your account details up to date.
              </p>
            </div>
            <Link className="button secondary" to="/verify-email">
              {t(en, "ইমেইল যাচাই করুন", "Verify email")}{" "}
              <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
        {tab === "overview" && (
          <>
            <div className="dashboard-summary">
              <div className="panel">
                <Activity className="red" />
                <h3>{t(en, "আমার রক্তের অনুরোধ", "My blood requests")}</h3>
                <strong className="metric">
                  {q.data?.total ?? q.data?.items.length ?? "—"}
                </strong>
              </div>
              <div className="panel">
                <ShieldCheck className="green" />
                <h3>{t(en, "ব্যক্তিগত প্রোফাইল", "Personal profile")}</h3>
                <strong>
                  {me?.profileCompleted
                    ? t(en, "সম্পূর্ণ", "Complete")
                    : t(en, "অসম্পূর্ণ", "Incomplete")}
                </strong>
              </div>
              <Link to="/requests/new" className="panel create-tile">
                <Plus />
                <h3>{t(en, "নতুন অনুরোধ", "Create a request")}</h3>
                <ArrowUpRight />
              </Link>
            </div>

            {donorProfile.data ? (
              <DonorEligibilityCard
                lastDonation={donorProfile.data.lastDonation}
                available={donorProfile.data.available}
                bloodGroup={donorProfile.data.bloodGroup}
                en={en}
                onNavigateToDonorTab={() => setTab("donor")}
              />
            ) : me?.profileCompleted ? (
              <div className="panel donor-invitation-tile">
                <HeartHandshake size={28} className="red" />
                <div>
                  <h4>
                    {t(
                      en,
                      "আপনি কি রক্তদানে আগ্রহী?",
                      "Are you interested in donating blood?",
                    )}
                  </h4>
                  <p>
                    {t(
                      en,
                      "রক্তদাতা ফর্ম পূরণ করে রক্তদানে প্রস্তুত থাকুন। আপনার রক্তে বেঁচে যেতে পারে একটি জীবন।",
                      "Complete your donor details to register as a voluntary lifesaver in Madhupur.",
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setTab("donor")}
                >
                  {t(en, "রক্তদাতা ফর্ম পূরণ করুন", "Join as donor")}
                </button>
              </div>
            ) : null}

            <h2>{t(en, "আমার অনুরোধ", "My requests")}</h2>
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
        {tab === "profile" && <ProfileOverview />}
        {tab === "donor" && (
          <section className="donor-onboarding">
            <h2>{t(en, "রক্তদাতা হিসেবে আপনার তথ্য", "Your donor details")}</h2>
            <p>
              {t(
                en,
                "রক্তের গ্রুপ, শেষ রক্তদান ও সম্মতির তথ্য পূরণ করুন। এটি ব্যক্তিগত প্রোফাইল থেকে আলাদা।",
                "Add your blood group, last donation and consent preferences. This form is separate from your personal profile.",
              )}
            </p>
            {me?.profileCompleted ? (
              <DonorProfile />
            ) : (
              <div className="notice">
                <button className="text-link" onClick={() => setTab("profile")}>
                  {t(
                    en,
                    "আগে ব্যক্তিগত প্রোফাইল পূরণ করুন",
                    "Complete your personal profile first",
                  )}
                </button>
              </div>
            )}
          </section>
        )}
        {tab === "donations" && <Donations />}
        {tab === "notifications" && <Notifications />}
        {tab === "settings" && (
          <div className="settings-layout">
            <section className="panel settings-session">
              <h2>{t(en, "অ্যাকাউন্ট সেশন", "Account sessions")}</h2>
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
                {t(en, "সব ডিভাইস থেকে লগ আউট", "Sign out everywhere")}
              </button>
              <p>
                <Link to="/forgot-password">
                  Recover password with an email code or recovery key
                </Link>
              </p>
            </section>
            <section className="panel settings-security">
              <AccountSecurity />
            </section>
            <section className="panel settings-data">
              <AccountData />
            </section>
          </div>
        )}
      </section>
    </RequireUser>
  );
}
