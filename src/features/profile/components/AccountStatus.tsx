import { Link } from "react-router-dom";
import { useMe } from "@/features/auth/hooks/useMe";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { canVolunteer } from "@/utils/volunteer-permissions";
export function AccountStatus() {
  const { data: user } = useMe();
  const { en } = usePrefs();
  if (!user) return null;
  const admin = user.roles.some((r) => ["admin", "super-admin"].includes(r));
  const volunteer =
    canVolunteer(user, "submit-referrals") ||
    canVolunteer(user, "coordinate-requests");
  return (
    <section className="panel account-status-panel">
      <h3>{t(en, "অ্যাকাউন্টের অবস্থা", "Account status")}</h3>
      <dl className="account-status-grid">
        <div>
          <dt>{t(en, "ইমেইল", "Email")}</dt>
          <dd>{user.email}</dd>
          <small>
            {user.emailVerified
              ? t(en, "যাচাইকৃত", "Verified")
              : t(en, "যাচাই প্রয়োজন", "Verification needed")}
          </small>
          {!user.emailVerified && (
            <Link className="text-link" to="/verify-email">
              {t(en, "ইমেইল যাচাই করুন", "Verify email")}
            </Link>
          )}
        </div>
        <div>
          <dt>{t(en, "ব্যক্তিগত প্রোফাইল", "Personal profile")}</dt>
          <dd>
            {user.profileCompleted
              ? t(en, "সম্পূর্ণ", "Complete")
              : t(en, "অসম্পূর্ণ", "Incomplete")}
          </dd>
          {!user.profileCompleted && (
            <Link className="text-link" to="/dashboard?tab=profile">
              {t(en, "প্রোফাইল পূরণ করুন", "Complete profile")}
            </Link>
          )}
        </div>
        <div>
          <dt>{t(en, "কাজের অনুমতি", "Workspace access")}</dt>
          <dd>
            {admin
              ? t(en, "অ্যাডমিন", "Administrator")
              : volunteer
                ? t(en, "অনুমোদিত স্বেচ্ছাসেবক", "Authorized volunteer")
                : t(en, "সাধারণ সদস্য", "Member")}
          </dd>
          {user.roles.includes("volunteer") && !volunteer && (
            <small>
              {t(
                en,
                "কাজের জন্য আলাদা অনুমতি দেওয়া হয়নি।",
                "No volunteer work permission has been granted.",
              )}
            </small>
          )}
        </div>
      </dl>
    </section>
  );
}
