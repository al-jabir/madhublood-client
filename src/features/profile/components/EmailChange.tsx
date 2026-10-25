import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMe } from "@/features/auth/hooks/useMe";
import { accountApi } from "../api/account.api";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { Field } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { errorText } from "@/utils/error-text";
import { qc } from "@/lib/query-client";
import { setCsrf } from "@/services/http";
export function EmailChange() {
  const { en } = usePrefs();
  const { data: user } = useMe();
  const nav = useNavigate();
  const [newEmail, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown((v) => v - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);
  return (
    <details className="panel settings-email-change">
      <summary>{t(en, "লগইন ইমেইল পরিবর্তন", "Change login email")}</summary>
      <p>
        {t(en, "বর্তমান ইমেইল:", "Current email:")} {user?.email}
      </p>
      <p>
        {t(
          en,
          "নতুন ঠিকানার কোড যাচাই না হওয়া পর্যন্ত ইমেইল বদলাবে না। বদলালে সব ডিভাইস থেকে লগ আউট হবে।",
          "Your email stays unchanged until the new address is verified. Changing it signs out all devices.",
        )}
      </p>
      <form
        className="settings-feature-form"
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy) return;
          setBusy(true);
          setError("");
          try {
            if (!sent) {
              await accountApi.requestEmailChange({
                newEmail: newEmail.trim().toLowerCase(),
                currentPassword: password,
              });
              setEmail(newEmail.trim().toLowerCase());
              setSent(true);
              setPassword("");
              setCooldown(60);
            } else {
              const result = await accountApi.confirmEmailChange({
                newEmail,
                code,
              });
              setCsrf("");
              qc.clear();
              nav("/login", {
                replace: true,
                state: { email: newEmail, message: result.message },
              });
            }
          } catch (err) {
            setError(errorText(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label={t(en, "নতুন ইমেইল ঠিকানা", "New email address")}>
          <input
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={newEmail}
            disabled={sent || busy}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        {!sent ? (
          <Field
            label={t(
              en,
              "ইমেইল বদলাতে বর্তমান পাসওয়ার্ড",
              "Current password to change email",
            )}
          >
            <PasswordInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              maxLength={128}
              autoComplete="current-password"
              disabled={busy}
            />
          </Field>
        ) : (
          <>
            <p role="status">
              {t(
                en,
                "নতুন ইমেইলে পাঠানো ছয় সংখ্যার কোড দিন। কোড ১০ মিনিটের জন্য।",
                "Enter the six-digit code sent to the new email. It expires in 10 minutes.",
              )}
            </p>
            <Field label={t(en, "ইমেইল পরিবর্তনের কোড", "Email change code")}>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                minLength={6}
                maxLength={6}
                required
                value={code}
                disabled={busy}
                onChange={(e) => setCode(e.target.value)}
              />
            </Field>
          </>
        )}
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        <button className="button" disabled={busy || (!sent && cooldown > 0)}>
          {busy
            ? t(en, "অপেক্ষা করুন…", "Please wait…")
            : sent
              ? t(en, "ইমেইল পরিবর্তন নিশ্চিত করুন", "Confirm email change")
              : cooldown
                ? `${t(en, "অপেক্ষা করুন", "Wait")} ${cooldown}s`
                : t(en, "নতুন ইমেইলে কোড পাঠান", "Send code to new email")}
        </button>
        {sent && (
          <button
            type="button"
            className="text-link"
            disabled={busy}
            onClick={() => {
              setSent(false);
              setCode("");
              setError("");
            }}
          >
            {t(
              en,
              "অন্য ঠিকানা বা নতুন কোড চাই",
              "Use another address or request a new code",
            )}
          </button>
        )}
      </form>
    </details>
  );
}
