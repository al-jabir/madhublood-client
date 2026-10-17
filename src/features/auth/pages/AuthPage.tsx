import { isAxiosError } from "axios";
import { returnToFrom } from "../return-to";
import { authApi } from "../api/auth.api";
import { authSchema } from "../schemas/auth.schema";
import type { z } from "zod";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Droplets, ArrowRight } from "lucide-react";
import { qc } from "@/lib/query-client";
import { usePrefs } from "@/store/preferences.store";
import { t } from "@/i18n/translate";
import { Field } from "@/components/ui/Field";
import { setCsrf } from "@/services/http";
import { errorText } from "@/utils/error-text";
import { AuthLayout } from "../components/AuthLayout";
import { PasswordInput } from "@/components/ui/PasswordInput";

export function AuthPage({ mode }: { mode: "register" | "login" }) {
  const { en } = usePrefs();
  const nav = useNavigate();
  const location = useLocation();
  const returnTo = returnToFrom(location.state);
  const register = mode === "register";
  const schema = authSchema(register);
  const {
    register: r,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email:
        typeof location.state?.email === "string" ? location.state.email : "",
    },
  });
  const m = useMutation({
    mutationFn: async (values: z.output<typeof schema>) => {
      if (register)
        return authApi.register({
          email: values.email,
          password: values.password,
          consent: values.consent,
        });
      await authApi.login({ email: values.email, password: values.password });
      // Confirm the browser retained the session before opening a private page.
      return authApi.me();
    },
    onSuccess: async (data) => {
      qc.removeQueries();
      setCsrf(data.csrf);
      qc.setQueryData(["me"], data.user);
      if (
        data.user.verificationRequired ||
        (register && !data.user.emailVerified)
      )
        nav("/verify-email", {
          replace: true,
          state: { email: data.user.email, returnTo, codeQueued: true },
        });
      else if (returnTo && data.user.profileCompleted)
        nav(returnTo.pathname, { state: returnTo.state });
      else if (
        data.user.roles.some((role) =>
          ["admin", "super-admin", "volunteer"].includes(role),
        )
      )
        nav("/admin");
      else nav("/dashboard?tab=profile", { state: { returnTo } });
    },
  });
  const loginError =
    !register && isAxiosError(m.error) && m.error.response?.status === 401;
  const serverMessage = m.error ? errorText(m.error) : "";
  const wrongPassword =
    loginError && serverMessage.startsWith("Incorrect password.");
  const missingAccount =
    loginError && serverMessage.startsWith("No account found with this email.");
  const lockedAccount =
    loginError &&
    serverMessage.startsWith("Too many unsuccessful sign-in attempts.");
  return (
    <AuthLayout>
      <div className="form-intro">
        <Droplets size={36} />
        <h1>
          {register
            ? t(en, "জীবনের পাশে থাকার শুরু", "Make a difference. Join us.")
            : t(en, "আবার স্বাগতম", "Welcome back")}
        </h1>
        <p>
          {t(
            en,
            "একটি নিরাপদ, স্বেচ্ছাসেবী কমিউনিটিতে আপনাকে স্বাগতম।",
            "A caring community, built on trust and consent.",
          )}
        </p>
      </div>
      <form
        className="auth-form"
        onChange={() => {
          if (m.isError) m.reset();
        }}
        onSubmit={handleSubmit((v) => m.mutate(v))}
      >
        {typeof location.state?.message === "string" && (
          <p className="notice" role="status">
            {location.state.message}
          </p>
        )}
        <Field label={t(en, "ইমেইল ঠিকানা", "Email address")}>
          <input
            aria-invalid={!!errors.email || !!missingAccount}
            aria-describedby={missingAccount ? "auth-error-message" : undefined}
            type="email"
            autoComplete="email"
            maxLength={254}
            placeholder={t(en, "user@example.com", "user@example.com")}
            {...r("email")}
          />
        </Field>
        <Field label={t(en, "পাসওয়ার্ড", "Password")}>
          <PasswordInput
            aria-invalid={!!errors.password || !!wrongPassword}
            aria-describedby={wrongPassword ? "auth-error-message" : undefined}
            autoComplete={register ? "new-password" : "current-password"}
            placeholder="••••••••"
            {...r("password")}
          />
        </Field>
        {register && (
          <Field label={t(en, "পাসওয়ার্ড নিশ্চিত করুন", "Confirm password")}>
            <PasswordInput
              autoComplete="new-password"
              placeholder="••••••••"
              {...r("confirmPassword")}
            />
          </Field>
        )}
        {register && (
          <label className="checkbox">
            <input type="checkbox" {...r("consent")} />
            <span>
              {t(
                en,
                "আমি অ্যাকাউন্ট তৈরিতে সম্মত এবং গোপনীয়তা নীতি পড়েছি।",
                "I consent to account creation and have read the privacy policy.",
              )}{" "}
              <Link to="/privacy">Privacy</Link>
            </span>
          </label>
        )}
        {m.isError && (
          <div
            id="auth-error-message"
            className="notice auth-action-error"
            role="alert"
          >
            <p>
              {isAxiosError(m.error) &&
              m.error.response?.status === 409 &&
              register
                ? t(
                    en,
                    "এই ইমেইলে আগে থেকেই অ্যাকাউন্ট আছে। লগ ইন করুন অথবা পাসওয়ার্ড ফিরে পান।",
                    "This email is already registered. Sign in instead of creating another account.",
                  )
                : wrongPassword
                  ? t(
                      en,
                      "পাসওয়ার্ড ভুল হয়েছে। আবার চেষ্টা করুন অথবা পাসওয়ার্ড ফিরে পান।",
                      "Incorrect password. Try again or reset your password.",
                    )
                  : missingAccount
                    ? t(
                        en,
                        "এই ইমেইলে কোনো অ্যাকাউন্ট নেই। আগে অ্যাকাউন্ট তৈরি করুন।",
                        "No account found with this email. Create an account first.",
                      )
                    : lockedAccount
                      ? t(
                          en,
                          "অনেকবার ভুল তথ্য দেওয়া হয়েছে। কিছুক্ষণ পরে আবার চেষ্টা করুন।",
                          "Too many unsuccessful sign-in attempts. Please try again later.",
                        )
                      : loginError
                        ? t(
                            en,
                            "ইমেইল বা পাসওয়ার্ড মেলেনি। তথ্য ঠিক করে আবার চেষ্টা করুন অথবা পাসওয়ার্ড ফিরে পান।",
                            "Email or password did not match. If you already registered, check your details or reset your password. New here? Create an account first.",
                          )
                        : errorText(m.error)}
            </p>
            <div className="auth-error-actions">
              {register ? (
                <Link
                  to="/login"
                  state={{ returnTo, email: getValues("email") }}
                >
                  {t(en, "লগ ইন করুন", "Sign in")}
                </Link>
              ) : !wrongPassword && !lockedAccount ? (
                <Link
                  to="/register"
                  state={{ returnTo, email: getValues("email") }}
                >
                  {t(en, "অ্যাকাউন্ট তৈরি করুন", "Create account")}
                </Link>
              ) : null}
              <Link to="/forgot-password" state={{ email: getValues("email") }}>
                {t(en, "পাসওয়ার্ড ফিরে পান", "Reset password")}
              </Link>
            </div>
          </div>
        )}
        {Object.entries(errors).map(([key, e]) => (
          <p className="error-text" role="alert" key={key}>
            {String(e?.message)}
          </p>
        ))}
        <button className="button full" disabled={m.isPending}>
          {m.isPending
            ? t(en, "একটু অপেক্ষা করুন…", "Please wait…")
            : register
              ? t(en, "অ্যাকাউন্ট তৈরি করুন", "Create account")
              : t(en, "লগ ইন করুন", "Sign in")}
          <ArrowRight size={17} />
        </button>
        <p className="auth-footer-links">
          {register ? (
            <Link to="/login" state={{ returnTo, email: getValues("email") }}>
              {t(
                en,
                "অ্যাকাউন্ট আছে? লগ ইন করুন",
                "Already registered? Sign in",
              )}
            </Link>
          ) : (
            <>
              <Link
                to="/register"
                state={{ returnTo, email: getValues("email") }}
              >
                {t(en, "নতুন অ্যাকাউন্ট তৈরি করুন", "Create account")}
              </Link>
              <span className="dot-sep">·</span>
              <Link to="/forgot-password">
                {t(en, "পাসওয়ার্ড ভুলে গেছেন?", "Forgot password?")}
              </Link>
            </>
          )}
        </p>
      </form>
    </AuthLayout>
  );
}
