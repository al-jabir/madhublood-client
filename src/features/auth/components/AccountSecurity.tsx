import { Link } from "react-router-dom";
import { ActionConfirmation } from "@/components/common/ActionConfirmation";
import { Loading } from "@/components/feedback/Loading";
import { Monitor, LogOut, ShieldCheck } from "lucide-react";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { useState, type FormEvent } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { authApi } from "../api/auth.api";
import { qc } from "@/lib/query-client";
import { setCsrf } from "@/services/http";
import { Field } from "@/components/ui/Field";
import { errorText } from "@/utils/error-text";

export function AccountSecurity() {
  const { en } = usePrefs();
  const nav = useNavigate();
  const sessions = useQuery({
    queryKey: ["sessions"],
    queryFn: authApi.sessions,
  });
  const [busy, setBusy] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  function signedOut() {
    setCsrf("");
    qc.clear();
    nav("/login");
  }
  const revoke = useMutation({
    mutationFn: authApi.revokeSession,
    onSuccess: async (data, id) => {
      toast.success(data.message);
      if (sessions.data?.items.find((s) => s.id === id)?.current) signedOut();
      else await qc.invalidateQueries({ queryKey: ["sessions"] });
    },
    onError: (error) => toast.error(errorText(error)),
  });
  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = new FormData(event.currentTarget);
    const currentPassword = String(values.get("currentPassword"));
    const newPassword = String(values.get("newPassword"));
    if (newPassword !== values.get("confirmPassword")) {
      toast.error(
        t(
          en,
          "নতুন পাসওয়ার্ড দুটি মিলছে না।",
          "The new passwords do not match.",
        ),
      );
      return;
    }
    setBusy(true);
    try {
      const result = await authApi.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success(result.message);
      signedOut();
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="panel settings-session">
        <h3>{t(en, "সক্রিয় সেশন", "Active sessions")}</h3>
        <p>
          {t(
            en,
            "আপনার লগইনগুলো দেখুন। অপ্রয়োজনীয় সেশন থেকে লগ আউট করুন।",
            "Review your sign-ins and sign out of sessions you no longer use.",
          )}
        </p>
        {sessions.isPending && <Loading compact />}
        {sessions.isError && <p role="alert">{errorText(sessions.error)}</p>}
        {!sessions.isPending &&
          !sessions.isError &&
          !sessions.data?.items.length && (
            <p>
              {t(
                en,
                "কোনো সক্রিয় সেশন পাওয়া যায়নি।",
                "No active sessions found.",
              )}
            </p>
          )}
        <div className="session-cards">
          {sessions.data?.items.map((session) => (
            <article
              className={
                "session-card" + (session.current ? " is-current" : "")
              }
              key={session.id}
            >
              <div className="session-device-icon">
                <Monitor size={23} />
              </div>
              <div className="session-details">
                <div className="session-title">
                  <h4>
                    {session.current
                      ? t(en, "আপনার বর্তমান সেশন", "Your current session")
                      : t(en, "অন্য একটি সেশন", "Another session")}
                  </h4>
                  {session.current && (
                    <span className="session-current-badge">
                      <ShieldCheck size={13} />
                      {t(en, "বর্তমান", "Current")}
                    </span>
                  )}
                </div>
                <dl className="session-times">
                  {[
                    [t(en, "লগইন করেছেন", "Signed in"), session.createdAt],
                    [t(en, "মেয়াদ শেষ", "Expires"), session.expiresAt],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>
                        <time dateTime={value}>
                          {new Intl.DateTimeFormat(en ? "en-BD" : "bn-BD", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(value))}
                        </time>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <button
                type="button"
                className="session-revoke"
                disabled={revoke.isPending}
                onClick={() => revoke.mutate(session.id)}
              >
                <LogOut size={16} />
                {t(en, "লগ আউট", "Sign out")}
              </button>
            </article>
          ))}
        </div>
        {sessions.isError && (
          <button
            type="button"
            className="button secondary"
            onClick={() => sessions.refetch()}
          >
            {t(en, "আবার চেষ্টা করুন", "Try again")}
          </button>
        )}
        <button
          type="button"
          className="button secondary"
          onClick={() => setConfirmLogout(true)}
        >
          {t(en, "সব ডিভাইস থেকে লগ আউট", "Sign out everywhere")}
        </button>
        {confirmLogout && (
          <ActionConfirmation
            title={t(
              en,
              "সব ডিভাইস থেকে লগ আউট করবেন?",
              "Sign out of all devices?",
            )}
            description={t(
              en,
              "এই ডিভাইসসহ সব সক্রিয় সেশন বন্ধ হবে। আবার লগইন করতে হবে।",
              "All sessions, including this device, will end. You will need to sign in again.",
            )}
            confirmLabel={t(en, "সব সেশন বন্ধ করুন", "Sign out everywhere")}
            onClose={() => setConfirmLogout(false)}
            onConfirm={async () => {
              await authApi.logoutAll();
              signedOut();
            }}
          />
        )}
      </section>
      <section className="panel settings-security">
        <h3>{t(en, "পাসওয়ার্ড পরিবর্তন", "Change password")}</h3>
        <p>
          {t(
            en,
            "পাসওয়ার্ড বদলালে সব ডিভাইস থেকে লগ আউট হবে।",
            "Changing your password signs you out of all sessions.",
          )}
        </p>
        <form onSubmit={changePassword}>
          <Field label={t(en, "বর্তমান পাসওয়ার্ড", "Current password")}>
            <input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              maxLength={128}
            />
          </Field>
          <Field
            label={t(
              en,
              "নতুন পাসওয়ার্ড (অন্তত ৬ অক্ষর)",
              "New password (at least 6 characters)",
            )}
          >
            <input
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              maxLength={128}
            />
          </Field>
          <Field
            label={t(
              en,
              "নতুন পাসওয়ার্ড নিশ্চিত করুন",
              "Confirm new password",
            )}
          >
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              maxLength={128}
            />
          </Field>
          <button className="button" disabled={busy}>
            {busy
              ? t(en, "পাসওয়ার্ড বদলানো হচ্ছে…", "Changing password...")
              : t(en, "পাসওয়ার্ড পরিবর্তন", "Change password")}
          </button>
        </form>
        <Link
          className="text-link settings-recovery-link"
          to="/forgot-password"
        >
          {t(
            en,
            "বর্তমান পাসওয়ার্ড ভুলে গেছেন?",
            "Forgot your current password?",
          )}
        </Link>
      </section>
    </>
  );
}
