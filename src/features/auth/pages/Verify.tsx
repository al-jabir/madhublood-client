import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  KeyRound,
  ShieldCheck,
} from "lucide-react";
import { authApi } from "@/features/auth/api/auth.api";
import { useMe } from "../hooks/useMe";
import { AuthLayout } from "../components/AuthLayout";
import { setCsrf } from "@/services/http";
import { qc } from "@/lib/query-client";
import { Field } from "@/components/ui/Field";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { errorText } from "@/utils/error-text";

export function Verify({ reset = false }: { reset?: boolean }) {
  const { en } = usePrefs();
  const { data: me } = useMe();
  const location = useLocation();
  const suggested =
    typeof location.state?.email === "string"
      ? location.state.email
      : (me?.email ?? "");
  const [email, setEmail] = useState(suggested);
  const [method, setMethod] = useState<"email" | "key">("email");
  const [sent, setSent] = useState(!reset);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const nav = useNavigate();
  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);
  useEffect(() => {
    if (me?.email && !reset) setEmail(me.email);
  }, [me?.email, reset]);

  async function requestCode() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = reset
        ? await authApi.forgotPassword(email.trim().toLowerCase())
        : await authApi.requestVerification(email.trim().toLowerCase());
      setMessage(result.message);
      setSent(true);
      setCooldown(60);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (reset && method === "email" && !sent) {
      await requestCode();
      return;
    }
    const data = new FormData(event.currentTarget);
    const password = String(data.get("password") ?? "");
    if (reset && password !== data.get("confirmPassword")) {
      setError(t(en, "পাসওয়ার্ড দুটি মিলছে না।", "Passwords do not match."));
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const identity = email.trim().toLowerCase();
      const result = !reset
        ? await authApi.verifyEmail({
            email: identity,
            code: String(data.get("code")),
          })
        : method === "key"
          ? await authApi.resetPassword({
              email: identity,
              recoveryKey: String(data.get("recoveryKey")),
              password,
            })
          : await authApi.resetPasswordEmail({
              email: identity,
              code: String(data.get("code")),
              password,
            });
      if (reset) {
        setCsrf("");
        qc.clear();
        nav("/login", { replace: true, state: { message: result.message } });
      } else {
        await qc.invalidateQueries({ queryKey: ["me"] });
        nav("/dashboard?tab=profile", {
          replace: true,
          state: { message: result.message },
        });
      }
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout>
      <Link
        className="text-link back-link"
        to={reset ? "/login" : "/dashboard?tab=profile"}
      >
        <ArrowLeft size={16} />
        {t(en, "ফিরে যান", "Go back")}
      </Link>
      <div className="form-intro">
        {reset ? <KeyRound size={30} /> : <Mail size={30} />}
        <h1>
          {reset
            ? t(en, "পাসওয়ার্ড ফিরে পান", "A fresh start.")
            : t(en, "ইমেইল যাচাই করুন", "Check your inbox.")}
        </h1>
        <p>
          {reset
            ? t(
                en,
                "ইমেইল কোড অথবা সংরক্ষিত recovery key দিয়ে নতুন পাসওয়ার্ড দিন।",
                "Reset your password with an email code or your saved recovery key.",
              )
            : t(
                en,
                "আপনার ইমেইলে পাঠানো ছয় সংখ্যার কোডটি লিখুন।",
                "Enter the six-digit code sent to your email. Check your spam folder, too.",
              )}
        </p>
      </div>
      {reset && (
        <div className="auth-methods" aria-label="Recovery method">
          <button
            type="button"
            aria-pressed={method === "email"}
            onClick={() => {
              setMethod("email");
              setError("");
              setMessage("");
            }}
          >
            <Mail size={16} />
            {t(en, "ইমেইল কোড", "Email code")}
          </button>
          <button
            type="button"
            aria-pressed={method === "key"}
            onClick={() => {
              setMethod("key");
              setError("");
              setMessage("");
            }}
          >
            <KeyRound size={16} />
            Recovery key
          </button>
        </div>
      )}
      <form className="auth-form" onSubmit={submit}>
        <Field label={t(en, "ইমেইল ঠিকানা", "Email address")}>
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="user@example.com"
            required
            maxLength={254}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (reset) setSent(false);
              setMessage("");
            }}
          />
        </Field>
        {(method === "key" || sent) && (
          <>
            {method === "email" ? (
              <Field label={t(en, "ছয় সংখ্যার কোড", "Verification code")}>
                <input
                  className="code-input"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  pattern="[0-9]{6}"
                  minLength={6}
                  maxLength={6}
                  placeholder="000000"
                />
              </Field>
            ) : (
              <Field label="Recovery key">
                <input
                  name="recoveryKey"
                  type="password"
                  required
                  pattern="[a-fA-F0-9]{64}"
                  autoComplete="off"
                />
              </Field>
            )}
            {reset && (
              <>
                <Field label={t(en, "নতুন পাসওয়ার্ড", "New password")}>
                  <PasswordInput
                    name="password"
                    minLength={6}
                    maxLength={128}
                    required
                    autoComplete="new-password"
                  />
                </Field>
                <Field
                  label={t(
                    en,
                    "নতুন পাসওয়ার্ড নিশ্চিত করুন",
                    "Confirm new password",
                  )}
                >
                  <PasswordInput
                    name="confirmPassword"
                    minLength={6}
                    maxLength={128}
                    required
                    autoComplete="new-password"
                  />
                </Field>
                <p className="muted">
                  {t(
                    en,
                    "অন্তত ৬ অক্ষর দিন। Reset করলে সব পুরোনো session ও recovery key বাতিল হবে।",
                    "Use at least 6 characters. Resetting signs out all devices and invalidates the previous recovery key.",
                  )}
                </p>
              </>
            )}
          </>
        )}
        {message && (
          <p className="notice" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        <button className="button full" disabled={busy}>
          {busy
            ? t(en, "অপেক্ষা করুন…", "Please wait…")
            : !reset
              ? t(en, "ইমেইল যাচাই করুন", "Verify email")
              : method === "email" && !sent
                ? t(en, "কোড পাঠান", "Send reset code")
                : t(en, "পাসওয়ার্ড reset করুন", "Reset password")}
          <ArrowRight size={17} />
        </button>
        {method === "email" && sent && (
          <button
            className="text-link resend-button"
            type="button"
            disabled={busy || cooldown > 0 || !email.includes("@")}
            onClick={requestCode}
          >
            {cooldown > 0
              ? `${t(en, "আবার পাঠাতে অপেক্ষা করুন", "Resend available in")} ${cooldown}s`
              : t(en, "নতুন কোড পাঠান", "Send a new code")}
          </button>
        )}
      </form>
      <p className="auth-footnote">
        <ShieldCheck size={15} />
        {t(
          en,
          "কোডটি ১০ মিনিটের জন্য। কাউকে শেয়ার করবেন না।",
          "Codes expire in 10 minutes. Keep them to yourself.",
        )}
      </p>
    </AuthLayout>
  );
}
